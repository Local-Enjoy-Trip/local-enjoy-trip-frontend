export type LocationConsent = "pending" | "granted" | "declined";

const locationConsentStorageKey = "spot-location-consent";

export function readLocationConsent(): LocationConsent {
  try {
    const savedConsent = window.localStorage.getItem(locationConsentStorageKey);

    return savedConsent === "granted" || savedConsent === "declined"
      ? savedConsent
      : "pending";
  } catch {
    return "pending";
  }
}

export function saveLocationConsent(
  consent: Exclude<LocationConsent, "pending">
) {
  window.localStorage.setItem(locationConsentStorageKey, consent);
}
