export interface ValidationOptions {
  checkDNS?: boolean;
  deepCheckSMTP?: boolean;
  allowDisposable?: boolean;
  checkTLD?: boolean;
}

export interface ValidationResult {
  email: string;
  user: string;
  domain: string;
  status: "valid" | "invalid";
  reason: string;
  disposable: boolean;
}

export type ReasonCode =
  | "MISSING_AT"
  | "MISSING_USER"
  | "MISSING_DOMAIN"
  | "TOO_LONG"
  | "INVALID_FORMAT"
  | "INVALID_TLD"
  | "DISPOSABLE"
  | "NO_MX"
  | "SMTP_FAIL"
  | "VALID";
