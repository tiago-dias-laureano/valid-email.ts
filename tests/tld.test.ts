import { describe, it, expect } from "vitest";
import { validate } from "../src";

describe("Email Validator - TLD Checks", () => {
  it("should accept a valid TLD (.com)", async () => {
    const res = await validate("user@gmail.com", { checkTLD: true });
    expect(res.status).toBe("valid");
    expect(res.reason).toMatch(/valid/i);
  });

  it("should reject an invalid TLD (.comm)", async () => {
    const res = await validate("user@gmail.comm", { checkTLD: true });
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/invalid/i);
  });

  it("should accept a country TLD (.br)", async () => {
    const res = await validate("user@dominio.br", {
      checkTLD: true,
      checkDNS: false,
    });
    expect(res.status).toBe("valid");
  });

  it("should reject a made-up TLD (.fake)", async () => {
    const res = await validate("user@domain.fake", {
      checkTLD: true,
      checkDNS: false,
    });
    expect(res.status).toBe("invalid");
  });
});
