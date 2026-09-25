// Fixed, not env-configurable -- GA4 is not optional per-deployment the way
// AdSense's client ID is (see layout.tsx's `adsenseClientId`), it's set once
// for the project. Kept in its own constant purely so the id has one place
// to change if the property is ever recreated.
export const GA_MEASUREMENT_ID = "G-B2ERW6CCVL";
