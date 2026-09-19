import type { ReactNode } from 'react';
import { Container } from '../components/Container.tsx';
import { Footer } from '../components/Footer.tsx';
import { Item } from '../components/Motion.tsx';
import { Nav } from '../components/Nav.tsx';
import { Glow } from '../components/Section.tsx';
import {
  CONTACT_EMAIL,
  CONTROLLER,
  EFFECTIVE,
  ENQUIRY_RETENTION,
  LOG_RETENTION,
  PLATFORMS,
  REGISTERED_ADDRESS,
  SALES_EMAIL,
} from './policy.ts';

/**
 * The privacy policy, at its own URL so an advertising platform can review it
 * and a campaign can link to it. Same shell as the marketing page — Nav and
 * Footer with `base="/"` so their section anchors walk back to the front page
 * rather than dying as fragments here.
 *
 * `site.css` lowercases the whole body, which is right for the marketing copy
 * and wrong for a legal document: it would render "gdpr", "google ads" and the
 * company's own name in lower case. The prose column therefore carries
 * `normal-case`, while the chrome (nav, footer, eyebrows) stays lowercase so
 * the page still reads as the same site.
 */

const H2 = 'text-[24px] font-medium leading-[1.2] tracking-[-0.03em] text-ink sm:text-[27px]';
const P = 'mt-4 text-[15.5px] leading-[1.68] text-muted';
const LI = 'text-[15.5px] leading-[1.68] text-muted';
const LINK = 'text-cyan underline decoration-cyan/35 underline-offset-[3px] transition-colors duration-300 hover:text-cyan-lift';

/** One numbered section, with the anchor an ad reviewer can deep-link to. */
function Clause({ id, index, title, children }: { id: string; index: string; title: string; children: ReactNode }) {
  return (
    <Item>
      <section id={id} className="scroll-mt-24 border-t border-white/[0.07] pt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dim">{index}</p>
        <h2 className={`mt-3 ${H2}`}>{title}</h2>
        {children}
      </section>
    </Item>
  );
}

