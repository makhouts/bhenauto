export const AUTOSCOUT_SOURCE_OF_TRUTH = "autoscout24";
export const WEBSITE_SOURCE_OF_TRUTH = "website";

export function isAutoScoutSourceOfTruth(value: string | null | undefined) {
  return value === AUTOSCOUT_SOURCE_OF_TRUTH;
}
