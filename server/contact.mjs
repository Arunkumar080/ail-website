#!/usr/bin/env node
//
// Mail relay for the contact form on the marketing shell.
//
// The site is a static build with no backend and no database, and this keeps it
// that way: a submission is turned into one email and then forgotten. Nothing is
// written to disk, nothing is queued, nothing is stored.
//
//   POST /api/contact          JSON in, JSON out, sends the mail
//   GET  /api/contact/health   liveness for scripts/deploy.sh
//
// It listens on loopback only; nginx proxies /api/ to it. Configuration comes
// from the environment — see server/contact.env.example.

import http from 'node:http';
import nodemailer from 'nodemailer';

// ------------------------------------------------------------------ config --

function num(v, fallback) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

const cfg = {
  port: num(process.env.CONTACT_PORT, 8787),
  host: process.env.CONTACT_HOST || '127.0.0.1',

  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: num(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASSWORD || '',
  // Implicit TLS on 465; STARTTLS on 587 and everything else.
  smtpSecure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : num(process.env.SMTP_PORT, 587) === 465,

  from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  to: process.env.CONTACT_TO || 'info@aetheriuslabs.com',
  subjectTag: process.env.CONTACT_SUBJECT_TAG || 'aetheriuslabs.com',

  // A submission that fails to send is gone — there is no store to retry from.
  // Logging it to the journal is the cheapest way not to lose the lead; it does
  // put the sender's details in the system log. Set to 'false' to keep them out.
  logFailedPayload: process.env.CONTACT_LOG_FAILURES !== 'false',

  maxPerWindow: num(process.env.CONTACT_RATE_LIMIT, 5),
  windowMs: num(process.env.CONTACT_RATE_WINDOW_MS, 10 * 60 * 1000),

  // A ceiling across all senders. The per-IP cap alone still allows 720 sends a
  // day from one address, and a consumer Gmail account is cut off at 500 — which
  // would take the mailbox down for real business mail, not just the form.
  maxPerDay: num(process.env.CONTACT_DAILY_LIMIT, 120),
};

for (const key of ['smtpHost', 'smtpUser', 'smtpPass', 'from']) {
  if (!cfg[key]) {
    console.error(`[contact] missing configuration: ${key} — see server/contact.env.example`);
    process.exit(1);
  }
}

const MAX_BODY = 16 * 1024; // the form's five fields cannot legitimately exceed this
const FIELD_LIMITS = { name: 120, email: 254, company: 160, spend: 60, context: 4000 };
const MIN_FILL_MS = 2500; // a human cannot read and complete the form faster than this

// ------------------------------------------------------------------- mailer --

const transporter = nodemailer.createTransport({
  host: cfg.smtpHost,
  port: cfg.smtpPort,
  secure: cfg.smtpSecure,
  auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

// Report a bad password or a blocked port at startup rather than on the first
// real submission, but keep serving either way — the endpoint staying up means
// nginx and the deploy check still behave, and the log says what is wrong.
transporter.verify().then(
  () => console.log(`[contact] smtp ready: ${cfg.smtpUser} via ${cfg.smtpHost}:${cfg.smtpPort}`),
  (err) =>
    console.error(`[contact] smtp NOT ready: ${err.message} — submissions will fail until this is fixed`),
);

// -------------------------------------------------------------- rate limit --

// In memory, so it resets when the service restarts. That is the right trade for
// a form that sees a handful of submissions a week: no store, no cleanup job.
const hits = new Map();

// Sends actually made in the last 24h, oldest first. Only successful sends count:
// a rejected or dropped submission costs the mailbox nothing.
let sends = [];

function quotaExhausted() {
  const now = Date.now();
  sends = sends.filter((t) => now - t < 24 * 60 * 60 * 1000);
  return sends.length >= cfg.maxPerDay;
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < cfg.windowMs);
  if (recent.length >= cfg.maxPerWindow) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= cfg.windowMs)) hits.delete(k);
  }
  return false;
}

// -------------------------------------------------------------- validation --

// Deliberately permissive: the address only has to be plausible enough to reply
// to. Anything stricter starts rejecting real addresses.
const EMAIL = /^[^\s@,;:<>"]+@[^\s@.,;:<>"]+(\.[^\s@.,;:<>"]+)+$/;

// Control characters are header-injection material and no legitimate form field
// contains them. Newlines are allowed back into the free-text field only.
// eslint-disable-next-line no-control-regex -- matching them is the entire point
const CONTROL = /[\x00-\x1f\x7f]/g;

function clean(value, limit) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL, '').trim().slice(0, limit);
}

function parse(raw) {
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: 'malformed request' };
  }
  if (!body || typeof body !== 'object') return { error: 'malformed request' };

  // Hidden field, positioned off-screen in the form. A browser leaves it empty;
  // a bot that fills every input does not.
  if (clean(body.website, 200)) return { spam: 'honeypot' };

  const startedAt = num(body.startedAt, 0);
  if (startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS) return { spam: 'too fast' };

  const multiline = typeof body.context === 'string' ? body.context.replace(/\r\n?/g, '\n') : '';

  const fields = {
    name: clean(body.name, FIELD_LIMITS.name),
    email: clean(body.email, FIELD_LIMITS.email),
    company: clean(body.company, FIELD_LIMITS.company),
    spend: clean(body.spend, FIELD_LIMITS.spend),
    context: multiline
      .split('\n')
      .map((line) => clean(line, FIELD_LIMITS.context))
      .join('\n')
      .trim()
      .slice(0, FIELD_LIMITS.context),
  };

  if (!fields.name) return { error: 'name is required' };
  if (!EMAIL.test(fields.email)) return { error: 'a valid work email is required' };
  if (!fields.context) return { error: 'tell us what is breaking' };

  return { fields };
}

