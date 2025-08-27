import { describe, it, expect } from "vitest";
import { validate } from "../src/index";

describe("Email Validator", () => {
  it("should validate a normal email", async () => {
    const res = await validate("test@gmail.com");
    expect(res.status).toBe("valid");
    expect(res.disposable).toBe(false);
  });

  it("should detect invalid format (missing @)", async () => {
    const res = await validate("invalid-email");
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/@/);
  });

  it("should detect invalid format (missing username)", async () => {
    const res = await validate("@gmail.com");
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/username/);
  });

  it("should detect invalid format (missing domain)", async () => {
    const res = await validate("user@");
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/domain/i);
  });

  it("should detect invalid format (domain missing dot)", async () => {
    const res = await validate("user@gmail");
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/dot/i);
  });

  it("should detect disposable email", async () => {
    const res = await validate("fake@mailinator.com");
    expect(res.status).toBe("invalid");
    expect(res.disposable).toBe(true);
  });

  it("should detect disposable email with subdomain", async () => {
    const res = await validate("test@tempmail.com");
    expect(res.status).toBe("invalid");
    expect(res.disposable).toBe(true);
  });

  it("should reject non-existing domain", async () => {
    const res = await validate("user@thisdomaindoesnotexist123456.com");
    expect(res.status).toBe("invalid");
    expect(res.reason).toMatch(/MX|lookup/i);
  });

  it("should normalize uppercase emails", async () => {
    const res = await validate("TEST@GMAIL.COM");
    expect(res.status).toBe("valid");
    expect(res.email).toBe("test@gmail.com");
  });

  it("should trim spaces around emails", async () => {
    const res = await validate("   user@gmail.com   ");
    expect(res.status).toBe("valid");
    expect(res.email).toBe("user@gmail.com");
  });
});
