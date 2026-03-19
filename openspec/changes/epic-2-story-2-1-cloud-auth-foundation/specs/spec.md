# Specification: Cloud Auth Module Foundation

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**

用户通过输入用户名和密码进行身份验证，系统验证通过后返回访问令牌和用户信息。

### 架构约束

**ADR-001 - 分层微内核架构**
- 认证逻辑位于 Cloud Layer
- 前端 React 负责登录交互
- Tauri/Rust 不承担账号密码鉴权主入口

**ADR-005 - 多租户数据库级隔离**
- 每个租户的数据在数据库层面隔离
- 认证需要识别租户上下文

### UX 规范

本子任务为后端基础设施，无直接 UX 需求。

## 功能规格

### 用户故事

As a **系统架构师**,
I want **构建云端认证模块的基础架构**,
So that **后续登录 API 和会话管理可以在此基础之上快速开发**。

### 验收场景

#### Scenario 1: 模块目录结构创建
- **GIVEN** Go 云端项目已初始化
- **WHEN** 创建认证模块目录结构
- **THEN** 目录符合 DDD 分层架构规范
  - domain/ 目录包含 entity、valueobject、repository 子目录
  - application/ 目录包含 service、dto 子目录
  - infrastructure/ 目录包含 persistence、crypto 子目录
  - interface/ 目录包含 handler 子目录

#### Scenario 2: 领域实体定义
- **GIVEN** 模块目录结构已创建
- **WHEN** 定义 User、Session、Token 实体
- **THEN** 
  - User 实体包含 ID、Username、Password、Email、Status 等字段
  - Session 实体包含 ID、UserID、TenantID、ExpiresAt、RevokedAt 等字段
  - Token 实体包含 AccessToken、RefreshToken、ExpiresIn 等字段
  - 所有实体包含 GORM 标签

#### Scenario 3: 核心接口定义
- **GIVEN** 领域实体已定义
- **WHEN** 定义 PasswordPolicy、TokenManager、SessionManager 接口
- **THEN**
  - PasswordPolicy 接口包含 Hash、Verify、ValidateStrength 方法
  - TokenManager 接口包含 GenerateAccessToken、GenerateRefreshToken、ValidateToken、RefreshToken 方法
  - SessionManager 接口包含 Create、Get、UpdateLastActive、Revoke 方法

#### Scenario 4: DTO 定义
- **GIVEN** 核心接口已定义
- **WHEN** 定义 LoginRequest、LoginResponse DTO
- **THEN**
  - LoginRequest 包含 Username、Password、TenantID 字段
  - LoginResponse 包含 AccessToken、RefreshToken、User、Tenant、Permissions 字段
  - 所有字段包含 JSON 标签和验证规则

#### Scenario 5: 日志和错误处理集成
- **GIVEN** 所有骨架代码已创建
- **WHEN** 集成日志和错误处理
- **THEN**
  - 使用 zap 结构化日志
  - 定义统一的 AuthError 错误类型
  - 所有认证事件可记录日志

## 数据规格

### 输入

本子任务为基础设施搭建，无直接用户输入。

### 输出

| 输出 | 类型 | 描述 |
|------|------|------|
| 模块目录结构 | 目录 | DDD 分层架构的认证模块 |
| 领域实体 | Go 文件 | User、Session、Token 实体定义 |
| 值对象 | Go 文件 | Password、PermissionSummary 值对象 |
| 接口定义 | Go 文件 | 核心接口和仓储接口 |
| DTO | Go 文件 | 登录请求响应 DTO |
| Service 骨架 | Go 文件 | AuthService 应用服务 |
| Handler 骨架 | Go 文件 | AuthHandler HTTP 处理器 |
| Repository 实现 | Go 文件 | 用户和会话仓储实现 |

## 边界条件

1. **模块边界**: 认证模块只负责认证相关功能，用户管理由 User Module 负责
2. **数据库边界**: 仓储实现依赖 GORM，使用 PostgreSQL
3. **加密边界**: 密码哈希使用 bcrypt，Token 使用 JWT

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| AUTH_001 | 用户名或密码错误 | 返回 401，记录日志 |
| AUTH_002 | 账户已被锁定 | 返回 403，记录日志 |
| AUTH_003 | 账户已禁用 | 返回 403，记录日志 |
| AUTH_004 | 令牌已过期 | 返回 401，提示刷新 |
| AUTH_005 | 令牌无效 | 返回 401，要求重新登录 |
| AUTH_006 | 会话已过期 | 返回 401，要求重新登录 |

## 质量属性

### 性能要求
- 接口定义无性能影响
- 骨架代码编译无警告

### 可维护性要求
- 代码符合 Go 规范
- 使用 gofmt 格式化
- 使用 golint 检查

### 安全要求
- 密码相关接口设计考虑安全因素
- Token 相关接口设计考虑防篡改

## 依赖关系

### 上游依赖
- Go 1.21+
- Gin Web 框架
- GORM
- golang-jwt/jwt
- golang.org/x/crypto/bcrypt
- go.uber.org/zap

### 下游依赖
- E2-S2.1-02: Login API and password policy
- E2-S2.2-01: User admin APIs
- E2-S2.10-01: Session model and timeout engine
- E2-S2.11-01: Structured audit log model