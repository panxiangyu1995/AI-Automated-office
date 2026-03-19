# Design: User Admin APIs

## Context (上下文)

- **Change**: `epic-2-story-2-2-user-admin-api`
- **Story**: Story 2.2 - 用户管理工作台
- **Capability**: `admin-api`
- **相关约束**: FR(FR28)、NFR(NFR16)、ARCH(ADR-005)

本变更在 Go 云端后端实现用户管理 API，遵循分层架构：Handler -> Service -> Repository。

## Goals / Non-Goals (目标与非目标)

### Goals (目标)
- 实现用户管理 CRUD API，支持分页和筛选
- 所有写操作写入审计日志
- 遵循 Epic 2 分层职责：React 前端调用 Go 云端 API
- 实现数据校验和标准错误响应

### Non-Goals (非目标)
- 不实现前端 UI（由 E2-S2.2-02 负责）
- 不修改 Tauri/Rust 层（桌面端不承担用户管理逻辑）
- 不实现权限校验中间件（由 E2-S2.7-01 负责）

## Architecture Decisions (架构决策)

### 1. API 设计风格
**决策**: 采用 RESTful API 设计
**理由**: 
- 符合业界标准，易于理解和维护
- 与现有认证 API 风格一致
- 支持标准的 HTTP 方法和状态码

### 2. 分页策略
**决策**: 使用 offset-based 分页
**理由**:
- 用户管理场景数据量可控（单租户 <= 500 用户）
- 实现简单，前端集成容易
- 支持跳页查询

### 3. 筛选实现
**决策**: 在数据库层实现筛选条件
**理由**:
- 减少数据传输量
- 利用数据库索引优化性能
- 支持多条件组合查询

### 4. 审计日志
**决策**: 所有写操作写入 audit_logs 表
**理由**:
- 满足合规要求
- 支持操作追溯
- 为后续审计查询 UI 提供数据

## Data Model (数据模型)

### Users 表扩展
```sql
-- 用户表核心字段（已有）
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    employee_code VARCHAR(50),
    real_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, locked
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, employee_code)
);

-- 建议新增索引
CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX idx_users_tenant_department ON users(tenant_id, department_id);
```

### 关联表
```sql
-- 用户-部门关联
CREATE TABLE user_departments (
    user_id UUID,
    department_id UUID,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, department_id)
);

-- 用户-角色关联
CREATE TABLE user_roles (
    user_id UUID,
    role_id UUID,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

## API Specification (API 规格)

### GET /api/admin/users
用户列表分页查询

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20，最大 100 |
| name | string | 否 | 姓名模糊搜索 |
| employee_code | string | 否 | 工号精确匹配 |
| department_id | UUID | 否 | 部门 ID |
| status | string | 否 | 状态筛选 |

**Response:**
```json
{
  "code": "SUCCESS",
  "data": {
    "items": [
      {
        "id": "uuid",
        "username": "zhangsan",
        "real_name": "张三",
        "employee_code": "EMP001",
        "email": "zhangsan@company.com",
        "phone": "13800138000",
        "status": "active",
        "departments": [
          {"id": "uuid", "name": "技术部", "is_primary": true}
        ],
        "roles": [
          {"id": "uuid", "name": "普通员工"}
        ],
        "created_at": "2026-03-18T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### POST /api/admin/users
创建用户

**Request Body:**
```json
{
  "username": "lisi",
  "real_name": "李四",
  "employee_code": "EMP002",
  "email": "lisi@company.com",
  "phone": "13900139000",
  "department_ids": ["uuid1"],
  "role_ids": ["uuid2"],
  "send_notification": true
}
```

**Response:**
```json
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "username": "lisi",
    "real_name": "李四",
    "temp_password": "Abc123!@#"
  }
}
```

### PUT /api/admin/users/:id
更新用户信息

**Request Body:**
```json
{
  "real_name": "李四",
  "email": "lisi_new@company.com",
  "phone": "13900139001",
  "department_ids": ["uuid1", "uuid3"],
  "role_ids": ["uuid2", "uuid4"]
}
```

### PATCH /api/admin/users/:id/status
更新用户状态

**Request Body:**
```json
{
  "status": "inactive",
  "reason": "离职"
}
```

## Error Handling (错误处理)

### 标准错误响应
```json
{
  "code": "VALIDATION_ERROR",
  "http_status": 400,
  "message": "用户名已存在",
  "field": "username",
  "trace_id": "req-20260318-xxxx"
}
```

### 错误码定义
| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 数据校验失败 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| DUPLICATE_USERNAME | 409 | 用户名重复 |
| DUPLICATE_EMPLOYEE_CODE | 409 | 工号重复 |
| PERMISSION_DENIED | 403 | 无权限（由权限中间件返回） |

## Risks / Trade-offs (风险与权衡)

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量用户导入性能问题 | 中 | 支持批量创建 API |
| 敏感字段泄露 | 高 | API 响应过滤密码等敏感信息 |
| 并发更新冲突 | 低 | 使用 updated_at 版本控制 |

## Migration Plan (迁移计划)

1. **Phase 1**: 实现 Repository 层（用户 CRUD 数据操作）
2. **Phase 2**: 实现 Service 层（业务逻辑、校验）
3. **Phase 3**: 实现 Handler 层（HTTP 端点）
4. **Phase 4**: 添加审计日志集成
5. **Phase 5**: 编写单元测试和集成测试

## Open Questions (待解决问题)

1. 用户创建时是否需要强制设置初始密码？
2. 批量导入功能是否在本变更范围内？
3. 用户头像存储方案确认（OSS 或本地存储）