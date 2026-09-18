#!/usr/bin/env bash
#
# Build the site and serve it from a local nginx on port 9090, starting again
# by itself after a reboot.
#
#   scripts/deploy.sh                 # build → publish → configure → reload → verify
#   scripts/deploy.sh --skip-build    # re-publish the existing dist/
#   scripts/deploy.sh --port 9091     # same, on another port
#
# Everything here is idempotent: run it as often as you like.

set -euo pipefail

# ---------------------------------------------------------------- settings --

PORT=9090
WEBROOT=""          # defaults to <brew prefix>/var/www/ail-website
SITE_URL=""         # VITE_SITE_URL for the build; empty keeps .env's value
IN_PLACE=0          # serve dist/ where it lies instead of copying it out
SKIP_BUILD=0
NO_SERVICE=0        # configure nginx but leave the launchd service alone

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$REPO_ROOT/deploy/nginx/ail-website.conf"
CONF_NAME="ail-website.conf"

# ----------------------------------------------------------------- output ---

say()  { printf '\033[36m==>\033[0m %s\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
    # The header comment is the usage text; stop at the first line that is not one.
    awk 'NR > 1 { if ($0 !~ /^#/) exit; sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"
    cat <<'USAGE'

Options
  --port N          port to listen on (default 9090)
  --webroot PATH    where the build is published (default <brew prefix>/var/www/ail-website)
  --site-url URL    VITE_SITE_URL baked into the build's social tags
  --in-place        serve dist/ directly instead of copying it out
  --skip-build      reuse the existing dist/
  --no-service      write the config and reload, but do not touch launchd
  -h, --help        this text
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --port)      PORT="${2:?--port needs a value}"; shift 2 ;;
        --webroot)   WEBROOT="${2:?--webroot needs a value}"; shift 2 ;;
        --site-url)  SITE_URL="${2:?--site-url needs a value}"; shift 2 ;;
        --in-place)  IN_PLACE=1; shift ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --no-service) NO_SERVICE=1; shift ;;
        -h|--help)   usage; exit 0 ;;
        *)           die "unknown argument: $1 (try --help)" ;;
    esac
done

case "$PORT" in
    ''|*[!0-9]*) die "--port must be a number, got: $PORT" ;;
