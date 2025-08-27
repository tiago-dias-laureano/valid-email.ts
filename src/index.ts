import { ValidationResult, ValidationOptions, ReasonCode } from "./types";
import { DISPOSABLE_DOMAINS } from "./data/disposable-domains";
import dns from "dns/promises";
import { fetchTLDs } from "./utils/fetch-tlds";
import { smtpCheck } from "./utils/smtp-check";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISPOSABLE_SET = new Set(DISPOSABLE_DOMAINS);

let defaultOptions: ValidationOptions = {
  checkDNS: true,
  deepCheckSMTP: false,
  allowDisposable: false,
  checkTLD: true,
};

export function setDefaultOptions(options: ValidationOptions) {
  defaultOptions = { ...defaultOptions, ...options };
}

function makeResult(
  email: string,
  user: string,
  domain: string,
  status: "valid" | "invalid",
  reasonCode: ReasonCode,
  reason: string,
  disposable: boolean
): ValidationResult & { reasonCode: ReasonCode } {
  return { email, user, domain, status, reason, disposable, reasonCode };
}

async function checkDomain(domain: string): Promise<boolean> {
  try {
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch {
    return false;
  }
}

export async function validate(
  email: string,
  options: ValidationOptions = {}
): Promise<ValidationResult & { reasonCode: ReasonCode }> {
  const { checkDNS, deepCheckSMTP, allowDisposable, checkTLD } = {
    ...defaultOptions,
    ...options,
  };

  email = email.trim().toLowerCase();
  const parts = email.split("@");

  if (parts.length !== 2) {
    return makeResult(
      email,
      "",
      "",
      "invalid",
      "MISSING_AT",
      "Email must contain a single '@' symbol",
      false
    );
  }

  const [user, domain] = parts;

  if (!user) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "MISSING_USER",
      "Missing username before '@'",
      false
    );
  }

  if (!domain.includes(".")) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "MISSING_DOMAIN",
      "Domain must contain a '.' (dot)",
      false
    );
  }

  if (user.length > 64) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "TOO_LONG",
      "Username too long",
      false
    );
  }

  if (domain.length > 255) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "TOO_LONG",
      "Domain too long",
      false
    );
  }

  if (email.length > 254) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "TOO_LONG",
      "Email exceeds maximum length",
      false
    );
  }

  if (!REGEX_EMAIL.test(email)) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "INVALID_FORMAT",
      "Email format does not match standard pattern",
      false
    );
  }

  if (checkTLD) {
    const tld = domain.split(".").pop()!.toUpperCase();
    const tlds = await fetchTLDs();
    if (!tlds.includes(tld)) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "INVALID_TLD",
        `Invalid or unknown TLD: .${tld}`,
        false
      );
    }
  }

  if (!allowDisposable && DISPOSABLE_SET.has(domain)) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "DISPOSABLE",
      "Disposable email domain detected",
      true
    );
  }

  if (checkDNS) {
    const domainOk = await checkDomain(domain);
    if (!domainOk) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "NO_MX",
        "Domain does not have valid MX records",
        false
      );
    }
  }

  if (deepCheckSMTP) {
    const smtpOk = await smtpCheck(email, domain);
    if (!smtpOk) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "SMTP_FAIL",
        "SMTP check failed (user may not exist)",
        false
      );
    } else {
      return makeResult(
        email,
        user,
        domain,
        "valid",
        "VALID",
        "Email accepted by SMTP server (best effort)",
        false
      );
    }
  }

  return makeResult(
    email,
    user,
    domain,
    "valid",
    "VALID",
    "Email is valid",
    false
  );
}

export async function validateMany(
  emails: string[],
  options: ValidationOptions = {}
): Promise<(ValidationResult & { reasonCode: ReasonCode })[]> {
  return Promise.all(emails.map((email) => validate(email, options)));
}
