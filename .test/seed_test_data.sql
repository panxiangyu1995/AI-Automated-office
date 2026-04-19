-- ============================================================
-- 测试数据初始化脚本
-- 用途：为 Go 云端 API 测试准备完整数据
-- 使用：docker exec -i cloud-server-postgres-1 psql -U postgres -d ai_office < .test/seed_test_data.sql
-- ============================================================

-- 常量
-- tenant_id: 235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5
-- admin password_hash (密码: admin123): $2a$10$N9qo8uLOickgx2ZMRZoMye.cYEQCbr2/SaGEGLF4iM/8yO.QLW6Qa

-- 清理旧测试数据
DELETE FROM message_audit_logs WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM group_messages WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM announcement_reads WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM announcements WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM notification_preferences WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM message_status WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM messages WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM user_permission_overrides WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM user_import_rows;
DELETE FROM user_import_batches WHERE tenant_id = '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5';
DELETE FROM audit_logs WHERE operator_id IN (
    SELECT id FROM users WHERE email LIKE 'test_%@ai-office.local'
);
DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE 'test_%@ai-office.local'
);
DELETE FROM users WHERE email LIKE 'test_%@ai-office.local';
DELETE FROM positions WHERE name LIKE '测试%';
DELETE FROM departments WHERE name LIKE '测试%';