esac
[ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || die "--port out of range: $PORT"
[ "$PORT" -ge 1024 ] || warn "port $PORT is privileged; a user-level nginx cannot bind it"

# ------------------------------------------------------------- 1. toolchain --

say "Checking the toolchain"

[ "$(uname -s)" = "Darwin" ] || die "this script drives Homebrew + launchd, so it is macOS-only"
command -v brew >/dev/null 2>&1 || die "Homebrew is not installed — see https://brew.sh"
command -v npm  >/dev/null 2>&1 || die "npm is not on PATH — install Node.js first"
[ -f "$TEMPLATE" ] || die "missing config template: $TEMPLATE"

BREW_PREFIX="$(brew --prefix)"
NGINX_ETC="$BREW_PREFIX/etc/nginx"
LOG_DIR="$BREW_PREFIX/var/log/nginx"

if brew list --formula nginx >/dev/null 2>&1; then
    ok "nginx $(nginx -v 2>&1 | sed 's|.*/||') already installed"
else
    say "Installing nginx"
    brew install nginx
    ok "nginx installed"
fi

[ -f "$NGINX_ETC/nginx.conf" ] || die "no nginx.conf under $NGINX_ETC — is this a Homebrew nginx?"
mkdir -p "$LOG_DIR"

# ----------------------------------------------------------------- 2. build --

if [ "$SKIP_BUILD" -eq 1 ]; then
    [ -f "$REPO_ROOT/dist/index.html" ] || die "--skip-build was given but dist/index.html does not exist"
    ok "reusing the existing dist/"
else
    say "Building the site"
    cd "$REPO_ROOT"

    if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
        npm ci
    else
        ok "dependencies already installed"
    fi

    if [ -n "$SITE_URL" ]; then
        VITE_SITE_URL="$SITE_URL" npm run build
    else
        npm run build
    fi

    [ -f "$REPO_ROOT/dist/index.html" ] && [ -f "$REPO_ROOT/dist/simulator/index.html" ] \
        || die "build finished but dist/ is missing an entry point"
    ok "built both pages into dist/"
fi

# --------------------------------------------------------------- 3. publish --

if [ "$IN_PLACE" -eq 1 ]; then
    WEBROOT="$REPO_ROOT/dist"
    case "$WEBROOT" in
        /Volumes/*) warn "serving from $WEBROOT — nginx will 404 whenever that volume is unmounted" ;;
    esac
    ok "serving dist/ in place: $WEBROOT"
else
    [ -n "$WEBROOT" ] || WEBROOT="$BREW_PREFIX/var/www/ail-website"
    say "Publishing to $WEBROOT"

    # This publish is `rsync --delete`. Refuse to point it at a directory that
    # is not already ours — another app's docroot must never be emptied by a
    # mistyped --webroot. A previous deploy is recognised either by the marker
    # or by carrying both of our entry points.
    if [ -d "$WEBROOT" ] && [ -n "$(ls -A "$WEBROOT" 2>/dev/null || true)" ] \
        && [ ! -f "$WEBROOT/.ail-website" ] \
        && { [ ! -f "$WEBROOT/index.html" ] || [ ! -f "$WEBROOT/simulator/index.html" ]; }; then
        die "$WEBROOT is not empty and was not published by this script — refusing to overwrite it"
    fi

    mkdir -p "$WEBROOT"
    : > "$WEBROOT/.ail-website"
    # --delete so a file dropped from the build never lingers on disk; the
    # marker is ours, not the build's, so it has to survive the sync.
    rsync -a --delete --exclude='.ail-website' "$REPO_ROOT/dist/" "$WEBROOT/"
    chmod -R a+rX "$WEBROOT"
    ok "$(find "$WEBROOT" -type f ! -name '.ail-website' | wc -l | tr -d ' ') files published"
fi

# ---------------------------------------------------------------- 4. config --

say "Configuring nginx on port $PORT"

# Homebrew's servers/ is the canonical drop point, but it is root-owned on most
# machines. Fall back to a user-owned include dir when sudo is unavailable, so
# the script still finishes without a password.
SERVERS_DIR="$NGINX_ETC/servers"
FALLBACK_DIR="$NGINX_ETC/ail-website.d"
CONF_PATH=""

if [ -d "$SERVERS_DIR" ] && [ -w "$SERVERS_DIR" ]; then
    CONF_PATH="$SERVERS_DIR/$CONF_NAME"
    INSTALL_SUDO=0
elif [ -d "$SERVERS_DIR" ] && { sudo -n true >/dev/null 2>&1 || [ -t 0 ]; }; then
    CONF_PATH="$SERVERS_DIR/$CONF_NAME"
    INSTALL_SUDO=1
else
    CONF_PATH="$FALLBACK_DIR/$CONF_NAME"
    INSTALL_SUDO=0
    mkdir -p "$FALLBACK_DIR"
    if ! grep -qF "ail-website.d/*.conf" "$NGINX_ETC/nginx.conf"; then
        [ -w "$NGINX_ETC/nginx.conf" ] || die "cannot write $SERVERS_DIR (needs sudo) or $NGINX_ETC/nginx.conf"
        cp "$NGINX_ETC/nginx.conf" "$NGINX_ETC/nginx.conf.bak-ail"
        # Slip the include in beside the one Homebrew already ships.
        awk '{ print } /^[[:space:]]*include[[:space:]]+servers\/\*;/ { print "    include ail-website.d/*.conf;" }' \
            "$NGINX_ETC/nginx.conf.bak-ail" > "$NGINX_ETC/nginx.conf"
        grep -qF "ail-website.d/*.conf" "$NGINX_ETC/nginx.conf" \
            || die "could not add the include to nginx.conf — add 'include ail-website.d/*.conf;' inside http{} by hand"
    fi
    warn "$SERVERS_DIR needs sudo; using $FALLBACK_DIR instead"
fi

# Somebody else on this port is a hard stop — nginx would keep serving theirs
# and quietly ignore ours. Look at every config nginx actually loads (includes
# can point anywhere) plus anything staged under the config dir but not yet
# live, minus the two paths where our own file may already sit.
LOADED_CONFS="$( { nginx -T 2>/dev/null || true; } | sed -n 's/^# configuration file \(.*\):$/\1/p')"
STAGED_CONFS="$(find "$NGINX_ETC" -name '*.conf' -type f 2>/dev/null || true)"
OTHER_CONF="$(printf '%s\n%s\n' "$LOADED_CONFS" "$STAGED_CONFS" | sed '/^$/d' | sort -u \
    | grep -vxF "$SERVERS_DIR/$CONF_NAME" | grep -vxF "$FALLBACK_DIR/$CONF_NAME" \
    | tr '\n' '\0' \
    | { xargs -0 grep -lE "listen[[:space:]]+(\[?[0-9a-f.:]+\]?:)?${PORT}[;[:space:]]" 2>/dev/null || true; })"
[ -z "$OTHER_CONF" ] || die "another nginx config already claims port $PORT:
$OTHER_CONF"

HOLDER="$( { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true; } | awk 'NR>1 {print $1}' | sort -u | tr '\n' ' ')"
case "${HOLDER// /}" in
    ''|nginx) ;;
    *) die "port $PORT is already held by: ${HOLDER}— stop it or pass --port" ;;
esac

RENDERED="$(mktemp -t ail-website-conf)"
trap 'rm -f "$RENDERED"' EXIT

{
    echo "# Generated by scripts/deploy.sh from deploy/nginx/ail-website.conf."
    echo "# Every deploy overwrites this file — edit the one in the repo instead."
    sed \
        -e "s|^.*# @@PORT@@$|    listen      ${PORT};|" \
        -e "s|^.*# @@PORT6@@$|    listen      [::]:${PORT};|" \
        -e "s|^.*# @@ROOT@@$|    root        ${WEBROOT};|" \
        -e "s|^.*# @@ACCESS_LOG@@$|    access_log  ${LOG_DIR}/ail-website.access.log;|" \
        -e "s|^.*# @@ERROR_LOG@@$|    error_log   ${LOG_DIR}/ail-website.error.log;|" \
        "$TEMPLATE"
} > "$RENDERED"

! grep -q '@@' "$RENDERED" || die "a @@TOKEN@@ survived rendering — template and script have drifted"

# Keep the old config so a failed `nginx -t` can be rolled straight back.
BACKUP=""
if [ -f "$CONF_PATH" ]; then
    BACKUP="$(mktemp -t ail-website-conf-prev)"
    cat "$CONF_PATH" > "$BACKUP"
fi

if [ "$INSTALL_SUDO" -eq 1 ]; then
    say "Writing $CONF_PATH (sudo)"
    sudo install -m 0644 "$RENDERED" "$CONF_PATH"
else
    install -m 0644 "$RENDERED" "$CONF_PATH"
fi
ok "config installed at $CONF_PATH"


restore_conf() {
    if [ -n "$BACKUP" ]; then
        if [ "$INSTALL_SUDO" -eq 1 ]; then sudo install -m 0644 "$BACKUP" "$CONF_PATH"
        else install -m 0644 "$BACKUP" "$CONF_PATH"; fi
    else
        if [ "$INSTALL_SUDO" -eq 1 ]; then sudo rm -f "$CONF_PATH"; else rm -f "$CONF_PATH"; fi
    fi
    rm -f "$BACKUP"
}

# `nginx -t` as this user: the pidfile and logs belong to it, and a root test
# would write root-owned logs the service can no longer append to.
if ! TEST_OUT="$(nginx -t 2>&1)"; then
    restore_conf
    printf '%s\n' "$TEST_OUT" >&2
    die "nginx rejected the config — the previous one has been put back"
fi
rm -f "$BACKUP"
ok "nginx -t passed"

# Only once the new config has passed: drop any copy of ours left behind in the
# other candidate location, or two server blocks fight over the same port. This
# has to come after the test — deleting it earlier would mean a rejected config
# takes the site down with it, having removed the one that was serving.
for stale in "$SERVERS_DIR/$CONF_NAME" "$FALLBACK_DIR/$CONF_NAME"; do
    if [ "$stale" = "$CONF_PATH" ] || [ ! -f "$stale" ]; then continue; fi
    rm -f "$stale" 2>/dev/null || sudo rm -f "$stale" \
        || die "a stale copy of this config needs sudo to remove: sudo rm $stale"
    warn "removed a stale copy at $stale"
    nginx -t >/dev/null 2>&1 || die "nginx rejected the config after removing $stale"
done

# --------------------------------------------------------------- 5. service --

if [ "$NO_SERVICE" -eq 1 ]; then
    warn "--no-service: launchd untouched"
    nginx -s reload >/dev/null 2>&1 && ok "reloaded the running nginx" || warn "nginx is not running"
else
    say "Enabling nginx at login"
    STATE="$(brew services list 2>/dev/null | awk '$1 == "nginx" { print $2 }')"
    RUNNING=0
    if pgrep -f "nginx: master" >/dev/null 2>&1; then RUNNING=1; fi

    if [ "$RUNNING" -eq 1 ]; then
        # This nginx may already be serving other people's sites. A reload is
        # graceful — old workers finish their requests — so never restart the
        # master out from under them, even if the reload fails.
        if nginx -s reload >/dev/null 2>&1; then
            ok "reloaded the running nginx — every other vhost kept serving"
        else
            warn "nginx is running but refused the reload; apply it yourself with:"
            warn "    brew services restart nginx   # briefly interrupts every site on this nginx"
        fi
        if [ "$STATE" != "started" ]; then
            warn "nginx is running outside launchd — run 'brew services start nginx' so it returns after a reboot"
        fi
    else
        brew services start nginx >/dev/null
        ok "nginx service started"
    fi
    # RunAtLoad in the LaunchAgent is what brings nginx back after a reboot.
    # Ask brew where the plist is — it has renamed the label before
    # (homebrew.mxcl.nginx → sh.brew.nginx), so the path cannot be hardcoded.
    PLIST="$(brew services list 2>/dev/null | awk '$1 == "nginx" { print $NF }')"
    case "$PLIST" in
        '~'/*) PLIST="$HOME/${PLIST#'~'/}" ;;
        /*)    ;;
        *)     PLIST="" ;;
    esac
    if [ -n "$PLIST" ] && [ -f "$PLIST" ] \
        && /usr/libexec/PlistBuddy -c 'Print :RunAtLoad' "$PLIST" 2>/dev/null | grep -qi true; then
        ok "auto-start registered: $PLIST (RunAtLoad)"
    else
        warn "could not confirm auto-start — check 'brew services list' for nginx"
    fi
fi

# ---------------------------------------------------------------- 6. verify --

say "Verifying http://localhost:$PORT"

# Everything else this nginx serves, so the blast radius of a deploy is visible.
OTHER_LISTENS="$( { nginx -T 2>/dev/null || true; } \
    | sed -n 's/^[[:space:]]*listen[[:space:]]\{1,\}\([^;]*\);.*/\1/p' \
    | sort -u | { grep -vxE "(\[::\]:)?${PORT}" || true; } | tr '\n' ' ')"

for _ in $(seq 1 25); do
    nc -z 127.0.0.1 "$PORT" >/dev/null 2>&1 && break
    sleep 0.2
done

code() { curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$PORT$1"; }
FAILED=0
check() {
    local path="$1" want="$2" got
    got="$(code "$path")"
    if [ "$got" = "$want" ]; then ok "$path → $got"
    else warn "$path → $got (expected $want)"; FAILED=1; fi
}

check /                                200
check /simulator/                      200
check /og.png                          200
check /this-path-does-not-exist        404

[ "$FAILED" -eq 0 ] || die "nginx is configured but is not serving as expected — see $LOG_DIR/ail-website.error.log"

cat <<SUMMARY

  site        http://localhost:$PORT/
  simulator   http://localhost:$PORT/simulator/

  webroot     $WEBROOT
  config      $CONF_PATH
  untouched   ${OTHER_LISTENS:-none} (other vhosts on this nginx)
  logs        $LOG_DIR/ail-website.{access,error}.log

  nginx runs as a login LaunchAgent, so it comes back on its own after a
  reboot once you log in. Re-run this script after any change to publish it.
SUMMARY
