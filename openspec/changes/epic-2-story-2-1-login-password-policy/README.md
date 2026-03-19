# Epic 2, Story 2.1: Login API and Password Policy

## 概述

实现 Go 云端登录 API，包括密码验证、失败次数限制、临时锁定策略，并返回 Token、用户信息、租户信息和权限摘要。这是认证流程的核心实现，建立在 E2-S2.1-01 的基础架构之上。

## 铁律映射

### PRD 需求
- **FRs**: FR27 - 用户可以使用账号密码登录系统
- **NFRs**: 
  - NFR11 - 密码安全，密码 bcrypt 加密存储，强度因子≥12
  - NFR12 - 会话管理，会话超时 30 分钟，支持强制登出

### 架构需求
- **ADR-005**: 多租户采用数据库级隔离
- **ADR-001**: 分层微内核架构，认证逻辑在云端层

### UX 需求
- 本子任务为后端 API，无直接 UX 需求（前端交互由 E2-S2.1-03 实现）

## 验收标准

- [ ] 实现 POST /api/auth/login 接口
- [ ] 应用 bcrypt 密码验证和强度规则（cost=12）
- [ ] 实现失败登录计数器和锁定规则（5次/15分钟，10次/1小时）
- [ ] 返回 Token、用户信息、租户信息、权限摘要
- [ ] 写入登录成功与失败审计日志

## 技术方案

### API 设计

```
POST /api/auth/login

Request:
{
  "username": "string",
  "password": "string",
  "tenant_id": "string (optional)"
}

Response (Success 200):
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 3600,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "real_name": "string",
    "department_id": "string",
    "position_id": "string",
    "status": "string"
  },
  "tenant": {
    "id": "string",
    "name": "string"
  },
  "permissions": {
    "roles": ["string"],
    "permissions": ["string"],
    "data_scopes": {"resource": "scope"}
  }
}

Response (Error 401/403):
{
  "code": "AUTH_001",
  "message": "用户名或密码错误",
  "trace_id": "string"
}
```

### 密码策略

- 最小长度：8 位
- 强度要求：包含大小写字母和数字
- 存储：bcrypt 哈希，cost = 12
- 验证：bcrypt 比对

### 锁定策略

- 连续失败 5 次：锁定 15 分钟
- 连续失败 10 次：锁定 1 小时
- 锁定期间任何登录尝试都返回锁定错误
- 锁定计数器在成功登录后重置

### 审计日志

- 登录成功：记录 user_id、tenant_id、IP hash、trace_id
- 登录失败：记录 username、失败原因、IP hash、trace_id

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`
- 基础架构: `openspec/changes/epic-2-story-2-1-cloud-auth-foundation/`
