# Specification: API Contracts

## 需求来源

### PRD 约束
- **FR27**: 用户登录认证
- **FR28/FR99**: 用户与员工档案管理
- **FR29**: 权限配置
- **FR33**: 导入导出
- **FR105**: 员工可以查看和编辑个人信息

### 架构约束
- **ADR-001**: 前端通过 HTTP 调用后端 API
- **ADR-005**: 后端提供 RESTful API

## 功能规格

### 统一响应格式

```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {}
}
```

### 分页响应格式

```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "page_size": 20
  }
}
```

### 统一错误响应格式

```json
{
  "code": "PERMISSION_DENIED",
  "http_status": 403,
  "message": "当前账号无权限执行该操作",
  "trace_id": "req-20260318-xxxx"
}
```

### API 列表

#### 认证与会话 API
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/session/current`
- `GET /api/auth/session/list`
- `POST /api/auth/session/revoke`

#### 个人信息 API（FR105）
- `GET /api/auth/profile`
- `PUT /api/auth/profile`

#### 用户与组织 API
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/departments/tree`
- `POST /api/admin/departments`
- `PUT /api/admin/departments/:id`
- `GET /api/admin/positions`
- `POST /api/admin/positions`

#### 权限 API
- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `PUT /api/admin/roles/:id`
- `GET /api/admin/permissions`
- `PUT /api/admin/users/:id/roles`
- `PUT /api/admin/users/:id/permission-overrides`

#### 审计与导入导出 API
- `GET /api/admin/audit-logs`
- `GET /api/admin/audit-logs/export`
- `POST /api/admin/users/import/preview`
- `POST /api/admin/users/import/commit`
- `POST /api/admin/users/export`

### 错误码范围
- `0-999`: 通用错误
- `1000-1999`: 认证与会话错误
- `2000-2999`: 用户与组织错误
- `3000-3999`: 导入导出错误
- `4000-4999`: 权限错误
- `5000+`: 系统错误

## 交付物
1. API 契约文档
2. Go 请求/响应结构体清单
3. TypeScript 类型定义
4. 错误码与 403 契约说明
