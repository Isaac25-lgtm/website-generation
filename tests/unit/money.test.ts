import { describe, expect, it } from "vitest";
import { parsePrice } from "../../src/shared/util";

// One validated conversion for CSV import, the product editor and delivery fees (release audit 6a1cc2c).
const ok = (input: string | number, cur: string) => { const r = parsePrice(input, cur); if (!r.ok) throw new Error(r.error); return r.minor; };
const bad = (input: string, cur: string) => { const r = parsePrice(input, cur); expect(r.ok, input).toBe(false); return r.ok ? "" : r.error; };

describe("parsePrice", () => {
  it("reads decimal points and decimal commas the same way", () => {
    expect(ok("19.95", "EUR")).toBe(1995);
    expect(ok("19,95", "EUR")).toBe(1995); // was €1,995.00 before the fix
    expect(ok("19,9", "EUR")).toBe(1990);
    expect(ok("0.5", "USD")).toBe(50);
    expect(ok("12", "GBP")).toBe(1200);
    expect(ok(19.95, "EUR")).toBe(1995);
  });

  it("accepts unambiguous thousands separators in common styles", () => {
    expect(ok("1,234.50", "USD")).toBe(123450);
    expect(ok("1.234,50", "EUR")).toBe(123450);
    expect(ok("1 234,50", "EUR")).toBe(123450);
    expect(ok("1 234,50", "EUR")).toBe(123450);
    expect(ok("1'234.50", "CHF")).toBe(123450);
    expect(ok("1,234,567", "USD")).toBe(123456700);
    expect(ok("€19,95", "EUR")).toBe(1995);
    expect(ok("19.95 EUR", "EUR")).toBe(1995);
  });

  it("rejects ambiguous and invalid values instead of guessing", () => {
    expect(bad("1,234", "USD")).toMatch(/ambiguous/);
    expect(bad("1.234", "EUR")).toMatch(/ambiguous/);
    expect(bad("abc", "USD")).toMatch(/isn't a valid price/);
    expect(bad("", "USD")).toMatch(/Enter a price/);
    expect(bad("-5", "USD")).toMatch(/negative/);
    expect(bad("12.", "USD")).toMatch(/valid/);
    expect(bad("1,23,4.00", "USD")).toMatch(/valid/);
    expect(bad("19.999", "USD")).toMatch(/ambiguous/);
    expect(bad("1.234,567", "EUR")).toMatch(/decimal places/);
  });

  it("handles zero-decimal currencies", () => {
    expect(ok("25000", "UGX")).toBe(25000);
    expect(ok("25,000", "UGX")).toBe(25000);
    expect(ok("25.000", "JPY")).toBe(25000);
    expect(bad("25,5", "JPY")).toMatch(/no decimal places/);
  });
});
