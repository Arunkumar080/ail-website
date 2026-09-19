/** Section anchors in the header. The active one is painted by Nav's observer. */
export const LINKS = [
  { href: '#interventions', label: 'Services' },
  { href: '#arsenal', label: 'Arsenal' },
  { href: '#economics', label: 'Model' },
  { href: '#security', label: 'Security' },
] as const;

/** The perimeter-node canvas app. */
export const SIMULATOR_HREF = '/simulator/';

/**
 * The privacy policy. A real page rather than a fragment, because ad platforms
 * require a stable, publicly reachable URL they can review and link from a
 * campaign — see `privacy/index.html`.
 */
export const PRIVACY_HREF = '/privacy/';

/** Footer column 2 — the nav list with the simulator appended in place of engagement. */
export const PRODUCT_LINKS = [
  { href: '#interventions', label: 'Services' },
  { href: '#arsenal', label: 'Arsenal' },
  { href: '#economics', label: 'Model' },
  { href: '#security', label: 'Security' },
  { href: SIMULATOR_HREF, label: 'Value-Delta Simulator' },
] as const;

/**
 * Footer column 3. The privacy policy is listed here as well as in the legal
 * strip at the very bottom: the strip is 11.5px dim mono and reads as fine
 * print, while an ad reviewer — and anyone actually looking for the policy —
 * scans these columns. Entries that are not fragments are used verbatim, so
 * this one resolves from any page.
 */
export const COMPANY_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#engagement', label: 'The 30-Day Engagement' },
  { href: '#careers', label: 'Careers' },
  { href: '#contact', label: 'Contact' },
  { href: PRIVACY_HREF, label: 'Privacy Policy' },
] as const;
