/**
 * Every fact in the privacy policy that is a business decision rather than a
 * property of the code lives here, in one block, so it can be checked in one
 * read before the URL goes to an ad reviewer.
 *
 * CONFIRM BEFORE PUBLISHING — each of these is a defensible default, not a
 * verified fact:
 *   · CONTACT_EMAIL — defaults to the address already published on the front
 *     page, because a policy that names a mailbox nobody reads is worse than
 *     one that names a working one: reviewers do test it, and a subject access
 *     request sent there has a legal clock on it. Switch to a dedicated
 *     privacy@ address only once that mailbox actually exists.
 *   · REGISTERED_ADDRESS — Google and Meta both prefer a full postal address on
 *     the policy itself. "available on request" passes review but is weaker.
 *   · MAIL_PROCESSOR — the relay authenticates as info@orieninfotech.com, a
 *     different domain from the controller named below. If Orien Infotech is a
 *     group company, say so; if it is a supplier, it is a processor and belongs
 *     in the disclosure list. Do not leave it undescribed.
 *   · ENQUIRY_RETENTION / LOG_RETENTION — these become true by being followed.
 *     LOG_RETENTION matches Ubuntu's stock logrotate for nginx (14 daily
 *     rotations); change the policy if you change logrotate, not the reverse.
 *   · PLATFORMS — list only the platforms you actually advertise on.
 */

/** Shown as "last updated" and used for the machine-readable date. */
export const EFFECTIVE = { iso: '2026-09-20', label: '20 September 2026' };

export const CONTROLLER = 'Aetherius Intelligence Labs Ltd';

/** Where privacy requests go. Must be a mailbox someone actually reads. */
export const CONTACT_EMAIL = 'deploy@aetheriuslabs.com';

/** The sales address already published on the front page. */
export const SALES_EMAIL = 'deploy@aetheriuslabs.com';

export const REGISTERED_ADDRESS = 'London, United Kingdom · Singapore';

/** How long an enquiry survives in the mailbox after the last exchange. */
export const ENQUIRY_RETENTION = '24 months';

/** Web-server access logs. Matches the stock Ubuntu nginx logrotate policy. */
export const LOG_RETENTION = '14 days';

/**
 * The advertising platforms whose lead forms may hand us an enquiry.
 *
 * CONFIRM: clause 04 promises enquiry data is never uploaded back to an ad
 * platform as a custom, matched or lookalike audience, or as an offline
 * conversion. That is the commitment the user asked for in their own words,
 * but it also rules out Google's Enhanced Conversions for Leads and offline
 * conversion import — the usual way a lead-gen advertiser feeds closed leads
 * back for bid optimisation. If those are ever switched on, clause 04 has to
 * change first.
 */
export const PLATFORMS = ['Google Ads', 'Meta (Facebook and Instagram)', 'LinkedIn', 'X'];