// ------------------------------------------------------------------- email --

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function html(f) {
  const row = (k, v) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;vertical-align:top;white-space:nowrap">${k}</td>` +
    `<td style="padding:4px 0;color:#111827;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif">${v}</td></tr>`;

  return [
    '<div style="max-width:640px;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827">',
    '<table style="border-collapse:collapse;margin-bottom:20px">',
    row('name', esc(f.name)),
    row('email', `<a href="mailto:${esc(f.email)}" style="color:#0e7490">${esc(f.email)}</a>`),
    row('company', esc(f.company || '—')),
    row('spend', esc(f.spend || '—')),
    '</table>',
    '<div style="color:#6b7280;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px">what is breaking</div>',
    `<div style="white-space:pre-wrap;border-left:2px solid #22d3ee;padding-left:14px">${esc(f.context)}</div>`,
    `<p style="margin-top:24px;color:#9ca3af;font-size:12px">sent by the contact form on ${esc(cfg.subjectTag)} — reply goes straight to ${esc(f.email)}</p>`,
    '</div>',
  ].join('');
}

function compose(f) {
  const text = [
    `name      ${f.name}`,
    `email     ${f.email}`,
    `company   ${f.company || '—'}`,
    `spend     ${f.spend || '—'}`,
    '',
    'what is breaking',
    '----------------',
    f.context,
    '',
    `— sent by the contact form on ${cfg.subjectTag}`,
  ].join('\n');

  return {
    // From: must stay the authenticated mailbox. Putting the visitor's address
    // here instead breaks SPF/DKIM alignment for the sending domain and the mail
    // is junked or rejected outright. Their address goes in Reply-To, so hitting
    // reply in the inbox still answers them directly.
    from: { name: `${f.name} via ${cfg.subjectTag}`, address: cfg.from },
    replyTo: { name: f.name, address: f.email },
    to: cfg.to,
    subject: `new enquiry — ${f.company || f.name}`,
    text,
    html: html(f),
  };
}

// ------------------------------------------------------------------ server --

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// X-Real-IP, never X-Forwarded-For: nginx builds the latter with
// $proxy_add_x_forwarded_for, which *appends* the peer address to whatever the
// client sent, so its first element is attacker-controlled and rotating it would
// walk straight past the rate limit. X-Real-IP is written from $remote_addr
// alone and cannot be forged from outside.
const clientIp = (req) =>
  (req.headers['x-real-ip'] || '').trim() || req.socket.remoteAddress || 'unknown';

const server = http.createServer(async (req, res) => {
  const path = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && (path === '/api/contact/health' || path === '/health')) {
    return send(res, 200, { ok: true });
  }

  if (path !== '/api/contact' && path !== '/contact') {
    return send(res, 404, { ok: false, error: 'not found' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method not allowed' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    console.warn(`[contact] rate limited ${ip}`);
    return send(res, 429, { ok: false, error: 'too many submissions — try again shortly' });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    return send(res, 413, { ok: false, error: 'request too large' });
  }

  const { fields, error, spam } = parse(raw);

  // A bot is told the same thing a person is: silence teaches it to retry with a
  // different shape, and no mail is sent either way.
  if (spam) {
    console.warn(`[contact] dropped (${spam}) from ${ip}`);
    return send(res, 200, { ok: true });
  }
  if (error) return send(res, 400, { ok: false, error });

  if (quotaExhausted()) {
    // Better to tell one visitor to email directly than to burn the sending
    // account's daily quota and lose every message after it.
    console.error(`[contact] DAILY QUOTA REACHED (${cfg.maxPerDay}) — refused ${fields.email}`);
    return send(res, 503, { ok: false, error: 'we are over quota today — email us directly instead' });
  }

  try {
    const info = await transporter.sendMail(compose(fields));
    sends.push(Date.now());
    console.log(
      `[contact] sent ${info.messageId} — ${fields.email} (${fields.company || 'no company'}) from ${ip}`,
    );
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error(`[contact] SEND FAILED for ${fields.email}: ${err.message}`);
    if (cfg.logFailedPayload) {
      // Nothing else holds this submission. Print it so it can be recovered from
      // the journal by hand: journalctl -u ail-contact | grep 'LOST SUBMISSION'
      console.error(`[contact] LOST SUBMISSION ${JSON.stringify(fields)}`);
    }
    return send(res, 502, { ok: false, error: 'could not send the message — email us directly instead' });
  }
});

server.headersTimeout = 15_000;
server.requestTimeout = 30_000;

server.listen(cfg.port, cfg.host, () => {
  console.log(`[contact] listening on http://${cfg.host}:${cfg.port} → ${cfg.to}`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log(`[contact] ${sig} — shutting down`);
    server.close(() => {
      transporter.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
