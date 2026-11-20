-- Owner reduced hosting & maintenance (2026-11-20): USD 4 per published site per month (was 5).
UPDATE system_settings SET value = '4', updated_at = 1763650000000 WHERE key = 'hosting_fee_amount';
