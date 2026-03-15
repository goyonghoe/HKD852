/**
 * Google AdSense configuration and slot IDs.
 */

export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

/** Ad unit slot IDs */
export const AD_SLOTS = {
  HOME_BANNER: "SLOT_HOME_BANNER",
  RESULT_BANNER: "SLOT_RESULT_BANNER",
  BETWEEN_QUESTIONS: "SLOT_BETWEEN_QUESTIONS",
  RESULT_BOTTOM: "SLOT_RESULT_BOTTOM",
  SHARE_BANNER: "SLOT_SHARE_BANNER",
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

/**
 * Show an interstitial ad every N questions.
 * For example, if set to 3, an interstitial triggers after Q3, Q6, Q9...
 */
export const INTERSTITIAL_FREQUENCY = 3;

/**
 * Check whether the current question index should trigger an interstitial.
 */
export function shouldShowInterstitial(questionIndex: number): boolean {
  if (questionIndex <= 0) return false;
  return questionIndex % INTERSTITIAL_FREQUENCY === 0;
}
