/**
 * What a verified Google sign-in may do to the account found for it (production audit finding #7).
 *
 * The callback looks an account up by Google subject first, then by email. An email match is only
 * linkable when that account has no Google identity yet; if it already carries a *different* Google
 * subject, signing in would hand the account to another Google identity, so it is refused.
 */
export type GoogleAccountAction = "create" | "login" | "link" | "conflict";

export function googleAccountAction(account: { google_sub: string | null } | null, sub: string): GoogleAccountAction {
  if (!account) return "create";
  if (!account.google_sub) return "link";
  return account.google_sub === sub ? "login" : "conflict";
}
