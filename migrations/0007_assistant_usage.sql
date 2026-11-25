-- "Ask ImprintSites AI" help assistant (25 Nov 2026): one service-wide daily token allowance shared by every
-- visitor, so no number of identities can run up the provider bill. Tokens are reserved before each provider
-- call and settled with the provider's reported usage afterwards; failed calls release their reservation.
-- No conversation text is stored.
CREATE TABLE IF NOT EXISTS assistant_usage (
  day TEXT PRIMARY KEY,               -- UTC date, YYYY-MM-DD
  reserved_tokens INTEGER NOT NULL DEFAULT 0,
  used_tokens INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 1.5 million tokens a day: at the published deepseek-flash rates that is at most about USD 1.80 a day
-- even if every token were billed at the peak output rate. Admins can change it in settings.
INSERT INTO system_settings (key, value, updated_at) VALUES ('assistant_daily_token_budget', '1500000', 1795600000000)
ON CONFLICT(key) DO NOTHING;
