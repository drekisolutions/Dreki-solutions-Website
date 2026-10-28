export const SMS_CONSENT_VERSION = "2026-10-10.5";
export const TERMS_VERSION = "2026-10-10.4";
export const PRIVACY_VERSION = "2026-10-26.1";
export const TERMS_AGREEMENT = "I agree to the Terms and Privacy Policy.";
export const SMS_PURPOSE = "I agree to receive service texts from Dreki Solutions LLC: opt-in confirmations, appointment reminders, order and waitlist updates, and client project updates. No marketing or promotional texts.";
export const SMS_DISCLOSURES = "Message frequency varies. Msg & data rates may apply.";
export const SMS_HELP = "Reply HELP for help.";
export const SMS_STOP = "Reply STOP to opt out.";
export const SMS_OPTIONAL = "Consent is optional and not a condition of purchase.";
export const SMS_CONSENT =
  [SMS_PURPOSE, SMS_DISCLOSURES, SMS_HELP, SMS_STOP, SMS_OPTIONAL].join(" ");

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming", "American Samoa",
  "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands",
] as const;
