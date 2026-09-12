import { Arsenal } from './components/Arsenal.tsx';
import { Contact } from './components/Contact.tsx';
import { Economics } from './components/Economics.tsx';
import { Engagement } from './components/Engagement.tsx';
import { Footer } from './components/Footer.tsx';
import { Hero } from './components/Hero.tsx';
import { Interventions } from './components/Interventions.tsx';
import { Nav } from './components/Nav.tsx';
import { Security } from './components/Security.tsx';

/**
 * The front door: a naturally scrolling page that explains the interventions,
 * the arsenal and the royalty model before anyone reaches the perimeter-node
 * canvas at `/simulator/`. Sections sit in a centred 1216px shell
 * (`components/Container.tsx`), each declaring its own grid tracks, separated
 * by a single hairline top border. `main` is the one stacking context, so
 * every `-z-10` glow paints beneath every section's content.
 */
export function Site() {
  return (
    <>
      <Nav />
      <main className="relative isolate overflow-x-clip bg-shell">
        <Hero />
        <Interventions />
        <Arsenal />
        <Economics />
        <Security />
        <Engagement />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
