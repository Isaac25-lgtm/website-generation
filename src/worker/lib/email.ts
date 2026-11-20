import type { AppEnv } from "../env";

// Optional transactional email via Resend's HTTP API. When no key is configured,
// callers receive { sent: false } and the UI states that notifications are not set up.
export function emailConfigured(env: AppEnv): boolean {
  return !!(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export async function sendEmail(env: AppEnv, msg: { to: string; subject: string; text: string }): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured(env)) return { sent: false, reason: "not_configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [msg.to], subject: msg.subject.slice(0, 200), text: msg.text.slice(0, 20000) }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok ? { sent: true } : { sent: false, reason: `provider_${r.status}` };
  } catch {
    return { sent: false, reason: "network" };
  }
}