-- ============================================================
-- 1. 部门数据
-- ============================================================
INSERT INTO departments (id, tenant_id, name, code, level, path, status, created_at, updated_at) VALUES
    ('a1000000-0000-0000-0000-000000000001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '测试技术部', 'test-tech', 1, '/1/', 'active', NOW(), NOW()),
    ('a1000000-0000-0000-0000-000000000002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '测试财务部', 'test-finance', 1, '/2/', 'active', NOW(), NOW()),
    ('a1000000-0000-0000-0000-000000000003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '测试销售部', 'test-sales', 1, '/3/', 'active', NOW(), NOW()),
    ('a1000000-0000-0000-0000-000000000004', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '测试人事部', 'test-hr', 1, '/4/', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- 2. 岗位数据 (level 是 integer)
-- ============================================================
INSERT INTO positions (id, tenant_id, department_id, name, code, level, status, created_at, updated_at) VALUES
    ('b1000000-0000-0000-0000-000000000001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'a1000000-0000-0000-0000-000000000001', '测试高级工程师', 'test-senior-eng', 7, 'active', NOW(), NOW()),
    ('b1000000-0000-0000-0000-000000000002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'a1000000-0000-0000-0000-000000000002', '测试财务主管', 'test-finance-lead', 6, 'active', NOW(), NOW()),
    ('b1000000-0000-0000-0000-000000000003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'a1000000-0000-0000-0000-000000000003', '测试销售经理', 'test-sales-mgr', 6, 'active', NOW(), NOW()),
    ('b1000000-0000-0000-0000-000000000004', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'a1000000-0000-0000-0000-000000000004', '测试HR专员', 'test-hr-spec', 4, 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- 3. 测试用户（密码: admin123，复用已有 hash）
-- ============================================================
INSERT INTO users (id, tenant_id, email, password_hash, name, status, email_verified, preferences, created_at, updated_at) VALUES
    ('c1000000-0000-0000-0000-000000000001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5',
     'test_admin@ai-office.local',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.cYEQCbr2/SaGEGLF4iM/8yO.QLW6Qa',
     '测试管理员', 'active', TRUE,
     '{"department":"测试技术部"}'::jsonb, NOW(), NOW()),
    ('c1000000-0000-0000-0000-000000000002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5',
     'test_manager@ai-office.local',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.cYEQCbr2/SaGEGLF4iM/8yO.QLW6Qa',
     '测试经理', 'active', TRUE,
     '{"department":"测试财务部"}'::jsonb, NOW(), NOW()),
    ('c1000000-0000-0000-0000-000000000003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5',
     'test_employee@ai-office.local',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.cYEQCbr2/SaGEGLF4iM/8yO.QLW6Qa',
     '测试员工', 'active', TRUE,
     '{"department":"测试销售部"}'::jsonb, NOW(), NOW()),
    ('c1000000-0000-0000-0000-000000000004', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5',
     'test_hr@ai-office.local',
     '$2a$10$N9qo8uLOickgx2ZMRZoMye.cYEQCbr2/SaGEGLF4iM/8yO.QLW6Qa',
     '测试HR', 'active', TRUE,
     '{"department":"测试人事部"}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- 为测试用户绑定角色
INSERT INTO user_roles (user_id, role_id, tenant_id, created_at)
    SELECT 'c1000000-0000-0000-0000-000000000001', id, tenant_id, NOW() FROM roles WHERE code = 'super_admin'
    ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id, tenant_id, created_at)
    SELECT 'c1000000-0000-0000-0000-000000000002', id, tenant_id, NOW() FROM roles WHERE code = 'manager'
    ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id, tenant_id, created_at)
    SELECT 'c1000000-0000-0000-0000-000000000003', id, tenant_id, NOW() FROM roles WHERE code = 'employee'
    ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id, tenant_id, created_at)
    SELECT 'c1000000-0000-0000-0000-000000000004', id, tenant_id, NOW() FROM roles WHERE code = 'employee'
    ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. 消息数据
-- ============================================================
INSERT INTO messages (id, tenant_id, msg_type, title, content, sender_id, sender_name, recipient_id, recipient_type, priority, status, created_at) VALUES
    ('msg-001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'system', '系统维护通知', '系统将于今晚22:00进行维护，预计持续2小时', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'c1000000-0000-0000-0000-000000000003', 'user', 'high', 'unread', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    ('msg-002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'approval', '请假审批待处理', '张三提交了3天年假申请，请审批', 'c1000000-0000-0000-0000-000000000003', '测试员工', 'c1000000-0000-0000-0000-000000000002', 'user', 'normal', 'unread', (EXTRACT(EPOCH FROM NOW())::BIGINT - 3600) * 1000),
    ('msg-003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'chat', '项目讨论', '新项目的需求文档已上传，请查看', 'c1000000-0000-0000-0000-000000000002', '测试经理', 'c1000000-0000-0000-0000-000000000001', 'user', 'normal', 'read', (EXTRACT(EPOCH FROM NOW())::BIGINT - 7200) * 1000),
    ('msg-004', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'task', '任务分配', '请完成Q2季度报告', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'c1000000-0000-0000-0000-000000000002', 'user', 'urgent', 'unread', (EXTRACT(EPOCH FROM NOW())::BIGINT - 1800) * 1000),
    ('msg-005', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'system', '全员公告', '公司年会将于下月15日举办', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'all', 'all', 'normal', 'unread', (EXTRACT(EPOCH FROM NOW())::BIGINT - 86400) * 1000)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

UPDATE messages SET read_at = created_at + 60000 WHERE id = 'msg-003';

-- ============================================================
-- 5. 公告数据
-- ============================================================
INSERT INTO announcements (id, tenant_id, title, content, author_id, author_name, priority, target_type, published_at, created_at, updated_at) VALUES
    ('ann-001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '2026年春节放假通知', '根据国务院办公厅通知，春节放假安排如下...', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'high', 'all', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    ('ann-002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', '新员工入职培训', '本月新入职员工培训将于下周一开始', 'c1000000-0000-0000-0000-000000000004', '测试HR', 'normal', 'all', (EXTRACT(EPOCH FROM NOW())::BIGINT - 86400) * 1000, (EXTRACT(EPOCH FROM NOW())::BIGINT - 86400) * 1000, (EXTRACT(EPOCH FROM NOW())::BIGINT - 86400) * 1000)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- ============================================================
-- 6. 群消息数据
-- ============================================================
INSERT INTO group_messages (id, tenant_id, group_id, sender_id, sender_type, sender_name, content, created_at, updated_at) VALUES
    ('gm-001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'group-tech', 'c1000000-0000-0000-0000-000000000001', 'user', '测试管理员', '大家早上好，今天站会10点开始', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    ('gm-002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'group-tech', 'c1000000-0000-0000-0000-000000000003', 'user', '测试员工', '收到，我准时参加', (EXTRACT(EPOCH FROM NOW())::BIGINT + 60) * 1000, (EXTRACT(EPOCH FROM NOW())::BIGINT + 60) * 1000),
    ('gm-003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'group-finance', 'c1000000-0000-0000-0000-000000000002', 'user', '测试经理', '本月报销截止25号', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- ============================================================
-- 7. 通知偏好数据
-- ============================================================
INSERT INTO notification_preferences (id, tenant_id, user_id, do_not_disturb_enabled, channel_in_app, channel_email, type_system, type_approval, type_task, type_chat, created_at, updated_at) VALUES
    ('np-001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'c1000000-0000-0000-0000-000000000001', FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    ('np-002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'c1000000-0000-0000-0000-000000000003', FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
ON CONFLICT (id) DO UPDATE SET channel_in_app = EXCLUDED.channel_in_app;

-- ============================================================
-- 8. 审计日志数据
-- ============================================================
INSERT INTO audit_logs (id, tenant_id, operator_id, operator_name, target_id, target_type, event_type, resource, action, result, ip_address, created_at) VALUES
    ('e1000000-0000-0000-0000-000000000001', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'c1000000-0000-0000-0000-000000000001', 'user', 'login', 'auth', 'login', 'success', '127.0.0.1', NOW()),
    ('e1000000-0000-0000-0000-000000000002', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'c1000000-0000-0000-0000-000000000001', '测试管理员', 'c1000000-0000-0000-0000-000000000003', 'user', 'create', 'user', 'create', 'success', '127.0.0.1', NOW() - INTERVAL '1 hour'),
    ('e1000000-0000-0000-0000-000000000003', '235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5', 'c1000000-0000-0000-0000-000000000002', '测试经理', 'a1000000-0000-0000-0000-000000000002', 'department', 'update', 'department', 'update', 'success', '127.0.0.1', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 完成
-- ============================================================
SELECT '测试数据初始化完成' AS status;
