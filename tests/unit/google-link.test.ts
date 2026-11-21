import { describe, expect, it } from "vitest";
import { googleAccountAction } from "../../src/worker/lib/google-link";

// Production audit finding #7: a Google sign-in must never take over an account linked to another Google identity.
describe("googleAccountAction", () => {
  it("creates an account when nothing matches", () => expect(googleAccountAction(null, "g-1")).toBe("create"));
  it("signs in the account already linked to this Google identity", () => expect(googleAccountAction({ google_sub: "g-1" }, "g-1")).toBe("login"));
  it("links Google to an email account that has no Google identity yet", () => expect(googleAccountAction({ google_sub: null }, "g-1")).toBe("link"));
  it("refuses an email match that is linked to a different Google identity", () => expect(googleAccountAction({ google_sub: "g-other" }, "g-1")).toBe("conflict"));
});
