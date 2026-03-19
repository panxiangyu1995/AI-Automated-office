# Design: Department and Position Domain Model

## Context (上下文)

- **Change**: `epic-2-story-2-3-org-domain-model`
- **Story**: Story 2.3 - 组织管理
- **Capability**: `domain-model`
- **相关约束**: FR(FR100, FR102)、NFR(NFR16)、ARCH(ADR-005)

本变更实现部门树和岗位的数据模型及 CRUD API。

## Goals / Non-Goals (目标与非目标)

### Goals (目标)
- 实现部门树形结构存储和查询
- 实现部门和岗位的 CRUD API
- 定义删除和迁移约束规则
- 确保数据完整性

### Non-Goals (非目标)
- 不实现前端 UI（由 E2-S2.3-02 负责）
- 不实现组织架构图可视化（由 E2-S2.8-01 负责）
- 不实现权限绑定逻辑（由 E2-S2.5-01 负责）

## Architecture Decisions (架构决策)

### 1. 部门树存储方案
**决策**: 使用 parent_id + 闭包表混合方案
**理由**:
- parent_id 简单直观，适合小规模树
- 闭包表优化深层查询性能
- 支持租户级隔离

### 2. 岗位与部门关系
**决策**: 岗位可选关联部门（多对多或一对多）
**理由**:
- 部分岗位可能跨部门（如"总监"）
- 大多数岗位属于特定部门
- 使用 department_id 外键关联

### 3. 删除约束
**决策**: 级联检查 + 禁止删除
**理由**:
- 有子部门时禁止删除
- 有员工关联时禁止删除
- 提供迁移接口处理关联数据

## Data Model (数据模型)

### Departments 表

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES departments(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    leader_id UUID REFERENCES users(id),
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- 闭包表（可选，用于优化树查询）
CREATE TABLE department_closure (
    ancestor_id UUID NOT NULL,
    descendant_id UUID NOT NULL,
    depth INT NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- 索引
CREATE INDEX idx_departments_tenant_parent ON departments(tenant_id, parent_id);
CREATE INDEX idx_departments_tenant_status ON departments(tenant_id, status);
```

### Positions 表

```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    department_id UUID REFERENCES departments(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    level INT,
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- 索引
CREATE INDEX idx_positions_tenant_dept ON positions(tenant_id, department_id);
```

## API Specification (API 规格)

### GET /api/admin/departments/tree
获取部门树

**Response:**
```json
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "name": "总公司",
    "code": "HQ",
    "leader": {
      "id": "uuid",
      "name": "张总"
    },
    "children": [
      {
        "id": "uuid",
        "name": "技术部",
        "code": "TECH",
        "children": []
      }
    ]
  }
}
```

### POST /api/admin/departments
创建部门

**Request Body:**
```json
{
  "name": "技术部",
  "code": "TECH",
  "parent_id": "uuid",
  "leader_id": "uuid",
  "sort_order": 1
}
```

### DELETE /api/admin/departments/:id
删除部门

**约束检查:**
- 有子部门时返回 `DEPARTMENT_HAS_CHILDREN`
- 有关联员工时返回 `DEPARTMENT_HAS_USERS`

### GET /api/admin/positions
获取岗位列表

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| department_id | UUID | 否 | 部门 ID 筛选 |
| name | string | 否 | 名称模糊搜索 |

### POST /api/admin/positions
创建岗位

**Request Body:**
```json
{
  "name": "高级工程师",
  "code": "SE",
  "department_id": "uuid",
  "description": "负责核心技术架构",
  "level": 3
}
```

## Constraint Rules (约束规则)

### 部门删除约束
```go
func (s *DepartmentService) Delete(ctx context.Context, id string) error {
    // 1. 检查子部门
    children, _ := s.repo.FindByParentID(ctx, id)
    if len(children) > 0 {
        return errors.New("DEPARTMENT_HAS_CHILDREN", "该部门下存在子部门，无法删除")
    }
    
    // 2. 检查关联员工
    users, _ := s.userRepo.FindByDepartmentID(ctx, id)
    if len(users) > 0 {
        return errors.New("DEPARTMENT_HAS_USERS", "该部门下存在员工，无法删除")
    }
    
    // 3. 执行删除
    return s.repo.SoftDelete(ctx, id)
}
```

### 部门迁移规则
- 迁移时更新所有子部门的路径
- 不允许跨租户迁移
- 迁移目标不能是自己的子部门

### 岗位删除约束
- 有员工关联时禁止删除
- 支持岗位停用（保留数据，禁止新分配）

## Error Handling (错误处理)

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| DEPARTMENT_NOT_FOUND | 404 | 部门不存在 |
| DEPARTMENT_HAS_CHILDREN | 400 | 部门有子部门 |
| DEPARTMENT_HAS_USERS | 400 | 部门有员工 |
| CIRCULAR_REFERENCE | 400 | 循环引用检测 |
| POSITION_NOT_FOUND | 404 | 岗位不存在 |
| POSITION_HAS_USERS | 400 | 岗位有员工 |

## Testing Strategy (测试策略)

### 单元测试
- 部门树构建测试
- 删除约束测试
- 循环引用检测测试

### 集成测试
- API 端点测试
- 级联操作测试
- 并发操作测试

## Open Questions (待解决问题)

1. 部门层级深度限制？
2. 岗位是否支持跨部门共享？
3. 部门负责人变更是否需要审批流程？