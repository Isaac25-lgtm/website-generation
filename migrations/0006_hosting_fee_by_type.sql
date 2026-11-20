-- Owner set hosting & maintenance per site type (2026-11-21): USD 3 personal, 4 business, 5 online store,
-- per published site per month. hosting_fee_amount stays as the business figure for older clients.
INSERT INTO system_settings (key, value, updated_at) VALUES
  ('hosting_fee_amount_personal', '3', 1763700000000),
  ('hosting_fee_amount_business', '4', 1763700000000),
  ('hosting_fee_amount_ecommerce', '5', 1763700000000)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
