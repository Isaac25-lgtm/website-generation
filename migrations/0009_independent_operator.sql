-- ImprintSites AI is independent (owner, 25 Nov 2026): it is not a product of Motion Imprints Technologies.
-- Replace the original seeded operator name only if an admin hasn't already changed it.
UPDATE system_settings SET value = 'ImprintSites AI', updated_at = 1795633000000
WHERE key = 'operator_display_name' AND value = 'Motion Imprints Technologies';
