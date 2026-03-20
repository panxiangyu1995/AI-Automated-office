-- 删除触发器
DROP TRIGGER IF EXISTS trg_maintain_department_closure ON departments;
DROP FUNCTION IF EXISTS maintain_department_closure();

-- 删除用户岗位关联表
DROP TABLE IF EXISTS user_positions;

-- 删除用户部门关联表
DROP TABLE IF EXISTS user_departments;

-- 删除闭包表
DROP TABLE IF EXISTS department_closure;

-- 删除岗位表
DROP TABLE IF EXISTS positions;

-- 删除 departments 表新增字段
ALTER TABLE departments DROP COLUMN IF EXISTS sort_order;
ALTER TABLE departments DROP COLUMN IF EXISTS status;

-- 删除索引
DROP INDEX IF EXISTS idx_departments_tenant_code;
DROP INDEX IF EXISTS idx_departments_tenant_status;
