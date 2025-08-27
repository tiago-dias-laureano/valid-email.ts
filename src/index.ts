import {
  ValidationResult,
  ValidationOptions,
  ValidationMessages,
} from "./types";
import { DISPOSABLE_DOMAINS } from "./data/disposable-domains";
import dns from "dns/promises";
import { fetchTLDs } from "./utils/fetch-tlds";
import { smtpCheck } from "./utils/smtp-check";
import { messages } from "./data/messages";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISPOSABLE_SET = new Set(DISPOSABLE_DOMAINS);

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

let defaultOptions: ValidationOptions = {
  checkDNS: true,
  deepCheckSMTP: false,
  allowDisposable: false,
  checkTLD: true,
  lang: "en",
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
  const opts = { ...defaultOptions, ...options };

  const langPack: ValidationMessages = {
    ...messages[opts.lang || "en"],
    ...opts.customMessages,
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
      langPack.missingAt,
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
      langPack.missingUser,
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
      langPack.missingDomain,
      false
    );
  }

  if (user.length > 64 || domain.length > 255 || email.length > 254) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "TOO_LONG",
      langPack.tooLong,
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
      langPack.invalidFormat,
      false
    );
  }

  if (opts.checkTLD) {
    const tld = domain.split(".").pop()!.toUpperCase();
    const tlds = await fetchTLDs();
    if (!tlds.includes(tld)) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "INVALID_TLD",
        langPack.invalidTLD,
        false
      );
    }
  }

  if (!opts.allowDisposable && DISPOSABLE_SET.has(domain)) {
    return makeResult(
      email,
      user,
      domain,
      "invalid",
      "DISPOSABLE",
      langPack.disposable,
      true
    );
  }

  if (opts.checkDNS) {
    const domainOk = await checkDomain(domain);
    if (!domainOk) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "NO_MX",
        langPack.noMX,
        false
      );
    }
  }

  if (opts.deepCheckSMTP) {
    const smtpOk = await smtpCheck(email, domain);
    if (!smtpOk) {
      return makeResult(
        email,
        user,
        domain,
        "invalid",
        "SMTP_FAIL",
        langPack.smtpFail,
        false
      );
    } else {
      return makeResult(
        email,
        user,
        domain,
        "valid",
        "VALID",
        langPack.valid,
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
    langPack.valid,
    false
  );
}
