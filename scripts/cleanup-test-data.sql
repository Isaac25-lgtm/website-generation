-- Remove automated-test data from production (test accounts, their projects, test tickets and test orders on the demo store).
DELETE FROM asset_blobs WHERE asset_id IN (SELECT storage_key FROM site_assets WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid'));
DELETE FROM site_assets WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid');
DELETE FROM entitlements WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid');
DELETE FROM builder_checkout_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid');
DELETE FROM inventory_movements WHERE project_id IN (SELECT id FROM projects WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid'));
DELETE FROM consents WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid');
DELETE FROM projects WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid');
DELETE FROM users WHERE email LIKE '%@test.example' OR email LIKE '%@smoke.invalid';
DELETE FROM support_tickets WHERE email = 'e2e@example.com';
DELETE FROM orders WHERE is_demo = 1 AND customer_name IN ('E2E Buyer', 'Smoke Buyer');
SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM support_tickets) AS tickets;
