import { z } from "zod";
import type { AppEnv } from "../env";

// Provider-agnostic runtime AI interface. The default provider is Cloudflare
// Workers AI (account binding). Every model output is parsed against a strict
// schema; invalid output is rejected, never rendered.

export interface AiResult<T> { ok: true; data: T; model: string; inputTokens?: number; outputTokens?: number }
export interface AiFailure { ok: false; error: string; model: string }

export function aiAvailable(env: AppEnv): boolean {
  return !!env.AI && typeof (env.AI as unknown as { run?: unknown }).run === "function";
}

export async function aiJson<T>(env: AppEnv, opts: { system: string; user: string; jsonSchema: Record<string, unknown>; schema: z.ZodType<T>; maxTokens?: number; timeoutMs?: number }): Promise<AiResult<T> | AiFailure> {
  const model = env.AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  if (!aiAvailable(env)) return { ok: false, error: "AI provider not configured", model };
  let lastErr = "unknown error";
  // One overall time budget across attempts, so a slow provider can't keep the customer waiting: callers fall
  // back to their rule-based path (and say so) when this returns ok: false.
  const deadline = Date.now() + (opts.timeoutMs ?? 20_000);
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 3_000) { if (attempt === 0) lastErr = "AI timed out"; break; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const call = (env.AI as unknown as { run: (m: string, i: unknown) => Promise<unknown> }).run(model, {
        messages: [{ role: "system", content: opts.system }, { role: "user", content: opts.user }],
        response_format: { type: "json_schema", json_schema: opts.jsonSchema },
        max_tokens: opts.maxTokens ?? 1200,
        temperature: 0.4,
      });
      const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("AI timed out")), remaining); });
      const res = (await Promise.race([call, timeout])) as { response?: unknown; usage?: { prompt_tokens?: number; completion_tokens?: number } };
      clearTimeout(timer);
      let raw = res?.response;
      if (typeof raw === "string") {
        const m = raw.match(/\{[\s\S]*\}/);
        raw = JSON.parse(m ? m[0] : raw);
      }
      const parsed = opts.schema.safeParse(raw);
      if (!parsed.success) { lastErr = `Model output failed validation: ${parsed.error.issues[0]?.message}`; continue; }
      return { ok: true, data: parsed.data, model, inputTokens: res.usage?.prompt_tokens, outputTokens: res.usage?.completion_tokens };
    } catch (e) {
      clearTimeout(timer);
      lastErr = (e as Error)?.message?.slice(0, 300) || "AI call failed";
      if (lastErr === "AI timed out") break; // the budget is spent; don't start another attempt
    }
  }
  return { ok: false, error: lastErr, model };
}

// ── Copy polishing: rewrites ONLY the facts the customer supplied. ──
export const CopySuggestion = z.object({
  heroHeading: z.string().max(120),
  heroSubheading: z.string().max(300),
  about: z.string().max(2500),
  serviceDescriptions: z.array(z.string().max(400)).max(24),
  seoDescription: z.string().max(170),
});
export type CopySuggestion = z.infer<typeof CopySuggestion>;

export const COPY_JSON_SCHEMA = {
  type: "object",
  properties: {
    heroHeading: { type: "string" }, heroSubheading: { type: "string" }, about: { type: "string" },
    serviceDescriptions: { type: "array", items: { type: "string" } }, seoDescription: { type: "string" },
  },
  required: ["heroHeading", "heroSubheading", "about", "serviceDescriptions", "seoDescription"],
};

export const COPY_SYSTEM = `You are a careful website copy editor. Improve clarity and tone of the supplied facts only.
STRICT RULES:
- Use ONLY information present in the input. Never add numbers, years, awards, certifications, client names, testimonials, prices, locations, guarantees or claims that are not in the input.
- If a field is empty in the input, return an empty string for it.
- Keep the same language as the input. Keep it concise and natural; no hype words like "world-class" or "best".
- serviceDescriptions must have exactly one entry per input service, in the same order.
- heroHeading max 12 words. seoDescription max 160 characters.
Return JSON only.`;

// ── Design refinement ──
export const REFINE_JSON_SCHEMA = {
  type: "object",
  properties: {
    theme: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["light", "dark"] },
        primary: { type: "string" }, accent: { type: "string" }, bg: { type: "string" }, text: { type: "string" },
        fontHeading: { type: "string" }, fontBody: { type: "string" },
        radius: { type: "string", enum: ["none", "sm", "md", "lg", "xl"] },
        density: { type: "string", enum: ["compact", "comfortable", "airy"] },
        headingScale: { type: "string", enum: ["sm", "md", "lg", "xl"] },
        animation: { type: "string", enum: ["none", "subtle", "lively"] },
        headerStyle: { type: "string", enum: ["bar", "centered", "split", "floating", "sidebar", "minimal"] },
        cardStyle: { type: "string", enum: ["flat", "outline", "elevated", "glass"] },
        ornament: { type: "string", enum: ["none", "grain", "grid", "blobs", "lines", "dots"] },
      },
    },
    heroVariant: { type: "string", enum: ["split", "centered", "editorial", "fullbleed", "terminal", "mosaic", "stacked", "poster", "minimal"] },
    explanation: { type: "string" },
  },
  required: ["theme", "explanation"],
};

export function refineSystem(fontKeys: readonly string[]): string {
  return `You translate a website owner's design request into a small JSON patch of design tokens.
Only include tokens that should change. Colours must be #rrggbb hex. Ensure text/background colours keep strong contrast.
Allowed fontHeading/fontBody values: ${fontKeys.join(", ")}.
"explanation" briefly says what you changed in plain English (max 2 sentences). Return JSON only.`;
}
