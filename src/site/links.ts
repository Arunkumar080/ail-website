/** Section anchors in the header. The active one is painted by Nav's observer. */
export const LINKS = [
  { href: '#interventions', label: 'interventions' },
  { href: '#arsenal', label: 'arsenal' },
  { href: '#economics', label: 'economics' },
  { href: '#security', label: 'security' },
  { href: '#engagement', label: 'engagement' },
] as const;

/** The perimeter-node canvas app. */
export const SIMULATOR_HREF = '/simulator/';

/** Footer column 2 — the nav list with the simulator appended in place of engagement. */
export const PRODUCT_LINKS = [
  { href: '#interventions', label: 'interventions' },
  { href: '#arsenal', label: 'arsenal' },
  { href: '#economics', label: 'economics' },
  { href: '#security', label: 'security' },
  { href: SIMULATOR_HREF, label: 'value-delta simulator' },
] as const;

/** Footer column 3. */
export const COMPANY_LINKS = [
  { href: '#about', label: 'about' },
  { href: '#engagement', label: 'the 30-day engagement' },
  { href: '#careers', label: 'careers' },
  { href: '#contact', label: 'contact' },
] as const;
