---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'AI-Automated-office'
user_name: 'PAN'
date: '2026-07-03'
classification:
  projectType: 'Cloud Backend API（无前端）+ 本地 CLI'
  domain: '企业经营SaaS（Agent调用API作为前端）'
  complexity: '高'
  projectContext: 'greenfield'
lastEdited: '2026-07-03'
status: 'in_progress'
---

# Architecture Decision Document - AI-Automated-office

**Author:** PAN
**Date:** 2026-07-03
**Project Type:** Cloud Backend SaaS + Local CLI (Agent-Driven)

---

## 📑 目录导航

| 章节 | 说明 |
|------|------|
| [Architecture Overview](#architecture-overview) | 系统架构总览 |
| [Technology Stack](#technology-stack) | 技术栈选型 |
| [API Design](#api-design) | API 设计规范 |
| [Authentication & Authorization](#authentication--authorization) | 认证授权架构 |
| [Multi-Tenant Strategy](#multi-tenant-strategy) | 多租户隔离策略 |
| [Data Model](#data-model) | 数据模型设计 |
| [CLI & Skill System](#cli--skill-system) | CLI 与 Skill 系统 |
| [Message Polling System](#message-polling-system) | 消息轮询系统 |
| [Deployment Architecture](#deployment-architecture) | 部署架构 |

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 286 FRs across 32 modules
- Core modules: Auth, ORG, HRM, CRM, IMS, Contract, Sales, Service, Finance, Workflow
- Supporting modules: File, Knowledge Base, Messaging, Multi-enterprise, Custom fields, Skills

**Non-Functional Requirements:**
- Performance: < 200ms API response, 100 concurrent/enterprise
- Security: OAuth 2.0 + JWT, bcrypt, 100% tenant isolation
- Reliability: 99.5% uptime, daily backup
- Observability: JSON logs, Prometheus, OpenTelemetry
- Deployment: Docker, K8s, AGPL v3

**Scale & Complexity:**
- Complexity: High (Enterprise SaaS + Multi-tenant + Workflow Engine)
- Primary domain: Cloud Backend API
- Cross-cutting concerns: Auth, Multi-tenancy, Workflow, Messaging

### Technical Constraints & Dependencies

| Constraint | Requirement |
|------------|-------------|
| Database | PostgreSQL (Schema-level multi-tenancy) |
| Auth | OAuth 2.0 + JWT + Refresh Token |
| Deployment | Docker + K8s + LAN deployment |
| License | AGPL v3 + Commercial |

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization** - OAuth 2.0, JWT, RBAC
2. **Multi-tenancy** - Schema isolation, cross-enterprise permissions
3. **Workflow Engine** - Configurable approval workflows
4. **Messaging** - CLI polling mechanism
5. **Skill System** - Natural language interface standardization

---

## Starter Template Evaluation

### Primary Technology Domain

**Backend API + CLI Tool** - 本项目是无前端 SaaS，主要组件是：
1. Go Backend API 服务
2. CLI 工具（Agent 调用）
3. PostgreSQL 数据库
4. Docker 部署

### 技术栈决策

| 组件 | 选择 | 理由 |
|------|------|------|
| Language | Go | 高性能、编译单二进制、PRD 建议 |
| Web Framework | Gin | Go 生态成熟、轻量高性能 |
| ORM | GORM | Go 生态成熟、PostgreSQL 支持 |
| Database | PostgreSQL 15+ | Schema 级多租户隔离 |
| Cache | Redis | Session、热点数据 |
| CLI Framework | Cobra | Go 最成熟 CLI 框架 |
| Container | Docker Compose | MVP 一键部署 |

### 项目结构

```
ai-office/
├── api/                    # Go Backend API
│   ├── cmd/server/        # 入口
│   ├── internal/          # 业务代码
│   │   ├── handler/      # HTTP Handler
│   │   ├── service/      # 业务逻辑
│   │   ├── repository/   # 数据访问
│   │   └── model/        # 数据模型
│   ├── pkg/              # 公共包
│   └── go.mod
├── cli/                   # CLI 工具
│   ├── cmd/              # Cobra 命令
│   └── main.go
├── deploy/                # 部署配置
│   └── docker-compose/
└── docs/                  # 文档
```

### 初始化命令

**Go Backend:**
```bash
mkdir -p api && cd api
go mod init github.com/ai-office/api
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
```

**CLI Tool:**
```bash
mkdir -p cli && cd cli
go mod init github.com/ai-office/cli
go get -u github.com/spf13/cobra
```

**Docker Compose:**
```bash
mkdir -p deploy/docker-compose
```

---

## Architecture Overview

### 核心架构设计

**AI-Automated-office** 是一款**面向 Agent 的企业级云服务 SaaS**，采用以下核心架构：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         本地环境 (Local)                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ Claude Code │    │   Codex     │    │   Gemini    │   ...        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘              │
│         │                   │                   │                     │
│         └───────────────────┼───────────────────┘                     │
│                             │                                         │
│                    ┌────────▼────────┐                               │
│                    │   CLI Skills    │                               │
│                    │  (Agent 调用)   │                               │
│                    └────────┬────────┘                               │
│                             │                                         │
│                    ┌────────▼────────┐                               │
│                    │   消息轮询 CLI   │  ◄── 60秒轮询间隔            │
│                    └────────┬────────┘                               │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼───────────────────────────────────────┐
│                         云端服务 (Cloud)                              │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │                      API Gateway                             │      │
│  │                   (Nginx / Traefik)                         │      │
│  └──────────────────────────┬──────────────────────────────────┘      │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────┐      │
│  │                   OAuth 2.0 + JWT                            │      │
│  │                  (认证 + 授权中心)                           │      │
│  └──────────────────────────┬──────────────────────────────────┘      │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────┐      │
│  │                    业务服务层 (Business)                      │      │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │      │
│  │  │ 组织架构│ │  HRM   │ │  CRM   │ │ 进销存 │ │  合同  │   │      │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │      │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │      │
│  │  │ 销售   │ │ 售后   │ │  财务  │ │ 审批流 │ │ 知识库 │   │      │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │      │
│  └─────────────────────────────────────────────────────────────┘      │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────┐      │
│  │                   PostgreSQL (多租户)                        │      │
│  │         Schema 级隔离 │ Row-Level Security                   │      │
│  └─────────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │                    文件存储 (Local/OSS)                      │      │
│  └─────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 架构特点

| 特点 | 说明 |
|------|------|
| **无前端 SaaS** | 不提供 Web/桌面 UI，Agent 通过 API 操作业务 |
| **数据即服务** | Agent 调用 API 获取数据，生成 HTML/文档展示 |
| **权限即壁垒** | RBAC + 多租户隔离，确保 Agent 只能访问授权数据 |
| **CLI 轮询** | 本地 CLI 每 60 秒轮询消息，解决 Agent 定时任务限制 |
| **开源+商业** | AGPL v3 开源 + 商业授权双轨 |

---

## Technology Stack

### 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **API Gateway** | Nginx / Traefik | HTTPS 终结、负载均衡 |
| **认证授权** | OAuth 2.0 + JWT | Refresh Token 机制 |
| **后端框架** | Go (Gin) / Node.js (Fastify) | 高性能 API 服务 |
| **数据库** | PostgreSQL 15+ | Schema 级多租户隔离 |
| **ORM** | GORM / Prisma | 数据库操作 |
| **文件存储** | 本地文件系统 (MVP) / OSS/S3 (v2.0) | 合同附件、员工档案 |
| **缓存** | Redis | Session、热点数据缓存 |
| **消息队列** | PostgreSQL LISTEN/NOTIFY / Redis Pub/Sub | 消息通知 |
| **容器化** | Docker + Docker Compose | 一键部署 |
| **CLI** | Go / Node.js / Python | 跨平台 CLI 工具 |

### 为什么选择这些技术？

| 选择 | 理由 |
|------|------|
| **Go** | 高并发、编译成单个二进制、部署简单 |
| **PostgreSQL** | Schema 级隔离成熟稳定、JSON 支持、成熟生态 |
| **OAuth 2.0 + JWT** | 标准认证协议、支持 Refresh Token |
| **Nginx** | 生产级反向代理、HTTPS 终结 |

---

## API Design

### API 设计规范

**遵循 RESTful 风格，使用 OpenAPI 3.0 规范：**

```
Base URL: https://api.ai-office.com/v1
```

### 认证流程

```
Agent                          API                      数据库
  │                             │                         │
  │  1. POST /auth/login        │                         │
  │     (client_id + client_secret)                      │
  │ ─────────────────────────────>│                        │
  │                             │  验证凭证                │
  │                             │ ────────────────────────>│
  │                             │ <───────────────────────│
  │  2. access_token + refresh_token                      │
  │ <─────────────────────────────│                        │
  │                             │                          │
  │  3. GET /org/employees      │                          │
  │     (Authorization: Bearer <token>)                   │
  │ ─────────────────────────────>│                        │
  │                             │  验证 token + RBAC       │
  │                             │ ────────────────────────>│
  │  4. employees JSON          │                          │
  │ <─────────────────────────────│                        │
```

### 核心 API 端点

| 模块 | 端点前缀 | 说明 |
|------|----------|------|
| **认证授权** | `/auth/*` | 登录、刷新 Token、登出 |
| **组织架构** | `/org/*` | 企业、部门、员工 CRUD |
| **HRM** | `/hrm/*` | 入职、离职、调岗、业绩 |
| **CRM** | `/crm/*` | 客户、联系人、商机 |
| **进销存** | `/ims/*` | 采购、销售、库存、仓库、调拨、领用、出入库流水 |
| **合同** | `/contract/*` | 合同 CRUD、附件 |
| **销售** | `/sales/*` | 销售订单、出库 |
| **售后** | `/service/*` | 工单、报价、维修 |
| **财务** | `/finance/*` | 应收、应付、发票 |
| **审批** | `/workflow/*` | 审批流配置、审批 |
| **附件** | `/file/*` | 上传、下载、预览 |
| **知识库** | `/kb/*` | 文档、RAG 检索 |
| **消息** | `/message/*` | 消息列表、已读 |

### 错误响应格式

**结构化错误码体系（便于 Agent 理解与恢复）：**

```json
{
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "访问令牌已过期，请刷新令牌",
    "details": {
      "resource": "/v1/contracts",
      "action": "read",
      "reason": "token_expired",
      "expired_at": "2024-07-03T10:00:00Z"
    },
    "level": "recoverable",
    "recoverable": true,
    "recovery_action": {
      "type": "refresh_token",
      "api": "POST /v1/auth/refresh",
      "description": "使用 Refresh Token 获取新的 Access Token"
    },
    "request_id": "req_abc123",
    "timestamp": "2024-07-03T10:30:00Z"
  }
}
```

**错误码命名规范（Casbin 风格，便于 Agent 解析）：**

```
{模块}_{错误类型}_{序号}
```

| 模块 | 前缀 | 示例 |
|------|------|------|
| 认证授权 | `AUTH` | `AUTH_TOKEN_EXPIRED`, `AUTH_INVALID_CREDENTIALS` |
| 权限 | `PERM` | `PERM_DENIED`, `PERM_ROLE_REQUIRED` |
| 业务 | `BIZ` | `BIZ_CONTRACT_NOT_FOUND`, `BIZ_CUSTOMER_LOCKED` |
| 验证 | `VAL` | `VAL_INVALID_PARAMS`, `VAL_MISSING_REQUIRED` |
| 系统 | `SYS` | `SYS_DB_ERROR`, `SYS_INTERNAL_ERROR` |
| 资源 | `RES` | `RES_NOT_FOUND`, `RES_ALREADY_EXISTS` |

**错误级别定义：**

| 级别 | level | Agent 处理方式 | 示例 |
|------|-------|----------------|------|
| **可恢复** | `recoverable` | Agent 自动重试或按 recovery_action 执行 | Token 过期、网络超时 |
| **需用户操作** | `user_action` | Agent 提示用户需要人工操作 | 权限不足、余额不足 |
| **数据问题** | `data_issue` | Agent 需要补充或修正数据 | 参数错误、数据不存在 |
| **系统错误** | `system_error` | 记录日志，联系管理员 | 数据库错误、服务不可用 |
| **致命错误** | `fatal` | 终止操作，记录日志 | 认证服务宕机 |

**错误响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 错误码，格式 `{模块}_{类型}_{序号}` |
| `message` | string | 人类可读的错误描述 |
| `details` | object | 错误详情，包含 `resource`、`action`、`reason` 等 |
| `level` | string | 错误级别 |
| `recoverable` | boolean | 是否可自动恢复 |
| `recovery_action` | object | 恢复建议，包含 `type`、`api`、`description` |
| `request_id` | string | 请求 ID，用于日志追踪 |
| `timestamp` | string | 错误发生时间 |

**常见错误码与恢复策略：**

| 错误码 | HTTP Status | level | 恢复策略 |
|--------|-------------|-------|----------|
| `AUTH_TOKEN_EXPIRED` | 401 | recoverable | 使用 Refresh Token 刷新 |
| `AUTH_TOKEN_INVALID` | 401 | user_action | 需要重新登录 `ao-cli auth login` |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | user_action | 需要重新登录 |
| `PERM_DENIED` | 403 | user_action | 联系管理员开通权限 |
| `PERM_ROLE_REQUIRED` | 403 | user_action | 需要特定角色，请切换账号 |
| `BIZ_NOT_FOUND` | 404 | data_issue | 确认资源 ID 是否正确 |
| `BIZ_CONTRACT_LOCKED` | 409 | user_action | 合同已锁定，请联系管理员 |
| `VAL_INVALID_PARAMS` | 400 | data_issue | 检查请求参数是否完整且正确 |
| `SYS_DB_ERROR` | 500 | system_error | 系统错误，记录 request_id 联系管理员 |
| `SYS_RATE_LIMIT` | 429 | recoverable | 限流，请等待后重试 |

**Agent 错误处理流程：**

```
Agent 请求失败
    │
    ▼
解析错误码：
├── AUTH_XXX (认证错误)
│   ├── recoverable = true  → 自动刷新 Token 重试
│   └── recoverable = false → 请求用户重新登录
│
├── PERM_XXX (权限错误)
│   └── 提示用户需要管理员开通权限
│
├── BIZ_XXX (业务错误)
│   ├── VAL_XXX → 检查并修正参数
│   └── 其他 → 根据 details.reason 处理
│
├── SYS_XXX (系统错误)
│   ├── recoverable = true → 等待后重试
│   └── fatal → 记录日志，终止操作
│
└── 未知错误
    └── 记录 request_id，提示用户联系管理员
```

**错误日志与监控：**

```go
// 错误日志结构
type ErrorLog struct {
    RequestID    string    `json:"request_id"`
    ErrorCode    string    `json:"error_code"`
    ErrorLevel   string    `json:"error_level"`
    Message      string    `json:"message"`
    UserID       string    `json:"user_id"`
    EnterpriseID string    `json:"enterprise_id"`
    Resource     string    `json:"resource"`
    Action       string    `json:"action"`
    ClientIP     string    `json:"client_ip"`
    UserAgent    string    `json:"user_agent"`
    Timestamp    time.Time `json:"timestamp"`
    StackTrace   string    `json:"stack_trace,omitempty"`
}

// 错误日志记录
func (s *ErrorService) LogError(ctx *Context, err *AppError) {
    // 1. 记录到 PostgreSQL error_logs 表
    // 2. 异步发送到 Prometheus (error_total, error_by_code)
    // 3. 超过阈值的错误发送告警
}
```

**错误监控告警规则：**

| 告警规则 | 阈值 | 动作 |
|----------|------|------|
| 5分钟内错误率 > 10% | 10% | 发送告警 |
| `AUTH_TOKEN_XXX` 错误 > 50次/分钟 | 50/min | 疑似暴力攻击 |
| `SYS_DB_ERROR` 出现 | 1次 | 立即告警 |
| `PERM_DENIED` 错误 > 100次/分钟 | 100/min | 疑似权限配置错误 |

---

## Authentication & Authorization

### OAuth 2.0 + JWT 实现

**Token 结构：**

| Token 类型 | 有效期 | 存储位置 |
|------------|--------|----------|
| **access_token** | 30 分钟 | 内存/环境变量 |
| **refresh_token** | 7 天 | 本地文件/CLI 配置 |

**Token Payload 示例：**

```json
{
  "sub": "employee_uuid",
  "client_id": "cli_client_id",
  "enterprise_id": "enterprise_uuid",
  "department_id": "department_uuid",
  "roles": ["department_manager", "employee"],
  "exp": 1700000000,
  "iat": 1699996400
}
```

### RBAC 权限模型

**角色定义：**

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| **Operator** | 运营商管理员 | 所有集团、所有企业 |
| **Group Owner** | 集团老板 | 集团内所有企业 |
| **Enterprise Admin** | 企业管理员 | 单个企业所有数据 |
| **Department Manager** | 部门经理 | 本部门数据 |
| **Employee** | 普通员工 | 个人数据 |

**权限检查流程：**

```
请求 ──> JWT 解析 ──> 获取 roles ──> 查询 RBAC 策略 ──> 允许/拒绝
                      │                                    │
                      │            ┌───────────────────────┘
                      │            │
                      ▼            ▼
              enterprise_id    department_id
              (跨企业检查)     (跨部门检查)
```

### ABAC 精细化权限模型

**RBAC + ABAC 混合模式：**

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| **RBAC** | 基于角色的权限控制 | 标准权限分配 |
| **ABAC** | 基于属性的细粒度控制 | 自定义权限、动态策略 |

**权限系统架构（Casbin + 解耦设计）：**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Permission System Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Permission Facade                              │   │
│  │                    (统一入口，屏蔽底层实现)                             │   │
│  └─────────────────────────────────┬──────────────────────────────────────┘   │
│                                    │                                          │
│  ┌─────────────────────────────────▼──────────────────────────────────────┐   │
│  │                    Permission Evaluator                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │   RBAC     │  │   ABAC     │  │  Attribute  │  │  Plugin     │   │   │
│  │  │  Evaluator │  │  Evaluator │  │  Evaluator  │  │  Evaluator  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  │         │               │               │               │              │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼──────────────┘   │
│            │               │               │               │                  │
│  ┌─────────▼───────────────▼───────────────▼───────────────▼──────────────┐   │
│  │                      Policy Storage (PostgreSQL)                       │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │   │
│  │  │  Role  │  │  Perm  │  │ EmpPerm│  │  Attr  │  │  Rule  │           │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Casbin PERM 模型配置：**

```ini
# perm_model.conf (RBAC + ABAC 混合)
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[abac_definition]
v2 = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

**权限引擎核心接口：**

```go
// PermissionEvaluator - 权限评估器接口（插件化）
type PermissionEvaluator interface {
    // Evaluate 执行权限检查
    Evaluate(ctx *PermissionContext) (*Decision, error)
    // GetName 获取评估器名称
    GetName() string
    // Priority 获取优先级（数字越小越先执行）
    Priority() int
}

// PermissionContext - 权限检查上下文
type PermissionContext struct {
    Subject *Subject  // 请求主体（用户）
    Object  *Object   // 目标对象（资源）
    Action  string    // 操作类型
    Env     *Env      // 环境变量（时间、IP等）
}

// Decision - 权限决策结果
type Decision struct {
    Allowed bool
    Reason  string
    MatchedRule string
}

// RBAC 评估器
type RBACEvaluator struct{}

func (e *RBACEvaluator) Evaluate(ctx *PermissionContext) (*Decision, error) {
    // 基于角色的权限检查
}

func (e *RBACEvaluator) GetName() string { return "rbac" }
func (e *RBACEvaluator) Priority() int   { return 1 }

// ABAC 评估器
type ABACEvaluator struct{}

func (e *ABACEvaluator) Evaluate(ctx *PermissionContext) (*Decision, error) {
    // 基于属性的权限检查
}

func (e *ABACEvaluator) GetName() string { return "abac" }
func (e *ABACEvaluator) Priority() int   { return 2 }
```

**精细化权限控制点：**

```go
// 权限属性定义
type Permission struct {
    Resource   string   // 资源：contract, customer, employee, message
    Action     string   // 操作：create, read, update, delete, send_announcement
    Conditions []Condition // 条件：部门ID、数据所属者、时间范围
}

// 条件类型
type Condition struct {
    Field    string      // 字段：department_id, created_by, enterprise_id
    Operator string      // 操作符：eq, ne, in, not_in, between, gt, lt, regex
    Value    interface{} // 值（支持 ${user.xxx} 变量插值）
}

// 时间条件示例
type TimeCondition struct {
    Field    string // created_at, updated_at
    Operator string // between, before, after
    Value    TimeRange
}

// 数据范围条件示例
type DataScopeCondition struct {
    Field    string   // department_id, created_by
    Operator string   // in, not_in, self_only
    Value    []string // 值列表，或 self_only（仅自己）
}

// 权限示例
var CustomPermissions = []Permission{
    // 销售经理：可查看所有客户，但只能编辑自己部门的客户
    {
        Resource: "crm_customer",
        Action:   "read",
        Conditions: []Condition{},
    },
    {
        Resource: "crm_customer",
        Action:   "update",
        Conditions: []Condition{
            {Field: "department_id", Operator: "eq", Value: "${user.department_id}"},
        },
    },
    // 老板/管理员：可发送全员公告
    {
        Resource: "message",
        Action:   "send_announcement",
        Conditions: []Condition{},
    },
}
```

**权限表设计（完整版）：**

```sql
-- 角色表
CREATE TABLE _role (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(50) NOT NULL, -- admin, manager, employee
    description    VARCHAR(200),
    is_system      BOOLEAN DEFAULT false, -- 系统内置角色不可删除
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限定义表
CREATE TABLE _permission (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(100) UNIQUE NOT NULL, -- contract.read, contract.write
    name           VARCHAR(100) NOT NULL,
    resource       VARCHAR(50) NOT NULL, -- contract, customer, message
    action         VARCHAR(50) NOT NULL, -- create, read, update, delete
    description    VARCHAR(200),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色权限关联表
CREATE TABLE _role_permission (
    role_id        UUID REFERENCES _role(id),
    permission_id  UUID REFERENCES _permission(id),
    PRIMARY KEY (role_id, permission_id)
);

-- 员工自定义权限表 (ABAC)
CREATE TABLE _employee_permission (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id    UUID NOT NULL REFERENCES _employee(id),
    permission_id  UUID NOT NULL REFERENCES _permission(id),
    conditions     JSONB DEFAULT '{}', -- 自定义条件
    granted_by     UUID NOT NULL REFERENCES _employee(id),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限属性表（支持更复杂的属性条件）
CREATE TABLE _permission_attr (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_id  UUID NOT NULL REFERENCES _permission(id),
    attr_key       VARCHAR(100) NOT NULL, -- time_range, data_scope, ip_whitelist
    attr_type      VARCHAR(50) NOT NULL,  -- time, scope, ip, custom
    attr_config    JSONB NOT NULL,        -- {start: "09:00", end: "18:00", days: [1,2,3,4,5]}
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自定义规则表（支持 Casbin 规则）
CREATE TABLE _custom_rule (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(100) NOT NULL,
    rule_type      VARCHAR(50) NOT NULL, -- deny_override, allow_override
    casbin_rule    TEXT NOT NULL,        -- p, admin, data, read
    priority       INT DEFAULT 0,        -- 优先级
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emp_perm_employee ON _employee_permission(employee_id);
CREATE INDEX idx_perm_attr_perm ON _permission_attr(permission_id);
CREATE INDEX idx_custom_rule_enterprise ON _custom_rule(enterprise_id, is_active);
```

**权限 API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/permissions` | GET | 获取所有权限定义 |
| `/v1/roles` | GET/POST | 获取/创建角色 |
| `/v1/roles/{id}` | GET/PUT/DELETE | 角色 CRUD |
| `/v1/roles/{id}/permissions` | GET/PUT | 角色权限分配 |
| `/v1/employees/{id}/permissions` | GET/POST/DELETE | 员工自定义权限 |
| `/v1/employees/{id}/permissions/effective` | GET | 员工有效权限（含继承） |
| `/v1/permissions/check` | POST | 权限检查（调试用） |
| `/v1/custom-rules` | GET/POST | 自定义 Casbin 规则 |

**权限检查 API 示例：**

```json
// POST /v1/permissions/check
{
  "subject": {
    "user_id": "user_xxx",
    "roles": ["employee"],
    "department_id": "dept_sales"
  },
  "object": {
    "resource": "crm_customer",
    "id": "cust_001"
  },
  "action": "update"
}

响应:
{
  "allowed": true,
  "reason": "ABAC condition passed: created_by == user.id",
  "matched_rules": [
    {"type": "rbac", "rule": "employee can read crm_customer"},
    {"type": "abac", "rule": "created_by == ${user.id}"}
  ]
}
```

**插件化权限评估器注册：**

```go
// 企业自定义权限插件接口
type PermissionPlugin interface {
    PermissionEvaluator
    // Init 初始化插件
    Init(config JSONB) error
    // GetMeta 获取插件元信息
    GetMeta() PluginMeta
}

// 注册自定义评估器
func RegisterEvaluator(evaluator PermissionEvaluator) {
    evaluators = append(evaluators, evaluator)
    sort.Slice(evaluators, func(i, j int) bool {
        return evaluators[i].Priority() < evaluators[j].Priority()
    })
}

// 内置评估器初始化
func init() {
    RegisterEvaluator(&RBACEvaluator{})
    RegisterEvaluator(&ABACEvaluator{})
    RegisterEvaluator(&AttributeEvaluator{})
    RegisterEvaluator(&CustomRuleEvaluator{})
}
```

**权限检查增强流程 (RBAC + ABAC + 插件)：**

```
请求 ──> JWT 解析 ──> 获取用户信息
                      │
                      ▼
              ┌───────────────────┐
              │  Permission Facade │ ──> 统一入口
              └─────────┬─────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │    Evaluator Chain (按优先级)  │
         ├──────────────────────────────┤
         │ 1. RBAC Evaluator (系统内置)  │ ──> 角色权限检查
         ├──────────────────────────────┤
         │ 2. ABAC Evaluator (自定义)    │ ──> 属性条件检查
         ├──────────────────────────────┤
         │ 3. Attribute Evaluator       │ ──> 时间/IP/数据范围
         ├──────────────────────────────┤
         │ 4. Custom Rule Evaluator     │ ──> Casbin 自定义规则
         ├──────────────────────────────┤
         │ 5. Plugin Evaluator (扩展)    │ ──> 企业自定义插件
         └──────────────────────────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   合并决策结果     │ ──> 所有评估器通过 = 允许
              └─────────┬─────────┘
                        │
                        ▼
                    允许/拒绝
```

**管理员自定义员工权限流程：**

```
管理员: "为销售专员张三添加：可查看所有客户，但只能编辑自己创建的客户"
          │
          ▼
Agent 解析权限需求:
- 资源: crm_customer
- 操作: read (无限制) + update (只编辑自己创建的)
- 条件: { created_by: "${user.id}" }

API 调用:
POST /v1/employees/{employee_id}/permissions
{
  "permissions": [
    {
      "permission_id": "perm_customer_read",
      "conditions": {}
    },
    {
      "permission_id": "perm_customer_update",
      "conditions": {
        "created_by": "${user.id}"
      }
    }
  ]
}
```

**特殊权限场景支持：**

| 场景 | 实现方式 | 示例 |
|------|----------|------|
| **时间段限制** | Attribute Evaluator | 仅工作时间 9:00-18:00 可访问 |
| **IP 白名单** | Attribute Evaluator | 仅内网 IP 可访问 |
| **数据范围限制** | ABAC Condition | 仅查看本部门数据 |
| **临时权限** | 有效期 + 自动过期 | 临时授权某员工访问敏感数据 |
| **审批后权限** | 流程 + 临时提升 | 审批通过后自动获得权限 |
| **代理权限** | 委托 + 审计 | 经理可代理下属操作 |
| **跨部门协作** | 临时数据共享 | 限时共享某客户数据给其他部门 |

**时间条件配置示例：**

```json
{
  "permission_id": "contract_approval",
  "attr_key": "time_range",
  "attr_type": "time",
  "attr_config": {
    "type": "weekly",
    "start_time": "09:00",
    "end_time": "18:00",
    "work_days": [1, 2, 3, 4, 5],
    "timezone": "Asia/Shanghai",
    "holidays": ["2024-07-04", "2024-07-05"]
  }
}
```

**数据范围条件配置示例：**

```json
{
  "permission_id": "crm_customer_read",
  "attr_key": "data_scope",
  "attr_type": "scope",
  "attr_config": {
    "type": "department",
    "include_children": true,
    "allowed_departments": ["dept_sales", "dept_marketing"]
  }
}
```

**全员公告权限控制：**

| 角色 | 可发送全员公告 |
|------|----------------|
| Operator | ✅ 是 |
| Group Owner | ✅ 是 |
| Enterprise Admin | ✅ 是 |
| Department Manager | ❌ 否 |
| Employee | ❌ 否 |

```go
// 公告权限检查
func (s *AuthService) CanSendAnnouncement(user *Claims) bool {
    // 只有 Enterprise Admin 及以上角色可发送全员公告
    adminRoles := []string{"operator", "group_owner", "enterprise_admin"}
    for _, role := range user.Roles {
        if slices.Contains(adminRoles, role) {
            return true
        }
    }
    return false
}
```

### 多租户权限隔离

**三层隔离：**

| 层级 | 隔离方式 | 检查位置 |
|------|----------|----------|
| **集团层** | Group Owner 角色 | API Gateway |
| **企业层** | Enterprise ID | 业务服务 |
| **部门层** | Department ID | 业务服务 |

---

## Multi-Tenant Strategy

### 多租户架构

**采用 PostgreSQL Schema 级隔离：**

```
PostgreSQL Instance
├── public.schema_mgmt          # 系统管理表（_operator, _group）
├── public.schema_ent_001      # 企业 A 数据
├── public.schema_ent_002      # 企业 B 数据
├── public.schema_ent_003      # 企业 C 数据
└── ...
```

### Schema 隔离策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **Schema per Tenant** | 每个租户独立 Schema | 中大型租户 |
| **Row-Level Security** | 行级安全策略 | 小型租户共享 Schema |
| **Database per Tenant** | 每个租户独立数据库 | 超大型租户（可选） |

**本产品采用 Schema per Tenant 方案：**

```
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL                         │
│  ┌─────────────────────────────────────────────┐    │
│  │              public schema                    │    │
│  │  ┌─────────────────────────────────────────┐ │    │
│  │  │ _operator (运营商表)                    │ │    │
│  │  │ _group (集团表)                         │ │    │
│  │  │ _enterprise (企业表)                    │ │    │
│  │  │ _department (部门表)                   │ │    │
│  │  │ _employee (员工表)                     │ │    │
│  │  └─────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │            ent_001 schema                    │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │ customer│ │contract│ │  sale   │  ...   │    │
│  │  └─────────┘ └─────────┘ └─────────┘        │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │            ent_002 schema                    │    │
│  │  (同上结构，不同数据)                        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 跨企业数据访问

**集团老板跨企业权限：**

```sql
-- 查询集团下所有企业的数据
SELECT * FROM ent_001.customer WHERE group_id = 'group_uuid'
UNION ALL
SELECT * FROM ent_002.customer WHERE group_id = 'group_uuid';
```

---

## Data Model

### 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   _group    │       │ _enterprise │       │ _department │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (UUID)   │───┐   │ id (UUID)   │───┐   │ id (UUID)   │
│ name        │   │   │ group_id    │◄──┘   │ enterprise_id│
│ created_at  │   │   │ name        │       │ name        │
└─────────────┘   │   │ created_at  │       │ parent_id   │
                  │   └─────────────┘       │ manager_id │
                  │                         └─────────────┘
                  │          │                    │
                  │          ▼                    ▼
                  │   ┌─────────────┐       ┌─────────────┐
                  └──►│  _employee  │       │  business   │
                      ├─────────────┤       │   tables    │
                      │ id (UUID)   │       │             │
                      │ enterprise_id│     │ (客户,合同,  │
                      │ department_id│     │  销售,等)   │
                      │ roles[]     │       │             │
                      └─────────────┘       └─────────────┘
```

### 业务表命名规范

| 业务模块 | 表名前缀 | 示例 |
|----------|----------|------|
| 客户管理 | `crm_` | `crm_customer`, `crm_contact` |
| 合同管理 | `con_` | `con_contract`, `con_attachment` |
| 销售管理 | `sale_` | `sale_order`, `sale_delivery` |
| 售后管理 | `svc_` | `svc_ticket`, `svc_quote` |
| 进销存 | `ims_` | `ims_warehouse`, `ims_material`, `ims_inventory`, `ims_stock_transfer`, `ims_inventory_transaction`, `ims_inventory_check`, `ims_requisition` |
| 财务管理 | `fin_` | `fin_receivable`, `fin_invoice` |
| 审批流 | `wf_` | `wf_definition`, `wf_instance` |
| 知识库 | `kb_` | `kb_document`, `kb_chunk` |

---

## CLI & Skill System

### CLI Skill 架构

**Skill 是 Agent 调用 API 的接口定义：**

```
┌──────────────────────────────────────────────────────────────┐
│                        Agent (Claude Code)                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  user: "帮我创建一个销售合同"                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              CLI Skill: contract_create                 │   │
│  │  - opening: "您好！我是合同助手"                        │   │
│  │  - options: [创建合同, 查看合同, 修改合同, 删除合同]    │   │
│  │  - actions: {create: {...}, read: {...}, ...}           │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            ▼                                  │
│                    POST /contract/create                      │
└──────────────────────────────────────────────────────────────┘
```

### Skill 定义结构

**完整 Skill 定义（支持角色差异化 + 字段说明）：**

```json
{
  "skill_name": "contract",
  "display_name": "合同管理",
  "description": "帮助您管理销售合同",
  "version": "1.0.0",
  "enterprise_id": "ent_xxx",

  "role_openings": {
    "enterprise_admin": {
      "opening": "您好！我是合同管理助手。作为企业管理员，您可以：",
      "available_actions": ["create", "list", "update", "delete", "approve", "withdraw"],
      "capabilities": ["管理所有合同", "审批合同", "查看所有员工合同", "导出合同报表"]
    },
    "department_manager": {
      "opening": "您好！我是合同管理助手。作为部门经理，您可以：",
      "available_actions": ["create", "list", "update", "submit_approval"],
      "capabilities": ["创建本部门合同", "查看本部门合同", "提交合同审批"]
    },
    "employee": {
      "opening": "您好！我是合同管理助手。您可以：",
      "available_actions": ["list", "view_own"],
      "capabilities": ["查看自己的合同", "查看合同详情"]
    }
  },

  "default_opening": "您好！我是合同管理助手，可以帮您管理销售合同",

  "actions": {
    "create": {
      "label": "创建合同",
      "description": "创建新的销售合同",
      "require_confirmation": true,
      "parameters": [
        {
          "name": "customer_id",
          "label": "客户",
          "type": "uuid",
          "required": true,
          "description": "选择合同对应的客户",
          "example": "客户名称或ID",
          "auto_fill_from_context": ["最近沟通的客户"]
        },
        {
          "name": "title",
          "label": "合同名称",
          "type": "string",
          "required": true,
          "description": "合同标题/名称",
          "validation": {
            "min_length": 5,
            "max_length": 200
          },
          "example": "XXX公司产品采购合同"
        },
        {
          "name": "amount",
          "label": "合同金额",
          "type": "decimal",
          "required": true,
          "description": "合同总金额（元）",
          "validation": {
            "min": 0.01,
            "max": 999999999
          },
          "example": "100000"
        },
        {
          "name": "sign_date",
          "label": "签订日期",
          "type": "date",
          "required": true,
          "description": "合同签订日期",
          "example": "2024-07-03"
        },
        {
          "name": "start_date",
          "label": "开始日期",
          "type": "date",
          "required": true,
          "description": "合同开始日期",
          "example": "2024-07-03"
        },
        {
          "name": "end_date",
          "label": "结束日期",
          "type": "date",
          "required": true,
          "description": "合同结束日期",
          "example": "2025-07-03"
        },
        {
          "name": "payment_terms",
          "label": "付款方式",
          "type": "enum",
          "required": true,
          "description": "付款方式",
          "options": [
            {"value": "一次性", "label": "一次性付款"},
            {"value": "分期", "label": "分期付款"},
            {"value": "月结", "label": "月结"}
          ],
          "example": "月结"
        },
        {
          "name": "attachments",
          "label": "附件",
          "type": "file[]",
          "required": false,
          "description": "合同附件（合同扫描件、补充协议等）",
          "validation": {
            "max_count": 10,
            "max_size_mb": 50,
            "allowed_types": ["pdf", "doc", "docx", "jpg", "png"]
          },
          "example": "合同.pdf"
        },
        {
          "name": "remark",
          "label": "备注",
          "type": "string",
          "required": false,
          "description": "备注说明",
          "validation": {
            "max_length": 1000
          },
          "example": "特殊条款说明"
        }
      ],
      "response_format": {
        "success": {
          "message": "合同创建成功",
          "fields": ["id", "title", "amount", "status"]
        },
        "pending_approval": {
          "message": "合同已提交审批，等待管理员审批",
          "waiting_approval_roles": ["enterprise_admin"]
        }
      }
    },
    "list": {
      "label": "查看合同列表",
      "description": "查看现有合同列表",
      "parameters": [
        {
          "name": "status",
          "label": "状态",
          "type": "enum",
          "required": false,
          "description": "筛选合同状态",
          "options": [
            {"value": "draft", "label": "草稿"},
            {"value": "pending_approval", "label": "待审批"},
            {"value": "approved", "label": "已审批"},
            {"value": "rejected", "label": "已拒绝"},
            {"value": "active", "label": "执行中"},
            {"value": "completed", "label": "已完成"},
            {"value": "terminated", "label": "已终止"}
          ],
          "default": "active"
        },
        {
          "name": "page",
          "label": "页码",
          "type": "int",
          "required": false,
          "description": "页码",
          "default": 1
        },
        {
          "name": "page_size",
          "label": "每页数量",
          "type": "int",
          "required": false,
          "description": "每页显示数量",
          "default": 20,
          "validation": {"max": 100}
        }
      ]
    },
    "view_own": {
      "label": "查看我的合同",
      "description": "查看自己相关的合同"
    }
  },

  "examples": [
    "帮我创建一个销售合同",
    "查看所有待审批的合同",
    "修改合同金额",
    "查看我负责的合同"
  ],

  "api_endpoints": {
    "create": "POST /v1/contracts",
    "list": "GET /v1/contracts",
    "update": "PUT /v1/contracts/:id",
    "delete": "DELETE /v1/contracts/:id",
    "approve": "POST /v1/contracts/:id/approve",
    "withdraw": "POST /v1/contracts/:id/withdraw"
  }
}
```

**角色化 Skill 加载流程：**

```
用户/Agent: "ao-cli skills load contract"
          │
          ▼
CLI 获取用户角色:
1. 读取本地 Token
2. 解析 JWT 获取 roles
3. 根据角色加载对应的 role_openings
          │
          ▼
返回个性化 Skill:
{
  "skill_name": "contract",
  "opening": "您好！我是合同管理助手。作为部门经理，您可以：",
  "available_actions": ["create", "list", "update", "submit_approval"],
  "capabilities": ["创建本部门合同", "查看本部门合同", "提交合同审批"]
}
          │
          ▼
Agent 根据 opening 生成自然语言引导用户
```

**字段类型说明：**

| 类型 | 说明 | 输入方式 |
|------|------|----------|
| `string` | 文本 | 直接输入 |
| `int` | 整数 | 直接输入数字 |
| `decimal` | 小数 | 直接输入数字（支持小数） |
| `date` | 日期 | YYYY-MM-DD 格式 |
| `enum` | 枚举 | 从选项中选择 |
| `uuid` | 唯一标识 | 输入ID或名称（支持模糊匹配） |
| `file` | 文件 | 上传文件或输入文件路径 |
| `file[]` | 文件数组 | 多个文件 |

**自动填充上下文（auto_fill_from_context）：**

```go
// 参数支持从对话上下文自动填充
type Parameter struct {
    Name                string
    auto_fill_from_context []string  // 自动填充来源
}

// 示例：当用户说"创建合同"但没指定客户时
// Agent 会自动从最近沟通的客户上下文中填充
```

**Skill Help 命令：**

```bash
# 查看 Skill 详细信息（包含字段说明）
ao-cli skill help contract

输出:
╔═══════════════════════════════════════════════════════════════╗
║                    Skill: 合同管理 (contract)                  ║
╠═══════════════════════════════════════════════════════════════╣
║  您好！我是合同管理助手。作为部门经理，您可以：                   ║
║  - 创建本部门合同                                               ║
║  - 查看本部门合同                                               ║
║  - 提交合同审批                                                 ║
╠═══════════════════════════════════════════════════════════════╣
║  可用操作:                                                      ║
║  1. create  - 创建合同                                          ║
║  2. list    - 查看合同列表                                      ║
║  3. update  - 修改合同                                          ║
╠═══════════════════════════════════════════════════════════════╣
║  创建合同 (create) 参数说明:                                    ║
║  ─────────────────────────────────────────────────────────────║
║  客户 ID *        | 必填 | 客户名称或ID                          ║
║  合同名称 *        | 必填 | 5-200字符                            ║
║  合同金额 *        | 必填 | 数字，最小0.01                       ║
║  签订日期 *        | 必填 | 格式: 2024-07-03                     ║
║  开始日期 *        | 必填 | 格式: 2024-07-03                     ║
║  结束日期 *        | 必填 | 格式: 2024-07-03                     ║
║  付款方式 *        | 必填 | 一次性/分期/月结                      ║
║  附件             | 选填 | PDF/Word/图片，最大50MB               ║
║  备注             | 选填 | 最多1000字符                          ║
╚═══════════════════════════════════════════════════════════════╝

# 查看特定操作的参数说明
ao-cli skill params contract --action create
```

**Skill API 端点：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/skills` | GET | 获取所有可用 Skill |
| `/v1/skills/{name}` | GET | 获取 Skill 详情（含角色化内容） |
| `/v1/skills/{name}/actions/{action}` | GET | 获取特定操作的参数说明 |
| `/v1/skills/schema` | GET | 获取 Skill JSON Schema（供 Agent 解析） |

**Skill 表设计：**

```sql
-- Skill 定义表
CREATE TABLE _skill (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID,  -- NULL 表示系统内置 Skill
    name           VARCHAR(100) NOT NULL,
    display_name   VARCHAR(200) NOT NULL,
    description    TEXT,
    version        VARCHAR(20) DEFAULT '1.0.0',
    is_system      BOOLEAN DEFAULT false,
    is_active      BOOLEAN DEFAULT true,
    config         JSONB DEFAULT '{}',  -- Skill 配置
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skill 角色化开场白表
CREATE TABLE _skill_role_opening (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id       UUID NOT NULL REFERENCES _skill(id),
    role           VARCHAR(50) NOT NULL,  -- enterprise_admin, department_manager, employee
    opening        TEXT NOT NULL,
    available_actions JSONB DEFAULT '[]',
    capabilities   JSONB DEFAULT '[]',
    UNIQUE(skill_id, role)
);

-- Skill 参数定义表
CREATE TABLE _skill_parameter (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id       UUID NOT NULL REFERENCES _skill(id),
    action         VARCHAR(50) NOT NULL,  -- create, update, list
    name           VARCHAR(100) NOT NULL,
    label          VARCHAR(200) NOT NULL,
    type           VARCHAR(50) NOT NULL,  -- string, int, decimal, date, enum, uuid, file
    required       BOOLEAN DEFAULT false,
    description    TEXT,
    example        TEXT,
    default_value  TEXT,
    validation     JSONB DEFAULT '{}',
    auto_fill_from_context JSONB DEFAULT '[]',
    sort_order     INT DEFAULT 0,
    UNIQUE(skill_id, action, name)
);

CREATE INDEX idx_skill_enterprise ON _skill(enterprise_id, is_active);
CREATE INDEX idx_skill_role_opening ON _skill_role_opening(skill_id, role);
CREATE INDEX idx_skill_param ON _skill_parameter(skill_id, action);
```

### CLI 命令行接口

```bash
# 登录
ao-cli auth login --client-id <id> --client-secret <secret>

# 查看可用 Skills
ao-cli skills list

# 查看 Skill 详细信息（包含角色化开场白和字段说明）
ao-cli skill help contract

# 查看特定操作的参数说明
ao-cli skill params contract --action create

# 调用 Skill
ao-cli skill invoke contract --action create --params '{"customer_id": "xxx", "amount": 10000}'

# 轮询消息
ao-cli message poll --interval 60
```

---

## Message Polling System

### 为什么需要轮询？

**Agent 限制：**
- Claude Code、Codex 等 Agent 不支持定时任务
- 无法像人一样保持 WebSocket 连接

**解决方案：**
- 本地 CLI 每 60 秒轮询一次消息接口
- Agent 主动拉取最新消息和通知
- 通过 Agent 的通知机制告知用户

### 轮询架构

**问题：传统轮询的 API 压力**

```
传统轮询（每 60 秒轮询 1000 个企业）:
1000 企业 × 1 请求/分钟 = 16.7 QPS（无消息时也产生）
1000 企业 × 1 请求/分钟 × 24 小时 = 1,440,000 次/天
```

### 优化方案：多级消息通知架构

**混合推送-轮询架构：**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Optimized Message System                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │   Business   │      │   Message    │      │    Redis     │              │
│  │   Service    │─────►│   Service    │─────►│   Pub/Sub    │              │
│  │  (触发消息)   │      │  (统一管理)   │      │  (实时分发)   │              │
│  └──────────────┘      └──────────────┘      └──────┬───────┘              │
│                                                      │                       │
│                                    ┌─────────────────┼─────────────────┐    │
│                                    │                 │                 │    │
│                                    ▼                 ▼                 ▼    │
│                            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│                            │  API Server  │ │  API Server  │ │  API Server  │
│                            │    实例 1     │ │    实例 2     │ │    实例 N     │
│                            └──────────────┘ └──────────────┘ └──────────────┘
│                                    │                 │                 │
│                                    └─────────────────┼─────────────────┘
│                                                      │                       │
│                                                      ▼                       │
│                      ┌────────────────────────────────────────────────────┐  │
│                      │              CLI (智能轮询)                         │  │
│                      │  ┌──────────────────────────────────────────────┐  │  │
│                      │  │  Adaptive Polling:                          │  │  │
│                      │  │  - 有新消息 → 缩短间隔 (5秒)                  │  │  │
│                      │  │  - 无新消息 → 延长间隔 (最大 300秒)           │  │  │
│                      │  │  - ETag/Last-Modified 减少空响应              │  │  │
│                      │  └──────────────────────────────────────────────┘  │  │
│                      └────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**优化策略：**

| 策略 | 说明 | 效果 |
|------|------|------|
| **Redis Pub/Sub** | 消息触发时立即推送到所有 API 实例 | 消除轮询等待延迟 |
| **Adaptive Polling** | 根据消息频率动态调整轮询间隔 | 减少无效请求 |
| **ETag/Last-Modified** | 304 Not Modified 无消息时返回 | 减少响应体传输 |
| **Message Cache** | Redis 缓存未读消息计数 | 减少数据库查询 |
| **Long Polling** | 有消息时立即返回，无消息时等待 30 秒 | 平衡延迟和压力 |

### 消息 API 设计

**轮询接口（优化版）：**

```go
// GET /v1/messages/poll
// 支持 Long Polling + ETag

type PollRequest struct {
    LastMessageID string `query:"last_id"`      // 最后已知消息ID
    Timeout       int    `query:"timeout"`      // 超时秒数（0-30）
    Limit         int    `query:"limit"`        // 最多返回消息数
}

type PollResponse struct {
    Messages     []Message `json:"messages"`
    HasMore      bool      `json:"has_more"`
    NextCursor   string    `json:"next_cursor"`
    UnreadCount  int       `json:"unread_count"`
    // 缓存控制
    ETag         string    `json:"etag"`
    LastModified string    `json:"last_modified"`
}

// 无新消息时返回 304 Not Modified
// 有新消息时返回 200 + 消息列表
```

**轮询决策流程：**

```
CLI 发起轮询请求
        │
        ▼
┌───────────────────────────┐
│ 检查 Redis 未读计数       │ ◄── 内存操作，极快
│ GET unread:{enterprise_id} │
└─────────────┬─────────────┘
              │
        ┌─────┴─────┐
        │ 计数 > 0? │
        └─────┬─────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
   Yes                  No
    │                   │
    ▼                   ▼
┌─────────┐      ┌─────────────────┐
│查询消息 │      │ Long Polling    │
│返回结果 │      │ (等待30秒)       │
└─────────┘      │                 │
                 │ 检查 ETag 变化?  │
                 └────────┬────────┘
                          │
                   ┌──────┴──────┐
                   │ 有新消息?    │
                   └──────┬──────┘
                         │
                  ┌──────┴──────┐
                  │             │
                  ▼             ▼
                 Yes            No
                  │             │
                  ▼             ▼
            ┌─────────┐   ┌─────────────┐
            │返回消息 │   │ 返回304     │
            └─────────┘   │ (无变化)    │
                          └─────────────┘
```

**Adaptive Polling 算法：**

```go
type AdaptivePoller struct {
    minInterval time.Duration  // 最小间隔（5秒）
    maxInterval time.Duration  // 最大间隔（5分钟）
    currentInterval time.Duration
}

func (p *AdaptivePoller) GetNextInterval(hasMessages bool) time.Duration {
    if hasMessages {
        // 有消息：缩短间隔，快速响应
        p.currentInterval = p.currentInterval / 2
        if p.currentInterval < p.minInterval {
            p.currentInterval = p.minInterval
        }
    } else {
        // 无消息：延长间隔，减少压力
        p.currentInterval = p.currentInterval * 1.5
        if p.currentInterval > p.maxInterval {
            p.currentInterval = p.maxInterval
        }
    }
    return p.currentInterval
}

// 初始间隔：30秒
// 有消息时：5秒 → 10秒 → 15秒...
// 无消息时：30秒 → 45秒 → 67秒 → 100秒... → 最大 300秒
```

**Redis Pub/Sub 集成：**

```go
// 消息服务发布新消息
func (s *MessageService) PublishMessage(msg *Message) error {
    // 1. 保存到数据库
    s.db.Create(msg)

    // 2. 更新 Redis 未读计数
    s.redis.Incr(fmt.Sprintf("unread:%s", msg.EnterpriseID))

    // 3. 发布到 Redis Channel
    channel := fmt.Sprintf("enterprise:%s:messages", msg.EnterpriseID)
    s.redis.Publish(channel, msg.ID)

    return nil
}

// API Server 订阅消息
func (s *APIServer) SubscribeEnterprise(enterpriseID string) {
    channel := fmt.Sprintf("enterprise:%s:messages", enterpriseID)
    pubsub := s.redis.Subscribe(channel)

    go func() {
        for msg := range pubsub {
            // 通知所有轮询中的请求有新消息
            s.notifyPollers(enterpriseID, msg.Payload)
        }
    }()
}
```

**API 压力对比：**

| 轮询方式 | 1000 企业/分钟 | 响应次数/天 | 数据库查询/天 |
|----------|---------------|-------------|---------------|
| **传统轮询（60秒）** | 16.7 QPS | 1,440,000 | 1,440,000 |
| **优化轮询（自适应）** | ~3 QPS | ~260,000 | ~260,000 |
| **Long Polling + Pub/Sub** | ~0.5 QPS | ~50,000 | ~50,000 |

**减少 95%+ 的无效请求！**

### 关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **实时通知** | Redis Pub/Sub | 消息触发时立即推送 |
| **轮询优化** | Adaptive Polling | 根据消息频率动态调整 |
| **空响应优化** | ETag/304 Not Modified | 减少响应体传输 |
| **消息缓存** | Redis 未读计数 | 减少数据库查询 |
| **长连接备选** | Long Polling | 无 WebSocket 时的最优解 |

### 消息类型

| 类型 | 说明 | 触发时机 |
|------|------|----------|
| **审批通知** | 待审批事项 | 审批流到达 |
| **任务完成** | 工单/维修完成 | 状态变更 |
| **系统消息** | 权限变更等 | 系统事件 |
| **告警消息** | 库存不足等 | 业务规则触发 |

### CLI 轮询配置

```yaml
# ~/.ai-office-cli/config.yaml
polling:
  # 初始轮询间隔（秒）
  initial_interval: 30

  # 最小轮询间隔（秒）
  min_interval: 5

  # 最大轮询间隔（秒）
  max_interval: 300

  # Long Polling 超时（秒）
  long_poll_timeout: 30

  # 启用 Redis Pub/Sub（需要 API Server 支持）
  use_pubsub: true
```

### CLI 后台服务与开机自启

**架构设计：CLI 作为系统后台服务运行**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLI 后台服务架构                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  用户登录系统                                                                 │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    CLI Service (后台守护进程)                          │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  消息轮询    │  │  通知管理    │  │  本地缓存    │              │    │
│  │  │  Poller     │  │  Notifier   │  │  Cache      │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐                                │    │
│  │  │  Token 管理  │  │  健康检查    │                                │    │
│  │  │  TokenMgr   │  │  HealthCheck│                                │    │
│  │  └──────────────┘  └──────────────┘                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                    │                                                        │
│                    ▼                                                        │
│         ┌─────────────────────┐                                             │
│         │  Agent 通知通道     │ ◄── 消息到达时通知 Agent                      │
│         │  (stdin/文件/pipe)  │                                             │
│         └─────────────────────┘                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**系统服务安装流程：**

```bash
# 安装 CLI 并注册系统服务（自动开机自启）
$ ao-cli service install

╔═══════════════════════════════════════════════════════════════╗
║                    AI-Office CLI 服务安装                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  > 正在安装服务...                                              ║
║  > 注册开机自启...                                              ║
║  > Windows: 注册为 Windows Service                             ║
║  > macOS: 注册为 launchd 守护进程                              ║
║  > Linux: 注册为 systemd user service                         ║
║  > 服务启动中...                                                ║
║                                                                ║
║  服务状态: 运行中                                               ║
║  轮询间隔: 30秒                                                 ║
║  开机自启: 已启用                                               ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝

# 卸载服务
$ ao-cli service uninstall
```

**各平台后台服务实现：**

| 操作系统 | 实现方式 | 服务名称 | 数据目录 |
|----------|----------|----------|----------|
| **Windows** | Windows Service | `AI-Office CLI` | `%APPDATA%\ai-office-cli` |
| **macOS** | launchd | `com.ai-office.cli` | `~/Library/Application Support/ai-office-cli` |
| **Linux** | systemd | `ai-office-cli.service` | `~/.config/ai-office-cli` |

**Windows Service 实现：**

```go
// golang.org/x/sys/windows/svc
func main() {
    service.Run("AI-Office CLI", &cliService{})
}

type cliService struct{}

func (s *cliService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (bool, uint32) {
    // 启动轮询 goroutine
    go startPolling()

    // 处理服务控制命令
    for {
        select {
        case c := <-r:
            switch c.Cmd {
            case svc.Stop, svc.Shutdown:
                changes <- svc.Status{State: svc.StopPending}
                return false, 0
            case svc.Interrogate:
                changes <- c.CurrentStatus
            }
        }
    }
}
```

**macOS launchd plist：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ai-office.cli</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ao-cli</string>
        <string>service</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/ai-office-cli.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/ai-office-cli.log</string>
</dict>
</plist>
```

**Linux systemd service：**

```ini
# ~/.config/systemd/user/ai-office-cli.service
[Unit]
Description=AI-Office CLI Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/ao-cli service run
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

**服务监控与自愈：**

```go
type ServiceManager struct {
    healthCheckInterval time.Duration
    maxRestartAttempts  int
    restartBackoff      time.Duration
}

func (s *ServiceManager) Run() {
    for {
        // 健康检查
        if !s.isHealthy() {
            s.restart()
        }

        // Token 续期检查
        if s.needsTokenRefresh() {
            s.refreshToken()
        }

        time.Sleep(s.healthCheckInterval)
    }
}

// 异常退出后自动重启（最多 3 次）
func (s *ServiceManager) restart() {
    if s.restartCount >= s.maxRestartAttempts {
        s.notifyUser("CLI 服务异常退出，请手动启动")
        return
    }
    s.restartCount++
    time.Sleep(s.restartBackoff * time.Duration(s.restartCount))
    exec.Command("ao-cli", "service", "start").Run()
}
```

**服务状态查看：**

```bash
$ ao-cli service status

╔═══════════════════════════════════════════════════════════════╗
║                    AI-Office CLI 服务状态                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  服务状态:     运行中                                           ║
║  进程 ID:      12345                                           ║
║  运行时长:     2 小时 34 分钟                                    ║
║  轮询状态:     正常 (最后消息: 10秒前)                           ║
║  未读消息:     3 条                                             ║
║  网络状态:     已连接                                           ║
║  Token 状态:   有效 (剩余 25 分钟)                              ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

**关键设计决策：**

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **自启方式** | 开机自动启动 | 确保消息实时到达 |
| **运行模式** | 后台守护进程 | 不影响用户前台操作 |
| **平台支持** | Windows/macOS/Linux | 覆盖主流操作系统 |
| **自愈机制** | 异常自动重启 | 提高服务可靠性 |
| **资源占用** | < 50MB 内存 | 轻量级服务 |

---

## Deployment Architecture

### 部署架构

**MVP 阶段：单机器 Docker 部署**

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Host                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Docker Compose                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │   nginx   │  │   api     │  │ postgres  │       │    │
│  │  │  (443)    │  │ (Go/Node) │  │   (5432)   │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘       │    │
│  │  ┌───────────┐  ┌───────────┐                      │    │
│  │  │   redis   │  │  files/    │                      │    │
│  │  │  (6379)   │  │  uploads   │                      │    │
│  │  └───────────┘  └───────────┘                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Docker 配置

**docker-compose.yml (MVP):**

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

  api:
    build: ./api
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_office
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 未来扩展方向

| 阶段 | 部署方式 | 说明 |
|------|----------|------|
| **MVP** | Docker Compose + 原生二进制 | 单机器验证，跨平台（Linux/Windows/macOS） |
| **v1.0** | Kubernetes | 多节点、弹性伸缩 |
| **v2.0** | 混合云 | 阿里云/华为云 + 局域网 |

---

## Summary

### 架构决策总结

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **项目类型** | Cloud SaaS + Local CLI | 无前端、Agent 驱动 |
| **技术栈** | Go + PostgreSQL + Redis | 高性能、稳定生态 |
| **多租户** | Schema 级隔离 | 成熟、运维简单 |
| **认证** | OAuth 2.0 + JWT | 标准协议、支持 Refresh |
| **消息通知** | CLI 轮询 | 解决 Agent 定时任务限制 |
| **部署** | Docker + 原生二进制 | 一键部署、跨平台（Linux/Win/Mac）、易迁移 |

---

## Core Architectural Decisions (ADR)

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- PostgreSQL Schema per Tenant - 多租户隔离
- OAuth 2.0 + JWT - 认证授权
- REST + OpenAPI 3.0 - API 规范
- Go + Gin + GORM - 技术栈

**Important Decisions (Shape Architecture):**
- Redis Pub/Sub - 消息通知
- Cobra CLI - 命令行工具
- YAML 配置 - 配置管理
- Zap 日志 - 结构化日志

**Deferred Decisions (Post-MVP):**
- Kubernetes 部署 - MVP 使用 Docker Compose
- OSS/S3 存储 - MVP 使用本地文件系统
- 向量数据库 - 知识库 MVP 使用 PG Vector

### ADR-001: 并发处理

**问题：** 如何处理并发请求，确保 100 并发/企业 的要求？

**决策：**

| 方案 | 权衡 | 决策 | 理由 |
|------|------|------|------|
| **Goroutine + Channel** | 内存占用低，但需小心死锁 | ✅ 采用 | Go 原生并发模型 |
| **Worker Pool** | 控制并发数，防止资源耗尽 | ✅ 采用 | 限制最大并发数 |
| **数据库连接池** | 连接数 vs 性能，需调优 | ✅ 采用 | GORM 内置连接池 |
| **Redis 分布式锁** | 性能 vs 一致性 | ⚠️ 按需 | 库存等强一致性场景 |

**实现：**

```go
// Worker Pool 限制并发
func NewWorkerPool(workers int) *WorkerPool {
    return &WorkerPool{
        jobs:   make(chan Job, workers*2),
        result: make(chan Result, workers*2),
    }
}

// 数据库连接池配置
db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{
    Pool: &sql.Pool{
        MaxOpenConns:    100,      // 最大打开连接数
        MaxIdleConns:    20,       // 最大空闲连接
        ConnMaxLifetime: time.Hour,
    },
})
```

### ADR-002: 云服务器配置

**问题：** 如何配置服务器满足多数用户（中小企业）需求？

**决策：**

| 规模 | CPU | 内存 | 带宽 | PostgreSQL | Redis | 适用场景 |
|------|-----|------|------|------------|-------|----------|
| **MVP 验证** | 2核 | 4GB | 5Mbps | 50GB SSD | 2GB | 10 企业 |
| **中小企业** | 4核 | 8GB | 10Mbps | 200GB SSD | 4GB | 50 企业 |
| **中大型企业** | 8核 | 16GB | 20Mbps | 500GB SSD | 8GB | 200 企业 |

**推荐起步配置（MVP）：**

```yaml
instance:
  type: "ecs.g6.large"  # 2核4GB
  bandwidth: "5Mbps"
  storage:
    system: "40GB SSD"
    data: "100GB SSD"
```

### ADR-003: 存储空间

**问题：** 如何规划存储空间，满足文件存储需求？

**决策：**

| 方案 | 权衡 | 决策 | 理由 |
|------|------|------|------|
| **本地存储** | 简单但难以扩展 | ⚠️ MVP 采用 | 初期简单 |
| **OSS/S3** | 成本低、可扩展 | ✅ v2.0 采用 | 长期最优 |
| **冷热分离** | 复杂但成本低 | ✅ 采用 | 历史数据访问少 |

**存储容量规划（MVP）：**

```yaml
storage:
  base_path: "/data/ai-office"
  allocation:
    attachments: "50GB"    # 合同、档案
    kb_documents: "20GB"   # 知识库
    backups: "30GB"         # 备份
    logs: "10GB"           # 日志
  total: "110GB"
```

### ADR-004: 性能保证

**问题：** 如何确保 API 响应时间 < 200ms（P95 < 500ms）？

**决策：**

| 优化层次 | 具体措施 | 预期收益 |
|----------|---------|---------|
| **数据库** | 索引、查询优化、分页 | 50-100ms ↓ |
| **缓存** | Redis 热点数据缓存 | 80-90% ↓ |
| **API** | 异步处理、批量接口 | 30-50% ↓ |
| **监控** | Prometheus + 告警 | 可观测性 |

**性能指标承诺：**

| 指标 | 目标 | 监控方式 |
|------|------|----------|
| API 平均响应 | < 200ms | Prometheus histogram |
| API P95 响应 | < 500ms | Prometheus histogram |
| QPS | ≥ 1000/企业 | Redis counter |
| 并发 | ≥ 100/企业 | Goroutine count |
| 可用性 | ≥ 99.5% | Health check |

---

### ADR-005: 安全加固（Red Team vs Blue Team 分析）

#### Red Team 发现的关键漏洞

**🚨 漏洞 #1: 跨企业越权访问**

```
攻击路径:
1. 攻击者获得企业 A 的 Token
2. 修改请求中的 enterprise_id 为企业 B
3. 如果 API 仅验证 Token 有效而未验证 enterprise_id 所属
4. 攻击者可以访问企业 B 的数据
```

**修复方案：**
```go
// 每个 API 必须验证 enterprise_id 属于当前用户
func (h *Handler) GetCustomer(c *gin.Context) {
    user := getUserFromContext(c)
    requestedEnterpriseID := c.Param("enterprise_id")

    // 必须验证
    if !user.CanAccessEnterprise(requestedEnterpriseID) {
        c.JSON(403, ErrorResponse{PermissionDenied})
        return
    }
}
```

**🚨 漏洞 #2: Refresh Token 无限滥用**

**修复方案：**
```go
// Refresh Token 使用时验证
func (s *AuthService) RefreshToken(refreshToken string) (*TokenPair, error) {
    claims, err := s.validateRefreshToken(refreshToken)
    if err != nil {
        return nil, err
    }

    // 检查 Token 是否已被撤销
    if s.isTokenRevoked(claims.JTI) {
        return nil, ErrTokenRevoked
    }

    // 检查用户密码是否修改
    user := s.getUser(claims.Subject)
    if user.PasswordChangedAfter(claims.Iat) {
        return nil, ErrTokenExpired
    }

    return s.generateTokenPair(user)
}
```

**🚨 漏洞 #3: 文件上传路径遍历**

**修复方案：**
```go
// 文件路径必须安全化
func SaveFile(enterpriseID, module, filename string, content []byte) error {
    // 使用 UUID 生成安全文件名
    safeFilename := uuid.New().String() + ext(filename)

    // 路径白名单验证
    allowedModules := map[string]bool{
        "contract": true,
        "employee": true,
        "customer": true,
    }

    // 构建安全路径（禁止 .. 遍历）
    basePath := fmt.Sprintf("/data/%s/%s", enterpriseID, module)
    filePath := filepath.Join(basePath, safeFilename)

    // 验证最终路径在预期目录内
    if !strings.HasPrefix(filePath, basePath) {
        return ErrPathTraversal
    }

    return os.WriteFile(filePath, content, 0644)
}
```

#### Blue Team 纵深防御体系

```
┌─────────────────────────────────────────────────────────────┐
│                      纵深防御体系                             │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: 网络层 - WAF, DDoS 防护, IP 白名单               │
│  Layer 2: API 网关 - OAuth, Rate Limiting, 请求大小限制     │
│  Layer 3: 应用层 - RBAC, 所有权验证, 输入验证                │
│  Layer 4: 数据层 - Schema 隔离, RLS, 审计日志, 加密         │
│  Layer 5: 基础设施 - TLS 1.3, KMS, 备份加密                 │
└─────────────────────────────────────────────────────────────┘
```

#### 安全检查清单

| 检查项 | 实现 | 状态 |
|--------|------|------|
| HTTPS 强制 | TLS 1.3 | ✅ |
| JWT 签名验证 | HS256/RS256 | ✅ |
| Token 短期过期 | 30 分钟 | ✅ |
| Refresh Token 轮换 | 单次使用 + Redis 黑名单 | ✅ |
| Rate Limiting | 100/1000 QPS | ✅ |
| Schema 隔离 | PostgreSQL RLS | ✅ |
| 输入验证 | 白名单 + 消毒 | ✅ |
| SQL 注入防护 | ORM 参数化 | ✅ |
| 文件上传安全 | UUID 文件名 + 路径验证 | ✅ |
| 审计日志 | 所有操作异步记录 | ✅ |
| 密码加密 | bcrypt | ✅ |

---

### ADR-006: CLI 安装与认证架构

#### CLI 多方式安装

**基于 Context7 GoReleaser 最佳实践，支持多种包管理器安装：**

| 用户类型 | 安装命令 | 理由 |
|----------|----------|------|
| **Go 开发者** | `go install github.com/ai-office/cli@latest` | 原生，编译快 |
| **Node.js 开发者** | `npm install -g @ai-office/cli` | 生态熟悉 |
| **Python 开发者** | `pip install ao-cli` | 生态熟悉 |
| **Rust 开发者** | `cargo install ao-cli` | Rust 原生 |
| **macOS/Linux** | `brew install ai-office/tap/ao-cli` | 主流包管理器 |
| **非技术用户** | `curl -fsSL https://ai-office.com/cli/install.sh \| sh` | 最简单 |

**GoReleaser 多平台发布配置：**

```yaml
# .goreleaser.yaml
project_name: ao-cli

builds:
  - id: ao-cli
    dir: ./cmd/ao-cli
    env:
      - CGO_ENABLED=0
    goos:
      - darwin
      - linux
      - windows
    goarch:
      - amd64
      - arm64

archives:
  - format: tar.gz
    format_overrides:
      - goos: windows
        format: zip

brews:
  - name: ao-cli
    repository:
      owner: ai-office
      name: homebrew-tap
    post_install: |
      install "#{staging_path}/{{ .ProjectName }}

nfpms:
  - package_name: ao-cli
    # npm/pip 发布配置
```

**跨平台支持矩阵：**

| 平台 | 支持版本 | 安装包格式 | 特殊考虑 |
|------|----------|------------|----------|
| **Windows** | Windows 10+ | `.exe` / `.msi` / `.zip` | 终端颜色、路径分隔符 |
| **macOS** | macOS 11+ | `.tar.gz` / `.pkg` / Homebrew | Apple Silicon (arm64) |
| **Linux** | Ubuntu 18.04+, CentOS 7+ | `.tar.gz` / `.deb` / `.rpm` | glibc 版本 |

**Windows 特殊适配：**

```go
// 跨平台路径处理
import (
    "path/filepath"
    "runtime"
)

// 获取配置目录
func GetConfigDir() string {
    switch runtime.GOOS {
    case "windows":
        return filepath.Join(os.Getenv("APPDATA"), "ai-office-cli")
    case "darwin":
        return filepath.Join(os.Getenv("HOME"), ".config", "ai-office-cli")
    case "linux":
        return filepath.Join(os.Getenv("HOME"), ".config", "ai-office-cli")
    default:
        return filepath.Join(os.Getenv("HOME"), ".ai-office-cli")
    }
}

// Windows 终端颜色支持
import (
    "github.com/mattn/go-colorable"
    "github.com/mattn/go-isatty"
)

// 彩色输出（Windows 10+ 支持 ANSI颜色）
var output = io.Writer
if runtime.GOOS == "windows" && !isatty.IsTerminal(os.Stdout.Fd()) {
    output = colorable.NewColorableStdout()
} else {
    output = os.Stdout
}

// Windows 服务支持（可选）
// 使用 golang.org/x/sys/windows/svc 运行 Windows Service
```

**自引导配置流程：**

```bash
# 首次运行自动引导
$ ao-cli init

╔═══════════════════════════════════════════════════════════════╗
║                    AI-Office CLI 初始化                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  > 输入企业 API 地址: https://api.company.com                 ║
║  > 正在验证连接...                                            ║
║  > 正在获取 Skills 列表...                                    ║
║  > Skills 安装完成                                            ║
║                                                                ║
║  运行 'ao-cli skills list' 查看可用 Skills                  ║
╚═══════════════════════════════════════════════════════════════╝
```

#### 无 UI 认证 - OAuth 2.1 Device Authorization Grant

**基于 Context7 OAuth 2.1 最新规范（RFC8628）：**

> **OAuth 2.1 关键更新：**
> - 所有 Authorization Code Grant **必须使用 PKCE**
> - Device Authorization Grant (RFC8628) **专为无浏览器设备设计**

**Device Authorization Grant 流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                OAuth 2.1 Device Authorization Grant         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CLI 请求设备码                                           │
│     POST /auth/device/code                                   │
│                                                              │
│  2. API 返回设备码和用户码                                   │
│     {                                                        │
│       "device_code": "GmRhmhcxhwEz...",                    │
│       "user_code": "WDGM-MRTB",                           │
│       "verification_uri": "https://auth.ai-office.com/device",
│       "interval": 5,                                      │
│       "expires_in": 1800                                   │
│     }                                                        │
│                                                              │
│  3. CLI 显示登录指引                                         │
│     ┌─────────────────────────────────────────────┐         │
│     │  请在浏览器中打开:                          │         │
│     │  https://auth.ai-office.com/device?code=WDGM-MRTB    │
│     │                                              │         │
│     │  输入验证码: WDGM-MRTB                      │         │
│     │  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 等待认证...     │         │
│     └─────────────────────────────────────────────┘         │
│                                                              │
│  4. CLI 轮询获取 Token                                       │
│     POST /auth/device/token                                  │
│     grant_type=urn:ietf:params:oauth:grant-type:device_code│
│                                                              │
│  5. 认证成功，返回 Token                                     │
│     {                                                        │
│       "access_token": "eyJhbGciOiJSUzI1NiIs...",          │
│       "token_type": "Bearer",                             │
│       "expires_in": 1800,                                 │
│       "refresh_token": "dCJRi9xZ..."                       │
│     }                                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**认证服务器实现（使用 go-oauth2）：**

```go
// Token 配置
manager.SetAuthorizeCodeTokenCfg(&manage.Config{
    AccessTokenExp:  time.Minute * 30,      // 30 分钟
    RefreshTokenExp: time.Hour * 24 * 7,    // 7 天
})

// Device Code Endpoint - RFC8628
http.HandleFunc("/device/code", func(w http.ResponseWriter, r *http.Request) {
    // 返回 device_code 和 user_code
})

// Device Authorization Endpoint - 用户浏览器访问
http.HandleFunc("/device", func(w http.ResponseWriter, r *http.Request) {
    // 显示用户码输入页面，验证后发放 token
})
```

**Token 刷新机制：**

```go
// CLI 自动刷新 Token
func (c *CLI) ensureValidToken() error {
    if c.token.ExpiresIn < time.Minute*5 {
        newToken, err := c.authClient.Refresh(ctx, c.token.RefreshToken)
        if err != nil {
            return err // Token 过期，需要重新登录
        }
        c.saveToken(newToken)
    }
    return nil
}
```

#### ADR-006 总结

| 组件 | 方案 | 标准/依据 |
|------|------|----------|
| **CLI 安装** | 多包管理器支持 | GoReleaser 最佳实践 |
| **CLI 跨平台** | Windows/macOS/Linux | Go 原生跨平台 |
| **CLI 后台服务** | 开机自启 + 守护进程 | 消息实时到达 |
| **CLI 认证** | Device Authorization Grant | OAuth 2.1 (RFC8628) |
| **Token 安全** | PKCE | OAuth 2.1 强制 |
| **Token 有效期** | Access 30min / Refresh 7d | 标准实践 |

---

### ADR-007: 安全审计与合规 (Security Audit Personas 分析)

#### 安全审计团队

| 角色 | 视角 | 关注点 |
|------|------|----------|
| **攻击者** | 恶意黑客视角 | 寻找漏洞、利用弱点 |
| **防御者** | 安全架构师视角 | 设计防御、检测威胁 |
| **审计员** | 合规审查视角 | 满足法规、审计追踪 |
| **开发者** | 实施者视角 | 实际可行、性能影响 |

#### 发现的安全问题

| ID | 问题 | 严重性 | 修复建议 |
|----|------|--------|----------|
| **SEC-01** | 无 Token 重放保护 | 高 | 添加 nonce + 时间戳 |
| **SEC-02** | CLI Token 明文存储 | 高 | 加密存储 + 系统密钥 |
| **SEC-03** | 无异地登录检测 | 中 | 地理位置分析 |
| **SEC-04** | 合同金额修改无需审批 | 极高 | 金额变更需重新审批 |
| **SEC-05** | 审计日志不完整 | 中 | 补充变更前后值 |
| **SEC-06** | 无 API 限流增强 | 中 | 智能限流 |

#### 防御者纵深防御架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        纵深防御体系 (Defense in Depth)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: 网络层 - WAF, DDoS 防护, VPC 隔离                      │
│  Layer 2: 身份与访问层 - OAuth 2.1 + PKCE, mTLS, MFA             │
│  Layer 3: 应用层 - RBAC + ABAC, Enterprise Ownership, Rate Limiting│
│  Layer 4: 数据层 - Schema 隔离, RLS, AES-256, TLS 1.3           │
│  Layer 5: 监控与响应层 - SIEM, 异常检测, 自动响应                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### 企业所有权验证中间件

```go
// 每个 API 的必须检查
func EnterpriseOwnershipMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := getClaimsFromContext(c)
        reqEnterpriseID := c.Param("enterprise_id")

        // 必须验证企业所有权
        if !claims.CanAccessEnterprise(reqEnterpriseID) {
            c.JSON(403, gin.H{
                "error": "PERMISSION_DENIED",
            })
            c.Abort()
            return
        }

        // 异步审计日志
        go asyncWriteAuditLog(&AuditLog{
            UserID:       claims.UserID,
            EnterpriseID:  reqEnterpriseID,
            Action:       c.Request.Method + " " + c.Request.URL.Path,
            IP:           c.ClientIP(),
            Timestamp:    time.Now(),
        })

        c.Next()
    }
}
```

#### 敏感操作双重验证

```go
// 敏感操作需要额外验证
type SensitiveOperationPolicy struct {
    operations map[string]*PolicyConfig
}

var SensitiveOps = &SensitiveOperationPolicy{
    "contract.create": {
        requireAmount:    100000, // 10万以上需要审批
        requireMFA:       true,
    },
    "employee.delete": {
        requireManagerApproval: true,
        auditRetention:         7 * 365 * 24, // 7年
    },
    "payment.approve": {
        requireAmount: 50000, // 5万以上需要双重验证
        requireMFA:    true,
    },
}
```

#### 审计日志规范

```go
type AuditLog struct {
    // 谁 (Who)
    UserID       string    `json:"user_id"`
    UserEmail    string    `json:"user_email"`
    UserRoles    []string  `json:"user_roles"`

    // 什么 (What)
    Action       string    `json:"action"`
    ResourceType string    `json:"resource_type"`
    ResourceID   string    `json:"resource_id"`
    Changes      []Change  `json:"changes"`  // 变更前/后值

    // 何时 (When)
    Timestamp    time.Time `json:"timestamp"`

    // 何地 (Where)
    IP          string    `json:"ip"`
    Location    string    `json:"location"`

    // 结果 (Result)
    Status      string    `json:"status"`
}
```

#### 数据保留策略

| 数据类型 | 保留期 | 法律依据 | 删除方式 |
|----------|--------|----------|----------|
| **审计日志** | 7 年 | 等保/税法 | 加密归档 |
| **合同数据** | 10 年 | 合同法 | 加密归档 |
| **财务数据** | 10 年 | 税法 | 加密归档 |
| **个人信息** | 合同结束后 2 年 | 劳动法 | 匿名化 |
| **临时缓存** | 24 小时 | - | 自动删除 |

#### 安全实现优先级

| 优先级 | 安全措施 | 工作量 | 理由 |
|--------|----------|--------|------|
| **P0** | 企业所有权验证中间件 | 中 | 防止跨租户访问 |
| **P0** | 审计日志 (异步) | 低 | 合规要求 |
| **P0** | Token 加密存储 | 中 | 保护凭证 |
| **P1** | 异常登录检测 | 高 | 防止账号被盗 |
| **P1** | 敏感操作 MFA | 中 | 防止恶意操作 |
| **P2** | SIEM 集成 | 高 | 监控告警 |

---

### ADR-008: 数据库架构设计

#### 一、多租户策略

**Schema per Tenant + RLS 双层防护：**

```
PostgreSQL Instance
│
├── public schema (系统管理)
│   ├── _operator          # 运营商表
│   ├── _group             # 集团表
│   ├── _enterprise        # 企业表
│   ├── _department        # 部门表
│   ├── _employee          # 员工表
│   └── _cross_enterprise_access  # 跨企业权限表
│
├── ent_001 schema (企业 A)
│   ├── crm_customer, crm_contact
│   ├── con_contract, con_attachment
│   ├── sale_order
│   ├── ims_warehouse, ims_material, ims_inventory
│   ├── ims_stock_transfer, ims_stock_transfer_item
│   ├── ims_inventory_transaction
│   ├── ims_inventory_check, ims_inventory_check_item
│   ├── ims_requisition, ims_requisition_item
│   ├── fin_receivable, fin_payment
│   ├── wf_definition, wf_instance, wf_approval
│   ├── kb_document
│   └── msg_notification
│
└── ent_002 schema (企业 B)
    └── ... (同上结构)
```

#### 二、Schema 设计

**公共 Schema (public) - 系统管理表：**

```sql
-- 运营商表
CREATE TABLE _operator (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL, -- bcrypt hash
    status      VARCHAR(20) DEFAULT 'active',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 集团表
CREATE TABLE _group (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES _operator(id),
    name        VARCHAR(200) NOT NULL
);

-- 企业表
CREATE TABLE _enterprise (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES _group(id),
    name        VARCHAR(200) NOT NULL,
    schema_name VARCHAR(50) UNIQUE NOT NULL -- ent_001, ent_002 ...
);

-- 员工表 (全局统一认证)
CREATE TABLE _employee (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL REFERENCES _enterprise(id),
    department_id  UUID REFERENCES _department(id),
    email          VARCHAR(255) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    roles          VARCHAR(50)[] DEFAULT '{}', -- ['admin', 'manager', 'employee']
    status         VARCHAR(20) DEFAULT 'active'
);

-- 跨企业权限表
CREATE TABLE _cross_enterprise_access (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id           UUID NOT NULL REFERENCES _employee(id),
    granted_enterprise_id UUID NOT NULL REFERENCES _enterprise(id),
    access_scope         VARCHAR(50) DEFAULT 'read',
    granted_by           UUID NOT NULL REFERENCES _employee(id),
    expires_at           TIMESTAMP
);
```

**业务 Schema (ent_XXX) - 客户模块示例：**

```sql
CREATE TABLE crm_customer (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone          VARCHAR(50),
    email          VARCHAR(255),
    customer_type  VARCHAR(20), -- individual, enterprise, government
    credit_level   VARCHAR(20), -- A, B, C, D
    enterprise_id  UUID NOT NULL, -- 冗余存储，用于 RLS
    created_by     UUID NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**业务 Schema (ent_XXX) - 进销存模块：**

```sql
-- 仓库
CREATE TABLE ims_warehouse (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(200) NOT NULL,
    code           VARCHAR(50) NOT NULL,       -- 仓库编码，如 WH-EC
    address        VARCHAR(500),
    manager_id     UUID REFERENCES _employee(id),
    status         VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enterprise_id, code)
);

-- 物料/SKU（成品、原材料、零部件、办公用品、耗材）
CREATE TABLE ims_material (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(200) NOT NULL,
    type           VARCHAR(30) NOT NULL,        -- finished_product / raw_material / component / office_supply / consumable
    spec_params    JSONB,                       -- 规格参数：{"尺寸":"300x200","重量":"5kg","颜色":"红","材质":"不锈钢"}
    unit           VARCHAR(20) NOT NULL,
    unit_price     DECIMAL(12,2) NOT NULL,
    category       VARCHAR(100),               -- 物料分类
    status         VARCHAR(20) DEFAULT 'active',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存（仓库 × 物料）
CREATE TABLE ims_inventory (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id       UUID NOT NULL,
    warehouse_id        UUID NOT NULL REFERENCES ims_warehouse(id),
    material_id         UUID NOT NULL REFERENCES ims_material(id),
    quantity            INT NOT NULL DEFAULT 0,        -- 当前库存
    safety_stock        INT NOT NULL DEFAULT 0,        -- 安全库存
    in_transit_quantity INT NOT NULL DEFAULT 0,        -- 在途数量
    locked_quantity     INT NOT NULL DEFAULT 0,        -- 锁定数量（已分配未出库）
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, material_id)
);

-- 调拨单
CREATE TABLE ims_stock_transfer (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id     UUID NOT NULL,
    transfer_no       VARCHAR(50) NOT NULL UNIQUE,    -- 调拨单号
    from_warehouse_id UUID NOT NULL REFERENCES ims_warehouse(id),
    to_warehouse_id   UUID NOT NULL REFERENCES ims_warehouse(id),
    status            VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/approved/in_transit/completed/cancelled
    operator_id       UUID NOT NULL REFERENCES _employee(id),
    approved_by       UUID REFERENCES _employee(id),
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 调拨单明细
CREATE TABLE ims_stock_transfer_item (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id       UUID NOT NULL REFERENCES ims_stock_transfer(id) ON DELETE CASCADE,
    material_id       UUID NOT NULL REFERENCES ims_material(id),
    quantity           INT NOT NULL,                    -- 调拨数量
    received_quantity  INT DEFAULT 0,                   -- 实收数量
    notes             TEXT
);

-- 统一出入库流水
CREATE TABLE ims_inventory_transaction (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id   UUID NOT NULL,
    transaction_no  VARCHAR(50) NOT NULL UNIQUE,        -- 流水号
    warehouse_id    UUID NOT NULL REFERENCES ims_warehouse(id),
    material_id     UUID NOT NULL REFERENCES ims_material(id),
    type            VARCHAR(30) NOT NULL,               -- purchase_in/sale_out/transfer_in/transfer_out/requisition_out/return_in/scrap_out/adjustment
    quantity        INT NOT NULL,                        -- 数量（正数）
    batch_no        VARCHAR(50),                         -- 批次号
    production_date DATE,                                -- 生产日期
    expiry_date     DATE,                                -- 有效期至
    serial_no       VARCHAR(100),                        -- 序列号（一物一码可追溯）
    spec_params     JSONB,                               -- 入库时实际规格参数
    unit_cost       DECIMAL(12,2),                       -- 单位成本
    source_type     VARCHAR(50),                         -- 关联单据类型
    source_id       UUID,                                -- 关联单据 ID
    operator_id     UUID NOT NULL REFERENCES _employee(id),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 盘库任务
CREATE TABLE ims_inventory_check (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id   UUID NOT NULL,
    check_no        VARCHAR(50) NOT NULL UNIQUE,         -- 盘点单号
    warehouse_id    UUID NOT NULL REFERENCES ims_warehouse(id),
    scope           VARCHAR(20) NOT NULL DEFAULT 'full', -- full(全盘) / spot(抽盘)
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/in_progress/submitted/approved/completed/cancelled
    checker_id      UUID NOT NULL REFERENCES _employee(id), -- 盘点人
    approved_by     UUID REFERENCES _employee(id),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 盘点明细
CREATE TABLE ims_inventory_check_item (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id         UUID NOT NULL REFERENCES ims_inventory_check(id) ON DELETE CASCADE,
    material_id      UUID NOT NULL REFERENCES ims_material(id),
    batch_no         VARCHAR(50),                        -- 按批次盘点
    system_quantity  INT NOT NULL,                       -- 系统数量
    actual_quantity  INT NOT NULL,                       -- 实盘数量
    diff_quantity    INT GENERATED ALWAYS AS (actual_quantity - system_quantity) STORED, -- 差异数量
    diff_amount      DECIMAL(12,2),                      -- 差异金额 = diff_quantity × unit_cost
    notes            TEXT                                -- 盘点备注
);

-- 领用申请
CREATE TABLE ims_requisition (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id   UUID NOT NULL,
    requisition_no  VARCHAR(50) NOT NULL UNIQUE,         -- 领用单号
    applicant_id    UUID NOT NULL REFERENCES _employee(id),
    department_id   UUID REFERENCES _department(id),
    warehouse_id    UUID NOT NULL REFERENCES ims_warehouse(id),
    purpose         VARCHAR(500),                        -- 领用用途
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft/pending_approval/approved/issued/cancelled
    approved_by     UUID REFERENCES _employee(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 领用申请明细
CREATE TABLE ims_requisition_item (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id      UUID NOT NULL REFERENCES ims_requisition(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES ims_material(id),
    requested_quantity  INT NOT NULL,                    -- 申请数量
    issued_quantity     INT DEFAULT 0,                   -- 实发数量
    notes               TEXT
);
```

#### 三、Row-Level Security (RLS)

**PostgreSQL Context7 最佳实践 - 双层防护：**

```sql
-- 启用 RLS
ALTER TABLE crm_customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE con_contract ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_stock_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_inventory_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE ims_requisition ENABLE ROW LEVEL SECURITY;

-- 企业上下文函数
CREATE OR REPLACE FUNCTION set_enterprise_context(ent_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.enterprise_id', ent_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 策略
CREATE POLICY tenant_isolation_crm_customer ON crm_customer
    USING (enterprise_id = current_setting('app.enterprise_id')::uuid);

-- 强制 RLS 即使是表所有者
ALTER TABLE crm_customer FORCE ROW LEVEL SECURITY;
```

**应用层集成：**

```go
func EnterpriseContextMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := getClaimsFromContext(c)
        db := c.Get("db").(*gorm.DB)
        db.Exec("SELECT set_config('app.enterprise_id', ?, false)",
            claims.EnterpriseID)
        c.Next()
    }
}
```

#### 四、索引策略

| 索引类型 | 用途 | 示例 |
|----------|------|------|
| **B-tree** | 主键、范围查询 | `CREATE INDEX idx_contract_status ON con_contract(status)` |
| **Gin** | JSONB、数组 | `CREATE INDEX idx_wf_config ON wf_definition USING gin(flow_config)` |
| **Ivfflat** | 向量检索 | `CREATE INDEX idx_kb_vector ON kb_document USING ivfflat(content_vector)` |

#### 五、分区策略

**按时间分区（财务数据、审计日志）：**

```sql
CREATE TABLE fin_receivable_history (...) PARTITION BY RANGE (created_at);

CREATE TABLE fin_receivable_2024 PARTITION OF fin_receivable_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **多租户隔离** | Schema + RLS | 双层防护，PostgreSQL 原生 |
| **主键类型** | UUID v4 | 分布式唯一，Qdrant 兼容 |
| **企业 ID** | 冗余存储 | 便于 RLS + 高效查询 |
| **向量存储** | PG Vector | 减少架构复杂度 |
| **JSON 存储** | JSONB | 灵活配置，工作流定义 |

---

### ADR-009: 文件统一处理架构

#### 一、URL 规则设计

**核心设计：URL 语义化、Agent 可直接使用、浏览器原生支持**

| URL 类型 | 用途 | 认证 | 示例 |
|----------|------|------|------|
| **Preview URL** | HTML 嵌入显示 | 签名/公开 | Agent 用于 `<img src="">` |
| **View URL** | PDF 预览跳转 | 需要 | 浏览器 PDF viewer 打开 |
| **Download URL** | 文件下载 | 签名 | 触发浏览器下载 |
| **Thumb URL** | 缩略图 | 公开/CDN | 列表页快速预览 |

**URL 格式规范：**

```
# 1. 公开文件预览 (图片、视频、音频)
https://cdn.ai-office.com/preview/{enterprise_id}/{file_key}/{safe_filename}
示例: https://cdn.ai-office.com/preview/ent_001/f_abc123/logo.png

# 2. PDF 预览跳转
https://api.ai-office.com/v1/files/{file_key}/view
示例: https://api.ai-office.com/v1/files/f_def456/view
行为: 302 重定向到 OSS 预签名 URL，浏览器用 PDF viewer 打开

# 3. 私有文件预览
https://api.ai-office.com/v1/files/{file_key}/preview?token=xxx

# 4. 文件下载
https://api.ai-office.com/v1/files/{file_key}/download

# 5. 缩略图
https://cdn.ai-office.com/thumb/{enterprise_id}/{file_key}.jpg
```

#### 二、存储路径设计

```
/data/ai-office/
├── storage/
│   └── {enterprise_id}/
│       ├── contract/{file_id}/original/contract.pdf
│       ├── employee/{file_id}/original/avatar.png
│       ├── customer/{file_id}/original/cert.docx
│       └── kb_document/{file_id}/original/doc.pdf
│
├── cdn/public/
│   └── {enterprise_id}/preview/{file_key}.jpg  # 公开图片缓存
│
└── temp/uploads/{upload_id}/part_*.tmp  # 分片临时文件
```

| 策略 | 说明 | 理由 |
|------|------|------|
| **企业隔离** | `{enterprise_id}/` | RLS 隔离 |
| **模块隔离** | `{module}/` | 便于清理 |
| **文件 ID 隔离** | `{file_id}/` | 版本管理 |

#### 三、预览 URL 决策树

```
文件类型?
├─── 图片 (jpg/png/gif/webp) ──► Preview URL (CDN) ──► HTML <img src="">
├─── PDF ──────────────────────► View URL (302) ──► 浏览器 PDF viewer
├─── 视频/音频 ──────────────► Preview URL ──► HTML5 <video>/<audio>
└─── 其他 (docx/xlsx) ─────────► Download URL ──► Office Online / 下载
```

#### 四、文件元数据结构

```sql
CREATE TABLE _file_metadata (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_key      VARCHAR(50) NOT NULL, -- f_{short_uuid} 用于 URL
    enterprise_id  UUID NOT NULL,
    module         VARCHAR(50) NOT NULL, -- contract, employee, etc.

    original_name  VARCHAR(255) NOT NULL,
    storage_path   VARCHAR(500) NOT NULL,
    content_type   VARCHAR(100) NOT NULL, -- MIME type
    file_size      BIGINT NOT NULL,
    safe_filename  VARCHAR(255) NOT NULL, -- URL 安全文件名

    is_public      BOOLEAN DEFAULT false,
    access_token   VARCHAR(255),

    status         VARCHAR(20) DEFAULT 'active',
    uploaded_by    UUID NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_key ON _file_metadata(file_key);
CREATE INDEX idx_file_public ON _file_metadata(is_public, access_token);
```

#### 五、URL 生成服务

```go
type FileURLService struct {
    cdnDomain   string
    apiDomain   string
    ossClient   *oss.Client
}

func (s *FileURLService) GenerateURLs(file *FileMetadata) (*FileURL, error) {
    urls := &FileURL{}

    switch {
    case s.isImageType(file.ContentType):
        urls.PreviewURL = s.buildPreviewURL(file)  // CDN 公开
        urls.ThumbURL = s.buildThumbURL(file)
        urls.DownloadURL = s.buildDownloadURL(file)

    case file.ContentType == "application/pdf":
        urls.ViewURL = s.buildViewURL(file)  // 302 重定向
        urls.DownloadURL = s.buildDownloadURL(file)

    case s.isMediaType(file.ContentType):
        urls.PreviewURL = s.buildPreviewURL(file)
        urls.DownloadURL = s.buildDownloadURL(file)

    default:
        urls.DownloadURL = s.buildDownloadURL(file)
    }

    return urls, nil
}

// PDF View Endpoint - 302 重定向到 OSS
func (h *FileHandler) ViewFile(c *gin.Context) {
    fileKey := c.Param("file_key")
    file, _ := h.getFileByKey(c, fileKey)

    signedURL, _ := h.ossClient.GetPresignedURL(file.StoragePath, time.Hour)
    c.Redirect(302, signedURL)  // 浏览器自动用 PDF viewer 打开
}
```

#### 六、Agent HTML 集成示例

```html
<!-- Agent 生成的 HTML 报告 -->

<!-- 1. 图片直接嵌入 -->
<img src="https://cdn.ai-office.com/preview/ent_001/f_abc123/chart.png"
     alt="销售趋势图" />

<!-- 2. PDF 预览跳转 (浏览器 PDF viewer) -->
<a href="https://api.ai-office.com/v1/files/f_def456/view"
   target="_blank">
    查看合同 PDF
</a>

<!-- 3. 下载链接 -->
<a href="https://api.ai-office.com/v1/files/f_ghi789/download"
   download="报表.xlsx">
    下载 Excel
</a>
```

#### 七、上传架构

**分片上传 + 预签名 URL（生产环境）：**

```
Agent → API InitUpload → {upload_id, presigned_urls[]}
Agent → OSS Direct Upload (分片)
Agent → API CompleteUpload → {file_id, urls}
```

#### 八、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **图片 URL** | CDN 公开 URL | Agent 直接用于 HTML |
| **PDF URL** | View URL (302) | 浏览器原生 PDF viewer |
| **私有文件** | 签名 URL | 短期 token 保护 |
| **存储** | OSS/S3 | 弹性扩展 |
| **上传** | 分片 + 预签名 | 大文件支持 |

---

### ADR-010: 企业高度自定义化架构

#### 一、自定义需求

| 自定义类型 | FR-ID | 需求 |
|------------|-------|------|
| **自定义部门** | FR-ORG-003, FR-ORG-004 | 部门 CRUD，设置经理 |
| **自定义字段** | FR-CUST-001 | 添加字段到员工、客户等实体 |
| **自定义关联** | FR-CUST-005 | 实体关联关系配置 |
| **自定义文件** | FR-CUST-004 | 实体附件支持配置 |
| **Operator 代配置** | FR-CUST-006 | Agent 帮客户配置 |

#### 二、元模型设计

```
┌─────────────────────────────────────────────────────────────────┐
│                      元模型架构 (Meta-Model)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                      │
│  标准实体 (employee, customer, contract ...)                        │
│       │                                                            │
│       ▼                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                        │
│  │ 字段定义表       │  │ 关联定义表       │                        │
│  │_field_definition│  │_relation_defini │                        │
│  └─────────────────┘  └─────────────────┘                        │
│       │                                                            │
│       ▼                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                        │
│  │ 附件定义表       │  │ 关联关系表       │                        │
│  │_attachment_defin│  │_entity_relation │                        │
│  └─────────────────┘  └─────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### 三、数据表设计

**字段定义表：**

```sql
CREATE TABLE _field_definition (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    entity_type   VARCHAR(50) NOT NULL, -- employee, customer, contract
    field_name    VARCHAR(100) NOT NULL, -- 字段名
    field_label   VARCHAR(200) NOT NULL, -- 显示名称
    field_type    VARCHAR(50) NOT NULL, -- string, number, date, enum, file, relation
    field_order   INT DEFAULT 0,
    is_required   BOOLEAN DEFAULT false,
    is_visible    BOOLEAN DEFAULT true,
    config        JSONB DEFAULT '{}', -- enum: {options:[...]}, relation: {target_entity:...}
    validation    JSONB DEFAULT '{}'  -- unique, min_length, max_length
);

CREATE UNIQUE INDEX idx_field_def_unique ON _field_definition(enterprise_id, entity_type, field_name);
```

**关联定义表：**

```sql
CREATE TABLE _relation_definition (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    relation_name  VARCHAR(100) NOT NULL,
    source_entity  VARCHAR(50) NOT NULL,
    target_entity  VARCHAR(50) NOT NULL,
    relation_type  VARCHAR(50) NOT NULL, -- one_to_one, one_to_many, many_to_many
    is_cascade_delete BOOLEAN DEFAULT false
);
```

**实体表自定义字段：**

```sql
CREATE TABLE crm_customer (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    -- 标准字段 ...

    custom_fields  JSONB DEFAULT '{}', -- 自定义字段
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_custom_fields ON crm_customer USING GIN (custom_fields);
```

#### 四、服务层设计

```go
// CustomFieldService - 自定义字段服务
func (s *CustomFieldService) SetCustomFieldValue(ctx, entityType, entityID, fieldName, value) error {
    // 1. 验证字段定义
    definition := s.getFieldDefinition(ctx, enterpriseID, entityType, fieldName)
    // 2. 验证值
    s.validateFieldValue(definition, value)
    // 3. 更新 JSONB
    return s.db.Exec(`
        UPDATE %s SET custom_fields = jsonb_set(custom_fields, '{%s}', ?)
        WHERE id = ?
    `, tableName, fieldName, toJSON(value), entityID)
}

// RelationService - 关联服务
func (s *RelationService) GetRelatedEntities(ctx, entityType, entityID, relationName) {
    // 根据关联类型 (one_to_one/one_to_many/many_to_many) 查询
}

// AttachmentService - 附件服务
func (s *AttachmentService) UploadAttachment(ctx, req) error {
    // 1. 验证附件配置
    // 2. 验证文件大小/类型
    // 3. 验证数量限制
    // 4. 上传到 OSS
}
```

#### 五、API 设计

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/meta/entities/{type}/fields` | GET | 获取字段定义 |
| `/v1/{type}/{id}` | GET | 获取完整实体数据 |
| `/v1/{type}/{id}/custom-fields` | PATCH | 更新自定义字段 |
| `/v1/{type}/{id}/relations/{name}` | GET | 获取关联数据 |
| `/v1/{type}/{id}/attachments` | POST | 上传附件 |

#### 六、查询优化

```sql
-- GIN 索引支持 JSONB 包含查询
CREATE INDEX idx_customer_custom_fields ON crm_customer USING GIN (custom_fields);

-- 查询特定自定义字段值
SELECT * FROM crm_customer
WHERE custom_fields @> '{"vip_level": "gold"}';
```

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **自定义字段存储** | JSONB | 灵活、PostgreSQL 原生支持 |
| **字段定义存储** | 独立表 | 企业级隔离、动态管理 |
| **关联存储** | 独立关联表 | 支持多对多 |
| **附件配置** | 独立表 | 细粒度控制 |
| **索引策略** | GIN + B-tree | JSONB 查询 + 标准字段 |

---

### ADR-011: Agent-CLI 通信格式

#### 一、格式选型

| 格式 | Agent 兼容 | 人类可读 | 体积效率 | 流式支持 | 推荐度 |
|-------|------------|----------|----------|----------|---------|
| **JSON** | ✅ 完美 | ✅ 好 | ⚠️ 中等 | ⚠️ NDJSON | ⭐⭐⭐⭐ |
| **MessagePack** | ⚠️ 需转换 | ❌ 差 | ✅ 好 | ⚠️ 手动处理 | ⭐⭐ |
| **Protocol Buffers** | ⚠️ 需 schema | ❌ 差 | ✅ 很好 | ✅ 原生支持 | ⭐⭐⭐ |
| **YAML** | ⚠️ 需解析 | ✅ 很好 | ❌ 大 | ❌ 不支持 | ⭐⭐ |

**决策：JSON/NDJSON 是 Agent 场景最佳平衡。**

#### 二、命令请求格式

```json
{
  "version": "1.0",
  "type": "command",
  "request_id": "req_abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "session": {
    "enterprise_id": "ent_001",
    "user_id": "user_xxx"
  },
  "command": {
    "skill": "contract",
    "action": "create",
    "params": {
      "customer_id": "cust_001",
      "title": "销售合同",
      "amount": 100000
    }
  }
}
```

#### 三、响应格式

**成功响应：**
```json
{
  "version": "1.0",
  "type": "response",
  "request_id": "req_abc123",
  "status": "success",
  "result": {
    "entity_type": "contract",
    "entity_id": "con_xyz789",
    "action": "created",
    "data": { "id": "con_xyz789", "title": "销售合同", "amount": 100000 }
  },
  "meta": { "processing_time_ms": 245 }
}
```

**错误响应：**
```json
{
  "version": "1.0",
  "type": "error",
  "request_id": "req_abc123",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [{ "field": "amount", "issue": "金额必须大于 0", "value": -100 }]
  }
}
```

**流式响应 (NDJSON)：**
```
{"type":"progress","progress":25,"message":"正在创建合同..."}
{"type":"progress","progress":50,"message":"上传附件中..."}
{"type":"done","entity_id":"con_xyz789","status":"pending_approval"}
```

#### 四、Skill 定义格式 (JSON Schema)

```json
{
  "skill_name": "contract",
  "display_name": "合同管理",
  "description": "帮助您管理销售合同",
  "actions": {
    "create": {
      "description": "创建新的销售合同",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string", "required": true },
          "title": { "type": "string", "required": true },
          "amount": { "type": "number", "minimum": 0 }
        },
        "required": ["customer_id", "title", "amount"]
      }
    },
    "list": { "description": "查询合同列表", "parameters": {...} }
  }
}
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **请求格式** | JSON | 结构化、Agent 原生支持 |
| **响应格式** | JSON | 标准、易解析 |
| **流式响应** | NDJSON | 每行独立、便于处理 |
| **Tool 定义** | JSON Schema | 行业标准、自动生成 |
| **错误格式** | JSON + 错误码 | 便于 Agent 错误恢复 |

---

### ADR-012: 跨部门消息通知架构

#### 一、使用场景

```
销售部 (张三)                                                      生产部 (张三)
     │                                                                 │
     │ "查询仓库A产品a库存"                                             │
     ▼                                                                 │
Agent ──► 库存 API ──► 返回: 库存 50 台                                │
     │                                                                 │
     │ "与客户签合同 100台"                                            │
     ▼                                                                 │
Agent ──► 创建销售订单 ──► 创建合同                                      │
     │                                                                 │
     │ "通知生产部经理张三，生产产品a 100台"                             │
     ▼                                                                 │
Agent ──► POST /v1/messages/send ──► 消息通知 ──► CLI 轮询 ──► 通知用户
```

#### 二、消息类型设计

| 消息类型 | 说明 | 示例 |
|----------|------|------|
| **SYSTEM** | 系统通知 | 审批到达、工单完成 |
| **TASK** | 任务通知 | 生产任务、售后任务 |
| **APPROVAL** | 审批通知 | 待审批事项 |
| **MESSAGE** | 部门间消息 | 销售→生产询问 |
| **MENTION** | @提及消息 | @张三 请处理 |
| **ALERT** | 告警消息 | 库存不足 |
| **ANNOUNCEMENT** | 全员公告 | 老板/管理员发送给企业所有员工 |

#### 三、消息表设计

```sql
CREATE TABLE _message (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,

    type           VARCHAR(50) NOT NULL, -- SYSTEM, TASK, APPROVAL, MESSAGE, MENTION, ALERT, ANNOUNCEMENT
    title          VARCHAR(200) NOT NULL,
    content        TEXT,

    sender_type    VARCHAR(20) NOT NULL, -- user, system, agent
    sender_id     UUID,
    sender_name   VARCHAR(100),

    recipient_type VARCHAR(20) NOT NULL, -- user, department, role, all_employees
    recipient_id  UUID NOT NULL,
    recipient_name VARCHAR(100),

    related_entity_type VARCHAR(50), -- contract, order, production_task
    related_entity_id   UUID,

    is_read        BOOLEAN DEFAULT false,
    read_at        TIMESTAMP,

    priority       VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    metadata       JSONB DEFAULT '{}',

    -- 全员公告特有字段
    is_announcement BOOLEAN DEFAULT false, -- 是否为全员公告
    expires_at      TIMESTAMP,             -- 公告过期时间（可撤回）
    is_active       BOOLEAN DEFAULT true,  -- 公告是否有效

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_recipient ON _message(recipient_type, recipient_id);
CREATE INDEX idx_message_unread ON _message(recipient_id, is_read);
CREATE INDEX idx_message_enterprise ON _message(enterprise_id, type, created_at DESC);
```

#### 四、消息 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/messages/send` | POST | 发送消息（支持全员公告） |
| `/v1/messages` | GET | 获取消息列表 |
| `/v1/messages/unread` | GET | 轮询未读消息 |
| `/v1/messages/{id}/read` | POST | 标记已读 |
| `/v1/messages/announcements` | GET | 获取全员公告列表 |

#### 五、自然语言消息发送

```
用户: "帮我通知生产部经理张三，生产产品a 100台"
          │
          ▼
Agent 解析:
- 意图: notify (发送消息)
- 接收者: 生产部经理张三 (user)
- 内容: 生产产品a 100台
- 优先级: normal

API 调用:
POST /v1/messages/send
{
  "recipient_type": "user",
  "recipient_id": "user_zhangsan_id",
  "type": "MESSAGE",
  "title": "【生产任务】产品a 生产通知",
  "content": "请尽快安排生产产品a，数量: 100台",
  "related_entity": { "type": "sale_order", "id": "order_xxx" }
}
```

#### 六、全员公告功能

**功能场景：**

```
老板/管理员: "发送全员公告：下周一开始执行新考勤制度"
          │
          ▼
Agent 解析:
- 意图: broadcast_announcement (发送全员公告)
- 接收者: all_employees (企业所有员工)
- 内容: 新考勤制度通知
- 优先级: high

API 调用:
POST /v1/messages/send
{
  "recipient_type": "all_employees",
  "recipient_id": "enterprise_id",
  "type": "ANNOUNCEMENT",
  "title": "【公告】关于执行新考勤制度的通知",
  "content": "各位同事：为提升公司管理水平，自下周一（7月10日）起，将执行新的考勤制度...",
  "priority": "high"
}
```

**全员公告特点：**

| 特点 | 说明 |
|------|------|
| **一次性发送** | 老板/管理员一次操作，企业所有员工收到 |
| **存储单条** | 数据库只存储一条消息，通过 `recipient_type=all_employees` 标识 |
| **高效查询** | 通过索引 `(enterprise_id, type, created_at)` 快速查询公告列表 |
| **权限控制** | 仅 Enterprise Admin 及以上角色可发送全员公告 |
| **可撤回** | 公告发送后可撤回，设置为已过期 |
| **已读追踪** | 可查看每个员工的已读/未读状态，方便管理确认 |

**公告已读状态表设计：**

```sql
-- 公告已读状态表
CREATE TABLE _announcement_read_status (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES _message(id),
    employee_id    UUID NOT NULL REFERENCES _employee(id),
    is_read        BOOLEAN DEFAULT false,
    read_at        TIMESTAMP,

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, employee_id)
);

CREATE INDEX idx_ann_read_ann ON _announcement_read_status(announcement_id);
CREATE INDEX idx_ann_read_emp ON _announcement_read_status(employee_id);
CREATE INDEX idx_ann_read_status ON _announcement_read_status(is_read);
```

**公告查询：**

```
GET /v1/messages/announcements
响应:
{
  "announcements": [
    {
      "id": "ann_xxx",
      "title": "关于执行新考勤制度的通知",
      "content": "...",
      "sender": "老板张三",
      "created_at": "2024-07-03T10:00:00Z",
      "expires_at": null,
      "is_active": true
    }
  ]
}
```

**公告已读状态查询：**

```
GET /v1/messages/announcements/{announcement_id}/read-status
权限：仅 Enterprise Admin 及以上角色可查看

响应:
{
  "announcement_id": "ann_xxx",
  "title": "关于执行新考勤制度的通知",
  "total_employees": 100,
  "read_stats": {
    "read": 75,
    "unread": 25
  },
  "read_details": [
    {
      "employee_id": "emp_001",
      "employee_name": "张三",
      "department": "销售部",
      "is_read": true,
      "read_at": "2024-07-03T14:30:00Z"
    },
    {
      "employee_id": "emp_002",
      "employee_name": "李四",
      "department": "市场部",
      "is_read": false,
      "read_at": null
    }
  ]
}
```

**批量提醒未读员工：**

```
POST /v1/messages/announcements/{announcement_id}/remind
{
  "remind_unread": true,
  "message": "请尽快阅读公告：关于执行新考勤制度的通知"
}
```

**公告 API 汇总：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/messages/send` | POST | 发送全员公告 |
| `/v1/messages/announcements` | GET | 获取公告列表 |
| `/v1/messages/announcements/{id}` | GET | 获取公告详情 |
| `/v1/messages/announcements/{id}/read-status` | GET | 查看已读/未读员工列表 |
| `/v1/messages/announcements/{id}/read` | POST | 标记本人已读 |
| `/v1/messages/announcements/{id}/remind` | POST | 批量提醒未读员工 |
| `/v1/messages/announcements/{id}/withdraw` | POST | 撤回公告 |

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **消息存储** | PostgreSQL | RLS 隔离、复杂查询 |
| **消息类型** | 枚举 + 扩展 | 清晰分类、灵活扩展 |
| **接收者** | 用户/部门/角色/全员 | 支持多种场景，含全员公告 |
| **全员公告** | 单条存储 + all_employees | 高效存储、权限控制 |
| **公告已读追踪** | 独立表 `_announcement_read_status` | 支持管理查看、批量提醒 |
| **轮询接口** | `GET /messages/unread` | 支持 CLI 轮询 |

---

### ADR-013: 通知服务集成架构（短信 + 邮件）

#### 一、通知场景分析

| 通知渠道 | 适用场景 | 优先级 | 说明 |
|----------|----------|--------|------|
| **站内消息** | 应用内通知 | P0 | 已在 ADR-012 定义 |
| **短信通知** | 紧急告警、验证码、审批超时 | P1 | 阿里云 Dysmsapi |
| **邮件通知** | 正式文书、合同、报表 | P1 | 163 邮箱 SMTP |

#### 二、短信通知架构

**阿里云 Dysmsapi 集成：**

```go
// 阿里云短信客户端
type AliyunSMSClient struct {
    accessKeyId     string
    accessKeySecret string
    regionId        string
    signName        string  // 短信签名
}

// 短信模板
type SMSTemplate struct {
    Code        string            // 模板CODE
    Params      map[string]string // 变量
}

func (c *AliyunSMSClient) Send(ctx context.Context, phone, templateCode string, params map[string]string) error {
    // 1. 构造请求签名 (HMAC-SHA1)
    // 2. POST https://dysmsapi.aliyuncs.com/?Action=SendSms
    // 3. 返回 RequestId, BizId
}

// 短信模板示例
var SMS_TEMPLATES = map[string]SMSTemplate{
    "approval_urgent": {
        Code:    "SMS_XXX",
        Params:  map[string]string{"content": "您有一条待审批事项需处理"},
    },
    "inventory_alert": {
        Code:    "SMS_XXX",
        Params:  map[string]string{"product": "产品A", "stock": "50"},
    },
}
```

**短信 API 设计：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/notifications/sms/send` | POST | 发送短信 |
| `/v1/notifications/sms/templates` | GET | 获取可用模板 |

**请求格式：**

```json
{
  "phone": "+86 138****8888",
  "template": "approval_urgent",
  "params": {
    "content": "您有一条待审批事项：销售合同-金额100万"
  },
  "priority": "high"
}
```

**配置项：**

```yaml
# config/notification.yaml
sms:
  provider: "aliyun"
  access_key_id: "${ALIYUN_ACCESS_KEY_ID}"
  access_key_secret: "${ALIYUN_ACCESS_KEY_SECRET}"
  region_id: "cn-hangzhou"
  sign_name: "AI-Office"
  templates:
    approval_urgent: "SMS_123456789"
    inventory_alert: "SMS_987654321"
```

#### 三、邮件通知架构

**163 邮箱 SMTP 集成（使用 smtppool）：**

```go
import "github.com/knadh/smtppool/v2"

// 邮件客户端
type EmailClient struct {
    pool   *smtppool.Pool
    from   string  // 发件人地址
}

// 邮件配置
type EmailConfig struct {
    Host     string
    Port     int     // 465 (SSL) or 587 (STARTTLS)
    Username string
    Password string  // 授权码，不是密码
    From     string  // 发件人显示名称
    SSL      smtppool.SSLType
}

func NewEmailClient(cfg EmailConfig) (*EmailClient, error) {
    pool, err := smtppool.New(smtppool.Opt{
        Host:            cfg.Host,
        Port:            cfg.Port,
        MaxConns:        10,
        MaxMessageRetries: 3,
        IdleTimeout:     60 * time.Second,
        SSL:             cfg.SSL,
        Auth:            smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host),
    })
    return &EmailClient{pool: pool, from: cfg.From}, err
}

func (c *EmailClient) Send(ctx context.Context, to []string, subject, htmlBody string) error {
    email := smtppool.Email{
        From:    c.from,
        To:      to,
        Subject: subject,
        HTML:    []byte(htmlBody),
    }
    return c.pool.Send(email)
}
```

**163 邮箱配置：**

```yaml
# config/notification.yaml
email:
  provider: "163"
  host: "smtp.163.com"
  port: 465              # SSL
  # port: 587           # STARTTLS
  username: "notify@company.com"
  password: "${EMAIL_AUTH_CODE}"  # 授权码
  from: "AI-Office 通知 <notify@company.com>"
  ssl: true
```

**邮件模板：**

```go
var EMAIL_TEMPLATES = map[string]string{
    "contract_approval": `
        <h2>合同审批通知</h2>
        <p>您有一条合同待审批：</p>
        <ul>
            <li>合同名称：{{.ContractName}}</li>
            <li>客户：{{.CustomerName}}</li>
            <li>金额：{{.Amount}} 元</li>
        </ul>
        <p><a href="{{.ApprovalURL}}">点击审批</a></p>
    `,
    "weekly_report": `
        <h2>本周销售报表</h2>
        <p>您好，{{.ManagerName}}，本周销售情况如下：</p>
        <ul>
            <li>新增订单：{{.NewOrders}} 单</li>
            <li>成交金额：{{.TotalAmount}} 元</li>
        </ul>
        <p><a href="{{.ReportURL}}">查看详情</a></p>
    `,
}
```

#### 四、统一通知服务

**通知服务架构：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Notification Service                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   In-App     │  │     SMS      │  │    Email     │            │
│  │  (ADR-012)   │  │  (Aliyun)    │  │    (163)     │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                  │                     │
│         └─────────────────┼──────────────────┘                     │
│                           │                                        │
│                    ┌──────▼──────┐                                │
│                    │ Notifier    │                                 │
│                    │  Facade     │                                 │
│                    └──────┬──────┘                                │
│                           │                                        │
│  ┌────────────────────────┼────────────────────────────────┐     │
│  │                        ▼                                 │     │
│  │  ┌─────────────────────────────────────────────────┐    │     │
│  │  │            Template Engine                       │    │     │
│  │  │   (短信模板、邮件模板、通知内容)                   │    │     │
│  │  └─────────────────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────┘
```

**通知服务接口：**

```go
// NotificationService - 统一通知服务
type NotificationService struct {
    inAppNotifier *InAppNotifier  // 站内通知
    smsClient     *AliyunSMSClient // 短信
    emailClient   *EmailClient     // 邮件
}

type SendNotificationRequest struct {
    Channels    []string           // ["in_app", "sms", "email"]
    RecipientID string             // 接收人ID
    RecipientInfo map[string]string // phone, email 等

    Template   string              // 模板名称
    TemplateData map[string]string // 模板变量

    Priority   string              // low, normal, high, urgent
    ScheduledAt *time.Time         // 定时发送
}

// 发送通知
func (s *NotificationService) Send(ctx context.Context, req SendNotificationRequest) error {
    // 1. 渲染模板
    content := s.renderTemplate(req.Template, req.TemplateData)

    // 2. 根据渠道发送
    for _, channel := range req.Channels {
        switch channel {
        case "in_app":
            go s.inAppNotifier.Send(req.RecipientID, content)
        case "sms":
            if phone := req.RecipientInfo["phone"]; phone != "" {
                go s.smsClient.Send(ctx, phone, req.Template, req.TemplateData)
            }
        case "email":
            if email := req.RecipientInfo["email"]; email != "" {
                go s.emailClient.Send(ctx, []string{email}, content.Subject, content.HTML)
            }
        }
    }
    return nil
}
```

**触发通知的业务场景：**

| 场景 | 渠道 | 模板 | 优先级 |
|------|------|------|--------|
| 审批超时尚未处理 | 短信 + 邮件 | `approval_urgent` | urgent |
| 库存不足告警 | 短信 | `inventory_alert` | high |
| 合同签署完成 | 邮件 | `contract_signed` | normal |
| 周报生成 | 邮件 | `weekly_report` | low |
| 工单完成通知 | 站内消息 | `ticket_completed` | normal |

#### 五、API 设计

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/notifications/send` | POST | 发送通知（多渠道） |
| `/v1/notifications/templates` | GET | 获取通知模板列表 |
| `/v1/notifications/channels` | GET | 获取可用渠道 |
| `/v1/notifications/preferences/{user_id}` | GET/PUT | 用户通知偏好 |

**发送通知请求：**

```json
{
  "channels": ["in_app", "sms", "email"],
  "recipient": {
    "user_id": "user_xxx",
    "phone": "+86 138****8888",
    "email": "user@company.com"
  },
  "template": "approval_urgent",
  "data": {
    "contract_name": "销售合同A",
    "amount": "1000000"
  },
  "priority": "high",
  "scheduled_at": null
}
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **短信服务商** | 阿里云 Dysmsapi | 国内领先，稳定性高 |
| **短信签名机制** | AccessKeyId/Secret | 阿里云标准签名 |
| **邮件发送** | smtppool 连接池 | 高吞吐，复用连接 |
| **邮件端口** | 465 (SSL) | 163 邮箱推荐 |
| **邮件认证** | PLAIN Auth + 授权码 | 163 邮箱要求 |
| **模板引擎** | Go text/template | 轻量、内置 |
| **异步发送** | goroutine | 不阻塞主流程 |
| **通知渠道** | 统一 Facade | 便于扩展 |

---

### ADR-014: 数据隔离与备份架构

#### 一、数据隔离层次

**三层隔离架构：**

| 层级 | 隔离方式 | 保障 |
|------|----------|------|
| **Schema 隔离** | PostgreSQL Schema per Tenant | 企业间物理隔离 |
| **RLS 隔离** | Row-Level Security | 行级安全策略 |
| **应用层隔离** | Enterprise Context Middleware | API 层验证 |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        多租户数据隔离体系                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  请求 ──► API Gateway ──► Enterprise Context Middleware                      │
│                                │                                             │
│                                ▼                                             │
│                    ┌───────────────────────────┐                            │
│                    │  1. 解析 JWT              │                            │
│                    │  2. 提取 enterprise_id    │                            │
│                    │  3. 设置 PostgreSQL Session│                           │
│                    │     SET app.enterprise_id │                            │
│                    └───────────────────────────┘                            │
│                                │                                             │
│                                ▼                                             │
│                    ┌───────────────────────────┐                            │
│                    │  PostgreSQL Schema        │                            │
│                    │  ent_xxx._message         │                            │
│                    └───────────────────────────┘                            │
│                                │                                             │
│                                ▼                                             │
│                    ┌───────────────────────────┐                            │
│                    │  RLS 策略                  │                            │
│                    │  enterprise_id = current  │                            │
│                    │  _setting('app.enter...') │                            │
│                    └───────────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、Schema 隔离策略

**企业 Schema 命名规范：**

```sql
-- 公共 Schema (public)
-- 存放系统管理表：_operator, _group, _enterprise, _department, _employee

-- 企业独立 Schema
ent_{enterprise_short_id}  -- 例如: ent_001, ent_002, ent_abc123
```

**Schema 隔离检查流程：**

```go
func EnterpriseSchemaMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := getClaimsFromContext(c)

        // 1. 确定目标 Schema
        targetSchema := "ent_" + claims.EnterpriseShortID

        // 2. 验证 Schema 存在且属于该企业
        if !isValidEnterpriseSchema(claims.EnterpriseID, targetSchema) {
            c.JSON(403, ErrorResponse{
                Code:    "PERM_ENTERPRISE_MISMATCH",
                Message: "企业标识不匹配",
            })
            c.Abort()
            return
        }

        // 3. 设置 Schema Context
        db := c.Get("db").(*gorm.DB)
        db.Exec("SET LOCAL search_path TO " + targetSchema)
        db.Exec("SELECT set_config('app.enterprise_id', ?, false)", claims.EnterpriseID)

        c.Next()
    }
}
```

#### 三、文件存储隔离

**企业文件目录结构：**

```
/data/ai-office/
├── storage/
│   └── {enterprise_id}/           # 企业隔离目录
│       ├── contract/              # 合同附件
│       │   └── {file_id}/
│       │       └── original/
│       ├── employee/              # 员工档案
│       │   └── {file_id}/
│       ├── customer/              # 客户文件
│       ├── kb_document/           # 知识库文档
│       └── backup/                # 企业私有备份
│
├── cdn/public/                    # CDN 公开文件
│   └── {enterprise_id}/preview/   # 企业预览文件
│
└── temp/                          # 临时文件（全局）
    └── uploads/
```

**文件隔离检查：**

```go
func (s *FileService) ValidateFileAccess(fileKey, enterpriseID string) error {
    // 1. 解析 fileKey 获取 enterprise_id
    file, err := s.getFileByKey(fileKey)
    if err != nil {
        return ErrFileNotFound
    }

    // 2. 验证文件属于请求的企业
    if file.EnterpriseID != enterpriseID {
        // 跨企业访问检查（需要特殊权限）
        if !hasCrossEnterpriseFileAccess(enterpriseID, file.EnterpriseID) {
            return ErrFileAccessDenied
        }
    }
    return nil
}
```

#### 四、备份策略

**备份类型：**

| 备份类型 | 频率 | 保留期 | 说明 |
|----------|------|--------|------|
| **全量备份** | 每日 | 30 天 | 完整数据库备份 |
| **增量备份** | 每小时 | 7 天 | WAL 日志归档 |
| **Schema 备份** | 每周 | 90 天 | 按企业 Schema 单独备份 |
| **文件备份** | 每日 | 30 天 | 企业文件目录备份 |
| **配置备份** | 每次变更 | 180 天 | 系统配置和权限 |

**企业级隔离备份：**

```bash
# 按企业 Schema 单独备份
pg_dump -h $HOST -U $USER -n ent_001 -Fc -f /backup/ent_001_$(date +%Y%m%d).dump

# 按企业文件目录备份
rsync -avz /data/ai-office/storage/ent_001 /backup/files/ent_001_$(date +%Y%m%d)/

# 加密备份（AES-256）
openssl enc -aes-256-cbc -salt -in backup.dump -out backup.dump.enc -pass pass:$BACKUP_KEY
```

**备份恢复流程：**

```go
// 企业数据恢复
func (s *BackupService) RestoreEnterprise(enterpriseID, backupPath string) error {
    // 1. 验证备份文件属于该企业
    if !s.validateBackupOwnership(enterpriseID, backupPath) {
        return ErrBackupOwnershipMismatch
    }

    // 2. 解密备份（如加密）
    decryptedPath, err := s.decryptBackup(backupPath)
    if err != nil {
        return err
    }

    // 3. 恢复到临时 Schema
    tempSchema := "ent_" + enterpriseID + "_restore"
    s.pgRestoreToSchema(decryptedPath, tempSchema)

    // 4. 验证恢复数据
    if err := s.validateRestoreData(tempSchema); err != nil {
        s.dropSchema(tempSchema)
        return err
    }

    // 5. 原子切换 Schema
    s.atomicSchemaSwap(enterpriseID, tempSchema)

    return nil
}
```

#### 五、跨企业数据访问控制

**跨企业访问场景：**

| 场景 | 权限来源 | 访问控制 |
|------|----------|----------|
| 集团老板查看跨企业数据 | Group Owner 角色 | 读取集团下所有企业数据 |
| 员工临时跨企业协作 | 跨企业权限表 | 仅限授权范围 |
| 数据导出/备份 | Admin/Operator | 需要明确授权 |

**跨企业权限表：**

```sql
CREATE TABLE _cross_enterprise_access (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id           UUID NOT NULL REFERENCES _employee(id),
    granted_enterprise_id UUID NOT NULL REFERENCES _enterprise(id),
    access_scope         VARCHAR(50) DEFAULT 'read', -- read, write
    data_scope           JSONB DEFAULT '{}',         -- {tables: ['customer', 'contract']}
    granted_by           UUID NOT NULL REFERENCES _employee(id),
    expires_at           TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 跨企业访问检查
CREATE OR REPLACE FUNCTION check_cross_enterprise_access(
    p_user_id UUID,
    p_target_enterprise_id UUID,
    p_required_action VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    -- 检查是否有跨企业权限
    IF EXISTS (
        SELECT 1 FROM _cross_enterprise_access
        WHERE employee_id = p_user_id
          AND granted_enterprise_id = p_target_enterprise_id
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (access_scope = p_required_action OR access_scope = 'write')
    ) THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 六、备份与恢复 SLA

| 指标 | 目标 | 说明 |
|------|------|------|
| **备份成功率** | ≥ 99.9% | 自动监控备份任务 |
| **恢复时间目标 (RTO)** | < 4 小时 | 从备份到恢复完成 |
| **恢复点目标 (RPO)** | < 1 小时 | 最近备份到现在的数据丢失 |
| **备份保留期** | 30-90 天 | 根据数据类型 |
| **备份加密** | AES-256 | 所有备份加密存储 |

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **数据隔离** | Schema + RLS | PostgreSQL 原生支持，企业级隔离 |
| **文件隔离** | 企业目录 + 访问控制 | 文件系统层隔离 |
| **备份方式** | Schema 级别备份 | 支持单企业恢复，不影响其他企业 |
| **备份加密** | AES-256 | 确保备份数据安全 |
| **恢复策略** | 原子 Schema 切换 | 恢复失败不影响原数据 |
| **跨企业访问** | 显式权限 + 审计 | 平衡协作需求与安全 |

---

### ADR-015: 可观测性架构

#### 一、可观测性体系概述

**三大支柱：**

| 支柱 | 工具 | 用途 |
|------|------|------|
| **Metrics（指标）** | Prometheus + Grafana | 定量分析、性能监控 |
| **Logging（日志）** | 结构化日志 + Loki | 故障排查、审计追踪 |
| **Tracing（链路追踪）** | OpenTelemetry + Jaeger | 请求链路、性能分析 |

**架构图：**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         可观测性架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         API Server (Go)                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Prometheus  │  │   Zap Log   │  │  OpenTelemetry │               │   │
│  │  │  Metrics   │  │  Structured │  │    Tracing    │                │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │   │
│  └─────────┼────────────────┼────────────────┼──────────────────────────┘   │
│            │                │                │                               │
│            ▼                ▼                ▼                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Prometheus Push Gateway                            │   │
│  │                         (指标收集)                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│            │                                                              │
│            ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Prometheus Server                             │   │
│  │                    (时序数据库 + 查询引擎)                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│            │                                                              │
│            ▼                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Grafana Dashboard                             │   │
│  │                    (可视化面板 + 告警)                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、Prometheus 指标设计

**核心指标：**

| 指标类型 | 指标名称 | 说明 |
|----------|----------|------|
| **API 指标** | `api_requests_total{method, path, status}` | 请求总数 |
| **API 延迟** | `api_request_duration_seconds{path, method}` | 请求延迟分布 |
| **企业 QPS** | `api_enterprise_qps{enterprise_id}` | 企业级 QPS |
| **数据库指标** | `db_connections_pool{state}` | 连接池状态 |
| **Redis 指标** | `redis_operations_total{operation}` | Redis 操作统计 |
| **配额指标** | `quota_daily_usage{enterprise_id}` | 企业日配额使用 |
| **消息指标** | `messages_poll_total{enterprise_id}` | 消息轮询次数 |
| **CLI 在线** | `cli_online_count{enterprise_id}` | 企业 CLI 在线数 |

**指标暴露接口：**

```go
// GET /metrics (Prometheus 格式)
func (s *MetricsServer) Handler() http.Handler {
    m := prometheus.NewRegistry()

    // 注册自定义指标
    m.MustRegister(apiRequestsTotal)
    m.MustRegister(apiRequestDuration)
    m.MustRegister(dbConnectionPool)
    m.MustRegister(quotaDailyUsage)

    return promhttp.HandlerFor(m, promhttp.HandlerOpts{})
}
```

**Grafana 面板设计：**

```json
{
  "dashboard": {
    "title": "AI-Office API 监控",
    "panels": [
      {
        "title": "API 请求 QPS",
        "targets": [{"expr": "rate(api_requests_total[5m])"}]
      },
      {
        "title": "API P95 延迟",
        "targets": [{"expr": "histogram_quantile(0.95, api_request_duration_seconds)"}]
      },
      {
        "title": "企业配额使用 Top 10",
        "targets": [{"expr": "topk(10, quota_daily_usage)"}]
      },
      {
        "title": "CLI 在线数",
        "targets": [{"expr": "sum(cli_online_count) by (enterprise_id)"}]
      }
    ]
  }
}
```

#### 三、结构化日志设计

**日志格式（JSON）：**

```json
{
  "level": "info",
  "timestamp": "2024-07-03T10:30:00.123Z",
  "request_id": "req_abc123",
  "enterprise_id": "ent_001",
  "user_id": "user_xxx",
  "method": "POST",
  "path": "/v1/contracts",
  "status": 201,
  "duration_ms": 45,
  "client_ip": "192.168.1.100",
  "user_agent": "ao-cli/1.0.0",
  "message": "Contract created successfully",
  "extra": {
    "contract_id": "con_xyz789",
    "amount": 100000
  }
}
```

**日志级别：**

| 级别 | 使用场景 |
|------|----------|
| **DEBUG** | 调试信息（开发环境） |
| **INFO** | 正常业务流程 |
| **WARN** | 配额预警、性能下降 |
| **ERROR** | 操作失败（可恢复） |
| **FATAL** | 系统级错误（需立即处理） |

**日志输出：**

```go
// 日志配置
func NewLogger(cfg LoggerConfig) *zap.Logger {
    return zap.NewProduction(
        zap.AddCaller(),
        zap.AddStacktrace(zap.WarnLevel),
        zap.WithMarshaler(zapcore.TimeKey, zapcore.ISO8601TimeEncoder),
    )
}

// 企业上下文日志
func WithEnterpriseContext(ctx *gin.Context, log *zap.Logger) *zap.Logger {
    claims := getClaimsFromContext(ctx)
    return log.With(
        zap.String("request_id", getRequestID(ctx)),
        zap.String("enterprise_id", claims.EnterpriseID),
        zap.String("user_id", claims.UserID),
    )
}
```

#### 四、OpenTelemetry 链路追踪

**追踪上下文传播：**

```go
// 中间件：自动创建 span
func TracingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        spanName := fmt.Sprintf("%s %s", c.Request.Method, c.FullPath())

        ctx, span := tracer.Start(c.Request.Context(), spanName,
            trace.WithAttributes(
                attribute.String("http.method", c.Request.Method),
                attribute.String("http.url", c.Request.URL.String()),
                attribute.String("enterprise_id", getEnterpriseID(c)),
            ),
        )
        defer span.End()

        c.Request = c.Request.WithContext(ctx)
        c.Next()

        span.SetAttributes(
            attribute.Int("http.status_code", c.Writer.Status()),
            attribute.Int64("http.response_size", int64(c.Writer.Size())),
        )
    }
}
```

**分布式追踪示例：**

```
Trace: req_abc123
├── API Gateway (0-5ms)
│   └── 验证 Token
├── Business Handler (5-50ms)
│   ├── PostgreSQL Query (10-30ms)
│   │   └── span: db.query "SELECT * FROM contracts"
│   └── Redis Cache (2-5ms)
│       └── span: redis.get "quota:ent_001"
└── Response (50-55ms)
```

#### 五、告警规则

| 告警名称 | 条件 | 级别 | 动作 |
|----------|------|------|------|
| **API 高延迟** | P95 > 500ms 持续 5 分钟 | WARN | 发送告警 |
| **API 不可用** | 5xx 错误率 > 5% | CRITICAL | 立即通知 |
| **配额超限** | 企业日配额使用 > 90% | WARN | 发送预警 |
| **CLI 掉线** | 企业 CLI 在线数 = 0 超过 10 分钟 | WARN | 通知用户 |
| **数据库连接池** | 活跃连接 > 80% | WARN | 发送告警 |
| **Token 刷新失败** | 连续失败 3 次 | CRITICAL | 立即通知 |

**告警通知渠道：**

| 渠道 | 用途 |
|------|------|
| **邮件** | 重要告警（系统管理员） |
| **短信** | 紧急告警（P0 问题） |
| **站内消息** | 一般通知 |

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **指标存储** | Prometheus | 云原生、成熟生态 |
| **日志存储** | Loki | 与 Prometheus 集成，原生支持 |
| **链路追踪** | OpenTelemetry | 厂商无关、标准化的追踪标准 |
| **可视化** | Grafana | 成熟的可视化平台 |
| **告警渠道** | 邮件 + 短信 | 确保关键告警送达 |

---

### ADR-016: API 配额管理架构

#### 一、配额设计理念

**问题：传统 QPS 限制的缺点**

| 问题 | 影响 |
|------|------|
| 秒级限制 | 批量操作（如导入100个客户）会被误杀 |
| 固定阈值 | 小企业够用，大企业不够用 |
| 突发流量 | 正常业务高峰被错误限流 |

**解决方案：配额制（更友好）**

| 方案 | 说明 | 用户体验 |
|------|------|----------|
| **日配额** | 每天 API 调用次数限制 | 允许突发，不限制瞬时 |
| **月配额** | 每月 API 调用次数限制 | 长期控制，不影响正常业务 |
| **弹性配额** | 允许偶尔超出，超出时预警而非拒绝 | 避免误杀 |

#### 二、配额模型

**企业配额表：**

```sql
-- 企业配额表
CREATE TABLE _enterprise_quota (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL UNIQUE REFERENCES _enterprise(id),
    plan           VARCHAR(50) NOT NULL, -- free, pro, enterprise

    -- 日配额
    daily_limit    INT NOT NULL DEFAULT 10000,
    daily_used     INT NOT NULL DEFAULT 0,
    daily_reset_at TIMESTAMP NOT NULL, -- 每天 UTC 0 点重置

    -- 月配额
    monthly_limit  INT NOT NULL DEFAULT 300000,
    monthly_used   INT NOT NULL DEFAULT 0,
    monthly_reset_at TIMESTAMP NOT NULL, -- 每月 1 日 UTC 重置

    -- 预警阈值
    warning_threshold FLOAT NOT NULL DEFAULT 0.8, -- 80%

    -- 弹性因子（允许超出百分比）
    grace_factor   FLOAT NOT NULL DEFAULT 0.1, -- 10%

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 配额使用日志（用于统计和审计）
CREATE TABLE _quota_usage_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    api_path       VARCHAR(255) NOT NULL,
    request_count  INT NOT NULL DEFAULT 1,
    timestamp      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quota_log_enterprise ON _quota_usage_log(enterprise_id, timestamp);
CREATE INDEX idx_quota_log_daily ON _quota_usage_log(DATE(timestamp), enterprise_id);
```

**配额计划定义：**

| 计划 | 日配额 | 月配额 | 价格 |
|------|--------|--------|------|
| **Free** | 1,000 | 30,000 | 免费 |
| **Pro** | 10,000 | 300,000 | ¥99/月 |
| **Enterprise** | 100,000 | 3,000,000 | ¥999/月 |

#### 三、配额检查流程

**配额检查中间件：**

```go
func QuotaMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := getClaimsFromContext(c)
        quota, err := getQuota(claims.EnterpriseID)
        if err != nil {
            c.Next()
            return
        }

        // 检查日配额
        if quota.DailyUsed >= quota.DailyLimit {
            // 超出 grace_factor 才拒绝
            if float64(quota.DailyUsed) >= float64(quota.DailyLimit) * (1 + quota.GraceFactor) {
                c.JSON(429, ErrorResponse{
                    Code:    "QUOTA_EXCEEDED",
                    Message: "日配额已用完，请明天再试",
                    Details: map[string]interface{}{
                        "daily_limit":     quota.DailyLimit,
                        "daily_used":      quota.DailyUsed,
                        "resets_in_hours": time.Until(quota.DailyResetAt).Hours(),
                    },
                    Level:           "user_action",
                    Recoverable:     false,
                    RecoveryAction: map[string]string{
                        "type":        "wait",
                        "description": "配额将在明天重置",
                    },
                })
                c.Abort()
                return
            }
            // 在 grace_factor 范围内：预警但允许
            go sendQuotaWarning(claims.EnterpriseID, "日配额使用已达 100%")
        }

        // 增加配额使用计数
        incrementQuotaUsage(claims.EnterpriseID, 1)

        // 设置响应头
        c.Header("X-Quota-Daily-Limit", strconv.Itoa(quota.DailyLimit))
        c.Header("X-Quota-Daily-Used", strconv.Itoa(quota.DailyUsed+1))
        c.Header("X-Quota-Daily-Remaining", strconv.Itoa(quota.DailyLimit-quota.DailyUsed-1))
        c.Header("X-Quota-Resets-In", fmt.Sprintf("%.0f hours", time.Until(quota.DailyResetAt).Hours()))

        c.Next()
    }
}
```

**配额预警机制：**

```go
func (s *QuotaService) CheckAndWarn(enterpriseID string) {
    quota := s.GetQuota(enterpriseID)

    // 达到预警阈值
    usagePercent := float64(quota.DailyUsed) / float64(quota.DailyLimit)
    if usagePercent >= quota.WarningThreshold && !s.hasWarnedToday(enterpriseID) {
        s.sendWarning(enterpriseID, usagePercent)
        s.markWarnedToday(enterpriseID)
    }
}
```

#### 四、配额 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/quota` | GET | 获取当前配额状态 |
| `/v1/quota/usage` | GET | 获取配额使用详情 |
| `/v1/quota/upgrade` | POST | 升级配额计划 |

**配额响应头：**

```http
GET /v1/contracts HTTP/1.1
Authorization: Bearer xxx

HTTP/1.1 200 OK
X-Quota-Daily-Limit: 10000
X-Quota-Daily-Used: 3456
X-Quota-Daily-Remaining: 6544
X-Quota-Resets-In: 14 hours
X-Quota-Monthly-Limit: 300000
X-Quota-Monthly-Used: 45678
X-Quota-Monthly-Remaining: 254322
```

**配额查询 API 响应：**

```json
GET /v1/quota

{
  "plan": "pro",
  "daily": {
    "limit": 10000,
    "used": 3456,
    "remaining": 6544,
    "resets_in_hours": 14,
    "usage_percent": 34.56
  },
  "monthly": {
    "limit": 300000,
    "used": 45678,
    "remaining": 254322,
    "usage_percent": 15.23,
    "resets_in_days": 27
  },
  "upgrade_available": true
}
```

#### 五、配额统计与分析

**企业配额使用报表：**

```json
GET /v1/quota/usage?period=30d

{
  "enterprise_id": "ent_001",
  "period": "30d",
  "total_requests": 45678,
  "daily_average": 1522,
  "peak_day": {
    "date": "2024-06-15",
    "requests": 3456
  },
  "top_api_calls": [
    {"path": "/v1/contracts", "count": 12345},
    {"path": "/v1/customers", "count": 9876},
    {"path": "/v1/messages/poll", "count": 8765}
  ],
  "quota_breach_count": 0,
  "recommendations": [
    "您的日配额使用率平均为 15%，建议升级到 Enterprise 以获得更多配额"
  ]
}
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **限制方式** | 配额制（非 QPS） | 更友好，不误杀正常业务 |
| **弹性配额** | 10% grace factor | 允许轻微超出，只预警不拒绝 |
| **响应头** | X-Quota-* | 透明化，让用户了解使用情况 |
| **预警机制** | 80% 阈值预警 | 提前通知，避免突然用完 |
| **重置周期** | 日/月双重重置 | 灵活控制，长期短期结合 |

---

### ADR-017: Kubernetes 部署架构

#### 一、Kubernetes 架构设计

**整体架构：**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Kubernetes Cluster                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Ingress (Nginx)                               │   │
│  │                    HTTPS 终结 + 路由 + 限流                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────────────────────┼──────────────────────────────────┐   │
│  │                                  ▼                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    API Server Deployment                    │   │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │   │   │
│  │  │  │  Pod 1 │  │  Pod 2 │  │  Pod 3 │  │  Pod N │  HPA      │   │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌──────────────────────────────────┼──────────────────────────────────┐   │
│  │                                  ▼                                  │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                        │   │
│  │  │  PostgreSQL     │    │      Redis      │                        │   │
│  │  │  StatefulSet    │    │   Deployment    │                        │   │
│  │  └─────────────────┘    └─────────────────┘                        │   │
│  │           │                      │                                 │   │
│  │           ▼                      ▼                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Persistent Volumes                        │   │   │
│  │  │  pv-postgresql-001    pv-redis-001    pv-storage-xxx        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、Kubernetes Manifests

**API Server Deployment：**

```yaml
# api-server-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-office-api
  namespace: ai-office
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-office-api
  template:
    metadata:
      labels:
        app: ai-office-api
    spec:
      containers:
      - name: api
        image: ai-office/api:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 2Gi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ai-office-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: ai-office-config
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

**Horizontal Pod Autoscaler (HPA)：**

```yaml
# api-server-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-office-api-hpa
  namespace: ai-office
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-office-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**PostgreSQL StatefulSet：**

```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ai-office-postgres
  namespace: ai-office
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ai-office-secrets
              key: postgres-password
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 8Gi
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-storage
      resources:
        requests:
          storage: 100Gi
```

#### 三、Helm Chart 结构

```
ai-office/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── ingress.yaml
│   ├── api-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── configmap.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── secrets.yaml
└── values.schema.json
```

**values.yaml 示例：**

```yaml
# values.yaml
replicaCount: 3

image:
  repository: ai-office/api
  tag: latest
  pullPolicy: IfNotPresent

resources:
  api:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.ai-office.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ai-office-tls
      hosts:
        - api.ai-office.com

postgresql:
  persistence:
    size: 100Gi
    storageClass: fast-storage
  resources:
    requests:
      cpu: 500m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 8Gi

redis:
  persistence:
    size: 10Gi
```

#### 四、部署与滚动更新

**部署流程：**

```bash
# 使用 Helm 部署
helm install ai-office ./ai-office \
  --namespace ai-office \
  --create-namespace \
  --values values.yaml

# 滚动更新
helm upgrade ai-office ./ai-office \
  --namespace ai-office \
  --values values.yaml \
  --set image.tag=v1.2.0

# 回滚
helm rollback ai-office 1 --namespace ai-office
```

**滚动更新策略：**

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **容器编排** | Kubernetes | 成熟的企业级编排 |
| **自动扩缩容** | HPA + KEDA | 根据负载自动伸缩 |
| **存储** | StatefulSet + PVC | 数据库需要持久化存储 |
| ** Ingress** | Nginx + Cert-manager | HTTPS 自动管理 |
| **部署方式** | Helm Chart | 一键部署、可版本化管理 |

---

### ADR-018: 功能开关架构

#### 一、功能开关设计理念

**无前端 SaaS 的功能开关特点：**

| 特点 | 说明 |
|------|------|
| **无 UI 配置** | 通过 API/CLI 管理 |
| **企业级开关** | 按企业启用/禁用模块 |
| **Agent 感知** | Agent 加载 Skill 时检查功能开关 |
| **灰度发布** | 支持百分比灰度 |

#### 二、功能开关模型

**功能开关表：**

```sql
-- 功能开关定义表
CREATE TABLE _feature_flag (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(100) NOT NULL UNIQUE,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    module         VARCHAR(50) NOT NULL, -- hrm, crm, finance, knowledge
    is_enabled     BOOLEAN DEFAULT true,
    enabled_by_default BOOLEAN DEFAULT true, -- 新企业是否默认启用
    rollout_percentage INT DEFAULT 100, -- 灰度发布百分比
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业功能开关状态表
CREATE TABLE _enterprise_feature (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL REFERENCES _enterprise(id),
    feature_code   VARCHAR(100) NOT NULL REFERENCES _feature_flag(code),
    is_enabled     BOOLEAN NOT NULL, -- 覆盖默认值
    enabled_at     TIMESTAMP,
    disabled_at    TIMESTAMP,
    enabled_by     UUID REFERENCES _employee(id),
    UNIQUE(enterprise_id, feature_code)
);

-- 功能开关历史（审计）
CREATE TABLE _feature_flag_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID REFERENCES _enterprise(id),
    feature_code   VARCHAR(100) NOT NULL,
    action         VARCHAR(20) NOT NULL, -- enable, disable
    changed_by     UUID NOT NULL REFERENCES _employee(id),
    changed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**预定义功能开关：**

| 功能代码 | 模块 | 说明 | 默认启用 |
|----------|------|------|----------|
| `hrm.enabled` | HRM | 人力资源管理模块 | ✅ |
| `crm.enabled` | CRM | 客户管理模块 | ✅ |
| `finance.enabled` | Finance | 财务管理模块 | ✅ |
| `knowledge.enabled` | Knowledge | 知识库模块 | ✅ |
| `sms.enabled` | Notification | 短信通知功能 | ✅ |
| `email.enabled` | Notification | 邮件通知功能 | ✅ |
| `cross_enterprise.enabled` | Group | 跨企业访问功能 | ❌ |
| `custom_field.enabled` | Custom | 自定义字段功能 | ✅ |
| `api_access.enabled` | API | 开放 API 功能 | ❌ |

#### 三、功能开关检查

**中间件检查：**

```go
func FeatureFlagMiddleware(requiredFeatures ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := getClaimsFromContext(c)

        for _, feature := range requiredFeatures {
            if !isFeatureEnabled(claims.EnterpriseID, feature) {
                c.JSON(403, ErrorResponse{
                    Code:    "FEATURE_DISABLED",
                    Message: fmt.Sprintf("功能 %s 未启用，请联系管理员", feature),
                    Details: map[string]interface{}{
                        "feature": feature,
                        "action":  c.Request.Method + " " + c.Request.URL.Path,
                    },
                    Level:        "user_action",
                    Recoverable:  false,
                })
                c.Abort()
                return
            }
        }
        c.Next()
    }
}

// 检查 Skill 是否可用
func (s *SkillService) IsSkillAvailable(enterpriseID, skillName string) bool {
    // 获取 Skill 对应的模块
    module := s.getSkillModule(skillName)
    featureCode := module + ".enabled"

    return isFeatureEnabled(enterpriseID, featureCode)
}
```

**Agent 加载 Skill 时检查：**

```go
// GET /v1/skills
func (s *SkillService) ListSkills(enterpriseID string) []Skill {
    allSkills := s.getAllSkills()

    // 过滤掉未启用功能的 Skill
    availableSkills := []Skill{}
    for _, skill := range allSkills {
        if s.IsSkillAvailable(enterpriseID, skill.Name) {
            availableSkills = append(availableSkills, skill)
        }
    }
    return availableSkills
}
```

#### 四、功能开关 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/features` | GET | 获取所有功能开关定义 |
| `/v1/features/{code}` | GET | 获取特定功能开关详情 |
| `/v1/enterprise/features` | GET | 获取企业功能开关状态 |
| `/v1/enterprise/features/{code}` | PUT | 更新企业功能开关状态 |
| `/v1/enterprise/features/{code}/enable` | POST | 启用功能 |
| `/v1/enterprise/features/{code}/disable` | POST | 禁用功能 |

**功能开关响应：**

```json
GET /v1/enterprise/features

{
  "enterprise_id": "ent_001",
  "features": [
    {
      "code": "hrm.enabled",
      "name": "人力资源管理",
      "module": "hrm",
      "is_enabled": true,
      "enabled_at": "2024-01-15T10:00:00Z",
      "enabled_by": "admin_user_xxx"
    },
    {
      "code": "knowledge.enabled",
      "name": "知识库",
      "module": "knowledge",
      "is_enabled": false,
      "enabled_at": null,
      "disabled_at": "2024-06-01T10:00:00Z",
      "enabled_by": "admin_user_xxx"
    }
  ]
}
```

#### 五、灰度发布

**灰度发布流程：**

```go
func isFeatureEnabledForEnterprise(enterpriseID, featureCode string) bool {
    flag := getFeatureFlag(featureCode)

    // 1. 检查企业特定设置
    enterpriseFeature := getEnterpriseFeature(enterpriseID, featureCode)
    if enterpriseFeature != nil {
        return enterpriseFeature.IsEnabled
    }

    // 2. 检查灰度百分比
    if flag.RolloutPercentage < 100 {
        hash := crc32.ChecksumIEEE([]byte(enterpriseID))
        bucket := hash % 100
        return int(bucket) < flag.RolloutPercentage
    }

    // 3. 返回默认值
    return flag.IsEnabled
}
```

**灰度发布 API：**

```bash
# 更新功能开关灰度百分比
PUT /v1/features/{code}/rollout

{
  "rollout_percentage": 50  // 50% 企业可用
}
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **开关粒度** | 模块级 | 简化管理，不需要字段级开关 |
| **默认值** | 可配置 | 新企业可以有默认启用的功能 |
| **覆盖机制** | 企业级覆盖 > 全局默认 | 灵活控制单个企业 |
| **灰度发布** | 百分比灰度 | 支持渐进式发布 |
| **审计日志** | 完整记录 | 所有开关变更可追溯 |

---

### ADR-019: 企业生命周期管理架构

#### 一、企业状态机设计

**状态定义：**

| 状态 | 说明 | API 访问 | 触发条件 |
|------|------|----------|----------|
| **active** | 正常运营 | ✅ 完全开放 | 创建时默认 |
| **trial** | 试用中 | ✅ 功能受限 | 新企业试用 |
| **suspended** | 暂停服务 | ⚠️ 部分API | 欠费/违规 |
| **frozen** | 冻结 | ❌ 完全冻结 | 风控/长期欠费 |
| **expired** | 已过期 | ❌ API 拒绝 | 订阅到期 |
| **cancelled** | 已取消 | ❌ 完全停止 | 主动取消 |

**状态转换图：**

```
                         创建
                           │
                           ▼
                      ┌─────────┐
                      │  trial  │ ◄──── 试用 7/30 天
                      └────┬────┘
                           │
                  试用到期 │ 试用通过
                           │    │
                           ▼    ▼
                      ┌────────────┐
                      │   active   │ ◄──── 正常运营
                      └─────┬──────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
      欠费/违规          冻结            到期
           │                │                │
           ▼                ▼                ▼
     ┌───────────┐   ┌───────────┐   ┌───────────┐
     │ suspended  │   │  frozen   │   │  expired  │
     └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
           │                │                │
      欠费结清          解冻              续费
           │                │                │
           └────────────────┼────────────────┘
                            │
                            ▼
                       ┌─────────┐
                       │ active  │
                       └─────────┘

           ┌────────────────────────────────┐
           │                                │
      主动取消                         永久冻结
           │                                │
           ▼                                ▼
     ┌───────────┐                   ┌───────────┐
     │ cancelled  │                   │ cancelled  │
     └───────────┘                   └───────────┘
```

#### 二、数据模型

**企业生命周期状态表：**

```sql
-- 企业生命周期状态表
CREATE TABLE _enterprise_lifecycle (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id    UUID NOT NULL UNIQUE REFERENCES _enterprise(id),

    -- 当前状态
    status           VARCHAR(20) NOT NULL DEFAULT 'active',

    -- 状态原因
    status_reason    TEXT,

    -- 变更记录
    status_changed_at TIMESTAMP,
    status_changed_by UUID REFERENCES _operator_admin(id),

    -- 暂停/冻结详情
    suspended_at     TIMESTAMP,
    suspended_reason VARCHAR(50), -- overdue, violation, manual
    frozen_at        TIMESTAMP,
    frozen_reason   VARCHAR(50), -- overdue, risk_control, manual

    -- 到期信息
    subscribed_at    TIMESTAMP,
    expires_at      TIMESTAMP,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业状态变更日志
CREATE TABLE _enterprise_status_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id    UUID NOT NULL REFERENCES _enterprise(id),
    operator_id     UUID NOT NULL REFERENCES _operator_admin(id),

    from_status      VARCHAR(20),
    to_status        VARCHAR(20) NOT NULL,
    reason           TEXT,
    metadata         JSONB DEFAULT '{}',

    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lifecycle_enterprise ON _enterprise_lifecycle(enterprise_id);
CREATE INDEX idx_status_log_enterprise ON _enterprise_status_log(enterprise_id, created_at DESC);
```

#### 三、API 访问控制

**企业状态中间件：**

```go
func EnterpriseStatusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        enterprise := getEnterpriseFromContext(c)

        switch enterprise.Status {
        case "active", "trial":
            // 正常访问
            c.Next()

        case "suspended":
            // 暂停服务：只允许特定 API
            allowedPaths := []string{
                "/v1/auth/login",
                "/v1/auth/refresh",
                "/v1/enterprise/status",
                "/v1/enterprise/reactivate",
            }
            if !contains(c.Request.URL.Path, allowedPaths) {
                c.JSON(403, ErrorResponse{
                    Code:    "ENTERPRISE_SUSPENDED",
                    Message: "企业服务已暂停，请联系运营商",
                    Details: map[string]interface{}{
                        "status": enterprise.Status,
                        "reason": enterprise.StatusReason,
                        "action": "recharge_or_contact",
                    },
                })
                c.Abort()
                return
            }
            c.Next()

        case "frozen":
            // 冻结：完全拒绝所有 API
            c.JSON(403, ErrorResponse{
                Code:    "ENTERPRISE_FROZEN",
                Message: "企业已被冻结，请联系运营商",
                Details: map[string]interface{}{
                    "status": enterprise.Status,
                    "reason": enterprise.FrozenReason,
                },
            })
            c.Abort()
            return

        case "expired":
            // 过期：提示续费
            c.JSON(403, ErrorResponse{
                Code:    "ENTERPRISE_EXPIRED",
                Message: "企业订阅已过期，请续费",
                Details: map[string]interface{}{
                    "expires_at": enterprise.ExpiresAt,
                    "action":    "renew_subscription",
                },
            })
            c.Abort()
            return

        case "cancelled":
            // 取消：完全停止
            c.JSON(403, ErrorResponse{
                Code:    "ENTERPRISE_CANCELLED",
                Message: "企业已被取消，无法访问",
            })
            c.Abort()
            return
        }
    }
}
```

#### 四、企业管理 API（完整版）

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/operator/enterprises` | GET | 获取企业列表（支持状态筛选） |
| `/v1/operator/enterprises` | POST | 创建企业 |
| `/v1/operator/enterprises/{id}` | GET | 获取企业详情 |
| `/v1/operator/enterprises/{id}` | PUT | 更新企业信息 |
| `/v1/operator/enterprises/{id}/activate` | POST | **激活/启用** |
| `/v1/operator/enterprises/{id}/suspend` | POST | **暂停服务** |
| `/v1/operator/enterprises/{id}/resume` | POST | **恢复服务** |
| `/v1/operator/enterprises/{id}/freeze` | POST | **冻结** |
| `/v1/operator/enterprises/{id}/unfreeze` | POST | **解冻** |
| `/v1/operator/enterprises/{id}/expire` | POST | **标记过期** |
| `/v1/operator/enterprises/{id}/renew` | POST | **续费** |
| `/v1/operator/enterprises/{id}/cancel` | POST | **取消订阅** |
| `/v1/operator/enterprises/{id}/delete` | POST | **永久删除** |
| `/v1/operator/enterprises/{id}/status-log` | GET | **状态变更日志** |

**状态变更 API 示例：**

```json
// POST /v1/operator/enterprises/{id}/suspend
// 暂停企业服务
{
  "reason": "overdue",
  "note": "因欠费暂停服务，请尽快充值"
}

// POST /v1/operator/enterprises/{id}/freeze
// 冻结企业
{
  "reason": "risk_control",
  "note": "风控部门冻结，需人工审核解冻"
}

// POST /v1/operator/enterprises/{id}/unfreeze
// 解冻企业
{
  "note": "审核通过，解除冻结",
  "extend_subscription": true,
  "extend_days": 30
}

// POST /v1/operator/enterprises/{id}/renew
// 续费
{
  "period_months": 12,
  "amount": 9999.00,
  "payment_method": "balance"
}

// POST /v1/operator/enterprises/{id}/cancel
// 取消订阅
{
  "reason": "voluntary",
  "cancel_immediately": false,
  "note": "客户转向其他产品"
}
```

#### 五、状态变更日志查询

```json
GET /v1/operator/enterprises/ent_xxx/status-log

{
  "enterprise_id": "ent_xxx",
  "logs": [
    {
      "id": "log_001",
      "from_status": null,
      "to_status": "active",
      "reason": "创建企业",
      "operator": "admin@operator.com",
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": "log_002",
      "from_status": "active",
      "to_status": "suspended",
      "reason": "欠费暂停",
      "note": "连续3个月未缴费",
      "operator": "system",
      "created_at": "2024-04-15T00:00:00Z"
    },
    {
      "id": "log_003",
      "from_status": "suspended",
      "to_status": "active",
      "reason": "手动恢复",
      "note": "结清欠费 ¥999",
      "operator": "admin@operator.com",
      "created_at": "2024-04-16T14:30:00Z"
    }
  ]
}
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **状态定义** | 6 种状态 | 覆盖完整生命周期 |
| **暂停权限** | 可配置 | 灵活控制暂停后能访问的 API |
| **冻结机制** | 完全冻结 | 风控场景需要完全隔离 |
| **日志审计** | 完整记录 | 所有状态变更可追溯 |
| **自动到期** | 定时任务检查 | 到期自动变更状态 |

---

---

### ADR-020: 计费与订阅管理架构

#### 一、架构设计

**核心原则：** 计费是运营商的命脉，必须可靠、可追溯、自动化。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         计费与订阅管理架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Subscription Service                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  计划管理    │  │  订阅管理    │  │  账单管理    │              │   │
│  │  │  Plan CRUD  │  │  Subscribe   │  │  Invoice     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       Payment Gateway                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  支付宝      │  │  微信支付    │  │  银行转账    │              │   │
│  │  │  Alipay      │  │  WeChat Pay  │  │  (线下记录)  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Lifecycle Integration                           │   │
│  │  订阅到期 → 欠费检测 → 宽限期 → 自动暂停 (联动 ADR-019)            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、数据模型

```sql
-- 订阅计划表
CREATE TABLE _subscription_plan (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(50) UNIQUE NOT NULL, -- free, pro, enterprise
    name           VARCHAR(200) NOT NULL,
    monthly_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
    features       JSONB NOT NULL,       -- {modules: [...], quota: {...]}
    is_active      BOOLEAN DEFAULT true,
    sort_order     INT DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 企业订阅表
CREATE TABLE _enterprise_subscription (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id    UUID NOT NULL UNIQUE REFERENCES _enterprise(id),
    plan_id          UUID NOT NULL REFERENCES _subscription_plan(id),

    -- 订阅周期
    billing_cycle    VARCHAR(20) NOT NULL, -- monthly, yearly
    started_at       TIMESTAMP NOT NULL,
    expires_at       TIMESTAMP NOT NULL,
    auto_renew       BOOLEAN DEFAULT true,

    -- 状态
    status           VARCHAR(20) NOT NULL DEFAULT 'active', -- active, past_due, cancelled

    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 账单表
CREATE TABLE _invoice (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id    UUID NOT NULL REFERENCES _enterprise(id),
    invoice_no       VARCHAR(50) UNIQUE NOT NULL,
    period_start     DATE NOT NULL,
    period_end       DATE NOT NULL,

    -- 金额明细
    subscription_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    overage_fee      DECIMAL(10,2) NOT NULL DEFAULT 0,
    addon_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- 状态
    status           VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, overdue, refunded
    due_date         DATE NOT NULL,
    paid_at          TIMESTAMP,

    -- PDF 存储
    pdf_file_key     VARCHAR(50),

    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表
CREATE TABLE _payment (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id       UUID NOT NULL REFERENCES _invoice(id),
    enterprise_id    UUID NOT NULL REFERENCES _enterprise(id),

    amount           DECIMAL(10,2) NOT NULL,
    payment_method   VARCHAR(30) NOT NULL, -- alipay, wechat, bank_transfer, balance
    transaction_id   VARCHAR(200),          -- 第三方支付流水号
    status           VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded

    paid_at          TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_enterprise ON _enterprise_subscription(enterprise_id);
CREATE INDEX idx_invoice_enterprise ON _invoice(enterprise_id, status);
CREATE INDEX idx_payment_invoice ON _payment(invoice_id);
```

#### 三、API 设计

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/billing/plans` | GET | 获取订阅计划列表 |
| `/v1/billing/subscription` | GET | 获取当前企业订阅状态 |
| `/v1/billing/subscription/upgrade` | POST | 升级计划 |
| `/v1/billing/subscription/downgrade` | POST | 降级计划（下周期生效） |
| `/v1/billing/invoices` | GET | 账单列表 |
| `/v1/billing/invoices/{id}` | GET | 账单详情 |
| `/v1/billing/invoices/{id}/pdf` | GET | 下载账单 PDF |
| `/v1/billing/payments` | POST | 发起支付 |
| `/v1/billing/payments/{id}/refund` | POST | 退款（仅 Operator） |
| `/v1/operator/revenue` | GET | 运营商收入汇总 |

#### 四、欠费自动处理流程

```
订阅到期
    ↓
宽限期开始（默认 7 天，可配置）
    │  → 站内消息 + 邮件提醒："订阅即将到期"
    ↓
宽限期结束未付
    │  → 自动暂停服务（联动 ADR-019 Enterprise Status = suspended）
    │  → 站内消息 + 短信通知："服务已暂停"
    ↓
暂停后 30 天仍未付
    │  → 自动标记过期（Enterprise Status = expired）
    │  → 数据保留但不可访问
    ↓
暂停后 90 天仍未付
    → 数据归档，进入删除倒计时
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **支付渠道** | 支付宝 + 微信支付 | 国内企业主流支付方式 |
| **计费周期** | 月付/年付 | 灵活选择，年付优惠 |
| **升级生效** | 立即生效 + 按天折算 | 用户体验优先 |
| **降级生效** | 下周期生效 | 避免功能突然不可用 |
| **欠费处理** | 宽限期 → 暂停 → 过期 → 归档 | 渐进式，给客户缓冲 |
| **账单存储** | PDF + 文件系统 | 可下载、可归档 |

---

### ADR-021: 业务统计与报表架构

#### 一、设计理念

**核心区分：统计 API ≠ 可视化 API**

| 我们做的 | 我们不做的 |
|---------|-----------|
| 业务指标计算与聚合 | 图表渲染与可视化 |
| 预计算汇总数据 | Dashboard 页面 |
| 交叉分析维度数据 | 前端图表组件 |
| 趋势数据（环比/同比） | 数据可视化引擎 |

**Agent 调用流程：**
```
用户: "这个月销售情况怎么样？"
    ↓
Agent 调用: GET /v1/reports/sales?period=month
    ↓
API 返回计算好的指标: {total: 150000, order_count: 23, mom_change: "+12%"}
    ↓
Agent 生成 HTML 报告展示给用户
```

#### 二、统计服务架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         统计与报表架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Report Service (统计计算)                          │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  销售统计    │  │  财务统计    │  │  库存统计    │              │   │
│  │  │  SalesStats  │  │  FinanceStats│  │  InvStats    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  人事统计    │  │  跨企业汇总  │  │  运营统计    │              │   │
│  │  │  HRStats     │  │  GroupRollup │  │  OpStats     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  Materialized View (物化视图)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  日汇总表    │  │  月汇总表    │  │  缓存层     │              │   │
│  │  │  _daily_*    │  │  _monthly_*  │  │  Redis       │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  定时刷新 (Cron)                                      │   │
│  │  每日 01:00 → 刷新日汇总表                                           │   │
│  │  每日 02:00 → 刷新月汇总表                                           │   │
│  │  每周一 03:00 → 生成周报推送给管理者                                  │   │
│  │  每月1日 03:00 → 生成月报推送给管理者                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 三、统计 API 设计

**销售统计：**

```go
// GET /v1/reports/sales
type SalesReportRequest struct {
    Period      string `query:"period"`       // day, week, month, quarter, year
    StartDate   string `query:"start_date"`
    EndDate     string `query:"end_date"`
    GroupBy     string `query:"group_by"`     // department, employee, customer, product
    CompareType string `query:"compare"`      // mom(环比), yoy(同比)
}

type SalesReportResponse struct {
    Period         string  `json:"period"`
    TotalAmount    float64 `json:"total_amount"`
    OrderCount     int     `json:"order_count"`
    AvgOrderAmount float64 `json:"avg_order_amount"`
    MoMChange      float64 `json:"mom_change"`      // 环比变化百分比
    YoYChange      float64 `json:"yoy_change"`      // 同比变化百分比
    NewCustomers   int     `json:"new_customers"`
    Details        []SalesDetail `json:"details"`    // 按分组维度
}
```

**财务统计（账龄分析）：**

```go
// GET /v1/reports/finance/aging
type FinanceAgingResponse struct {
    TotalReceivable  float64 `json:"total_receivable"`
    Aging30          float64 `json:"aging_30"`       // 0-30天
    Aging60          float64 `json:"aging_60"`       // 31-60天
    Aging90          float64 `json:"aging_90"`       // 61-90天
    Aging180         float64 `json:"aging_180"`      // 91-180天
    AgingOver180     float64 `json:"aging_over_180"` // 180天+
    CollectionRate   float64 `json:"collection_rate"` // 回款率
    TotalPayable     float64 `json:"total_payable"`
    CashFlowForecast float64 `json:"cash_flow_forecast"` // 现金流预测
}
```

**跨企业汇总：**

```go
// GET /v1/reports/group/summary (Group Owner 专属)
type GroupSummaryResponse struct {
    Enterprises []EnterpriseKPI `json:"enterprises"`
    Total       GroupKPI        `json:"total"`
}

type EnterpriseKPI struct {
    EnterpriseID   string  `json:"enterprise_id"`
    EnterpriseName string  `json:"enterprise_name"`
    MonthlySales   float64 `json:"monthly_sales"`
    CollectionRate float64 `json:"collection_rate"`
    EmployeeCount  int     `json:"employee_count"`
    HealthScore    int     `json:"health_score"`     // 0-100
}
```

#### 四、物化视图设计

```sql
-- 日销售汇总表
CREATE TABLE _daily_sales_summary (
    enterprise_id  UUID NOT NULL,
    summary_date   DATE NOT NULL,
    total_amount   DECIMAL(12,2) DEFAULT 0,
    order_count    INT DEFAULT 0,
    new_customers  INT DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enterprise_id, summary_date)
);

-- 日财务汇总表
CREATE TABLE _daily_finance_summary (
    enterprise_id       UUID NOT NULL,
    summary_date        DATE NOT NULL,
    total_receivable    DECIMAL(12,2) DEFAULT 0,
    total_payable       DECIMAL(12,2) DEFAULT 0,
    total_collected     DECIMAL(12,2) DEFAULT 0,
    overdue_receivable  DECIMAL(12,2) DEFAULT 0,
    PRIMARY KEY (enterprise_id, summary_date)
);

-- 日库存汇总表
CREATE TABLE _daily_inventory_summary (
    enterprise_id      UUID NOT NULL,
    warehouse_id       UUID,                        -- 按仓库维度汇总（NULL 表示全仓库汇总）
    summary_date       DATE NOT NULL,
    total_stock_value  DECIMAL(12,2) DEFAULT 0,
    alert_count        INT DEFAULT 0,
    stagnant_count     INT DEFAULT 0,
    PRIMARY KEY (enterprise_id, COALESCE(warehouse_id, '00000000-0000-0000-0000-000000000000'), summary_date)
);
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **计算方式** | 物化视图 + 定时刷新 | 避免实时聚合查询拖慢数据库 |
| **刷新频率** | 每日凌晨 | 平衡实时性与性能 |
| **API 定位** | 返回计算好的指标 | Agent 负责可视化 |
| **环比/同比** | API 支持 compare 参数 | Agent 可直接展示趋势 |
| **下钻分析** | group_by 参数 | 逐层下钻定位问题 |

---

### ADR-022: 经营者数据体系架构

#### 一、设计理念

**老板看数据的本质不是"看数据"，而是"做决策"和"排除风险"。**

四层模型：
- **L1 信号灯**：公司有没有问题？→ 每天看
- **L2 预警**：什么事需要马上处理？→ 实时推
- **L3 指标**：能不能完成目标？→ 每周看
- **L4 归因**：为什么出问题？→ 按需

#### 二、信号灯 API

```go
// GET /v1/owner/dashboard
type OwnerDashboardResponse struct {
    EnterpriseID   string          `json:"enterprise_id"`
    UpdatedAt      time.Time       `json:"updated_at"`

    Revenue        HealthDimension `json:"revenue"`         // 营收健康
    CashFlow       HealthDimension `json:"cash_flow"`       // 现金流健康
    Operations     HealthDimension `json:"operations"`      // 运营健康
    HumanResources HealthDimension `json:"human_resources"` // 人力健康

    Alerts         []Alert         `json:"alerts"`          // 当前预警
}

type HealthDimension struct {
    Status    string  `json:"status"`     // green, yellow, red
    Score     int     `json:"score"`      // 0-100
    Indicators []Indicator `json:"indicators"`
}

type Indicator struct {
    Name      string      `json:"name"`
    Value     interface{} `json:"value"`
    Change    float64     `json:"change"`    // 环比变化
    Status    string      `json:"status"`     // green, yellow, red
    Threshold string      `json:"threshold"`  // 触发条件描述
}
```

**信号灯状态判定规则（可配置）：**

| 维度 | 指标 | 绿 | 黄 | 红 |
|------|------|---|---|----|
| 营收 | 月度目标完成率 | ≥ 80% | 50-80% | < 50% |
| 营收 | 环比增长 | ≥ 0% | -10%~0% | < -10% |
| 现金流 | 回款率 | ≥ 80% | 50-80% | < 50% |
| 现金流 | 逾期应收占比 | < 10% | 10-30% | > 30% |
| 运营 | 待审批积压 | < 5 | 5-20 | > 20 |
| 运营 | 库存预警数（按仓库维度） | 0 | 1-3 | > 3 |
| 人力 | 关键岗位空缺 | 0 | 1-2 | > 2 |
| 人力 | 月离职率 | < 3% | 3-8% | > 8% |

#### 三、预警规则引擎

```go
// 预警规则配置
type AlertRule struct {
    ID            UUID        `json:"id"`
    EnterpriseID  UUID        `json:"enterprise_id"`
    Code          string      `json:"code"`           // big_contract, overdue_receivable, ...
    Name          string      `json:"name"`
    Description   string      `json:"description"`
    Condition     Condition   `json:"condition"`      // 触发条件
    Channels      []string    `json:"channels"`       // ["in_app", "sms", "email"]
    Recipients    []UUID      `json:"recipients"`     // 接收人 ID
    Priority      string      `json:"priority"`       // low, normal, high, urgent
    IsEnabled     bool        `json:"is_enabled"`
    CooldownMinutes int       `json:"cooldown_minutes"` // 同一预警冷却时间
}

type Condition struct {
    Metric      string      `json:"metric"`        // contract.amount, receivable.overdue_days
    Operator    string      `json:"operator"`      // gt, lt, eq, gte, lte
    Value       interface{} `json:"value"`
    TimeWindow  string      `json:"time_window"`   // 1h, 24h, 7d
}
```

**预警规则表：**

```sql
CREATE TABLE _alert_rule (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    code           VARCHAR(100) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    condition      JSONB NOT NULL,     -- 触发条件
    channels       JSONB DEFAULT '["in_app"]',
    recipients     JSONB DEFAULT '[]',
    priority       VARCHAR(20) DEFAULT 'normal',
    is_enabled     BOOLEAN DEFAULT true,
    cooldown_min   INT DEFAULT 60,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enterprise_id, code)
);
```

#### 四、归因分析 API

```go
// GET /v1/owner/metrics/{metric}/drilldown
// 示例: "为什么这个月销售额下降了？"
type DrilldownRequest struct {
    Metric    string `query:"metric"`     // sales, collection_rate, etc.
    Period    string `query:"period"`     // month
    GroupBy   string `query:"group_by"`   // department, employee, customer, product
}

type DrilldownResponse struct {
    Metric       string          `json:"metric"`
    TotalValue   float64         `json:"total_value"`
    Change       float64         `json:"change"`
    Breakdown    []BreakdownItem `json:"breakdown"`
    TopContributors []Contributor `json:"top_contributors"` // 变化贡献最大的
}

type Contributor struct {
    Name         string  `json:"name"`
    Value        float64 `json:"value"`
    Change       float64 `json:"change"`
    Contribution float64 `json:"contribution"` // 贡献了总变化的百分之几
}
```

**归因分析示例：**

```
问: "为什么本月销售额环比下降 15%？"

API 返回:
{
  "metric": "sales",
  "total_value": 850000,
  "change": -0.15,
  "breakdown": [
    {"name": "华东区", "value": 300000, "change": -0.30, "contribution": -0.60},
    {"name": "华南区", "value": 350000, "change": +0.05, "contribution": +0.10},
    {"name": "华北区", "value": 200000, "change": -0.25, "contribution": -0.30}
  ],
  "top_contributors": [
    {"name": "华东区", "contribution": -0.60, "reason": "大客户A合同到期未续签"}
  ]
}

Agent 据此生成: "本月销售额下降 15%，主要原因是华东区下降 30%，其中大客户A合同到期未续签贡献了 60% 的降幅。"
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **信号灯判定** | 可配置阈值 | 不同企业标准不同 |
| **预警推送** | 消息系统联动 | 统一通知渠道 |
| **归因分析** | API 逐层下钻 | Agent 可自然语言引导 |
| **信号灯刷新** | 物化视图 + 5分钟缓存 | 平衡实时性与性能 |
| **预警冷却** | 同一预警 N 分钟内不重复 | 避免轰炸 |

---

### ADR-023: 运营商客制化服务架构

#### 一、核心场景

**企业经营者不知道怎么配置系统，运营商通过 Agent 对话调用专属 Skill 提供客制化配置服务。**

```
运营商（你）对 Agent 说:
"帮我给企业 X 做初始化配置：
  1. 应用制造业模板
  2. 增加一个研发部
  3. 合同审批金额阈值改为 10 万
  4. 给客户添加'结算方式'字段
  5. 配置库存低于 50 台预警通知老板"

Agent 依次调用:
  → operator_template_apply(manufacturing, enterprise_id)
  → org_department_create(研发部, enterprise_id)
  → operator_workflow_configure(contract_approval, threshold=100000)
  → operator_custom_field_configure(customer, 结算方式, enum)
  → operator_alert_configure(inventory_low, threshold=50, notify=owner)

企业 X 配置完成，员工开始使用
```

#### 二、行业模板系统

```sql
-- 行业模板表
CREATE TABLE _industry_template (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(50) UNIQUE NOT NULL, -- manufacturing, trading, service, retail
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    version        VARCHAR(20) DEFAULT '1.0.0',
    is_system      BOOLEAN DEFAULT false,        -- 系统内置 vs 运营商自建
    is_active      BOOLEAN DEFAULT true,
    created_by     UUID,                          -- NULL=系统内置
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模板内容表（每个模板包含的配置项）
CREATE TABLE _template_content (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id    UUID NOT NULL REFERENCES _industry_template(id),
    section        VARCHAR(50) NOT NULL, -- departments, workflows, custom_fields, alert_rules, dashboard
    config         JSONB NOT NULL,       -- 该部分的完整配置
    sort_order     INT DEFAULT 0,
    UNIQUE(template_id, section)
);
```

**制造业模板示例：**

```json
{
  "template_code": "manufacturing",
  "name": "制造业模板",
  "sections": {
    "departments": [
      {"name": "销售部", "manager_role": "department_manager"},
      {"name": "生产部", "manager_role": "department_manager"},
      {"name": "仓储部", "manager_role": "department_manager"},
      {"name": "质检部", "manager_role": "department_manager"},
      {"name": "财务部", "manager_role": "department_manager"},
      {"name": "人事部", "manager_role": "department_manager"}
    ],
    "workflows": [
      {
        "name": "采购审批",
        "module": "purchase_order",
        "nodes": [
          {"type": "department_manager", "condition": null},
          {"type": "enterprise_admin", "condition": "amount >= 50000"}
        ]
      },
      {
        "name": "合同审批",
        "module": "contract",
        "nodes": [
          {"type": "department_manager", "condition": null},
          {"type": "enterprise_admin", "condition": "amount >= 100000"}
        ]
      }
    ],
    "custom_fields": [
      {"entity": "product", "name": "bom_code", "label": "BOM编号", "type": "string", "required": true},
      {"entity": "customer", "name": "industry", "label": "行业分类", "type": "enum", "options": ["汽车", "电子", "机械", "食品", "其他"]},
      {"entity": "employee", "name": "skill_level", "label": "技能等级", "type": "enum", "options": ["初级", "中级", "高级", "专家"]}
    ],
    "alert_rules": [
      {"code": "inventory_low", "name": "库存低于安全线", "condition": {"metric": "inventory.quantity", "operator": "lt", "value": 30}, "channels": ["in_app"]},
      {"code": "big_contract", "name": "大额合同审批", "condition": {"metric": "contract.amount", "operator": "gte", "value": 100000}, "channels": ["in_app", "sms"]}
    ],
    "dashboard": {
      "revenue_score_threshold": {"green": 80, "yellow": 50},
      "cashflow_score_threshold": {"green": 80, "yellow": 50}
    }
  }
}
```

#### 三、运营商配置 Skill 定义

```json
{
  "skill_name": "operator_setup",
  "display_name": "运营商企业配置",
  "description": "帮运营商为客户企业做初始化和客制化配置",
  "role_openings": {
    "operator": {
      "opening": "您好！我是运营商配置助手，可以帮您为客户企业做以下配置：",
      "available_actions": [
        "template_apply", "enterprise_setup", "department_configure",
        "workflow_configure", "custom_field_configure", "alert_configure",
        "dashboard_configure", "config_preview", "config_snapshot"
      ]
    }
  },
  "actions": {
    "template_apply": {
      "label": "应用行业模板",
      "description": "将行业模板应用到指定企业，自动创建部门、审批流、自定义字段等",
      "parameters": [
        {"name": "template_code", "type": "enum", "required": true, "options": ["manufacturing", "trading", "service", "retail"]},
        {"name": "enterprise_id", "type": "uuid", "required": true}
      ]
    },
    "enterprise_setup": {
      "label": "一键初始化企业",
      "description": "创建部门结构、设置经理、配置基础审批流",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "departments", "type": "array", "required": true},
        {"name": "approval_rules", "type": "object", "required": false}
      ]
    },
    "custom_field_configure": {
      "label": "批量配置自定义字段",
      "description": "为一个或多个实体添加自定义字段",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "fields", "type": "array", "required": true, "description": "字段定义列表"}
      ]
    },
    "workflow_configure": {
      "label": "对话式配置审批流",
      "description": "通过对话方式配置审批流程",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "workflow_name", "type": "string", "required": true},
        {"name": "module", "type": "enum", "required": true, "options": ["contract", "purchase_order", "sale_order", "payment_request"]},
        {"name": "nodes", "type": "array", "required": true}
      ]
    },
    "alert_configure": {
      "label": "配置预警规则",
      "description": "为指定企业配置预警规则",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "rules", "type": "array", "required": true}
      ]
    },
    "dashboard_configure": {
      "label": "配置经营者信号灯",
      "description": "配置信号灯的阈值和指标",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "dimensions", "type": "object", "required": true}
      ]
    },
    "config_preview": {
      "label": "预览配置变更",
      "description": "执行前展示即将变更的配置清单，确认后才执行",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true},
        {"name": "pending_changes", "type": "array", "required": true}
      ],
      "require_confirmation": true
    },
    "config_snapshot": {
      "label": "查看企业配置全景",
      "description": "查看指定企业的完整配置状态",
      "parameters": [
        {"name": "enterprise_id", "type": "uuid", "required": true}
      ]
    }
  }
}
```

#### 四、配置预览与确认机制

```
运营商: "帮企业X添加自定义字段：客户来源（枚举：线上/线下/转介绍）"
    ↓
Agent 调用: operator_setup config_preview
    ↓
返回预览:
┌───────────────────────────────────────────────────┐
│  配置变更预览 - 企业X                              │
├───────────────────────────────────────────────────┤
│  变更类型: 新增自定义字段                           │
│  实体: 客户 (crm_customer)                         │
│  字段名: source                                    │
│  显示名: 客户来源                                  │
│  类型: enum                                        │
│  选项: 线上 / 线下 / 转介绍                        │
│  必填: 否                                          │
├───────────────────────────────────────────────────┤
│  影响范围: 该企业所有客户将新增此字段               │
│  已有客户数据: 不受影响（新字段默认为空）           │
├───────────────────────────────────────────────────┤
│  确认执行？ [是/否]                                │
└───────────────────────────────────────────────────┘
    ↓
运营商确认: "是"
    ↓
Agent 调用: operator_setup custom_field_configure
    ↓
配置完成，审计日志记录
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **配置方式** | Agent Skill 调用 | 符合无前端理念，运营商自然语言操作 |
| **模板起点** | 行业模板一键应用 | 降低初始化成本，避免从零配置 |
| **模板来源** | 系统内置 + 运营商自建 | 灵活扩展 |
| **安全机制** | 预览确认 + 审计日志 | 防误操作、可追责 |
| **配置联动** | 自动联动业务事件 | 配置的预警规则自动生效 |

---

### ADR-024: 审计日志增强架构

#### 一、变更追踪设计

```sql
-- 业务数据变更日志表（替代原有简单审计日志）
CREATE TABLE _change_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id   UUID NOT NULL,

    -- 谁
    user_id         UUID NOT NULL,
    user_name       VARCHAR(100),
    user_roles      VARCHAR(50)[] DEFAULT '{}',

    -- 做了什么
    action          VARCHAR(20) NOT NULL, -- create, update, delete
    entity_type     VARCHAR(50) NOT NULL, -- contract, customer, employee
    entity_id       UUID NOT NULL,

    -- 变更内容
    before_values   JSONB,          -- 变更前值（create 时为 null）
    after_values    JSONB,          -- 变更后值（delete 时为 null）
    changed_fields  VARCHAR(100)[], -- 仅变更的字段名列表

    -- 变更归类
    is_sensitive    BOOLEAN DEFAULT false, -- 金额变更、删除操作等
    sensitivity_type VARCHAR(50),          -- amount_change, deletion, permission_change

    -- 上下文
    request_id      VARCHAR(50),
    client_ip       VARCHAR(50),
    user_agent      VARCHAR(255),

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_changelog_entity ON _change_log(enterprise_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_changelog_user ON _change_log(enterprise_id, user_id, created_at DESC);
CREATE INDEX idx_changelog_sensitive ON _change_log(enterprise_id, is_sensitive, created_at DESC) WHERE is_sensitive = true;
```

#### 二、版本链查询

```go
// GET /v1/audit-logs/entity/{entity_type}/{entity_id}/history
type EntityHistoryResponse struct {
    EntityType string          `json:"entity_type"`
    EntityID   UUID            `json:"entity_id"`
    Versions   []EntityVersion `json:"versions"`
}

type EntityVersion struct {
    Version      int             `json:"version"`
    Action       string          `json:"action"`
    ChangedBy    string          `json:"changed_by"`
    ChangedAt    time.Time       `json:"changed_at"`
    ChangedFields []string       `json:"changed_fields"`
    Snapshot     interface{}     `json:"snapshot"`  // 该版本的完整数据快照
    Diff         []FieldDiff     `json:"diff"`      // 与上一版本的差异
}

type FieldDiff struct {
    Field  string      `json:"field"`
    Before interface{} `json:"before"`
    After  interface{} `json:"after"`
}
```

#### 三、敏感操作告警

```go
// 敏感操作自动触发告警
type SensitiveOperationDetector struct {
    rules []SensitiveRule
}

var DefaultSensitiveRules = []SensitiveRule{
    {EntityType: "contract", Field: "amount", ChangeType: "any", AlertLevel: "high"},
    {EntityType: "*", Action: "delete", AlertLevel: "urgent"},
    {EntityType: "employee", Field: "roles", ChangeType: "any", AlertLevel: "high"},
    {EntityType: "contract", Field: "status", FromValue: "approved", AlertLevel: "high"},
}

func (d *SensitiveOperationDetector) Check(change *ChangeLog) *Alert {
    for _, rule := range d.rules {
        if rule.Match(change) {
            return &Alert{
                Type:    "sensitive_operation",
                Level:   rule.AlertLevel,
                Message: fmt.Sprintf("敏感操作：%s %s 的 %s 被 %s 修改", change.Action, change.EntityType, rule.Field, change.UserName),
            }
        }
    }
    return nil
}
```

#### 四、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **变更存储** | before/after JSONB | 完整记录，支持 diff 展示 |
| **版本快照** | 按需重建 | 不存储完整快照，节省空间，通过重放变更链构建 |
| **敏感检测** | 规则引擎 | 灵活可配置 |
| **索引策略** | 部分索引 (is_sensitive=true) | 敏感操作查询高效 |

---

### ADR-025: 数据导入导出架构

#### 一、通用导入框架

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         数据导入流程                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 下载模板                                                                 │
│     GET /v1/import/template?entity=customer                                  │
│     → 返回标准 Excel/CSV 模板                                                │
│                                                                              │
│  2. 上传文件                                                                 │
│     POST /v1/import/upload                                                   │
│     → 返回 import_id                                                         │
│                                                                              │
│  3. 预校验                                                                   │
│     POST /v1/import/{import_id}/validate                                     │
│     → 返回校验结果：总行数、有效行数、错误行详情                              │
│                                                                              │
│  4. 确认导入                                                                 │
│     POST /v1/import/{import_id}/execute                                      │
│     → 参数：strategy（skip/overwrite/merge）                                 │
│     → 返回：成功数、跳过数、失败数                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、重复检测策略

```go
type DuplicateStrategy string

const (
    DuplicateSkip      DuplicateStrategy = "skip"      // 跳过重复行
    DuplicateOverwrite DuplicateStrategy = "overwrite" // 用新数据覆盖
    DuplicateMerge     DuplicateStrategy = "merge"     // 合并（新数据补充空字段）
)

type DuplicateDetector struct {
    entityConfigs map[string]DuplicateKeyConfig
}

// 重复检测键配置
type DuplicateKeyConfig struct {
    EntityType  string   `json:"entity_type"`
    KeyFields   []string `json:"key_fields"`   // customer: ["name"], employee: ["email"]
    MatchRule   string   `json:"match_rule"`   // exact, fuzzy
}
```

#### 三、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **导入方式** | 上传→校验→确认 | 防止误导入 |
| **重复策略** | 可选（skip/overwrite/merge） | 灵活应对不同场景 |
| **模板格式** | Excel + CSV | 企业用户 Excel 为主 |
| **导入大小** | 最大 10000 行/次 | 防止超时，大批量分批导入 |

---

### ADR-026: Webhook 与事件订阅架构

#### 一、架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Webhook 架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  业务事件触发                                                                │
│  (合同创建/审批通过/库存预警/回款登记...)                                    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Event Dispatcher                                   │   │
│  │  1. 匹配该企业的 Webhook 订阅规则                                     │   │
│  │  2. 过滤不匹配的事件                                                 │   │
│  │  3. 构建 Payload + HMAC 签名                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Delivery Queue (Redis Stream)                      │   │
│  │  异步投递，不阻塞业务流程                                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    HTTP Delivery Worker                               │   │
│  │  POST → 目标 URL                                                     │   │
│  │  失败重试: 1min → 5min → 30min → 2h → 8h (最多 5 次)               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Delivery Log (PostgreSQL)                          │   │
│  │  记录每次投递的请求/响应/状态码/耗时                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、数据模型

```sql
-- Webhook 端点表
CREATE TABLE _webhook_endpoint (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(200) NOT NULL,
    url            VARCHAR(500) NOT NULL,
    secret         VARCHAR(100) NOT NULL,  -- HMAC 签名密钥
    is_active      BOOLEAN DEFAULT true,
    created_by     UUID NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook 事件订阅表
CREATE TABLE _webhook_subscription (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id    UUID NOT NULL REFERENCES _webhook_endpoint(id),
    event_type     VARCHAR(100) NOT NULL, -- contract.created, approval.approved, etc.
    filter         JSONB DEFAULT '{}',    -- 事件过滤条件
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint_id, event_type)
);

-- Webhook 投递日志表
CREATE TABLE _webhook_delivery (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id    UUID NOT NULL REFERENCES _webhook_endpoint(id),
    event_type     VARCHAR(100) NOT NULL,
    event_id       UUID NOT NULL,

    -- 请求
    request_headers JSONB,
    request_body    JSONB,

    -- 响应
    response_status INT,
    response_body   TEXT,
    duration_ms     INT,

    -- 重试
    attempt_count   INT DEFAULT 1,
    next_retry_at   TIMESTAMP,
    last_error      TEXT,

    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, abandoned

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_endpoint ON _webhook_endpoint(enterprise_id, is_active);
CREATE INDEX idx_webhook_delivery ON _webhook_delivery(endpoint_id, status, created_at DESC);
```

#### 三、Webhook Payload 格式

```json
{
  "event_id": "evt_abc123",
  "event_type": "contract.created",
  "timestamp": "2024-07-04T10:30:00Z",
  "enterprise_id": "ent_001",
  "data": {
    "id": "con_xyz789",
    "title": "销售合同A",
    "amount": 100000,
    "customer_id": "cust_001",
    "status": "pending_approval",
    "created_by": "user_xxx"
  },
  "signature": "sha256=abc123def456..."
}
```

#### 四、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **投递方式** | 异步队列 | 不阻塞业务流程 |
| **重试策略** | 指数退避，最多 5 次 | 平衡可靠性与资源消耗 |
| **签名验证** | HMAC-SHA256 | 接收方可验证请求来源 |
| **事件过滤** | JSONB 条件 | 灵活过滤，减少无效投递 |
| **投递日志** | 持久化到 PostgreSQL | 可查询、可排查 |

---

### ADR-027: 客户成功与健康度架构

#### 一、健康度评分模型

```go
// 企业健康度评分
type EnterpriseHealthScore struct {
    EnterpriseID   string  `json:"enterprise_id"`
    OverallScore   int     `json:"overall_score"`    // 0-100
    ActivityScore  int     `json:"activity_score"`   // 活跃度评分
    AdoptionScore  int     `json:"adoption_score"`   // 功能采纳评分
    EngagementScore int    `json:"engagement_score"` // 参与度评分
    ChurnRisk      string  `json:"churn_risk"`      // low, medium, high, critical
    LastActiveAt   time.Time `json:"last_active_at"`
}
```

**评分权重：**

| 维度 | 权重 | 计算逻辑 |
|------|------|---------|
| **活跃度** | 40% | 最近 30 天 API 调用量 / 预期调用量 |
| **功能采纳** | 30% | 已使用的功能模块数 / 总可用模块数 |
| **参与度** | 30% | 登录人数 / 总员工数 + 主动操作占比 |

#### 二、流失预警

```go
// 流失风险检测
type ChurnRiskDetector struct {
    inactiveDaysThreshold int // 默认 7 天
}

func (d *ChurnRiskDetector) Check(enterprise *Enterprise) ChurnRisk {
    daysSinceActive := time.Since(enterprise.LastAPICallAt).Hours() / 24

    switch {
    case daysSinceActive >= 30:
        return ChurnRiskCritical
    case daysSinceActive >= 14:
        return ChurnRiskHigh
    case daysSinceActive >= 7:
        return ChurnRiskMedium
    default:
        return ChurnRiskLow
    }
}
```

#### 三、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **评分频率** | 每日计算 | 平衡实时性与计算成本 |
| **存储方式** | Redis 缓存 + PostgreSQL 持久化 | 快速查询 + 历史追溯 |
| **流失阈值** | 可配置 | 不同行业标准不同 |

---

### ADR-028: 知识库增强架构

#### 一、混合检索架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         知识库混合检索架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  用户/Agent 查询: "公司的差旅报销标准是什么？"                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Query Router                                      │   │
│  │  判断查询类型：精确关键词 → 全文检索，模糊语义 → 向量检索            │   │
│  └───────────────────────┬──────────────────────────────────────────────┘   │
│                          │                                                  │
│              ┌───────────┼───────────┐                                      │
│              ▼                       ▼                                      │
│  ┌──────────────────┐  ┌──────────────────┐                               │
│  │  全文检索        │  │  向量检索        │                               │
│  │  PostgreSQL      │  │  PG Vector       │                               │
│  │  ts_vector       │  │  ivfflat 索引    │                               │
│  └────────┬─────────┘  └────────┬─────────┘                               │
│           │                       │                                          │
│           └───────────┬───────────┘                                          │
│                       ▼                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Result Merger & Ranker                            │   │
│  │  按权重合并：全文权重 0.3 + 向量权重 0.7                            │   │
│  │  去重 + 重排序                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                       │                                                      │
│                       ▼                                                      │
│               返回 Top-K 结果                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、版本管理

```sql
-- 文档版本表
CREATE TABLE kb_document_version (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id    UUID NOT NULL REFERENCES kb_document(id),
    version        INT NOT NULL DEFAULT 1,
    content_hash   VARCHAR(64) NOT NULL,       -- SHA-256 内容指纹
    storage_path   VARCHAR(500) NOT NULL,
    uploaded_by    UUID NOT NULL,
    change_summary TEXT,                        -- 版本变更说明
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version)
);

-- 文档主表增加版本字段
ALTER TABLE kb_document ADD COLUMN current_version INT DEFAULT 1;
ALTER TABLE kb_document ADD COLUMN visibility VARCHAR(20) DEFAULT 'all'; -- all, department, role, specific
ALTER TABLE kb_document ADD COLUMN allowed_departments UUID[] DEFAULT '{}';
ALTER TABLE kb_document ADD COLUMN allowed_roles VARCHAR(50)[] DEFAULT '{}';
ALTER TABLE kb_document ADD COLUMN tags VARCHAR(100)[] DEFAULT '{}';
ALTER TABLE kb_document ADD COLUMN category VARCHAR(200); -- 分类路径：公司制度/财务/报销
```

#### 三、自动入档

```go
// 业务事件自动触发知识库入档
type AutoArchiveRule struct {
    EntityType  string `json:"entity_type"`  // contract, policy
    EventType   string `json:"event_type"`   // created, approved
    Category    string `json:"category"`     // 知识库分类
    Tags        []string `json:"tags"`
    IsEnabled   bool   `json:"is_enabled"`
}

var DefaultAutoArchiveRules = []AutoArchiveRule{
    {EntityType: "contract", EventType: "approved", Category: "合同档案", Tags: ["合同", "已审批"]},
    // 新的政策文件上传时自动归入知识库
}
```

#### 四、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **混合检索** | 全文 + 向量双路召回 | 覆盖精确匹配和语义匹配 |
| **权重分配** | 向量 0.7 + 全文 0.3 | 语义为主，关键词为辅 |
| **版本管理** | 版本链 + 内容指纹 | 支持对比和回退 |
| **权限控制** | 可见范围 (visibility) | 按部门/角色/指定人员 |
| **自动入档** | 事件驱动 | 减少手动上传 |

---

### ADR-029: CRM 客户管理增强架构

#### 一、客户分级与标签体系

```sql
-- 客户分级定义表（企业可自定义）
CREATE TABLE crm_customer_level (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,    -- vip, important, normal, potential
    name           VARCHAR(200) NOT NULL,   -- VIP客户, 重要客户, 普通客户, 潜在客户
    description    TEXT,
    auto_rule      JSONB,                   -- 自动升级规则：{metric: "annual_purchase", operator: "gte", value: 1000000}
    sort_order     INT DEFAULT 0,
    is_system      BOOLEAN DEFAULT false,   -- 系统预置 vs 企业自建
    UNIQUE(enterprise_id, code)
);

-- 客户标签表
CREATE TABLE crm_customer_tag (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    name           VARCHAR(100) NOT NULL,   -- 战略合作, 价格敏感, 续约客户
    color          VARCHAR(7),              -- 显示颜色 #FF5733
    created_by     UUID NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enterprise_id, name)
);

-- 客户-标签关联表
CREATE TABLE crm_customer_tag_relation (
    customer_id    UUID NOT NULL REFERENCES crm_customer(id),
    tag_id         UUID NOT NULL REFERENCES crm_customer_tag(id),
    PRIMARY KEY (customer_id, tag_id)
);

-- 联系人表（增强：角色标记、首要联系人）
CREATE TABLE crm_contact (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id    UUID NOT NULL REFERENCES crm_customer(id),
    name           VARCHAR(100) NOT NULL,
    position       VARCHAR(100),               -- 职位
    phone          VARCHAR(50),
    email          VARCHAR(255),
    wechat         VARCHAR(100),               -- 微信号
    role_mark      VARCHAR(30) DEFAULT 'daily_contact', -- decision_maker, influencer, daily_contact
    is_primary     BOOLEAN DEFAULT false,       -- 是否首要联系人
    remark         TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_customer ON crm_contact(customer_id);
CREATE INDEX idx_contact_role ON crm_contact(customer_id, role_mark);

-- 客户名称唯一约束（同一企业内）
ALTER TABLE crm_customer ADD CONSTRAINT uq_customer_name UNIQUE (enterprise_id, name);
```

#### 二、客户全景视图 API

```go
// GET /v1/customers/{id}/profile
type CustomerProfileResponse struct {
    Customer     Customer          `json:"customer"`
    Level        CustomerLevel     `json:"level"`
    Tags         []CustomerTag     `json:"tags"`
    Contacts     []Contact         `json:"contacts"`
    Opportunities []Opportunity    `json:"opportunities"`
    Contracts    []ContractSummary `json:"contracts"`     // 关联合同摘要
    ServiceOrders []ServiceSummary `json:"service_orders"` // 关联售后工单摘要
    Payments     PaymentSummary    `json:"payments"`      // 回款汇总
    Statistics   CustomerStats     `json:"statistics"`    // 客户统计指标
}

type CustomerStats struct {
    TotalContractAmount float64 `json:"total_contract_amount"` // 累计合同金额
    TotalPaidAmount     float64 `json:"total_paid_amount"`     // 累计回款金额
    OutstandingAmount   float64 `json:"outstanding_amount"`    // 未回款金额
    ContractCount       int     `json:"contract_count"`        // 合同总数
    ServiceOrderCount   int     `json:"service_order_count"`   // 售后工单总数
    FirstCooperateDate  string  `json:"first_cooperate_date"`  // 首次合作日期
    LastActivityDate    string  `json:"last_activity_date"`    // 最近活动日期
}
```

#### 三、关联查询 API

```go
// GET /v1/customers/{id}/contracts
type CustomerContractsResponse struct {
    CustomerID UUID              `json:"customer_id"`
    Contracts  []ContractSummary `json:"contracts"`
    Summary    struct {
        TotalCount   int     `json:"total_count"`
        ActiveCount  int     `json:"active_count"`
        TotalAmount  float64 `json:"total_amount"`
    } `json:"summary"`
}

// GET /v1/customers/{id}/service-orders
type CustomerServiceOrdersResponse struct {
    CustomerID    UUID            `json:"customer_id"`
    ServiceOrders []ServiceSummary `json:"service_orders"`
    Summary       struct {
        TotalCount  int `json:"total_count"`
        OpenCount   int `json:"open_count"`
        ClosedCount int `json:"closed_count"`
    } `json:"summary"`
}
```

#### 四、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **客户唯一性** | 企业内公司名称唯一 | 避免重复客户，便于关联查询 |
| **联系人** | 一客户多联系人 + 角色标记 | 匹配真实商务场景（决策人/对接人） |
| **首要联系人** | 布尔标记 | Agent 默认联系首要联系人 |
| **分级体系** | 预置 + 自定义 + 自动规则 | 兼顾开箱即用和灵活性 |
| **标签** | 多对多自由标签 | 灵活分类，支持多维度标记 |
| **全景视图** | 单 API 聚合返回 | Agent 一次调用获取完整画像 |
| **关联查询** | 独立 API + 摘要模式 | 灵活查询，避免数据冗余 |
| **行业分类** | 枚举字段 | 标准化，便于统计筛选 |

---

### ADR-030: 财务管理增强 — 合同回款追踪与现金流架构

#### 一、核心场景

**经营者最关心的问题：**
- "这份合同回了多少钱？还差多少？"
- "哪些合同该回款了？谁去催？"
- "下个月公司账上有多少钱？够不够付？"

#### 二、合同回款追踪架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    合同回款追踪架构                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  合同 (con_contract)                                                         │
│  ├── 合同金额: 1,000,000                                                     │
│  ├── 回款计划 (con_payment_plan)                                             │
│  │   ├── 节点1: 签约付 30% → 300,000 → 预计 7/1 → 已回款 ✓               │
│  │   ├── 节点2: 交付付 50% → 500,000 → 预计 8/1 → 待回款 (即将到期)       │
│  │   └── 节点3: 验收付 20% → 200,000 → 预计 9/1 → 待回款                  │
│  │                                                                          │
│  ├── 回款记录 (fin_collection)                                               │
│  │   ├── 7/1 回款 300,000 → 关联节点1 → 凭证: 银行回单.pdf               │
│  │   └── ...                                                                │
│  │                                                                          │
│  └── 回款汇总                                                                │
│      ├── 应收总额: 1,000,000                                                 │
│      ├── 已回款: 300,000 (30%)                                               │
│      ├── 未回款: 700,000 (70%)                                               │
│      └── 逾期: 0                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 三、数据模型

```sql
-- 合同回款计划表
CREATE TABLE con_payment_plan (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id    UUID NOT NULL REFERENCES con_contract(id),
    node_name      VARCHAR(200) NOT NULL,    -- "签约定金", "交付款", "验收尾款"
    plan_amount    DECIMAL(12,2) NOT NULL,   -- 计划回款金额
    plan_date      DATE NOT NULL,            -- 预计回款日期
    actual_date    DATE,                     -- 实际回款日期
    actual_amount  DECIMAL(12,2) DEFAULT 0,  -- 实际回款金额
    status         VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, partial, completed, overdue
    responsible_id UUID REFERENCES _employee(id), -- 负责催款的员工
    sort_order     INT DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_plan_contract ON con_payment_plan(contract_id, sort_order);
CREATE INDEX idx_payment_plan_overdue ON con_payment_plan(status) WHERE status = 'overdue';

-- 回款记录增加凭证关联
ALTER TABLE fin_collection ADD COLUMN payment_plan_node_id UUID REFERENCES con_payment_plan(id);
ALTER TABLE fin_collection ADD COLUMN voucher_file_keys VARCHAR(50)[] DEFAULT '{}'; -- 凭证附件文件key列表

-- 合同增加回款汇总字段（冗余缓存，定期刷新）
ALTER TABLE con_contract ADD COLUMN total_collected DECIMAL(12,2) DEFAULT 0;
ALTER TABLE con_contract ADD COLUMN total_uncollected DECIMAL(12,2) DEFAULT 0;
ALTER TABLE con_contract ADD COLUMN collection_rate DECIMAL(5,4) DEFAULT 0; -- 0.0000 ~ 1.0000
```

#### 四、催款提醒流程

```
每日定时任务 (02:00)
    │
    ▼
扫描所有回款计划节点
    │
    ├── 状态 = pending 且 plan_date - N天 <= 今天
    │   → 发送催款提醒给负责员工："合同X的节点Y即将到期，请催款"
    │
    ├── 状态 = pending 且 plan_date < 今天
    │   → 标记状态 = overdue
    │   → 发送逾期通知给负责员工 + 部门经理
    │
    └── 状态 = overdue 且逾期天数 > 7
        → 升级通知企业管理员
```

#### 五、现金流预测 API

```go
// GET /v1/reports/finance/cashflow-forecast
type CashFlowForecastRequest struct {
    Months int `query:"months"` // 预测未来 N 个月，默认 6
}

type CashFlowForecastResponse struct {
    EnterpriseID string              `json:"enterprise_id"`
    Months       []MonthlyCashFlow   `json:"months"`
    Summary      CashFlowSummary     `json:"summary"`
}

type MonthlyCashFlow struct {
    Month           string  `json:"month"`             // "2024-08"
    ExpectedInflow  float64 `json:"expected_inflow"`  // 预计流入（应收到期）
    ExpectedOutflow float64 `json:"expected_outflow"` // 预计流出（应付到期）
    NetCashFlow     float64 `json:"net_cash_flow"`    // 净现金流
    CumulativeCash  float64 `json:"cumulative_cash"`  // 累计现金流
    RiskLevel       string  `json:"risk_level"`       // safe, warning, danger
}

type CashFlowSummary struct {
    TotalInflow6M   float64 `json:"total_inflow_6m"`
    TotalOutflow6M  float64 `json:"total_outflow_6m"`
    MinCashPosition float64 `json:"min_cash_position"` // 6个月内最低现金位
    DeficitMonth    string  `json:"deficit_month"`     // 首次出现缺口月份
}
```

**现金流预测逻辑：**

```
第N月预计流入 = 该月到期的应收款总额 × 历史回款率
第N月预计流出 = 该月到期的应付款总额
第N月净现金流 = 预计流入 - 预计流出
累计现金流 = 上月累计 + 本月净现金流

风险判定:
  累计现金流 > 0       → safe
  累计现金流 > -10万    → warning
  累计现金流 <= -10万   → danger
```

#### 六、往来款对账 API

```go
// GET /v1/finance/reconciliation?customer_id=xxx
type ReconciliationResponse struct {
    CustomerID    string              `json:"customer_id"`
    CustomerName  string              `json:"customer_name"`
    TotalReceivable float64           `json:"total_receivable"`
    TotalCollected  float64           `json:"total_collected"`
    TotalUncollected float64          `json:"total_uncollected"`
    OverdueAmount   float64           `json:"overdue_amount"`
    Details        []ReconciliationDetail `json:"details"`
}

type ReconciliationDetail struct {
    ContractID    string  `json:"contract_id"`
    ContractNo    string  `json:"contract_no"`
    Amount        float64 `json:"amount"`
    Collected     float64 `json:"collected"`
    Uncollected   float64 `json:"uncollected"`
    LastPaidDate  string  `json:"last_paid_date"`
    NextDueDate   string  `json:"next_due_date"`
    Status        string  `json:"status"` // current, overdue
}
```

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **回款计划** | 合同级多节点 | 匹配真实商务场景（分阶段付款） |
| **催款提醒** | 到期前 N 天 + 逾期升级 | 渐进式，避免遗漏 |
| **凭证管理** | 回款记录关联附件 | 便于对账和审计 |
| **现金流预测** | 基于到期日 + 历史回款率 | 简单有效，不追求复杂模型 |
| **回款汇总缓存** | 冗余字段 + 定时刷新 | 避免每次查询聚合 |

---

### ADR-031: 企业专属 Skill 矩阵架构

#### 一、设计理念

**不同企业的 Skill 不应该完全一样。** 运营商通过客制化，让每个企业的 Agent 呈现不同的 Skill 矩阵。

```
贸易公司 A 的 Agent 打开后看到:
┌─────────────────────────────────────────────┐
│  您好！我是您的业务助手，可以帮您：           │
│  1. 合同管理（含贸易条款、出口/内销分类）     │
│  2. 销售管理（含FOB/CIF价格条款）            │
│  3. 库存管理（含批次号、效期管理）            │
│  4. 客户管理（含客户分级、往来款查看）        │
│  5. 财务管理（含回款催款、现金流查看）        │
└─────────────────────────────────────────────┘

制造公司 B 的 Agent 打开后看到:
┌─────────────────────────────────────────────┐
│  您好！我是您的业务助手，可以帮您：           │
│  1. 合同管理（含BOM编号、交付周期）           │
│  2. 生产管理（含工单、排产）                  │
│  3. 质检管理（含质检标准、不合格处理）        │
│  4. 库存管理（含安全库存预警、周转率）        │
│  5. 客户管理（含客户分级、往来款查看）        │
│  6. 财务管理（含回款催款、现金流查看）        │
└─────────────────────────────────────────────┘
```

#### 二、Skill 矩阵数据模型

```sql
-- 企业 Skill 配置表（覆盖系统默认配置）
CREATE TABLE _enterprise_skill_config (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    skill_name     VARCHAR(100) NOT NULL,    -- contract, customer, inventory

    -- 覆盖配置
    is_enabled     BOOLEAN DEFAULT true,     -- 该企业是否启用此 Skill
    custom_opening TEXT,                     -- 自定义开场白（覆盖默认）
    custom_actions JSONB,                    -- 自定义操作列表（覆盖默认）
    custom_params  JSONB,                    -- 自定义参数定义（覆盖默认，如增加字段）
    custom_examples JSONB DEFAULT '[]',      -- 自定义示例

    -- 优先级和排序
    sort_order     INT DEFAULT 0,            -- Skill 显示顺序
    role_overrides JSONB DEFAULT '{}',       -- 角色化开场白覆盖

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enterprise_id, skill_name)
);

CREATE INDEX idx_ent_skill_enterprise ON _enterprise_skill_config(enterprise_id, is_enabled);
```

#### 三、Skill 加载流程

```
Agent/CLI 请求: GET /v1/skills
    │
    ▼
1. 获取系统内置 Skill 列表
    │
    ▼
2. 查询该企业的 _enterprise_skill_config
    │
    ▼
3. 合并逻辑:
   ├── 企业 is_enabled = false → 移除该 Skill
   ├── 企业有 custom_opening → 覆盖默认开场白
   ├── 企业有 custom_actions → 覆盖默认操作列表
   ├── 企业有 custom_params → 追加/覆盖参数定义
   ├── 企业有 role_overrides → 覆盖角色化开场白
   └── 企业有 sort_order → 按企业自定义排序
    │
    ▼
4. 按功能开关过滤（ADR-018）
    │
    ▼
5. 返回该企业专属的 Skill 矩阵
```

#### 四、行业模板含 Skill 矩阵预设

```json
// 行业模板增加 skill_matrix 配置
{
  "template_code": "manufacturing",
  "sections": {
    "skill_matrix": {
      "enabled_skills": ["contract", "customer", "inventory", "production", "quality", "finance", "hrm"],
      "disabled_skills": ["tender", "project"],
      "skill_overrides": {
        "contract": {
          "custom_opening": "您好！我是合同管理助手。作为制造企业，您可以：",
          "custom_params": {
            "bom_code": {"label": "BOM编号", "type": "string", "required": false},
            "delivery_cycle": {"label": "交付周期(天)", "type": "int", "required": true}
          }
        },
        "inventory": {
          "custom_opening": "您好！我是库存管理助手。您可以查看安全库存和周转率：",
          "custom_actions": ["list", "check_alert", "view_turnover", "adjust"]
        }
      },
      "skill_order": ["contract", "production", "inventory", "quality", "customer", "finance", "hrm"]
    }
  }
}
```

#### 五、运营商 Skill 配置 Skill

```json
{
  "skill_name": "operator_skill_configure",
  "display_name": "企业 Skill 矩阵配置",
  "actions": {
    "list_skills": {
      "label": "查看企业 Skill 矩阵",
      "description": "查看指定企业当前的 Skill 列表和配置"
    },
    "enable_skill": {
      "label": "启用 Skill",
      "description": "为指定企业启用某个 Skill"
    },
    "disable_skill": {
      "label": "禁用 Skill",
      "description": "为指定企业禁用某个 Skill（如制造企业不需要投标管理）"
    },
    "customize_skill": {
      "label": "客制化 Skill",
      "description": "为指定企业自定义 Skill 的开场白、操作、字段、示例",
      "require_confirmation": true
    },
    "reorder_skills": {
      "label": "调整 Skill 顺序",
      "description": "调整企业 Skill 的显示顺序"
    },
    "reset_to_default": {
      "label": "重置为默认",
      "description": "移除企业自定义配置，恢复系统默认"
    }
  }
}
```

#### 六、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **配置方式** | 覆盖模式（企业配置覆盖系统默认） | 保留默认，仅存差异 |
| **行业模板** | 含预设 Skill 矩阵 | 一键应用，降低配置成本 |
| **变更通知** | CLI 下次加载时获取最新 | 无需实时推送，Skill 配置变更频率低 |
| **排序** | 企业自定义 sort_order | 不同企业关注的 Skill 顺序不同 |
| **重置** | 支持重置为默认 | 防止配置错误无法恢复 |

---

### ADR-032: 员工日常工作助手架构

#### 一、统一待办聚合

**核心场景：** 员工早上打开 Agent，说"我今天有什么事要处理？"，Agent 一次调用返回所有待办。

```go
// GET /v1/me/todo
type MyTodoResponse struct {
    UserID         string    `json:"user_id"`
    GeneratedAt    time.Time `json:"generated_at"`

    // 各类待办
    PendingApprovals []TodoItem `json:"pending_approvals"` // 待审批
    PendingCollections []TodoItem `json:"pending_collections"` // 待催款
    PendingOpportunities []TodoItem `json:"pending_opportunities"` // 待跟进商机
    UnreadMessages    []TodoItem `json:"unread_messages"`     // 未读消息

    // 汇总
    Summary struct {
        TotalCount int `json:"total_count"`
        UrgentCount int `json:"urgent_count"` // 高优先级数量
    } `json:"summary"`
}

type TodoItem struct {
    ID          string    `json:"id"`
    Type        string    `json:"type"`        // approval, collection, opportunity, message
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Priority    string    `json:"priority"`    // low, normal, high, urgent
    DueDate     string    `json:"due_date"`
    RelatedURL  string    `json:"related_url"` // Agent 可用于跳转
}
```

#### 二、流程指引系统

**核心场景：** 新员工问"请假怎么申请？"，Agent 返回结构化的步骤指引。

```sql
-- 流程指引表
CREATE TABLE _process_guide (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id  UUID NOT NULL,
    code           VARCHAR(100) NOT NULL,    -- leave_request, expense_reimbursement, contract_approval
    name           VARCHAR(200) NOT NULL,    -- 请假申请, 报销申请, 合同审批
    description    TEXT,
    steps          JSONB NOT NULL,           -- 结构化步骤
    applicable_roles VARCHAR(50)[] DEFAULT '{}', -- 适用角色
    category       VARCHAR(50),              -- HR, finance, sales, warehouse, service
    is_active      BOOLEAN DEFAULT true,
    UNIQUE(enterprise_id, code)
);
```

**步骤结构：**

```json
{
  "steps": [
    {
      "order": 1,
      "title": "确认请假类型和天数",
      "description": "确定是事假/病假/年假，以及请假起止日期",
      "tips": "年假需要确认剩余天数"
    },
    {
      "order": 2,
      "title": "提交请假申请",
      "action": "approval_create",
      "skill": "approval",
      "params": {
        "type": "leave_request",
        "fields": ["leave_type", "start_date", "end_date", "reason"]
      }
    },
    {
      "order": 3,
      "title": "等待部门经理审批",
      "description": "提交后部门经理会收到审批通知，通常1个工作日内完成审批",
      "auto_notify": true
    },
    {
      "order": 4,
      "title": "审批结果通知",
      "description": "审批通过或拒绝后，你会收到消息通知"
    }
  ]
}
```

**流程指引 API：**

```go
// GET /v1/process-guide?category=HR 或 GET /v1/process-guide/{code}
type ProcessGuideResponse struct {
    Code        string       `json:"code"`
    Name        string       `json:"name"`
    Description string       `json:"description"`
    Steps       []GuideStep  `json:"steps"`
}

// GET /v1/process-guide (列表)
type ProcessGuideListResponse struct {
    Categories []GuideCategory `json:"categories"`
}

type GuideCategory struct {
    Name     string   `json:"name"`     // "人事", "财务", "销售"
    Guides   []string `json:"guides"`   // ["请假申请", "报销申请"]
}
```

#### 三、员工自助查询

```go
// GET /v1/me/profile
type MyProfileResponse struct {
    Employee   EmployeeInfo    `json:"employee"`
    Department DepartmentInfo  `json:"department"`
    Position   PositionInfo    `json:"position"`
    Statistics EmployeeStats   `json:"statistics"`
}

type EmployeeStats struct {
    ContractsCreated    int     `json:"contracts_created"`    // 创建的合同数
    ApprovalsHandled    int     `json:"approvals_handled"`    // 处理的审批数
    CollectionsFollowed int     `json:"collections_followed"` // 跟进的回款数
    ServiceOrdersHandled int    `json:"service_orders_handled"` // 处理的售后工单数
}
```

#### 四、员工快捷 Skill 定义

```json
{
  "skill_name": "my_todo",
  "display_name": "我的待办",
  "description": "查看今天需要处理的所有事项",
  "actions": {
    "list": {
      "label": "查看今日待办",
      "description": "聚合所有待审批、待催款、待跟进、未读消息"
    }
  }
}
```

```json
{
  "skill_name": "find_person",
  "display_name": "找同事",
  "description": "按姓名、部门、角色查找同事信息",
  "actions": {
    "search": {
      "label": "搜索同事",
      "parameters": [
        {"name": "name", "type": "string", "required": false, "description": "姓名（支持模糊搜索）"},
        {"name": "department", "type": "string", "required": false, "description": "部门名称"},
        {"name": "role", "type": "string", "required": false, "description": "角色/岗位（如仓库管理员、销售经理）"}
      ]
    }
  }
}
```

```json
{
  "skill_name": "ask_process",
  "display_name": "问流程",
  "description": "查询公司业务操作流程指引",
  "actions": {
    "search": {
      "label": "查询流程",
      "parameters": [
        {"name": "keyword", "type": "string", "required": true, "description": "流程关键词（如请假、报销、合同审批）"}
      ]
    }
  }
}
```

#### 五、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **待办聚合** | 单 API 返回所有类型 | Agent 一次调用即可展示 |
| **流程指引** | 结构化 JSON 步骤 | Agent 可逐步引导，比纯文档更好 |
| **找同事** | 支持角色/姓名双维度 | 匹配真实需求（找人和找角色） |
| **自助查询** | /v1/me/* 路径 | 清晰的资源归属，仅返回本人数据 |
| **工作报告** | Skill 一键生成 | 减少员工手动汇总工作量 |

---

### ADR-033: CLI 初始化与 Skill 下载架构

#### 一、初始化流程

```
用户执行: ao-cli init
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ao-cli init 初始化流程                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: 输入 API 地址                                                      │
│  > 请输入企业 API 地址: https://api.ai-office.com                           │
│  > 正在验证连接... ✓                                                        │
│                                                                              │
│  Step 2: OAuth 2.1 Device Authorization Grant 登录                          │
│  > 请在浏览器中打开: https://auth.ai-office.com/device?code=WDGM-MRTB      │
│  > 输入验证码: WDGM-MRTB                                                   │
│  > ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 等待认证... ✓                                    │
│  > 登录成功！欢迎，张三（销售部）                                           │
│                                                                              │
│  Step 3: 下载企业专属 Skill 矩阵                                            │
│  > 正在获取 Skill 列表... ✓ (7 个 Skill)                                   │
│  > 下载合同管理 Skill... ✓                                                  │
│  > 下载客户管理 Skill... ✓                                                  │
│  > 下载销售管理 Skill... ✓                                                  │
│  > 下载库存管理 Skill... ✓                                                  │
│  > 下载财务管理 Skill... ✓                                                  │
│  > 下载我的待办 Skill... ✓                                                  │
│  > 下载找同事 Skill... ✓                                                    │
│                                                                              │
│  Step 4: 生成 CLAUDE.md                                                     │
│  > 生成 CLAUDE.md... ✓                                                      │
│                                                                              │
│  Step 5: 生成 agent.md                                                      │
│  > 生成 agent.md... ✓                                                       │
│                                                                              │
│  ══════════════════════════════════════════════                              │
│  初始化完成！                                                                 │
│                                                                              │
│  Skill 目录: ~/.ai-office-cli/skills/                                        │
│  CLAUDE.md:  ~/.ai-office-cli/CLAUDE.md                                      │
│  agent.md:   ~/.ai-office-cli/agent.md                                       │
│                                                                              │
│  现在可以在 Claude Code 中使用这些 Skill 了！                                │
│  ══════════════════════════════════════════════                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 二、本地目录结构

```
~/.ai-office-cli/
├── config.yaml                # CLI 配置（API地址、Token、轮询参数等）
├── CLAUDE.md                  # Agent 上下文文件（给 Claude Code 读取）
├── agent.md                   # Agent 行为规范文件
├── skills/                    # Skill 定义文件目录
│   ├── contract.json          # 合同管理 Skill
│   ├── customer.json          # 客户管理 Skill
│   ├── sales.json             # 销售管理 Skill
│   ├── inventory.json         # 库存管理 Skill
│   ├── finance.json           # 财务管理 Skill
│   ├── my_todo.json           # 我的待办 Skill
│   ├── find_person.json       # 找同事 Skill
│   └── ask_process.json       # 问流程 Skill
├── cache/                     # 本地缓存
│   └── messages.db            # SQLite 消息缓存
└── tokens/                    # Token 存储
    └── access_token.json      # 加密存储的 Token
```

#### 三、CLAUDE.md 模板

```markdown
# AI-Automated-office — 企业 ERP Agent 上下文

## 企业信息
- 企业名称: {{enterprise_name}}
- 行业: {{industry}}
- API 地址: {{api_url}}
- 用户: {{user_name}} ({{department}} / {{roles}})

## 可用 Skill
{{#each skills}}
### {{display_name}} ({{skill_name}})
- 描述: {{description}}
- 操作: {{#each actions}}{{label}}, {{/each}}
- 示例: {{#each examples}}"{{this}}", {{/each}}
{{/each}}

## 调用规范
- 所有 Skill 通过 CLI 调用: `ao-cli skill invoke <skill_name> --action <action> --params '<json>'`
- 认证: CLI 自动携带 Token，Token 过期自动刷新
- 错误处理: 遵循错误码体系，可恢复错误自动重试

## 权限说明
- 当前角色: {{roles}}
- 数据范围: 本部门数据 + 个人数据
- 不可操作: 其他部门数据（除非有跨部门权限）
```

#### 四、agent.md 模板

```markdown
# AI-Automated-office — Agent 行为规范

## 角色设定
你是 {{enterprise_name}} 的企业业务助手，帮助员工通过自然语言完成日常工作。

## 交互风格
- 使用简体中文
- 专业简洁，不啰嗦
- 主动提示下一步操作
- 不确定时询问确认

## 权限边界
- 只能访问当前用户权限范围内的数据
- 敏感操作（删除、金额变更）必须确认
- 不得修改自己权限外的数据

## 错误处理
- Token 过期 → 提示用户执行 `ao-cli auth login`
- 权限不足 → 明确告知需要什么权限
- 网络错误 → 建议检查网络连接
- 参数错误 → 提示用户补充必要信息

## 行业特性
{{industry_context}}
```

#### 五、Skill 下载 API

```go
// GET /v1/skills/download
// 返回该企业当前用户可用的所有 Skill 定义（含企业客制化配置）
type SkillsDownloadResponse struct {
    EnterpriseName string         `json:"enterprise_name"`
    Industry       string         `json:"industry"`
    User           UserInfo       `json:"user"`
    Skills         []SkillDefinition `json:"skills"`
    ClaudeMD       string         `json:"claude_md"`     // 渲染好的 CLAUDE.md 内容
    AgentMD        string         `json:"agent_md"`      // 渲染好的 agent.md 内容
    Version        string         `json:"version"`       // 配置版本号
}
```

#### 六、更新机制

```
用户执行: ao-cli init --update
    │
    ▼
1. 检查本地版本 vs 云端版本
    ├── 版本一致 → "配置已是最新，无需更新"
    └── 版本不一致 → 继续更新
    │
    ▼
2. 下载最新 Skill 定义
    │
    ▼
3. 重新生成 CLAUDE.md 和 agent.md
    │
    ▼
4. 更新本地版本号
    │
    ▼
5. 通知用户更新内容
```

**版本号机制：**

```sql
-- 企业 Skill 配置版本表
ALTER TABLE _enterprise_skill_config ADD COLUMN config_version INT DEFAULT 1;

-- 版本号在每次配置变更时自增
-- CLI 请求时携带本地版本号，服务端比对是否需要更新
```

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **初始化方式** | 交互式引导 + OAuth Device Flow | 无前端场景最佳方案 |
| **Skill 存储** | 本地 JSON 文件 | Agent 可直接读取，离线也可用 |
| **CLAUDE.md** | 服务端渲染模板 | 不同企业内容不同，运营商可客制化 |
| **agent.md** | 服务端渲染模板 | 行业特性和权限边界由服务端控制 |
| **更新机制** | 版本号比对 | 避免全量下载，只在配置变更时更新 |
| **模板客制化** | 运营商可通过 Skill 修改 | 符合"数字化管家"理念 |

### ADR-034: 客制化 README.md 使用指南生成架构

#### 一、设计动机

CLAUDE.md 是给 AI 看的规则文件，agent.md 是 Agent 行为规范，但**企业员工需要一个面向人的使用指南**：
- 员工不是技术人员，需要用自然语言描述"系统能干什么"
- 不同企业开通的模块不同，README.md 应只展示该企业的可用功能
- 运营商客制化后，README.md 需要反映客制化内容（如企业专属术语、禁止操作说明）

#### 二、README.md 模板结构

```markdown
# {{enterprise_name}} — AI 企业助手使用指南

## 欢迎使用
你是 {{enterprise_name}} 的员工，通过本系统可以完成以下工作。

## 已开通功能

{{#each modules}}
### {{display_name}}
{{description}}
- **你可以这样问 Agent：**
{{#each examples}}
  - "{{this}}"
{{/each}}
{{/each}}

## 快捷指令速查

| 指令 | 说明 |
|------|------|
| 我的待办 | 查看今天所有待处理事项 |
| 找同事 [姓名/角色] | 查找同事信息和联系方式 |
| 问流程 [流程名] | 查询业务操作步骤 |
| 我的信息 | 查看个人档案和假期余额 |
| 生成周报 | 一键生成本周工作报告 |

## 常见问答

{{#each faq}}
**Q: {{question}}**
A: {{answer}}
{{/each}}

## 企业专属说明

{{custom_notes}}

---
*本指南由 AI-Automated-office 自动生成，如有疑问请咨询管理员。*
*最后更新: {{generated_at}}*
```

#### 三、生成时机与 API

```go
// README.md 在以下时机生成：
// 1. ao-cli init 初始化时
// 2. ao-cli init --update 配置更新时
// 3. 运营商修改企业 Skill 矩阵后，员工下次 --update 时

// GET /v1/skills/download 响应扩展
type SkillsDownloadResponse struct {
    EnterpriseName string         `json:"enterprise_name"`
    Industry       string         `json:"industry"`
    User           UserInfo       `json:"user"`
    Skills         []SkillDefinition `json:"skills"`
    ClaudeMD       string         `json:"claude_md"`
    AgentMD        string         `json:"agent_md"`
    ReadmeMD       string         `json:"readme_md"`     // 新增：渲染好的 README.md 内容
    Version        string         `json:"version"`
}
```

#### 四、运营商客制化 Skill 扩展

```go
// operator_skill_configure Skill 新增 action
{
    "skill_name": "operator_skill_configure",
    "action": "customize_readme",
    "params": {
        "enterprise_id": "xxx",
        "custom_notes": "本公司所有合同审批必须经过法务部门审核后才能提交",  // 企业专属注意事项
        "faq": [                                                          // 自定义常见问答
            {"question": "报销单怎么提交？", "answer": "请告诉Agent「我要报销」，Agent会引导你完成流程"},
            {"question": "客户信息怎么修改？", "answer": "请告诉Agent「修改客户XXX的信息」，Agent会帮你操作"}
        ],
        "extra_modules_intro": {  // 额外的模块介绍（覆盖自动生成的）
            "finance": "财务部：管理应收应付、回款登记、发票开具。涉及金额的操作需谨慎确认。"
        }
    }
}
```

#### 五、行业模板预设

| 行业 | README.md 预设差异 |
|------|-------------------|
| 制造业 | 强调生产管理、BOM、质检流程；常见问答增加"如何查看生产进度" |
| 贸易型 | 强调进销存、供应商管理；常见问答增加"如何下采购单" |
| 服务业 | 强调售后工单、客户管理；常见问答增加"如何创建售后工单" |
| 零售业 | 强调库存管理、销售统计；常见问答增加"如何查看库存预警" |

#### 六、本地存储位置

```
~/.ai-office-cli/
├── README.md                  # 客制化使用指南（面向员工）
├── CLAUDE.md                  # Agent 上下文文件（给 Claude Code 读取）
├── agent.md                   # Agent 行为规范文件
└── skills/                    # Skill 定义文件目录
```

#### 七、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **README.md 面向受众** | 非技术人员（企业员工） | CLAUDE.md 给 AI 看，README.md 给人看，职责分离 |
| **内容生成方式** | 服务端模板渲染 + 企业模块动态填充 | 不同企业开通模块不同，内容自动适配 |
| **客制化方式** | 运营商通过 Skill 修改模板 | 符合"数字化管家"理念，运营商对话即可配置 |
| **生成时机** | 与 CLAUDE.md/agent.md 同步生成 | 三文件一致性保障，避免版本漂移 |

### ADR-035: 跨平台私有化部署架构

#### 一、设计动机

开源后企业需要在自有局域网内部署服务，但内网服务器环境多样：
- **Windows Server** 是企业最常见的内网服务器操作系统（政府、金融、制造业）
- **macOS** 在创意型/设计型企业中常见（广告公司、设计工作室）
- **Linux** 是技术型企业首选，但并非唯一选择

因此，私有化部署必须**跨平台**，且提供**两种部署方案**：
1. **Docker 方案**：适合已安装 Docker 的环境，一键启动
2. **原生二进制方案**：适合无 Docker 的 Windows Server 环境，直接运行

#### 二、双轨部署方案

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ao-cli deploy 部署引导                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  选择部署模式:                                                        │
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐       │
│  │    方案 A: Docker        │  │    方案 B: 原生二进制         │       │
│  │    ─────────────────── │  │    ─────────────────────── │       │
│  │    适合: 已有 Docker     │  │    适合: 无 Docker 环境      │       │
│  │    优势: 环境隔离        │  │    优势: 零依赖，直接运行     │       │
│  │    依赖: Docker Desktop  │  │    依赖: 无                  │       │
│  │         / Docker Engine  │  │                              │       │
│  │    平台: Linux/Win/Mac   │  │    平台: Linux/Win/Mac       │       │
│  └─────────────────────────┘  └─────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 三、Docker Compose 跨平台方案

**核心原则：一套 docker-compose.yml，三平台通用。**

```yaml
# docker-compose.yml — 三平台通用
version: '3.8'

services:
  api:
    image: ai-office/api:${API_VERSION:-latest}
    ports:
      - "${API_PORT:-8080}:8080"
    environment:
      - DATABASE_URL=postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-changeme}@db:${DB_PORT:-5432}/${DB_NAME:-ai_office}
      - REDIS_URL=redis://redis:${REDIS_PORT:-6379}
      - DATA_DIR=${DATA_DIR:-/data/ai-office}
      - LOG_DIR=${LOG_DIR:-/var/log/ai-office}
    volumes:
      - ${DATA_DIR:-./data}:/data/ai-office
      - ${LOG_DIR:-./logs}:/var/log/ai-office
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/api/v1/system/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    ports:
      - "${DB_PORT_EXPOSE:-5432}:5432"
    environment:
      - POSTGRES_USER=${DB_USER:-postgres}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-changeme}
      - POSTGRES_DB=${DB_NAME:-ai_office}
    volumes:
      - postgres_data:${PGDATA_DIR:-/var/lib/postgresql/data}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT_EXPOSE:-6379}:6379"
    volumes:
      - redis_data:${REDIS_DATA_DIR:-/data}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**.env 配置文件（端口和目录自定义）：**

```bash
# .env — 端口和目录配置
# ============================================
# 所有端口均可自定义，避免与企业现有服务冲突
# ============================================

# API 服务端口
API_PORT=8080
API_VERSION=latest

# 数据库配置
DB_USER=postgres
DB_PASSWORD=changeme
DB_NAME=ai_office
DB_PORT=5432           # 内部端口（容器间通信）
DB_PORT_EXPOSE=5432    # 外部端口（宿主机映射）
PGDATA_DIR=/var/lib/postgresql/data

# Redis 配置
REDIS_PORT=6379
REDIS_PORT_EXPOSE=6379
REDIS_DATA_DIR=/data

# 数据目录（Windows 示例: D:\ai-office\data）
DATA_DIR=./data
LOG_DIR=./logs
```

#### 四、原生二进制方案

**编译目标矩阵：**

| 平台 | 架构 | 二进制名 | 依赖 |
|------|------|---------|------|
| Linux | amd64 | `ai-office-server-linux-amd64` | 无 |
| Linux | arm64 | `ai-office-server-linux-arm64` | 无 |
| Windows | amd64 | `ai-office-server-windows-amd64.exe` | 无 |
| macOS | amd64 | `ai-office-server-darwin-amd64` | 无 |
| macOS | arm64 (Apple Silicon) | `ai-office-server-darwin-arm64` | 无 |

**Go 交叉编译配置：**

```makefile
# Makefile — 跨平台编译
VERSION ?= $(shell git describe --tags --always)

LDFLAGS = -s -w -X main.Version=$(VERSION) -X main.BuildTime=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)

# Linux
build-linux-amd64:
	GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o dist/ai-office-server-linux-amd64 ./cmd/server

build-linux-arm64:
	GOOS=linux GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o dist/ai-office-server-linux-arm64 ./cmd/server

# Windows
build-windows-amd64:
	GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o dist/ai-office-server-windows-amd64.exe ./cmd/server

# macOS
build-darwin-amd64:
	GOOS=darwin GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o dist/ai-office-server-darwin-amd64 ./cmd/server

build-darwin-arm64:
	GOOS=darwin GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o dist/ai-office-server-darwin-arm64 ./cmd/server

build-all: build-linux-amd64 build-linux-arm64 build-windows-amd64 build-darwin-amd64 build-darwin-arm64
```

**原生二进制配置文件（config.yaml）：**

```yaml
# config.yaml — 原生二进制部署配置
server:
  host: "0.0.0.0"
  port: 8080                    # 可自定义
  tls:
    enabled: false              # 默认关闭，ao-cli deploy --tls 时开启
    cert_file: ""               # 证书路径
    key_file: ""                # 私钥路径

database:
  host: "localhost"
  port: 5432                    # 可自定义
  user: "postgres"
  password: "changeme"
  dbname: "ai_office"
  sslmode: "disable"

redis:
  host: "localhost"
  port: 6379                    # 可自定义
  password: ""

storage:
  data_dir: "./data"            # 可自定义（Windows: "D:\\ai-office\\data"）
  upload_dir: "./data/uploads"
  log_dir: "./logs"             # 可自定义

# Windows 路径示例：
# storage:
#   data_dir: "D:\\ai-office\\data"
#   upload_dir: "D:\\ai-office\\data\\uploads"
#   log_dir: "D:\\ai-office\\logs"
```

#### 五、ao-cli deploy 部署引导流程

```
用户执行: ao-cli deploy
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ao-cli deploy 部署引导                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: 选择部署模式                                                        │
│  > [1] Docker Compose（推荐）                                               │
│  > [2] 原生二进制（无 Docker 环境）                                          │
│                                                                              │
│  Step 2: 配置端口（默认值可直接回车跳过）                                      │
│  > API 端口 [8080]:                                                         │
│  > 数据库端口 [5432]:                                                       │
│  > Redis 端口 [6379]:                                                       │
│                                                                              │
│  Step 3: 配置数据目录                                                        │
│  > 数据存储目录 [./data]: D:\ai-office\data                                 │
│  > 日志目录 [./logs]: D:\ai-office\logs                                     │
│                                                                              │
│  Step 4: 配置数据库                                                          │
│  > 数据库用户 [postgres]:                                                   │
│  > 数据库密码 [changeme]: ********                                          │
│  > 数据库名称 [ai_office]:                                                  │
│                                                                              │
│  Step 5: TLS 配置                                                            │
│  > 是否启用 HTTPS? [y/N]: y                                                 │
│  > [1] 自动生成自签名证书                                                    │
│  > [2] 导入企业自有证书                                                      │
│  > 选择: 1                                                                  │
│  > 生成自签名证书... ✓                                                      │
│                                                                              │
│  Step 6: 初始化                                                              │
│  > 拉取镜像 / 下载二进制... ✓                                               │
│  > 启动服务... ✓                                                            │
│  > 执行数据库迁移... ✓                                                      │
│  > 创建超级管理员...                                                         │
│  > 管理员邮箱: admin@company.com                                            │
│  > 管理员密码: ********                                                     │
│  > 验证服务健康... ✓                                                        │
│                                                                              │
│  ══════════════════════════════════════════════                              │
│  部署完成！                                                                   │
│                                                                              │
│  API 地址: https://localhost:8080                                            │
│  管理后台: 请使用 ao-cli init 初始化                                         │
│  健康检查: https://localhost:8080/api/v1/system/health                       │
│  ══════════════════════════════════════════════                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 六、TLS 自签名证书方案

```go
// ao-cli deploy --tls 自动生成自签名证书
// 使用 Go 标准库 crypto/x509 生成

type TLSCertConfig struct {
    Host       string // 默认: localhost + 本机内网 IP
    ValidFor   int    // 有效期天数，默认 365
    RSAKeySize int    // 默认 2048
    OutputDir  string // 证书输出目录
}

// 生成流程：
// 1. 生成 RSA 私钥
// 2. 创建 CA 证书（自签名）
// 3. 创建服务端证书（CA 签发）
// 4. SAN 包含：localhost, 127.0.0.1, 本机内网 IP
// 5. 输出: ca.crt, server.crt, server.key
// 6. 提示用户将 ca.crt 导入客户端信任链（可选）
```

#### 七、在线升级机制

```
用户执行: ao-cli deploy --upgrade
    │
    ▼
1. 检查当前版本（调用 /api/v1/system/version）
    │
    ▼
2. 查询最新版本（调用 GitHub Release API 或自建更新源）
    │
    ├── 版本一致 → "已是最新版本"
    └── 有新版本 → 继续升级
    │
    ▼
3. 下载新版本
    ├── Docker: docker pull ai-office/api:新版本
    └── 原生二进制: 下载新版本二进制到临时目录
    │
    ▼
4. 备份当前版本（原二进制重命名为 .bak）
    │
    ▼
5. 执行数据库迁移
    → API 服务启动时自动检测并执行待运行的迁移脚本
    │
    ▼
6. 重启服务
    ├── Docker: docker-compose restart api
    └── 原生: 停止旧进程 → 启动新二进制
    │
    ▼
7. 验证健康检查
    → GET /api/v1/system/health 返回新版本号
    │
    ▼
8. 升级完成 / 失败回滚
    ├── 成功: 删除 .bak 备份
    └── 失败: 自动回滚到 .bak 版本
```

#### 八、健康检查 API

```go
// GET /api/v1/system/health
type SystemHealthResponse struct {
    Status    string            `json:"status"`     // "healthy" | "degraded" | "unhealthy"
    Version   string            `json:"version"`    // 当前版本号
    Uptime    int64             `json:"uptime"`     // 运行时长（秒）
    Components map[string]ComponentHealth `json:"components"`
}

type ComponentHealth struct {
    Status  string `json:"status"`   // "up" | "down"
    Latency int64  `json:"latency"`  // 响应延迟（ms）
    Detail  string `json:"detail"`   // 额外信息
}

// 示例响应：
// {
//   "status": "healthy",
//   "version": "1.2.0",
//   "uptime": 86400,
//   "components": {
//     "api":    {"status": "up", "latency": 2, "detail": ""},
//     "db":     {"status": "up", "latency": 5, "detail": "PostgreSQL 15.4"},
//     "redis":  {"status": "up", "latency": 1, "detail": "Redis 7.2"},
//     "disk":   {"status": "up", "latency": 0, "detail": "Used 12GB / 100GB"}
//   }
// }

// GET /api/v1/system/version
type SystemVersionResponse struct {
    Version     string `json:"version"`       // 当前版本
    BuildTime   string `json:"build_time"`    // 编译时间
    GoVersion   string `json:"go_version"`    // Go 版本
    DBVersion   int    `json:"db_version"`    // 数据库迁移版本号
    LatestVersion string `json:"latest_version"` // 最新可用版本
    UpgradeAvailable bool `json:"upgrade_available"` // 是否有可用升级
}
```

#### 九、Windows Server 特殊处理

```go
// Windows 特有配置

// 1. Windows Service 注册
// ao-cli deploy --install-service
// 使用 golang.org/x/sys/windows/svc/mgr 包注册为 Windows Service
// 服务名: "AI-Office-API"
// 启动类型: Automatic
// 依赖: 无（内置 PostgreSQL/Redis 或使用外部服务）

// 2. Windows 防火墙
// 部署时自动提示添加防火墙入站规则
// netsh advfirewall firewall add rule name="AI-Office API" dir=in action=allow protocol=TCP localport=8080

// 3. Windows 路径处理
// 数据目录: D:\ai-office\data
// 日志目录: D:\ai-office\logs
// 配置文件: C:\ProgramData\ai-office\config.yaml
// 服务二进制: C:\Program Files\ai-office\ai-office-server.exe

// 4. Windows 日志
// 同时输出到文件和 Windows Event Log
// 使用 golang.org/x/sys/windows/svc/eventlog 包
```

#### 十、macOS 特殊处理

```go
// macOS 特有配置

// 1. launchd 守护进程
// ao-cli deploy --install-service
// 生成 ~/Library/LaunchAgents/com.ai-office.server.plist
// 自动启动、崩溃自动重启

// 2. macOS 路径处理
// 数据目录: /usr/local/var/ai-office/data
// 日志目录: /usr/local/var/ai-office/logs
// 配置文件: /usr/local/etc/ai-office/config.yaml
// 二进制: /usr/local/bin/ai-office-server

// 3. Apple Silicon (arm64) 原生支持
// 编译目标: GOOS=darwin GOARCH=arm64
// 性能优于 Rosetta 转译的 amd64 版本
```

#### 十一、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **双轨部署** | Docker + 原生二进制 | Windows Server 大多无 Docker，原生二进制是刚需 |
| **编译目标** | 5 平台架构 | Linux amd64/arm64 + Windows amd64 + macOS amd64/arm64 |
| **端口/目录可配置** | 环境变量 + .env + config.yaml | 企业内网端口常被占用，必须支持自定义 |
| **TLS 方案** | 自签名 CA + 服务端证书 | 内网无公共 CA，自签名满足加密需求 |
| **升级方式** | 二进制替换 + 数据库自动迁移 | 最简单的升级路径，避免复杂编排 |
| **健康检查** | 统一 HTTP API | Agent/CLI/curl 均可调用，运维友好 |
| **Windows Service** | golang.org/x/sys/windows/svc | Go 原生支持，无额外依赖 |
| **macOS launchd** | plist + launchctl | macOS 标准服务管理方式 |

### ADR-036: Agent-First 多语言架构（中英文双语）

#### 一、设计动机

传统 SaaS 的多语言 = 前端 UI 翻译（按钮、菜单、表单标签）。Agent-First SaaS 没有前端 UI，但整条交互链路都需要语言适配：

```
用户（中文/英文）→ Agent（需理解用户语言）→ Skill（需匹配语言的描述和示例）
    → API（需返回可理解的错误信息）→ Agent 转述给用户
    → 消息推送（需匹配接收者语言）
    → 生成文件（CLAUDE.md/agent.md/README.md 需匹配用户语言）
```

**核心原则：我们翻译的是"Agent 的输入和输出"，不是"UI 组件"。**

#### 二、语言偏好层级

```
优先级（高→低）：
1. 用户级偏好（employee.language_preference）
2. 企业级偏好（enterprise.default_language）
3. 系统默认（zh-CN）
```

```sql
-- 用户表增加语言偏好
ALTER TABLE employees ADD COLUMN language_preference VARCHAR(10) DEFAULT NULL;
-- NULL 表示跟随企业设置

-- 企业表增加默认语言
ALTER TABLE enterprises ADD COLUMN default_language VARCHAR(10) DEFAULT 'zh-CN';
-- 可选值: 'zh-CN', 'en-US'
```

#### 三、Skill 多语言定义

```go
// Skill 定义结构扩展
type SkillDefinition struct {
    Name         string              `json:"name"`
    DisplayName  map[string]string   `json:"display_name"`   // {"zh-CN": "合同管理", "en-US": "Contract Management"}
    Description  map[string]string   `json:"description"`    // {"zh-CN": "管理企业合同...", "en-US": "Manage enterprise contracts..."}
    Examples     map[string][]string `json:"examples"`       // {"zh-CN": ["创建合同", "查看合同列表"], "en-US": ["create contract", "view contract list"]}
    OpeningMsg   map[string]string   `json:"opening_message"`// {"zh-CN": "我可以帮你管理合同...", "en-US": "I can help you manage contracts..."}
    Actions      []SkillAction       `json:"actions"`
}

type SkillAction struct {
    Name        string            `json:"name"`
    Label       map[string]string `json:"label"`       // {"zh-CN": "创建合同", "en-US": "Create Contract"}
    Description map[string]string `json:"description"` // {"zh-CN": "创建一份新合同", "en-US": "Create a new contract"}
    Params      []SkillParam      `json:"params"`
}

type SkillParam struct {
    Name        string            `json:"name"`
    Label       map[string]string `json:"label"`       // {"zh-CN": "合同金额", "en-US": "Contract Amount"}
    Description map[string]string `json:"description"` // {"zh-CN": "合同总金额（元）", "en-US": "Total contract amount (CNY)"}
}
```

**Skill 下载 API 语言适配：**

```go
// GET /v1/skills/download?lang=zh-CN
// GET /v1/skills/download?lang=en-US
// 如果不传 lang 参数，使用用户偏好 → 企业偏好 → 系统默认

type SkillsDownloadResponse struct {
    EnterpriseName string            `json:"enterprise_name"`
    Industry       string            `json:"industry"`
    User           UserInfo          `json:"user"`
    Language       string            `json:"language"`        // 实际使用的语言
    Skills         []SkillDefinition `json:"skills"`          // 包含所有语言版本
    ClaudeMD       string            `json:"claude_md"`       // 按语言渲染
    AgentMD        string            `json:"agent_md"`        // 按语言渲染
    ReadmeMD       string            `json:"readme_md"`       // 按语言渲染
    Version        string            `json:"version"`
}
```

**CLI 本地存储：**

```
~/.ai-office-cli/
├── skills/
│   ├── contract.json          # 包含中英文双语的完整 Skill 定义
│   ├── customer.json
│   └── ...
├── CLAUDE.md                  # 按用户语言偏好渲染
├── agent.md                   # 按用户语言偏好渲染
├── README.md                  # 按用户语言偏好渲染
└── config.yaml                # 包含 language: zh-CN 或 en-US
```

#### 四、API 错误码多语言

```go
// 错误响应结构
type APIError struct {
    ErrorCode   string `json:"error_code"`    // 程序化错误码，不变：CONTRACT_NOT_FOUND
    UserMessage string `json:"user_message"`  // 人类可读，按 Accept-Language 翻译
    Detail      string `json:"detail"`        // 技术细节，始终英文
}

// 示例：
// Accept-Language: zh-CN
// {
//   "error_code": "CONTRACT_NOT_FOUND",
//   "user_message": "合同不存在或已被删除",
//   "detail": "Contract ID con_abc123 not found in schema tenant_xxx"
// }

// Accept-Language: en-US
// {
//   "error_code": "CONTRACT_NOT_FOUND",
//   "user_message": "Contract not found or has been deleted",
//   "detail": "Contract ID con_abc123 not found in schema tenant_xxx"
// }
```

**错误码翻译存储：**

```sql
-- 错误码翻译表（系统级，非租户级）
CREATE TABLE _system.error_code_translations (
    error_code  VARCHAR(100) NOT NULL,
    language    VARCHAR(10)  NOT NULL,
    message     TEXT         NOT NULL,
    PRIMARY KEY (error_code, language)
);

-- 预置数据
INSERT INTO _system.error_code_translations VALUES
('CONTRACT_NOT_FOUND', 'zh-CN', '合同不存在或已被删除'),
('CONTRACT_NOT_FOUND', 'en-US', 'Contract not found or has been deleted'),
('PERMISSION_DENIED', 'zh-CN', '权限不足，无法执行此操作'),
('PERMISSION_DENIED', 'en-US', 'Permission denied, unable to perform this operation'),
('TOKEN_EXPIRED', 'zh-CN', '登录已过期，请重新登录'),
('TOKEN_EXPIRED', 'en-US', 'Session expired, please log in again');
-- ... 所有错误码均需中英文翻译
```

#### 五、消息通知多语言

```go
// 消息模板多语言
type MessageTemplate struct {
    TemplateKey string            `json:"template_key"`
    Content     map[string]string `json:"content"`  // {"zh-CN": "您有一份合同待审批...", "en-US": "You have a contract pending approval..."}
}

// 消息发送时根据接收者语言偏好选择模板
// 同一企业内，中文员工收到中文推送，英文员工收到英文推送
```

```sql
-- 消息模板表
CREATE TABLE _system.message_templates (
    template_key VARCHAR(100) NOT NULL,
    language     VARCHAR(10)  NOT NULL,
    content      TEXT         NOT NULL,  -- 支持 {{variable}} 占位符
    PRIMARY KEY (template_key, language)
);

-- 示例
INSERT INTO _system.message_templates VALUES
('approval.pending', 'zh-CN', '您有一份{{doc_type}}待审批，来自{{submitter_name}}，金额{{amount}}元'),
('approval.pending', 'en-US', 'You have a {{doc_type}} pending approval from {{submitter_name}}, amount {{amount}} CNY'),
('alert.receivable_overdue', 'zh-CN', '应收款预警：客户{{customer_name}}有{{amount}}元已逾期{{days}}天'),
('alert.receivable_overdue', 'en-US', 'Receivable alert: Customer {{customer_name}} has {{amount}} CNY overdue for {{days}} days');
```

#### 六、生成文件多语言

**CLAUDE.md 英文模板：**

```markdown
# AI-Automated-office — Enterprise ERP Agent Context

## Enterprise Info
- Enterprise: {{enterprise_name}}
- Industry: {{industry}}
- API Endpoint: {{api_url}}
- User: {{user_name}} ({{department}} / {{roles}})

## Available Skills
{{#each skills}}
### {{display_name.en-US}} ({{skill_name}})
- Description: {{description.en-US}}
- Actions: {{#each actions}}{{label.en-US}}, {{/each}}
- Examples: {{#each examples.en-US}}"{{this}}", {{/each}}
{{/each}}

## Calling Convention
- All Skills invoked via CLI: `ao-cli skill invoke <skill_name> --action <action> --params '<json>'`
- Auth: CLI auto-attaches Token, auto-refresh on expiry
- Error handling: Follow error code system, auto-retry on recoverable errors

## Permissions
- Current role: {{roles}}
- Data scope: Department data + Personal data
- Restricted: Other department data (unless cross-department permission granted)
```

**README.md 英文模板：**

```markdown
# {{enterprise_name}} — AI Enterprise Assistant Guide

## Welcome
As an employee of {{enterprise_name}}, you can accomplish the following tasks through this system.

## Available Features
{{#each modules}}
### {{display_name}}
{{description.en-US}}
- **You can ask the Agent:**
{{#each examples.en-US}}
  - "{{this}}"
{{/each}}
{{/each}}

## Quick Commands

| Command | Description |
|---------|-------------|
| My todos | View all pending items for today |
| Find colleague [name/role] | Look up colleague info and contact details |
| Ask process [process name] | Query business operation steps |
| My info | View personal profile and leave balance |
| Generate weekly report | One-click weekly work report |
```

#### 七、运营商翻译管理

```go
// operator_skill_configure Skill 新增 action
{
    "skill_name": "operator_skill_configure",
    "action": "manage_translations",
    "params": {
        "enterprise_id": "xxx",
        "target": "skill" | "message_template" | "error_code",
        "target_key": "contract_management",  // 具体的 Skill 或模板 key
        "translations": {
            "en-US": {
                "display_name": "Contract Management",
                "description": "Manage enterprise contracts, track signing and execution",
                "examples": ["create contract", "view contract list", "check contract status"]
            }
        }
    }
}
```

#### 八、语言检测与回退

```go
// 语言解析链
func ResolveLanguage(acceptLanguage string, userPref string, enterprisePref string) string {
    // 1. 用户显式偏好
    if userPref != "" {
        return userPref
    }
    // 2. Accept-Language 请求头
    if acceptLanguage != "" {
        parsed := ParseAcceptLanguage(acceptLanguage) // 解析 q 值排序
        for _, lang := range parsed {
            if SupportedLanguages[lang] {
                return lang
            }
        }
    }
    // 3. 企业默认语言
    if enterprisePref != "" {
        return enterprisePref
    }
    // 4. 系统默认
    return "zh-CN"
}

// 回退链：en-US → zh-CN（英文缺失时回退到中文）
// 原因：中文是主要开发语言，翻译最完整
func GetTranslation(translations map[string]string, lang string) string {
    if v, ok := translations[lang]; ok && v != "" {
        return v
    }
    // 回退到中文
    if v, ok := translations["zh-CN"]; ok {
        return v
    }
    // 最终回退：取第一个非空值
    for _, v := range translations {
        if v != "" {
            return v
        }
    }
    return ""
}
```

#### 九、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **MVP 语言范围** | zh-CN + en-US | 覆盖国内+海外华人+外企，最务实 |
| **翻译对象** | Agent 交互链路（Skill/错误码/消息/生成文件） | 无 UI，不需要翻译按钮/菜单 |
| **语言偏好层级** | 用户 > 企业 > 系统默认 | 同一企业内中英文员工共存 |
| **Skill 定义格式** | map[string]string 多语言字段 | 一次下载包含所有语言，Agent 可按需切换 |
| **错误码翻译** | 系统级表 + Accept-Language | error_code 不变（程序化），user_message 翻译（人类可读） |
| **消息推送语言** | 按接收者偏好 | 同一事件，不同语言员工收到不同语言推送 |
| **回退策略** | en-US → zh-CN | 中文是主开发语言，翻译最完整 |
| **运营商管理** | operator_skill_configure Skill 扩展 | 运营商对话即可补充/修改翻译 |

---

### ADR-037: 多仓库与出入库流水架构

#### 一、设计理念

**企业仓库不止一处，库存 = 仓库 × 物料。** 核心设计原则：

1. **物料是一等实体，不只是成品**：仓库存的不只是产品，还有原材料、零部件、办公用品、耗材
2. **仓库是一等实体**：库存挂在仓库下，而非挂在物料上
3. **统一流水表**：所有出入库行为写入同一张流水表，每笔流水记录批次号、效期、序列号、规格参数
4. **调拨是双步操作**：源仓库出库 + 目标仓库入库，中间有在途状态
5. **领用走审批**：员工申请 → 审批 → 仓库确认出库，全流程可追溯
6. **盘库闭环**：实地盘点 → 差异对比 → 审批 → 自动调整库存

#### 二、物料管理 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/materials` | GET | 物料列表（支持 type 过滤） |
| `/v1/ims/materials` | POST | 创建物料 |
| `/v1/ims/materials/:id` | PUT | 编辑物料 |
| `/v1/ims/materials/:id` | DELETE | 停用物料 |

**物料类型枚举：**

| type | 说明 | 示例 |
|------|------|------|
| `finished_product` | 成品 | 服务器设备、终端产品 |
| `raw_material` | 原材料 | 钢材、化工原料 |
| `component` | 零部件 | 主板、电源模块、螺丝 |
| `office_supply` | 办公用品 | 打印纸、文件夹 |
| `consumable` | 耗材 | 墨盒、清洁剂 |

**物料规格参数示例：**

```json
{
  "尺寸": "300x200x50mm",
  "重量": "5kg",
  "颜色": "银灰",
  "材质": "铝合金",
  "功率": "500W",
  "接口": "USB-C, HDMI"
}
```

#### 三、仓库管理 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/warehouses` | GET | 仓库列表 |
| `/v1/ims/warehouses` | POST | 创建仓库 |
| `/v1/ims/warehouses/:id` | PUT | 编辑仓库 |
| `/v1/ims/warehouses/:id` | DELETE | 停用仓库（软删除） |
| `/v1/ims/warehouses/:id/inventory` | GET | 查看某仓库全部物料库存 |

#### 四、库存查询 API

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/inventory` | GET | 库存列表（支持 warehouse_id / material_id / type 过滤） |
| `/v1/ims/inventory/:material_id/distribution` | GET | 某物料在各仓库的分布 |
| `/v1/ims/inventory/alerts` | GET | 库存预警列表（低于安全库存） |
| `/v1/ims/inventory/expiring` | GET | 临期物料列表（效期临近的批次） |

**库存分布响应：**

```go
type InventoryDistributionResponse struct {
    MaterialID   string                 `json:"material_id"`
    MaterialName string                 `json:"material_name"`
    MaterialType string                 `json:"material_type"`
    TotalQty     int                    `json:"total_quantity"`
    Warehouses   []WarehouseInventory   `json:"warehouses"`
}

type WarehouseInventory struct {
    WarehouseID   string `json:"warehouse_id"`
    WarehouseName string `json:"warehouse_name"`
    Quantity      int    `json:"quantity"`
    SafetyStock   int    `json:"safety_stock"`
    InTransit     int    `json:"in_transit_quantity"`
    Locked        int    `json:"locked_quantity"`
    Available     int    `json:"available_quantity"` // quantity - locked
}
```

#### 五、出入库流水参数

每笔出入库流水记录以下追踪参数：

| 字段 | 说明 | 适用场景 |
|------|------|----------|
| `batch_no` | 批次号 | 采购入库、生产入库时填写，同物料不同批次可追溯 |
| `production_date` | 生产日期 | 有保质期的物料必须填写 |
| `expiry_date` | 有效期至 | 有保质期的物料必须填写，临期自动预警 |
| `serial_no` | 序列号 | 一物一码追踪（设备、高价值零部件） |
| `spec_params` | 规格参数(JSON) | 入库时实际规格，可能与物料主数据不同（如定制规格） |
| `unit_cost` | 单位成本 | 加权平均计算，盘库差异金额计算 |

**出入库参数组合规则：**

| 物料类型 | 批次号 | 效期 | 序列号 | 规格参数 |
|----------|--------|------|--------|----------|
| 成品 | 可选 | 有保质期必填 | 高价值必填 | 可选 |
| 原材料 | 必填 | 必填 | — | 必填 |
| 零部件 | 可选 | — | 高价值必填 | 可选 |
| 办公用品 | — | — | — | — |
| 耗材 | 可选 | 有保质期必填 | — | 可选 |

#### 六、调拨流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  创建单   │───►│  审批     │───►│  源仓出库  │───►│  在途运输  │───►│  目标仓入库 │
│  draft    │    │  approved │    │  出库流水  │    │  in_transit│    │  入库流水   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │                                │
                                     ▼                                ▼
                              锁定源仓库存                         填写实收数量
                              (locked_quantity↑)                   差异自动记录
```

**调拨 API：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/stock-transfers` | GET | 调拨单列表 |
| `/v1/ims/stock-transfers` | POST | 创建调拨单 |
| `/v1/ims/stock-transfers/:id` | GET | 调拨单详情 |
| `/v1/ims/stock-transfers/:id/approve` | POST | 审批通过 |
| `/v1/ims/stock-transfers/:id/ship` | POST | 确认出库（扣减源仓库，生成出库流水） |
| `/v1/ims/stock-transfers/:id/receive` | POST | 确认入库（增加目标仓库，填写实收数量，生成入库流水） |
| `/v1/ims/stock-transfers/:id/cancel` | POST | 取消调拨 |

**确认入库请求：**

```json
{
  "items": [
    {
      "material_id": "uuid-xxx",
      "received_quantity": 48,
      "batch_no": "B20260704",
      "expiry_date": "2027-07-04",
      "spec_params": {"颜色": "红", "材质": "铝合金"}
    }
  ],
  "notes": "运输中损坏2件，已拍照存档"
}
```

> 当 `received_quantity < quantity` 时，系统自动记录差异，可触发告警通知仓库管理员。

#### 七、领用申请流程

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│  员工申请  │───►│  审批(可配置)  │───►│  仓库确认  │───►│  出库完成  │
│  draft    │    │ pending_approval│   │  approved │    │  issued   │
└──────────┘    └──────────────┘    └──────────┘    └──────────┘
                                        │                  │
                                        ▼                  ▼
                                   选择出库仓库          生成出库流水
                                   填写实发数量         (type=requisition_out)
```

**领用 API：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/requisitions` | GET | 领用申请列表 |
| `/v1/ims/requisitions` | POST | 创建领用申请 |
| `/v1/ims/requisitions/:id` | GET | 领用申请详情 |
| `/v1/ims/requisitions/:id/approve` | POST | 审批通过 |
| `/v1/ims/requisitions/:id/issue` | POST | 仓库确认出库（填写实发数量，生成出库流水） |
| `/v1/ims/requisitions/:id/cancel` | POST | 取消领用 |

#### 八、盘库流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  创建盘点  │───►│  实地盘点  │───►│  提交结果  │───►│  审批     │───►│  调整库存  │
│  draft    │    │in_progress│    │ submitted │    │ approved │    │ completed │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                                                │
                     ▼                                                ▼
               录入实盘数量                                     自动生成调整流水
               (按物料/批次)                                   (type=adjustment)
```

**盘库 API：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/inventory-checks` | GET | 盘点任务列表 |
| `/v1/ims/inventory-checks` | POST | 创建盘点任务 |
| `/v1/ims/inventory-checks/:id` | GET | 盘点任务详情（含明细） |
| `/v1/ims/inventory-checks/:id/start` | POST | 开始盘点（锁定库存快照） |
| `/v1/ims/inventory-checks/:id/items/:item_id` | PUT | 录入实盘数量 |
| `/v1/ims/inventory-checks/:id/submit` | POST | 提交盘点结果（生成盘盈盘亏明细） |
| `/v1/ims/inventory-checks/:id/approve` | POST | 审批通过（自动生成调整流水，更新库存） |
| `/v1/ims/inventory-checks/:id/cancel` | POST | 取消盘点 |

**创建盘点任务请求：**

```json
{
  "warehouse_id": "uuid-xxx",
  "scope": "spot",
  "material_ids": ["uuid-001", "uuid-002"],
  "notes": "月度抽盘"
}
```

**盘盈盘亏响应：**

```go
type InventoryCheckResult struct {
    CheckID     string              `json:"check_id"`
    WarehouseID string              `json:"warehouse_id"`
    Surplus     []CheckDiffItem     `json:"surplus"`  // 盘盈
    Shortage    []CheckDiffItem     `json:"shortage"` // 盘亏
    TotalDiffAmount decimal.Decimal `json:"total_diff_amount"`
}

type CheckDiffItem struct {
    MaterialID   string          `json:"material_id"`
    MaterialName string          `json:"material_name"`
    BatchNo      string          `json:"batch_no"`
    SystemQty    int             `json:"system_quantity"`
    ActualQty    int             `json:"actual_quantity"`
    DiffQty      int             `json:"diff_quantity"`
    DiffAmount   decimal.Decimal `json:"diff_amount"`
}
```

> 盘点期间，被盘点的物料在对应仓库的出入库操作被暂时冻结（locked），盘点完成后自动解冻。

#### 九、统一出入库流水

所有出入库操作统一写入 `ims_inventory_transaction` 表。

**出入库类型枚举：**

| type | 方向 | 说明 | source_type |
|------|------|------|-------------|
| `purchase_in` | 入库 | 采购入库 | purchase_order |
| `sale_out` | 出库 | 销售出库 | sale_order |
| `transfer_in` | 入库 | 调拨入库 | stock_transfer |
| `transfer_out` | 出库 | 调拨出库 | stock_transfer |
| `requisition_out` | 出库 | 领用出库 | requisition |
| `return_in` | 入库 | 退货入库 | sale_order / service_order |
| `scrap_out` | 出库 | 报废出库 | — |
| `adjustment` | 出入库 | 盘点调整 | inventory_check |

**出入库流水 API：**

| API | 方法 | 说明 |
|-----|------|------|
| `/v1/ims/inventory-transactions` | GET | 出入库流水列表（支持 warehouse_id / material_id / type / batch_no / 日期范围过滤） |

#### 十、库存操作与流水的数据一致性

**关键约束：库存变更必须通过流水表驱动，不允许直接修改 ims_inventory.quantity。**

```go
// 库存变更事务（伪代码）
func UpdateInventory(tx *gorm.DB, warehouseID, materialID uuid.UUID, txn InventoryTransaction) error {
    // 1. 写入流水（含批次号、效期、序列号、规格参数）
    if err := tx.Create(&txn).Error; err != nil {
        return err
    }

    // 2. 更新库存快照
    sign := 1 // 入库为正
    if isOutbound(txn.Type) { sign = -1 }

    result := tx.Model(&Inventory{}).
        Where("warehouse_id = ? AND material_id = ?", warehouseID, materialID).
        Update("quantity", gorm.Expr("quantity + ?", sign*txn.Quantity))

    if result.RowsAffected == 0 {
        // 首次入库，创建记录
        tx.Create(&Inventory{
            WarehouseID: warehouseID,
            MaterialID:  materialID,
            Quantity:    sign * txn.Quantity,
        })
    }

    // 3. 检查库存预警
    if isOutbound(txn.Type) {
        checkSafetyStock(tx, warehouseID, materialID)
    }

    // 4. 检查效期预警
    if txn.ExpiryDate != nil {
        checkExpiryAlert(tx, warehouseID, materialID, *txn.ExpiryDate)
    }

    return nil
}
```

**Redis 分布式锁保障并发安全：**

```
库存操作锁 Key: inventory:{warehouse_id}:{material_id}
```

同一仓库同一物料的并发出入库操作串行化，防止超卖。

#### 十一、关键设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **物料 vs 产品** | 物料（5类SKU） | 仓库不只存成品，采购的原材料/零部件/办公用品也需要出入库管理 |
| **规格参数格式** | JSONB | 不同物料类型规格完全不同，无法用固定列；JSONB 支持索引和查询 |
| **批次号粒度** | 出入库流水级别 | 同物料不同批次可追溯，盘点可按批次维度进行 |
| **序列号** | 出入库流水级别 | 一物一码，高价值设备从入库到报废全程可追溯 |
| **效期管理** | production_date + expiry_date | 临期预警需要两个时间点计算剩余天数 |
| **盘库范围** | 全盘/抽盘 | 大仓库不适合每次全盘，抽盘提升效率 |
| **盘点冻结** | 盘点期间锁定库存 | 防止盘点期间出入库导致数据不一致 |
| **差异调整** | 审批后自动生成调整流水 | 盘盈盘亏必须有审批，调整必须有流水记录 |
| **库存变更驱动** | 流水表驱动，禁止直接修改 | 保障数据一致性和可审计性 |
