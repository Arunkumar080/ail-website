import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Container } from './Container.tsx';
import { Item } from './Motion.tsx';
import { Glow } from './Section.tsx';

const FIELD_LABEL = 'font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted';
const FIELD =
  'h-11 rounded-md border border-white/[0.16] bg-black/50 px-3 text-[15px] text-ink placeholder:text-dim/70 focus-visible:border-cyan/60';

/**
 * The design's form has no action. It posts to /api/contact, which nginx proxies
 * to the mail relay in server/contact.mjs — one email to the inbox, nothing
 * stored anywhere. At rest the markup is the design's; the status line below the
 * button only exists once a submission is in flight.
 */
const ENDPOINT = '/api/contact';

type Status = { state: 'idle' | 'sending' | 'sent' | 'error'; message?: string };

export function Contact() {
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  // How long the visitor took to fill the form in. The relay drops anything
  // completed faster than a human can read it, and treats 0 as "unknown" — so
  // stamping this after mount rather than during render costs nothing.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.state === 'sending') return;

    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus({ state: 'sending' });

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          company: data.get('company'),
          spend: data.get('spend'),
          context: data.get('context'),
          website: data.get('website'),
          startedAt: openedAt.current,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.ok) {
        setStatus({
          state: 'error',
          message: body.error || 'could not send that — email info@aetheriuslabs.com instead.',
        });
        return;
      }

      form.reset();
      openedAt.current = Date.now();
      setStatus({ state: 'sent', message: 'received. we reply within a week.' });
    } catch {
      // The relay is down, or the visitor is offline. Either way the mailto in
      // the left column still works, so point at it rather than just failing.
      setStatus({ state: 'error', message: 'network error — email info@aetheriuslabs.com instead.' });
    }
  };

  const sending = status.state === 'sending';

  return (
    <section id="contact" className="relative scroll-mt-20 border-t border-white/[0.07] py-14 lg:pt-16 lg:pb-[72px]">
      <Glow x="50%" y="40%" w="1200px" h="420px" alpha={0.1} />
      <Container className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        <Item>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.24em] text-cyan">{'// deploy'}</p>
          <h2 className="mt-5 max-w-[18ch] text-balance text-[34px] font-medium leading-[1.02] tracking-[-0.042em] text-ink sm:text-[42px] lg:text-[52px]">
            name your hardest problem.
          </h2>
          <p className="mt-5 max-w-[44ch] text-pretty text-[17px] leading-[1.6] text-muted lg:text-[18px]">
            send us the shape of your stack and a rough monthly spend. we return a modelled delta and a fixed royalty
            rate within a week — or tell you there is nothing worth taking.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 font-mono text-[13px] tracking-[0.06em]">
            <a href="mailto:info@aetheriuslabs.com" className="w-fit text-cyan transition-colors duration-300 hover:text-cyan-lift">
              info@aetheriuslabs.com
            </a>
            <span className="text-muted">london · singapore · remote</span>
          </div>
        </Item>

        <Item>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-[14px] border border-white/[0.12] bg-white/[0.022] p-6 lg:p-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>name</span>
                <input type="text" name="name" required autoComplete="name" placeholder="jordan okafor" className={FIELD} />
              </label>
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>work email</span>
                <input type="email" name="email" required autoComplete="email" placeholder="jordan@company.com" className={FIELD} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>company</span>
                <input type="text" name="company" autoComplete="organization" placeholder="northwind logistics" className={FIELD} />
              </label>
              <label className="flex flex-col gap-2">
                <span className={FIELD_LABEL}>monthly cloud spend</span>
                <input type="text" name="spend" inputMode="numeric" placeholder="$120,000" className={`${FIELD} font-mono text-sm`} />
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <span className={FIELD_LABEL}>what is breaking</span>
              <textarea
                name="context"
                rows={3}
                required
                placeholder="postgres write path is our ceiling; we are over-provisioned on kubernetes."
                className="resize-y rounded-md border border-white/[0.16] bg-black/50 p-3 text-[15px] leading-[1.5] text-ink placeholder:text-dim/70 focus-visible:border-cyan/60"
              />
            </label>

            {/* Off-screen decoy. A person never sees it; a bot that fills every
                input marks itself, and the relay silently drops the submission. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />

            <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                disabled={sending}
                className="h-12 cursor-pointer rounded-full border border-cyan bg-cyan/10 px-7 text-[15px] font-medium normal-case text-cyan transition-colors duration-300 hover:bg-cyan/[0.16] disabled:cursor-wait disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Book a Technical Call'}
              </button>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted">nda on request</span>
            </div>

            {status.message ? (
              <p
                role="status"
                aria-live="polite"
                className={`font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] ${
                  status.state === 'error' ? 'text-[#f87171]' : 'text-cyan'
                }`}
              >
                {status.message}
              </p>
            ) : null}
          </form>
        </Item>
      </Container>
    </section>
  );
}
