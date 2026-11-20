// Grant admin role to an existing account (run AFTER signing up on the site).
// Usage: node scripts/make-admin.mjs you@example.com [--local]
import { execFileSync } from "node:child_process";
const email = process.argv[2];
const local = process.argv.includes("--local");
if (!email || !/^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(email)) { console.error("Usage: node scripts/make-admin.mjs you@example.com [--local]"); process.exit(1); }
const sql = `UPDATE users SET role = 'admin' WHERE email = '${email.toLowerCase()}'; SELECT email, role FROM users WHERE email = '${email.toLowerCase()}';`;
const out = execFileSync("npx", ["wrangler", "d1", "execute", "DB", local ? "--local" : "--remote", "--json", "--command", sql], { encoding: "utf8", shell: process.platform === "win32" });
const rows = JSON.parse(out.slice(out.indexOf("["))).flatMap((r) => r.results ?? []);
console.log(rows.length ? `OK: ${rows[0].email} is now ${rows[0].role}` : "No account with that email. Sign up on the site first.");
