import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { api, ApiError, useApp } from "../lib";
import { ASSISTANT_MAX_HISTORY, ASSISTANT_MAX_TURN, pageCategory } from "../../shared/assistant";
import { PAGE_GUIDES } from "../../shared/assistant-guides";

// "Ask ImprintSites AI" (owner, 25 Nov 2026): a help assistant on every platform page, answered by DeepSeek
// through /api/assistant (the key never reaches the browser). Replies are shown as plain text, never HTML.
// Each account (or signed-out visitor) has its own conversation in this tab's session storage; switching
// account starts an empty chat and removes the previous one.

type Msg = { role: "user" | "assistant"; content: string };
/** Inline **bold** and `code`, as React elements (never HTML). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code>
        : <Fragment key={i}>{part.replace(/\*\*/g, "")}</Fragment>); // unpaired ** never shows
}

/** Readable formatting for the assistant's answers: headings, numbered and bulleted lists, paragraphs, bold. */
export function RichReply({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => { if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>); para = []; };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((x, i) => <li key={i}>{inline(x)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    // "## Heading" and a line that is entirely bold ("**1. Describe your site**") both become headings.
    const heading = line.match(/^#{1,4}\s+(.*)$/) ?? line.match(/^\*\*([^*]+)\*\*:?$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (!line) { flushPara(); flushList(); }
    else if (heading) { flushPara(); flushList(); blocks.push(<p key={blocks.length} className="ast-h">{inline(heading[1].replace(/\*\*/g, ""))}</p>); }
    else if (ordered || bullet) {
      flushPara();
      const isOrdered = !!ordered;
      if (!list || list.ordered !== isOrdered) { flushList(); list = { ordered: isOrdered, items: [] }; }
      list.items.push((ordered ?? bullet)![1]);
    } else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return <>{blocks}</>;
}

const keyFor = (owner: string) => `imprintsites-assistant:${owner}`;

function load(owner: string): Msg[] {
  try {
    sessionStorage.removeItem("imprintsites-assistant"); // the old shared key, from before conversations were per account
    const v = JSON.parse(sessionStorage.getItem(keyFor(owner)) || "[]");
    return Array.isArray(v) ? v.filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string").slice(-20) : [];
  } catch { return []; }
}

export function Assistant() {
  const loc = useLocation();
  const { me } = useApp();
  const owner = me?.id ?? "visitor";
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState(() => ({ owner, msgs: load(owner) }));
  const msgs = conv.msgs;
  const setMsgs = (f: Msg[] | ((m: Msg[]) => Msg[])) => setConv((c) => ({ ...c, msgs: typeof f === "function" ? f(c.msgs) : f }));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  // Bumped on Clear and on account change, so a reply that arrives afterwards is discarded.
  const generation = useRef(0);
  if (conv.owner !== owner) {
    try { sessionStorage.removeItem(keyFor(conv.owner)); } catch { /* private mode */ }
    generation.current++;
    setText(""); setBusy(false); setNote(""); setOpen(false);
    setConv({ owner, msgs: load(owner) });
  }
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const compact = /^\/projects\/[^/]+\/(editor|setup)/.test(loc.pathname); // keep the editor canvas clear

  useEffect(() => { try { sessionStorage.setItem(keyFor(conv.owner), JSON.stringify(conv.msgs.slice(-20))); } catch { /* private mode */ } }, [conv]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs, busy, open]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  async function send(q: string) {
    const content = q.trim().slice(0, ASSISTANT_MAX_TURN);
    if (!content || busy) return;
    const next = [...msgs, { role: "user" as const, content }];
    const gen = generation.current;
    setMsgs(next); setText(""); setNote(""); setBusy(true);
    try {
      const r = await api<{ reply: string }>("/api/assistant", { body: { messages: next.slice(-ASSISTANT_MAX_HISTORY), page: loc.pathname } });
      if (gen !== generation.current) return; // cleared or switched account while waiting
      setMsgs((m) => [...m, { role: "assistant", content: r.reply.slice(0, ASSISTANT_MAX_TURN) }]);
    } catch (e) {
      if (gen !== generation.current) return;
      const err = e as ApiError;
      setNote(err.code === "not_configured" ? "The assistant isn't switched on yet. For help now, use the Contact page." : err.message || "Something went wrong. Please try again.");
      if (err.code === "not_configured" || err.status === 400) setMsgs((m) => m.slice(0, -1));
      if (err.code === "not_configured" || err.status === 400) setText(content);
    } finally {
      if (gen === generation.current) setBusy(false);
    }
  }

  return (
    <div className={`ast${compact ? " ast-compact" : ""}`}>
      {open && (
        <section className="ast-panel" role="dialog" aria-label="Ask ImprintSites AI">
          <header className="ast-head">
            <img src="/logo-mark.svg" alt="" width={26} height={26} />
            <div><strong>ImprintSites AI</strong><span>Answers about building your site</span></div>
            {msgs.length > 0 && <button className="ast-clear" onClick={() => { generation.current++; setMsgs([]); setText(""); setNote(""); setBusy(false); }}>Clear</button>}
            <button className="ast-x" aria-label="Close assistant" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="ast-list" ref={list} aria-live="polite">
            {msgs.length === 0 && (
              <div className="ast-empty">
                <p>Ask anything about building, publishing or running your site. Questions about this page:</p>
                {PAGE_GUIDES[pageCategory(loc.pathname)].starters.map((s) => <button key={s} className="ast-chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => <div key={i} className={`ast-msg ast-${m.role}`}>{m.role === "assistant" ? <RichReply text={m.content} /> : m.content}</div>)}
            {busy && <div className="ast-msg ast-assistant ast-typing" aria-label="Writing a reply"><i /><i /><i /></div>}
            {note && <p className="ast-note" role="status">{note}</p>}
          </div>
          <form className="ast-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <textarea ref={input} rows={1} maxLength={ASSISTANT_MAX_TURN} value={text} placeholder="Type your question" aria-label="Your question"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
          </form>
          <p className="ast-foot">Your questions and this chat's recent messages are sent to DeepSeek to write answers, and kept in this browser tab until you clear them or sign out. AI answers can be wrong. Never share passwords or card details here. <Link to="/privacy">Privacy</Link></p>
        </section>
      )}
      <button className="ast-pill" aria-expanded={open} aria-label={open ? "Close ImprintSites AI" : "Ask ImprintSites AI"} onClick={() => setOpen((o) => !o)}>
        <img src="/logo-mark.svg" alt="" width={26} height={26} />
        <span>Ask ImprintSites AI</span>
      </button>
    </div>
  );
}
