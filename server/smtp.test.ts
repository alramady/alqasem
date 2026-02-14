import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP Email Configuration", () => {
  it("should have all required SMTP environment variables set", () => {
    expect(process.env.SMTP_HOST).toBeTruthy();
    expect(process.env.SMTP_PORT).toBeTruthy();
    expect(process.env.SMTP_USER).toBeTruthy();
    expect(process.env.SMTP_PASS).toBeTruthy();
    expect(process.env.SMTP_FROM_EMAIL).toBeTruthy();
  });

  it("should have valid SMTP_HOST for Gmail", () => {
    expect(process.env.SMTP_HOST).toBe("smtp.gmail.com");
  });

  it("should have valid SMTP_PORT", () => {
    const port = parseInt(process.env.SMTP_PORT || "0");
    expect([587, 465, 25]).toContain(port);
  });

  it("should have valid email format for SMTP_USER", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(process.env.SMTP_USER || "")).toBe(true);
  });

  it("should successfully verify SMTP connection", async () => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // verify() checks the connection and authentication
    const result = await transporter.verify();
    expect(result).toBe(true);
  }, 15000);
});
