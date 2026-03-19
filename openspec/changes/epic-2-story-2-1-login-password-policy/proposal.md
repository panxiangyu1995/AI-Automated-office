# Proposal: Login API and Password Policy

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证与部门权限系统的核心是登录认证。E2-S2.1-01 已完成认证模块的基础架构搭建，本提案旨在实现完整的登录 API，包括密码验证、失败锁定策略、Token 签发和权限摘要返回。

### 业务背景
- 用户需要使用账号密码登录系统（FR27）
- 需要防止暴力破解攻击（NFR11, NFR12）
- 需要返回用户信息、租户信息和权限摘要供前端使用

### 技术背景
- 基于 E2-S2.1-01 的认证模块基础架构
- 使用 bcrypt 进行密码验证
- 使用 JWT 签发访问令牌和刷新令牌
- 多租户数据库级隔离（ADR-005）

## 目标

实现完整的登录 API，包括：
1. 用户名密码验证
2. 密码强度验证规则
3. 失败次数限制和临时锁定策略
4. Token 签发（access_token + refresh_token）
5. 用户信息、租户信息、权限摘要返回
6. 登录审计日志记录

## 范围

### 包含
- 实现 POST /api/auth/login 接口
- 密码验证逻辑（bcrypt 比对）
- 密码强度验证规则（8位+大小写+数字）
- 失败登录计数器（存储在 Redis 或数据库）
- 锁定策略实现（5次/15分钟，10次/1小时）
- Token 生成和签名
- 权限摘要查询和组装
- 登录成功/失败审计日志

### 不包含
- 登录页面 UI（E2-S2.1-03）
- 本地会话缓存（E2-S2.1-04）
- Token 刷新接口（E2-S2.1-01 已定义接口）
- 登出接口（后续 Story）

## 影响范围

### 后端
- `cloud-server/internal/module/auth/application/service/auth_service.go` - 实现登录逻辑
- `cloud-server/internal/module/auth/interface/handler/auth_handler.go` - 实现 HTTP Handler
- `cloud-server/internal/module/auth/infrastructure/` - 实现失败计数器和锁定策略
- `cloud-server/internal/module/audit/` - 记录登录审计日志

### 数据库
- `users` 表：读取用户信息
- `sessions` 表：创建会话记录
- `audit_logs` 表：写入登录审计日志
- Redis（可选）：存储失败计数器

### API
- 新增 POST /api/auth/login

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 暴力破解攻击 | 高 | 高 | 实现失败计数器和锁定策略 |
| 密码泄露 | 中 | 高 | bcrypt 加密存储，cost=12 |
| Token 被窃取 | 中 | 高 | 使用 HTTPS，Token 有效期短（1小时） |
| 分布式环境下的锁定策略 | 中 | 中 | 使用 Redis 存储失败计数器 |
| 性能问题（权限查询） | 低 | 中 | 优化权限查询，考虑缓存 |

## 实施计划

1. **Step 1**: 实现密码验证和强度检查
2. **Step 2**: 实现失败计数器和锁定策略
3. **Step 3**: 实现 Token 生成逻辑
4. **Step 4**: 实现权限摘要查询
5. **Step 5**: 组装 LoginResponse
6. **Step 6**: 集成审计日志
7. **Step 7**: 编写单元测试和集成测试

## 依赖关系

### 前置依赖
- E2-S2.1-01: Cloud auth module foundation（必须完成）

### 后置依赖
- E2-S2.1-03: Frontend login flow
- E2-S2.1-04: Local session cache wrapper
- E2-S2.10-01: Session model and timeout engine
- E2-S2.11-02: Audit event integration

## 验收场景

### Scenario 1: 成功登录
- **GIVEN** 用户存在且密码正确
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 200，包含 access_token、refresh_token、用户信息、租户信息、权限摘要

### Scenario 2: 密码错误
- **GIVEN** 用户存在但密码错误
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 401，错误码 AUTH_001，记录失败计数

### Scenario 3: 账户锁定
- **GIVEN** 用户已连续失败 5 次
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 403，错误码 AUTH_002，提示锁定时间

### Scenario 4: 用户不存在
- **GIVEN** 用户名不存在
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 401，错误码 AUTH_001（不透露用户是否存在）

### Scenario 5: 账户禁用
- **GIVEN** 用户状态为 disabled
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 403，错误码 AUTH_003