/**
 * Veer Vandan campaign content and legal copy.
 *
 * Isomorphic (no server-only imports) so both client components and server
 * routes can use it.
 *
 * ⚠️ BEFORE PUBLISHING: confirm the bracketed entities below with the campaign.
 * The source document says to replace the placeholder with the exact registered
 * entity name (e.g. the formal Office / committee name).
 */

export const CAMPAIGN = {
  name: "Veer Vandan",
  copyrightYear: 2026,
  /** TODO: confirm the exact registered entity name before going live. */
  copyrightHolder: "Office of Rajya Sabha MP Sujeet Kumar",
  /** TODO: confirm the formal organising-committee name before going live. */
  organisingCommittee: "the Veer Vandan Organising Committee",
} as const;

/** 2.1 Footer Notice — site-wide, bottom of every page. */
export const COPYRIGHT_NOTICE =
  `© ${CAMPAIGN.copyrightYear} ${CAMPAIGN.name}, ${CAMPAIGN.copyrightHolder}. ` +
  `All rights reserved. Content, design, and materials on this website may not ` +
  `be reproduced without written permission.`;

/** 2.2 Submission Consent — required checkbox by the Submit button. */
export const SUBMISSION_CONSENT =
  `I confirm this letter is my own original writing. I grant ` +
  `${CAMPAIGN.organisingCommittee} permission to reproduce, display, and ` +
  `publish this letter — online, in print, or at public events as part of the ` +
  `${CAMPAIGN.name} campaign, with credit as specified.`;

/** 2.4 Guardian Consent — shown when the participant is under 18. */
export const GUARDIAN_CONSENT =
  `I am the parent/guardian of the participant named above and consent to ` +
  `their letter being submitted and displayed as part of this campaign.`;

/** 2.5 Data-Use Line — small print beneath the form. */
export const DATA_USE_NOTICE =
  `We collect only the details needed to process your submission (name, ` +
  `contact info). This information won't be shared beyond what's required to ` +
  `run the campaign.`;

/**
 * The five official "To our heroes" tribute messages supplied for the campaign,
 * shown as a featured set on the home page.
 */
export const FEATURED_MESSAGES: string[] = [
  `"Yeh Dil Maange More." Decades have passed. Yet every Indian heart still asks for one more opportunity to say Thank you.`,
  `"Jai Hind" is more than a salute — it is a promise that your courage and sacrifice will never be forgotten. Thank you for protecting our nation and reminding us of the true meaning of service before self.`,
  `Tiger Hill stands as a symbol of what determination and courage can achieve. Your unwavering spirit continues to remind us that no challenge is too great when it is faced with love for the nation. Thank you for your service.`,
  `Every time the Tricolour flies proudly, it reminds us of the courage of those who protected it against all odds. Thank you for your sacrifice and for inspiring every Indian to cherish the freedom we enjoy today.`,
  `We may not have witnessed Kargil, but we have inherited your legacy. Your courage continues to inspire us to serve our nation with integrity, compassion, and pride. Thank you for leading by example.`,
];
