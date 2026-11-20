-- Owner-approved hosting & maintenance price (2026-11-20): USD 5 per published site per month.
-- Status 'announced' = shown everywhere and agreed to by the customer before any charge.
-- Switch to 'active' only once monthly billing (a Dodo subscription product) is live.
UPDATE system_settings SET value = '5', updated_at = 1763640000000 WHERE key = 'hosting_fee_amount';
UPDATE system_settings SET value = 'USD', updated_at = 1763640000000 WHERE key = 'hosting_fee_currency';
UPDATE system_settings SET value = 'month', updated_at = 1763640000000 WHERE key = 'hosting_fee_interval';
UPDATE system_settings SET value = 'announced', updated_at = 1763640000000 WHERE key = 'hosting_fee_status';
