DELETE FROM users
WHERE email = current_setting('app.admin_email', true)
  AND tenant_id IN (SELECT id FROM tenants WHERE slug = 'default');

DELETE FROM roles
WHERE code IN ('super_admin', 'admin', 'manager', 'employee')
  AND tenant_id IN (SELECT id FROM tenants WHERE slug = 'default');