/** A tick list. `mark` is the cyan glyph carrying the row's meaning. */
function List({ items, mark = '·' }: { items: ReactNode[]; mark?: string }) {
  return (
    <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-3 ${LI}`}>
          <span aria-hidden="true" className="mt-px shrink-0 font-mono text-[13px] text-cyan">
            {mark}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Privacy() {
  return (
    <>
      <Nav base="/" />
      <main id="top" className="relative isolate overflow-x-clip bg-shell">
        <Container className="max-w-[860px] py-14 lg:py-20">
          <Glow x="50%" y="12%" w="1000px" h="420px" alpha={0.1} />

          <Item>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.24em] text-cyan">{'// privacy'}</p>
            <h1 className="mt-5 text-balance text-[34px] font-medium leading-[1.04] tracking-[-0.042em] text-ink sm:text-[42px] lg:text-[48px]">
              privacy policy.
            </h1>
            <p className="mt-5 normal-case text-[17px] leading-[1.62] text-quiet">
              We collect contact details for one reason: to reply to you. We do not sell them, we do not share them for
              anyone else&rsquo;s marketing, and we do not publish them.
            </p>
            <p className="mt-6 font-mono text-[11.5px] tracking-[0.1em] text-dim">
              <span className="normal-case">
                last updated <time dateTime={EFFECTIVE.iso}>{EFFECTIVE.label}</time>
              </span>
            </p>
          </Item>

          <div className="mt-12 flex flex-col gap-10 normal-case">
            <Clause id="who-we-are" index="01" title="Who we are">
              <p className={P}>
                {CONTROLLER} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the data controller for the personal data described
                in this policy. We operate from {REGISTERED_ADDRESS}. A postal address is available on request.
              </p>
              <p className={P}>
                For anything in this policy &mdash; including a request to see, correct or delete your data &mdash; write
                to{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                  {CONTACT_EMAIL}
                </a>
                . This policy covers this website, the enquiry form on it, and enquiries that reach us through our
                advertising.
              </p>
            </Clause>

            <Clause id="what-we-collect" index="02" title="What we collect, and where it comes from">
              <p className={P}>There are three ways personal data reaches us. There is no fourth.</p>

              <h3 className="mt-7 text-[16px] font-medium tracking-[-0.01em] text-quiet">
                a. The enquiry form on this website
              </h3>
              <p className={P}>
                When you submit the form, we receive the fields you filled in: your name, your work email address, and
                optionally your company, your approximate monthly cloud spend, and your description of the problem you
                want solved. A hidden field and a timing check sit on the form to reject automated submissions; neither
                records anything about you.
              </p>

              <h3 className="mt-7 text-[16px] font-medium tracking-[-0.01em] text-quiet">
                b. Advertising platforms and their lead forms
              </h3>
              <p className={P}>
                We advertise on third-party platforms &mdash; currently {PLATFORMS.join(', ')}. If you respond to one of
                our ads by completing a lead form hosted by the platform rather than by visiting this site, the platform
                passes us the details you entered there: typically your name, work email, company, and sometimes a phone
                number or job title.
              </p>
              <p className={P}>
                We receive that as a notification of your enquiry. We do not receive, request or buy any wider profile
                about you from the platform &mdash; no browsing history, no interests, no audience segments, no
                identifiers beyond what you typed into the form. The platform collects its own data about how you
                interacted with the ad under its own privacy policy, as its own controller; that part is between you and
                them, and their policy governs it.
              </p>

              <h3 className="mt-7 text-[16px] font-medium tracking-[-0.01em] text-quiet">
                c. Email and direct contact
              </h3>
              <p className={P}>
                If you email us, or we exchange messages about a possible engagement, we hold that correspondence and
                whatever you chose to put in it.
              </p>

              <h3 className="mt-7 text-[16px] font-medium tracking-[-0.01em] text-quiet">
                Technical data, and what this site does not do
              </h3>
              <p className={P}>
                Our web server keeps standard access logs: IP address, the page requested, timestamp, browser user-agent.
                We use them to keep the site up and to stop abuse of the enquiry form. Beyond that:
              </p>
              <List
                mark="×"
                items={[
                  'This website sets no cookies. Nothing is stored in your browser.',
                  'There is no analytics tool, no advertising pixel, no conversion tag and no remarketing tag on this site.',
                  'There are no third-party scripts, fonts or embeds loaded from anyone else — the site serves its own.',
                  'We ask for no account, no password and no payment details.',
                ]}
              />
              <p className={P}>
                That is the state of this site today. If we ever add measurement or advertising tags, we will update this
                page and ask for consent where the law requires it, before they run.
              </p>
            </Clause>

            <Clause id="why" index="03" title="Why we use it">
              <p className={P}>
                One purpose: to make contact with you about your enquiry and take it forward. Specifically, we use your
                details to reply, to ask what we need in order to understand the problem, to send you the modelled saving
                and the royalty rate we would work under, and to keep a record of that correspondence.
              </p>
              <p className={P}>
                We do not use your details to build a marketing list, and we do not send unsolicited campaigns to people
                who merely enquired.
              </p>
              <p className={P}>
                Under UK and EU data protection law our lawful bases are Article 6(1)(b) &mdash; taking steps at your
                request before entering into a contract &mdash; and Article 6(1)(f), our legitimate interest in
                responding to business enquiries addressed to us. You can object to the latter at any time; see{' '}
                <a href="#your-rights" className={LINK}>
                  your rights
                </a>
                .
              </p>
            </Clause>

            <Clause id="what-we-never-do" index="04" title="What we never do with it">
              <p className={P}>
                This is the part that matters most to us, so it is stated as a commitment rather than buried in a
                qualification. We never:
              </p>
              <List
                mark="×"
                items={[
                  <>
                    <strong className="font-medium text-quiet">Sell, rent or license</strong> your personal data to
                    anyone, for any price, ever.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Share it for anyone else&rsquo;s marketing</strong> —
                    including any partner, affiliate, reseller or data broker.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Publish it.</strong> Your name, your company and the
                    problem you described do not appear on this site, in a case study, in a testimonial or in a pitch
                    deck without your written permission.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Upload it back to an advertising platform.</strong> Your
                    details are never used to build a custom audience, a matched audience, a lookalike audience or an
                    offline-conversion upload on any ad platform.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Train models on it.</strong> Your enquiry is not used as
                    training data for our systems or anyone else&rsquo;s.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Profile or auto-decide.</strong> No automated
                    decision-making with legal or similarly significant effects, and no profiling of you.
                  </>,
                ]}
              />
            </Clause>

            <Clause id="who-sees-it" index="05" title="Who else can see it">
              <p className={P}>
                Your enquiry is read by the people at {CONTROLLER} who would work on it. Beyond that, personal data
                passes only through the suppliers that make the mailbox and the website run, each acting on our
                instructions:
              </p>
              <List
                items={[
                  'Our email provider, which delivers and stores the message that carries your enquiry.',
                  'Our hosting and infrastructure provider, on whose server this site and its access logs sit.',
                  'The advertising platform you used, if you reached us through a lead form it hosts — it holds its own copy under its own policy.',
                ]}
              />
              <p className={P}>
                We will also disclose data where the law requires it &mdash; a valid court order or regulatory demand
                &mdash; and to our professional advisers where necessary. If the business is ever sold or reorganised,
                enquiry records may transfer with it, and this policy continues to apply to them.
              </p>
              <p className={P}>
                Our team works from the United Kingdom and Singapore, so your enquiry may be read in either. Where
                personal data leaves the UK or the EEA, we rely on the safeguards the law provides for such transfers,
                including the UK Addendum and the EU Standard Contractual Clauses.
              </p>
            </Clause>

            <Clause id="how-long" index="06" title="How long we keep it">
              <p className={P}>
                The enquiry form has no database behind it. The form is turned into a single email and nothing is written
                to disk by the website itself &mdash; but the email then sits in a mailbox, and that is where retention
                actually happens. Being precise about this:
              </p>
              <List
                items={[
                  <>
                    <strong className="font-medium text-quiet">Enquiries and correspondence:</strong> kept for{' '}
                    {ENQUIRY_RETENTION} after our last exchange, then deleted. If the enquiry becomes an engagement, the
                    records are kept for as long as the engagement runs and for the period our legal and tax obligations
                    require afterwards.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Web-server access logs:</strong> rotated and deleted after{' '}
                    {LOG_RETENTION}.
                  </>,
                  <>
                    <strong className="font-medium text-quiet">Failed deliveries:</strong> if an enquiry cannot be
                    emailed, its contents may be written to the server&rsquo;s system log so the enquiry is not lost.
                    Those logs rotate on the same schedule as the rest of the system logs.
                  </>,
                ]}
              />
              <p className={P}>
                Ask us to delete your enquiry sooner and we will, unless we are required to keep it.
              </p>
            </Clause>

            <Clause id="security" index="07" title="How it is protected">
              <p className={P}>
                Traffic to this site and to our mail provider is encrypted in transit. The enquiry form is served by a
                small relay that holds no database and keeps no queue, reachable only from the web server on the same
                machine. Its credentials are readable only by the machine&rsquo;s administrator, never by the account the
                site itself runs as. The form is rate-limited per address and in total, so it cannot be used to flood the
                mailbox.
              </p>
              <p className={P}>
                No system is perfect. If a breach ever affects your data and the law requires it, we will notify the
                relevant regulator and you.
              </p>
            </Clause>

            <Clause id="your-rights" index="08" title="Your rights">
              <p className={P}>
                Depending on where you live, you have some or all of the following rights over your personal data. In the
                UK and EEA you have all of them:
              </p>
              <List
                items={[
                  'To be told what we hold about you, and to get a copy of it.',
                  'To have inaccurate data corrected.',
                  'To have your data deleted.',
                  'To restrict how we use it, or to object to our use of it — including objecting to our legitimate interests.',
                  'To receive your data in a portable, machine-readable form.',
                  'To withdraw consent, where we relied on consent, without affecting what was lawful beforehand.',
                ]}
              />
              <p className={P}>
                Write to{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                  {CONTACT_EMAIL}
                </a>{' '}
                and we will respond within one month. There is no charge. We may ask you to confirm your identity first
                &mdash; usually by replying from the address the enquiry came from.
              </p>
              <p className={P}>
                If you are unhappy with our answer you can complain to a supervisory authority: in the UK, the
                Information Commissioner&rsquo;s Office (
                <a href="https://ico.org.uk" className={LINK} rel="noopener noreferrer" target="_blank">
                  ico.org.uk
                </a>
                ); in Singapore, the Personal Data Protection Commission (
                <a href="https://www.pdpc.gov.sg" className={LINK} rel="noopener noreferrer" target="_blank">
                  pdpc.gov.sg
                </a>
                ); or your local authority in the EEA. We would rather you came to us first.
              </p>
            </Clause>

            <Clause id="children" index="09" title="Children">
              <p className={P}>
                This is a business-to-business service. It is not directed at children, and we do not knowingly collect
                data from anyone under 16. If you believe a child has sent us their details, tell us and we will delete
                them.
              </p>
            </Clause>

            <Clause id="changes" index="10" title="Changes to this policy">
              <p className={P}>
                If what we do with personal data changes, we change this page and move the date at the top of it. This
                URL stays the same, so a link to it from an ad, a lead form or a platform review never goes stale. Where
                a change materially affects people whose data we already hold, we tell them directly.
              </p>
            </Clause>

            <Clause id="contact" index="11" title="Contact us">
              <p className={P}>
                Privacy, data protection and anything in this policy:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              {/* One published mailbox today, so naming it twice would just look
                  like an oversight. The moment a dedicated privacy@ address
                  exists, `policy.ts` splits them and this line comes back. */}
              {SALES_EMAIL !== CONTACT_EMAIL && (
                <p className={P}>
                  Everything else, including new engagements:{' '}
                  <a href={`mailto:${SALES_EMAIL}`} className={LINK}>
                    {SALES_EMAIL}
                  </a>
                  .
                </p>
              )}
              <p className={P}>
                {CONTROLLER} &mdash; {REGISTERED_ADDRESS}.
              </p>
            </Clause>
          </div>

          <Item>
            <div className="mt-14 border-t border-white/[0.07] pt-8">
              <a
                href="/"
                className="inline-flex h-11 items-center rounded-full border border-cyan/55 px-6 font-mono text-[12px] normal-case tracking-[0.08em] text-cyan transition-colors duration-300 hover:bg-cyan/10"
              >
                Back to aetheriuslabs
              </a>
            </div>
          </Item>
        </Container>
      </main>
      <Footer base="/" />
    </>
  );
}
