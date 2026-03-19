# Proposal: Cloud Auth Module Foundation

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证与部门权限系统的核心是登录认证。根据架构设计，登录认证主链路由 Go 云端承担。本提案旨在构建云端认证模块的基础架构，为后续登录 API、密码策略、会话管理等功能提供底层支撑。

### 业务背景
- 用户需要使用账号密码登录系统（FR27）
- 认证数据需要安全传输和存储（NFR9, NFR11）
- 会话需要有效管理（NFR12）

### 技术背景
- 采用 Go 语言构建云端后端
- 多租户数据库级隔离（ADR-005）
- 分层微内核架构（ADR-001）

## 目标

构建 Go 云端认证模块的基础骨架，包括：
1. 领域模型定义（用户、会话、Token）
2. 应用服务骨架（认证服务）
3. 基础设施接口（仓储、加密工具）
4. 接口层骨架（HTTP Handler）

## 范围

### 包含
- 创建 auth module 目录结构
- 定义核心领域实体（User, Session, Token）
- 定义值对象（Password, PermissionSummary）
- 定义 DTO（LoginRequest, LoginResponse, RefreshRequest）
- 定义核心接口（PasswordPolicy, TokenManager, SessionManager）
- 创建 service、handler、repository 骨架
- 连接日志系统和标准错误处理

### 不包含
- 具体的登录 API 实现（E2-S2.1-02）
- 前端登录页面（E2-S2.1-03）
- 本地会话缓存（E2-S2.1-04）
- 密码验证和锁定策略的完整实现（E2-S2.1-02）

## 影响范围

### 后端
- `cloud-server/internal/module/auth/` - 新增认证模块
- `cloud-server/internal/pkg/crypto/` - 新增加密工具包
- `cloud-server/internal/pkg/errors/` - 新增认证相关错误定义

### 数据库
- 无直接影响（数据库表结构在 E2-S2.1-02 中实现）

### 依赖
- Go 标准库
- Gin Web 框架
- GORM
- JWT 库（golang-jwt/jwt）
- Bcrypt 库（golang.org/x/crypto/bcrypt）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 接口设计不合理导致后续重构 | 中 | 中 | 参考 OpenClaw 架构，充分评审接口设计 |
| 模块结构不符合 DDD 最佳实践 | 低 | 中 | 遵循 DDD 分层架构，参考成熟项目结构 |
| 日志和错误处理不统一 | 中 | 低 | 使用统一的 zap 日志和自定义错误类型 |

## 实施计划

1. **Step 1**: 创建模块目录结构
2. **Step 2**: 定义领域实体和值对象
3. **Step 3**: 定义核心接口
4. **Step 4**: 创建 DTO 定义
5. **Step 5**: 实现 service/handler/repository 骨架
6. **Step 6**: 连接日志和错误处理

## 依赖关系

### 前置依赖
- Epic 1, Story 1.6 - Go 云端后端项目初始化
- Epic 1, Story 1.7 - PostgreSQL 数据库初始化

### 后置依赖
- E2-S2.1-02: Login API and password policy
- E2-S2.2-01: User admin APIs
- E2-S2.3-01: Department and position domain model
- E2-S2.10-01: Session model and timeout engine
- E2-S2.11-01: Structured audit log model