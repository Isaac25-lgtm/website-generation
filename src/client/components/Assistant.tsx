import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { api, ApiError } from "../lib";

// "Ask ImprintSites AI" (owner, 25 Nov 2026): a help assistant on every platform page, answered by DeepSeek
// through /api/assistant (the key never reaches the browser). Replies are shown as plain text, never HTML.

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "imprintsites-assistant";
const STARTERS = ["What does it cost to publish a site?", "Which template suits a small business?", "How do I add products to my store?"];

function load(): Msg[] {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.slice(-20) : []; } catch { return []; }
}

export function Assistant() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(load);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const compact = /^\/projects\/[^/]+\/(editor|setup)/.test(loc.pathname); // keep the editor canvas clear

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-20))); } catch { /* private mode */ } }, [msgs]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs, busy, open]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  async function send(q: string) {
    const content = q.trim().slice(0, 2000);
    if (!content || busy) return;
    const next = [...msgs, { role: "user" as const, content }];
    setMsgs(next); setText(""); setNote(""); setBusy(true);
    try {
      const r = await api<{ reply: string }>("/api/assistant", { body: { messages: next.slice(-12), page: loc.pathname } });
      setMsgs((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (e) {
      const err = e as ApiError;
      setNote(err.code === "not_configured" ? "The assistant isn't switched on yet. For help now, use the Contact page." : err.message || "Something went wrong. Please try again.");
      if (err.code === "not_configured" || err.status === 400) setMsgs((m) => m.slice(0, -1));
      if (err.code === "not_configured" || err.status === 400) setText(content);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`ast${compact ? " ast-compact" : ""}`}>
      {open && (
        <section className="ast-panel" role="dialog" aria-label="Ask ImprintSites AI">
          <header className="ast-head">
            <img src="/logo-mark.svg" alt="" width={26} height={26} />
            <div><strong>ImprintSites AI</strong><span>Answers about building your site</span></div>
            {msgs.length > 0 && <button className="ast-clear" onClick={() => { setMsgs([]); setNote(""); }}>Clear</button>}
            <button className="ast-x" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="ast-list" ref={list} aria-live="polite">
            {msgs.length === 0 && (
              <div className="ast-empty">
                <p>Ask about templates, prices, publishing or running your store.</p>
                {STARTERS.map((s) => <button key={s} className="ast-chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => <div key={i} className={`ast-msg ast-${m.role}`}>{m.content}</div>)}
            {busy && <div className="ast-msg ast-assistant ast-typing" aria-label="Writing a reply"><i /><i /><i /></div>}
            {note && <p className="ast-note" role="status">{note}</p>}
          </div>
          <form className="ast-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <textarea ref={input} rows={1} maxLength={2000} value={text} placeholder="Type your question" aria-label="Your question"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
          </form>
          <p className="ast-foot">AI answers can be wrong. Never share passwords or card details here.</p>
        </section>
      )}
      <button className="ast-pill" aria-expanded={open} aria-label={open ? "Close ImprintSites AI" : "Ask ImprintSites AI"} onClick={() => setOpen((o) => !o)}>
        <img src="/logo-mark.svg" alt="" width={26} height={26} />
        <span>Ask ImprintSites AI</span>
      </button>
    </div>
  );
}
