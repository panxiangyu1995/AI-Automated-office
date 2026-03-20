-- 添加 departments 表缺失字段
ALTER TABLE departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 创建唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'idx_departments_tenant_code'
    ) THEN
        CREATE UNIQUE INDEX idx_departments_tenant_code ON departments(tenant_id, code) WHERE code IS NOT NULL AND deleted_at IS NULL;
    END IF;
END $$;

-- 创建状态索引
CREATE INDEX IF NOT EXISTS idx_departments_tenant_status ON departments(tenant_id, status);

-- 创建岗位表
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    department_id UUID REFERENCES departments(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    level INTEGER,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 岗位表索引
CREATE INDEX IF NOT EXISTS idx_positions_tenant_dept ON positions(tenant_id, department_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_tenant_code ON positions(tenant_id, code) WHERE code IS NOT NULL AND deleted_at IS NULL;

-- 创建部门闭包表（用于优化树查询）
CREATE TABLE IF NOT EXISTS department_closure (
    ancestor_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- 创建闭包表索引
CREATE INDEX IF NOT EXISTS idx_closure_descendant ON department_closure(descendant_id);
CREATE INDEX IF NOT EXISTS idx_closure_depth ON department_closure(depth);

-- 创建触发器函数：自动维护闭包表
CREATE OR REPLACE FUNCTION maintain_department_closure()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入新部门时
    IF TG_OP = 'INSERT' THEN
        -- 插入自身引用
        INSERT INTO department_closure (ancestor_id, descendant_id, depth)
        VALUES (NEW.id, NEW.id, 0);
        
        -- 如果有父部门，复制父部门的所有祖先关系
        IF NEW.parent_id IS NOT NULL THEN
            INSERT INTO department_closure (ancestor_id, descendant_id, depth)
            SELECT dc.ancestor_id, NEW.id, dc.depth + 1
            FROM department_closure dc
            WHERE dc.descendant_id = NEW.parent_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- 更新部门时（parent_id 变更）
    IF TG_OP = 'UPDATE' AND OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
        -- 删除所有非自身的祖先关系
        DELETE FROM department_closure
        WHERE descendant_id = NEW.id
          AND ancestor_id != NEW.id;
        
        -- 如果有新的父部门，添加新的祖先关系
        IF NEW.parent_id IS NOT NULL THEN
            INSERT INTO department_closure (ancestor_id, descendant_id, depth)
            SELECT dc.ancestor_id, NEW.id, dc.depth + 1
            FROM department_closure dc
            WHERE dc.descendant_id = NEW.parent_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_maintain_department_closure ON departments;
CREATE TRIGGER trg_maintain_department_closure
AFTER INSERT OR UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION maintain_department_closure();

-- 创建用户部门关联表（如果不存在）
CREATE TABLE IF NOT EXISTS user_departments (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, department_id)
);

-- 用户岗位关联表
CREATE TABLE IF NOT EXISTS user_positions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_user_departments_dept ON user_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_position ON user_positions(position_id);
