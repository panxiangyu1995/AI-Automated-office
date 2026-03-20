-- 010_user_permission_overrides.down.sql
-- 回滚 Story 2.6 细粒度权限覆盖迁移

-- 1. 删除触发器
DROP TRIGGER IF EXISTS update_user_permission_overrides_updated_at ON user_permission_overrides;

-- 2. 删除表
DROP TABLE IF EXISTS user_permission_overrides;

-- 3. 删除函数（如果不再被其他表使用）
-- DROP FUNCTION IF EXISTS update_updated_at_column();
