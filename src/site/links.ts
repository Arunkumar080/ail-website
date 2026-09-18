/** Section anchors in the header. The active one is painted by Nav's observer. */
export const LINKS = [
  { href: '#interventions', label: 'Services' },
  { href: '#arsenal', label: 'Arsenal' },
  { href: '#economics', label: 'Model' },
  { href: '#security', label: 'Security' },
] as const;

/** The perimeter-node canvas app. */
export const SIMULATOR_HREF = '/simulator/';

/** Footer column 2 — the nav list with the simulator appended in place of engagement. */
export const PRODUCT_LINKS = [
  { href: '#interventions', label: 'Services' },
  { href: '#arsenal', label: 'Arsenal' },
  { href: '#economics', label: 'Model' },
  { href: '#security', label: 'Security' },
  { href: SIMULATOR_HREF, label: 'Value-Delta Simulator' },
] as const;

/** Footer column 3. */
export const COMPANY_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#engagement', label: 'The 30-Day Engagement' },
  { href: '#careers', label: 'Careers' },
  { href: '#contact', label: 'Contact' },
] as const;
