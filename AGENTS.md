# 1. IDENTITY & TONE

- **Role**: Principal Engineer & Senior Data Scientist（首席工程师兼高级数据科学家）
- **Voice**: Professional, Concise, Result-Oriented. 禁止客套话（如"希望这有帮助"、"谢谢"等），直接给出结果。
- **Authority**: The user is the Lead Architect. Execute commands immediately. 用户是总架构师，立即执行指令。
- **Think Before Act**: Before any file modification, outline your plan in 3 bullet points.
- **Verification First**: Never report "Done" until you have run a verification script.
- **Error Handling**: If a command fails, read error log, analyze root cause, fix.

### Engineering Principles

| 原则 | 全称 | 核心思想 |
|------|------|----------|
| **SOLID** | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion | 面向对象设计五大原则：单一职责、开闭原则、里氏替换、接口隔离、依赖倒置 |
| **KISS** | Keep It Simple, Stupid | 简单就是美，拒绝不必要的复杂性，优先选择最直观的解决方案 |
| **DRY** | Don't Repeat Yourself | 杜绝重复，识别重复代码并抽象复用，统一相似功能实现 |
| **DIP** | Dependency Inversion Principle | 依赖抽象而非具体实现，上层和下层模块都应依赖抽象 |
| **YAGNI** | You Aren't Gonna Need It | 只实现当前所需功能，不做"未来可能用得到"的预留设计 |

---

# AI-Automated-office - Claude AI 工作指南
## 使用UTF-8格式进行编码
## 项目概述

**AI-Automated-office** 是一款**面向 Agent 的企业级云服务 SaaS**，旨在为企业提供一个无前端界面、通过自然语言 Agent 驱动业务流程的经营管理平台。

**核心理念：**
- **无前端 SaaS**：不提供传统 Web/桌面 UI，企业员工通过本地 Agent（Claude Code、Codex、Gemini、OpenCode、OpenClaw、Hermes 等）对话来操作系统
- **数据即服务**：Agent 调用 API 获取数据后，可生成 HTML/文档进行可视化展示
- **权限即壁垒**：完善的多租户隔离 + RBAC 权限体系，确保 Agent 只能访问授权范围内的数据
- **开源+局域网部署**：代码开源（AGPL v3），支持社区局域网部署

**目标用户：**
- **云服务运营商**：运营整个平台，创建集团/企业，管理所有租户
- **集团老板**：拥有一个或多个企业，查看跨企业经营数据
- **企业管理员**：管理企业员工、部门、业务数据
- **部门经理**：管理本部门员工和业务
- **员工**：使用业务功能（无管理权限）

**差异化核心：**
> *"传统 SaaS 给企业一个前端界面让人操作；我们给企业一个后端 API 让 Agent 操作，Agent 就是企业的数字员工。"*

**技术栈：** Go (Gin) + PostgreSQL + Redis + Docker + CLI (Cobra)

---

## 🔒 铁律文档（MANDATORY DOCUMENTS）

**以下文档是本项目的铁律，所有开发决策必须以此为基准，不可违背：**

### 1️⃣ PRD 文档 - 产品铁律
📄 **位置：** `_bmad-output/planning-artifacts/prd.md`

**内容要点：**
- 273条功能需求（FR1-FR273）
- 覆盖10+业务模块：组织架构/权限、HRM、CRM、进销存、合同管理、销售管理、售后管理、财务管理、审批工作流、知识库等
- 核心平台能力：OAuth 2.0 + JWT 认证、RBAC + ABAC 权限、多租户隔离、CLI + Skill 系统、消息轮询
- 用户旅程定义（5个核心旅程）
- MVP范围：核心业务模块 + 认证授权 + 多租户 + CLI Skill + 计费订阅 + 私有化部署
- 验收标准

**约束力：**
- ❌ 不得实现PRD之外的功能
- ❌ 不得省略PRD定义的功能点
- ✅ 实现细节可在架构框架内调整

### 2️⃣ 架构文档 - 技术铁律
📄 **位置：** `_bmad-output/planning-artifacts/architecture.md`

**内容要点：**
- 技术栈选型：Go (Gin) + PostgreSQL 15+ + Redis + Docker
- 分层架构：API Gateway → OAuth 2.0 + JWT → 业务服务层 → PostgreSQL (Schema级多租户)
- 认证授权：OAuth 2.0 + JWT + Refresh Token，RBAC + ABAC 混合权限模型
- 多租户：PostgreSQL Schema 级隔离 + Row-Level Security
- CLI & Skill 系统：Cobra CLI + Agent Skill 定义
- 消息轮询：CLI 每 60 秒轮询消息
- 错误码体系：结构化错误码 + Agent 可恢复策略
- 部署：Docker Compose 一键部署 + 局域网部署支持

**约束力：**
- ❌ 不得更换技术栈核心组件
- ❌ 不得违背模块边界
- ❌ 不得绕过安全设计（OAuth 2.0、JWT、RBAC、多租户隔离）
- ✅ 具体实现方案可在架构框架内优化

### 3️⃣ Epic 文档 - 实现铁律
📄 **位置：** `_bmad-output/planning-artifacts/epics.md`

**内容要点：**
- 多个 Epic 定义
- 详细的用户故事（Story）拆分
- 需求覆盖映射表（FR/NFR/ARCH）
- 验收标准（Acceptance Criteria）

**约束力：**
- ❌ 不得实现 Epic 之外的功能
- ❌ 不得跳过 Story 或省略验收标准
- ✅ 实现细节可在验收标准框架内调整

### 4️⃣ 测试规范铁律 - 质量铁律
📄 **位置：** `_bmad-output/planning-artifacts/testing-specification.md`

**内容要点：**
- 分层测试策略：单元测试 → 集成测试 → E2E 测试（测试金字塔）
- Mock 使用原则：Mock at the boundary, test your stack end-to-end
- E2E 测试必须使用真实 API，禁止 Mock 自有后端
- 集成测试使用 Testing Library，Mock 外部依赖
- 单元测试纯函数优先，完全 Mock 外部依赖
- 测试数据管理：Fixtures + Helpers
- 测试覆盖率要求：单元 ≥ 80%，集成 ≥ 60%，E2E 核心流程 100%
- 反模式清单：禁止 E2E Mock 自有 API、禁止测试间共享状态等

**Mock 使用决策表：**
| 场景 | 是否 Mock |
|------|----------|
| 自有 REST/GraphQL API | ❌ 永不 |
| 自有数据库 | ❌ 永不 |
| 认证系统 | ⚠️ 使用 storageState |
| 第三方服务（支付/邮件/OAuth） | ✅ 总是 |
| LLM API | ✅ 总是 |
| CDN/静态资源 | ❌ 永不 |

**约束力：**
- ❌ 不得违背分层测试策略
- ❌ E2E 测试不得 Mock 自有 API
- ❌ 不得提交失败的测试
- ✅ 新功能必须包含对应测试
- ✅ 测试代码遵循与业务代码相同的质量标准

---

## ⚠️ 铁律执行机制（MANDATORY COMPLIANCE）

### 开发前必读（Before Any Implementation）

**每次开始新任务前，必须执行以下流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                    铁律合规检查流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 读取任务需求                                        │
│     ↓                                                       │
│  Step 2: 打开并查阅 PRD 文档                                 │
│     → 确认功能定义、需求编号、验收标准                        │
│     ↓                                                       │
│  Step 3: 打开并查阅架构文档                                  │
│     → 确认技术方案、模块边界、数据库设计                      │
│     ↓                                                       │
│  Step 4: 打开并查阅 Epic 文档                                │
│     → 确认 Story 定义、验收标准、依赖关系                     │
│     ↓                                                       │
│  Step 5: 生成实现方案                                        │
│     → 方案必须同时满足 PRD + 架构 + Epic 三方约束             │
│     ↓                                                       │
│  Step 6: 开始实现                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 合规检查清单（Compliance Checklist）

**每个任务实现前必须填写：**

```markdown
## 铁律合规检查

### PRD 合规
- [ ] 功能定义来源：FR-XX（填写具体需求编号）
- [ ] 无 PRD 外功能添加

### 架构合规
- [ ] 技术方案符合架构设计
- [ ] 模块边界明确
- [ ] 命名约定遵循规范
- [ ] API 设计遵循 RESTful 规范

### Epic 合规
- [ ] Story 来源：Epic X, Story X.X（填写具体故事编号）
- [ ] 验收标准全部满足

### 测试规范合规
- [ ] 单元测试覆盖核心业务逻辑（如适用）
- [ ] 集成测试覆盖模块间交互（如适用）
- [ ] E2E 测试不 Mock 自有 API
- [ ] 测试命名符合规范（描述行为，非实现）
```
---

## 📋 MANDATORY: Agent Workflow

Every new agent session MUST follow this workflow:

### Step 1: Initialize Environment

```bash
# Go Backend
cd api && go mod download

# CLI Tool
cd cli && go mod download

# Ensure Colima is running (macOS Docker runtime)
colima status 2>/dev/null || colima start --cpu 2 --memory 4

# Docker (for PostgreSQL + Redis)
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis
```

**DO NOT skip this step.** Ensure the services are running before proceeding.

### Step 2: 铁律合规检查

**在开始任何任务之前，必须阅读以下文档：**

1. **PRD 文档**：`_bmad-output/planning-artifacts/prd.md`
2. **架构文档**：`_bmad-output/planning-artifacts/architecture.md`
3. **Epic 文档**：`_bmad-output/planning-artifacts/epics.md`
4. **测试规范铁律**：`_bmad-output/planning-artifacts/testing-specification.md`

### Step 3: Select Next Task

Read `task.json` and select ONE task to work on.

**任务结构规范：**

每个任务对应一个 OpenSpec 变更，结构如下：

```json
{
  "id": 1,
  "epic": "Epic 1",
  "story": "Story 1.1",
  "title": "Go API 项目初始化",
  "description": "创建一个可运行的 Go API 项目脚手架",
  "openspec_change": "epic-1-story-1-go-project-init",
  "steps": [...],
  "frs_covered": [],
  "nfrs_covered": ["NFR1", "NFR5"],
  "arch_covered": ["ARCH-01"],
  "dependencies": [],
  "passes": false
}
```

**核心原则：一个 Task = 一个 OpenSpec 变更 = 一个 Story**

Selection criteria (in order of priority):
1. Choose a task where `passes: false`
2. Consider dependencies - check `dependencies` field for prerequisite stories
3. 按 Epic 顺序：Epic 1 → Epic 2 → ... → Epic 8
4. 按 Story 顺序：Story X.1 → Story X.2 → ... → Story X.Y

### Step 4: Implement the Task

- 执行铁律合规检查
- Read the task description and steps carefully
- Implement the functionality to satisfy all steps
- Follow existing code patterns and conventions

### Step 5: Test Thoroughly

After implementation, verify ALL steps in the task:

**强制测试要求（Testing Requirements - MANDATORY）：**

1. **API 端点修改**（新增/修改 API、修改业务逻辑）：
   - **必须运行 API 测试！** 使用 `go test` 或 HTTP 客户端验证
   - 验证 API 端点正确响应
   - 验证错误码和错误响应格式
   - 验证权限检查（RBAC/ABAC）

2. **小幅度代码修改**（修复 bug、调整配置、添加辅助函数）：
   - 可以使用单元测试或 lint/build 验证
   - 如有疑虑，仍运行完整测试

3. **所有修改必须通过**：
   - `go vet` 无错误
   - `go build` 构建成功
   - `go test ./...` 测试通过
   - API 功能验证正常

**测试清单：**
- [ ] 代码没有编译错误
- [ ] go vet 通过
- [ ] go build 成功
- [ ] go test 通过
- [ ] API 端点功能正常（对于 API 相关修改）

### Step 6: Update Progress

Write your work to `progress.txt`:

```
## [Date] - Task: [task description]

### 铁律合规检查：
- PRD 合规：[FR-XX]
- 架构合规：[说明]

### What was done:
- [specific changes made]

### Testing:
- [how it was tested]

### Notes:
- [any relevant notes for future agents]
```

### Step 7: Commit Changes (包含 task.json 更新)

**IMPORTANT: 所有更改必须在同一个 commit 中提交，包括 task.json 的更新！**

流程：
1. 更新 `task.json`，将任务的 `passes` 从 `false` 改为 `true`
2. 更新 `progress.txt` 记录工作内容
3. 一次性提交所有更改：

```bash
git add .
git commit -m "[修改类型]+[系统模块]+[修改内容总结]"
```

**提交规范：**
- `[功能]+[API]+[添加员工管理端点]`
- `[bug]+[API]+[修复消息轮询异常]`
- `[重构]+[CLI]+[优化Skill命令结构]`

**规则:**
- 只有在所有步骤都验证通过后才标记 `passes: true`
- 永远不要删除或修改任务描述
- 永远不要从列表中移除任务
- **一个 task 的所有内容（代码、progress.txt、task.json）必须在同一个 commit 中提交**

---

## ⚠️ 阻塞处理（Blocking Issues）

**如果任务无法完成测试或需要人工介入，必须遵循以下规则：**

### 需要停止任务并请求人工帮助的情况：

1. **缺少环境配置**：
   - 需要填写真实的 API 密钥
   - 需要创建外部服务账号

2. **外部依赖不可用**：
   - 第三方 API 服务宕机
   - 需要人工授权的 OAuth 流程

3. **铁律冲突**：
   - 发现 PRD/架构文档之间存在矛盾
   - 实现需求与铁律文档冲突

### 阻塞时的正确操作：

**DO NOT（禁止）：**
- ❌ 提交 git commit
- ❌ 将 task.json 的 passes 设为 true
- ❌ 假装任务已完成
- ❌ 绕过铁律文档

**DO（必须）：**
- ✅ 在 progress.txt 中记录当前进度和阻塞原因
- ✅ 输出清晰的阻塞信息，说明需要人工做什么
- ✅ 停止任务，等待人工介入

### 阻塞信息格式：

```
🚫 任务阻塞 - 需要人工介入

**当前任务**: [任务名称]

**已完成的工作**:
- [已完成的代码/配置]

**阻塞原因**:
- [具体说明为什么无法继续]

**需要人工帮助**:
1. [具体的步骤 1]
2. [具体的步骤 2]
...

**解除阻塞后**:
- 运行 [命令] 继续任务
```

---

## 完整项目目录结构

```
ai-automated-office/
├── 📁 Go Backend API (api/)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # API 服务入口
│   ├── internal/
│   │   ├── handler/                 # HTTP Handler（Gin）
│   │   │   ├── auth_handler.go
│   │   │   ├── org_handler.go
│   │   │   ├── hrm_handler.go
│   │   │   ├── crm_handler.go
│   │   │   ├── ims_handler.go
│   │   │   ├── contract_handler.go
│   │   │   ├── sales_handler.go
│   │   │   ├── service_handler.go
│   │   │   ├── finance_handler.go
│   │   │   ├── workflow_handler.go
│   │   │   ├── kb_handler.go
│   │   │   ├── file_handler.go
│   │   │   └── message_handler.go
│   │   ├── service/                 # 业务逻辑层
│   │   │   ├── auth_service.go
│   │   │   ├── org_service.go
│   │   │   ├── hrm_service.go
│   │   │   ├── crm_service.go
│   │   │   ├── ims_service.go
│   │   │   ├── contract_service.go
│   │   │   ├── sales_service.go
│   │   │   ├── service_service.go
│   │   │   ├── finance_service.go
│   │   │   ├── workflow_service.go
│   │   │   ├── kb_service.go
│   │   │   ├── file_service.go
│   │   │   └── message_service.go
│   │   ├── repository/              # 数据访问层
│   │   │   ├── auth_repo.go
│   │   │   ├── org_repo.go
│   │   │   ├── hrm_repo.go
│   │   │   ├── crm_repo.go
│   │   │   ├── ims_repo.go
│   │   │   ├── contract_repo.go
│   │   │   ├── sales_repo.go
│   │   │   ├── service_repo.go
│   │   │   ├── finance_repo.go
│   │   │   ├── workflow_repo.go
│   │   │   ├── kb_repo.go
│   │   │   ├── file_repo.go
│   │   │   └── message_repo.go
│   │   ├── model/                   # 数据模型
│   │   │   ├── user.go
│   │   │   ├── enterprise.go
│   │   │   ├── department.go
│   │   │   ├── employee.go
│   │   │   ├── customer.go
│   │   │   ├── contract.go
│   │   │   ├── order.go
│   │   │   ├── product.go
│   │   │   ├── warehouse.go
│   │   │   └── ...
│   │   ├── middleware/              # 中间件
│   │   │   ├── auth.go             # JWT 认证中间件
│   │   │   ├── rbac.go             # 权限检查中间件
│   │   │   ├── tenant.go           # 多租户中间件
│   │   │   ├── cors.go             # CORS 中间件
│   │   │   └── logger.go           # 请求日志中间件
│   │   └── pkg/                    # 内部公共包
│   │       ├── errors/             # 结构化错误码
│   │       ├── response/           # 统一响应格式
│   │       ├── validator/          # 参数验证
│   │       └── pagination/         # 分页工具
│   ├── pkg/                        # 公共包（可被 CLI 引用）
│   │   ├── api_client/             # API 客户端
│   │   └── config/                 # 配置管理
│   ├── go.mod
│   └── go.sum
│
├── 📁 CLI 工具 (cli/)
│   ├── cmd/                        # Cobra 命令
│   │   ├── root.go
│   │   ├── auth.go                 # ao-cli auth login/logout
│   │   ├── poll.go                 # ao-cli poll（消息轮询）
│   │   └── skill.go                # ao-cli skill（Skill 管理）
│   ├── internal/
│   │   ├── skill/                  # Skill 定义与执行
│   │   │   ├── registry.go
│   │   │   ├── hr_skills.go
│   │   │   ├── crm_skills.go
│   │   │   ├── ims_skills.go
│   │   │   ├── contract_skills.go
│   │   │   ├── sales_skills.go
│   │   │   ├── service_skills.go
│   │   │   ├── finance_skills.go
│   │   │   └── workflow_skills.go
│   │   ├── poller/                 # 消息轮询器
│   │   │   └── poller.go
│   │   └── config/                 # CLI 配置
│   │       └── config.go
│   ├── go.mod
│   └── main.go
│
├── 📁 部署配置 (deploy/)
│   └── docker-compose/
│       ├── docker-compose.yml      # PostgreSQL + Redis + API
│       ├── Dockerfile.api          # API 服务镜像
│       ├── Dockerfile.cli          # CLI 工具镜像
│       ├── nginx/                  # Nginx 配置
│       │   └── nginx.conf
│       └── .env.example
│
├── 📁 测试 (tests/)
│   ├── unit/                       # 单元测试
│   │   ├── handler/
│   │   ├── service/
│   │   └── repository/
│   ├── integration/                # 集成测试
│   │   ├── auth/
│   │   ├── org/
│   │   ├── hrm/
│   │   ├── crm/
│   │   ├── ims/
│   │   └── workflow/
│   └── e2e/                        # E2E 测试
│       ├── auth_test.go
│       ├── org_test.go
│       ├── hrm_test.go
│       ├── crm_test.go
│       ├── ims_test.go
│       └── workflow_test.go
│
├── 📁 文档 (docs/)
│   ├── api/                        # OpenAPI 3.0 规范
│   │   └── openapi.yaml
│   ├── deployment/                 # 部署文档
│   └── skills/                     # Skill 定义文档
│
├── 📁 配置与日志
│   ├── config/                     # 配置文件
│   │   ├── app.yaml                # 应用配置
│   │   ├── database.yaml           # 数据库配置
│   │   └── logging.yaml            # 日志配置
│   └── logs/                       # 日志目录
│       ├── app.log
│       ├── error.log
│       └── performance.log
│
├── 📁 铁律文档
│   └── _bmad-output/
│       └── planning-artifacts/
│           ├── prd.md
│           ├── architecture.md
│           ├── epics.md
│           └── testing-specification.md
│
├── task.json                       # 任务跟踪
├── progress.txt                    # 进度记录
├── CLAUDE.md                       # 工作指南
└── README.md                       # 项目说明
```

---

## 💻 Commands

```bash
# Go Backend API
cd api
go mod download          # 安装依赖
go run cmd/server/main.go  # 启动 API 服务
go build -o bin/api cmd/server/main.go  # 构建 API
go test ./...            # 运行所有测试
go test ./internal/handler/...  # 运行 handler 测试
go vet ./...             # 代码检查
go fmt ./...             # 格式化代码

# CLI 工具
cd cli
go mod download          # 安装依赖
go run main.go           # 运行 CLI
go build -o bin/ao-cli main.go  # 构建 CLI

# Docker 部署（macOS 需先启动 Colima）
colima status 2>/dev/null || colima start --cpu 2 --memory 4   # Colima 是 macOS Docker 运行时
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis   # 启动 PostgreSQL + Redis
docker compose -f deploy/docker-compose/docker-compose.yml down     # 停止所有服务
docker compose -f deploy/docker-compose/docker-compose.yml logs -f  # 查看日志

# 数据库管理
docker exec -it ao-postgres psql -U ai_office -d ai_office    # 连接数据库
docker exec ao-postgres pg_isready -U ai_office -d ai_office  # 检查状态

# 开发环境配置
cp deploy/docker-compose/.env.example deploy/docker-compose/.env  # 复制环境变量模板
```

---

## 📝 Coding Conventions

### Go 规范
- 遵循 Go 官方代码风格（Effective Go）
- 使用 `go fmt` 格式化代码
- 使用 `go vet` 进行代码检查
- 使用 `golangci-lint` 进行综合代码检查
- 错误处理：显式处理所有 error，禁止 `_ =` 忽略错误
- 包命名：小写单词，无下划线（如 `handler`, `service`, `repository`）
- 文件命名：snake_case（如 `auth_handler.go`, `org_service.go`）
- 接口命名：动词+er 或名词（如 `Evaluator`, `Repository`）

### API 设计规范
- RESTful 风格，使用 OpenAPI 3.0 规范
- URL 命名：kebab-case，复数名词（如 `/api/v1/employees`）
- HTTP 方法：GET（查询）、POST（创建）、PUT（全量更新）、PATCH（部分更新）、DELETE（删除）
- 统一响应格式：`{ "data": ..., "error": ..., "meta": ... }`
- 结构化错误码：`{模块}_{错误类型}_{序号}`（如 `AUTH_TOKEN_EXPIRED`）
- 分页：`?page=1&page_size=20`
- 排序：`?sort=created_at&order=desc`

### 数据库规范
- 遵循 PRD 数据字典定义
- 使用 PostgreSQL，Schema 级多租户隔离
- 表名：snake_case，复数（如 `employees`, `contracts`）
- 列名：snake_case（如 `enterprise_id`, `created_at`）
- 敏感数据使用 AES-256 加密存储
- 所有表包含 `id` (UUID)、`created_at`、`updated_at`、`deleted_at` 字段
- 软删除：使用 `deleted_at` 字段

### CLI & Skill 规范
- CLI 命令：`ao-cli <command> [flags]`
- Skill 命名：`{module}_{entity}_{action}`（如 `hrm_employee_create`）
- Skill 定义包含：name、description、parameters、api_endpoint
- 消息轮询间隔：60 秒
- **CLI 唯一入口**：Agent 禁止直接使用 `curl` 调用业务 API，必须通过 `ao-cli skill execute` 执行所有业务操作。CLI 统一管理认证凭证生命周期

---

## 🎯 Key Rules

1. **铁律优先** - PRD、架构、Epic 文档是铁律，所有决策以此为基准
2. **One task per session** - Focus on completing one task well
3. **合规检查** - 实现前必须完成铁律合规检查
4. **Test before marking complete** - All steps must pass
5. **API testing for endpoint changes** - 新增或修改 API 端点必须测试
6. **Document in progress.txt** - Help future agents understand your work
7. **One commit per task** - 所有更改（代码、progress.txt、task.json）必须在同一个 commit 中提交
8. **Never remove tasks** - Only flip `passes: false` to `true`
9. **Stop if blocked** - 需要人工介入时，不要提交，输出阻塞信息并停止
10. **Agent-First Design** - API 设计优先考虑 Agent 调用场景，错误码可被 Agent 自动恢复
11. **本地优先** - 数据存储采用 PostgreSQL + Redis 缓存策略
12. **无前端** - 本项目不提供任何 Web/桌面 UI，所有交互通过 API + CLI 完成
13. **时间很充足** - 不存在什么时间有限的说法，不要使用任何简化的或者批量的方式降低代码质量！
13. **CLI 唯一入口铁律** - Agent 绝对禁止通过 `curl` 等 HTTP 客户端直接调用业务 API。所有业务操作必须通过 `ao-cli skill execute` 执行。用户在 CLI 输入一次凭证（`ao-cli init` + `ao-cli auth login`），CLI 统一管理 token 生命周期和自动刷新，Agent 不接触任何凭证。服务器端验证请求来源 Header `X-Request-Source: ao-cli`，拒绝非 CLI 请求
14. **Think Before Coding**
    Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
15. **Simplicity First**
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
16. **Surgical Changes**
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.
17. **Goal-Driven Execution**
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.


## 🚀 快速启动清单

**新会话启动清单：**

1. [ ] 阅读本 CLAUDE.md 文件
2. [ ] 阅读 PRD 文档（`_bmad-output/planning-artifacts/prd.md`）
3. [ ] 阅读架构文档（`_bmad-output/planning-artifacts/architecture.md`）
4. [ ] 阅读 Epic 文档（`_bmad-output/planning-artifacts/epics.md`）
5. [ ] 查看 task.json 选择任务
6. [ ] 启动依赖服务：`docker-compose -f deploy/docker-compose/docker-compose.yml up -d`
7. [ ] 安装 Go 依赖：`cd api && go mod download`
8. [ ] 启动 API 服务：`cd api && go run cmd/server/main.go`（默认端口 8080）
9. [ ] 开始工作！

---

## 🏃 运行服务（Running Services）

当前开发环境使用 **Colima + Docker** 运行依赖服务：

| 服务 | 容器名 | 端口 | 连接信息 |
|------|--------|------|----------|
| PostgreSQL 15 | `ao-postgres` | `5432` | `host=localhost user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable` |
| Redis 7 | `ao-redis` | `6379` | `localhost:6379` |
| API (Gin) | - | `8080` | `http://localhost:8080`（健康检查: `/api/v1/health`） |
| CLI | - | - | `go run main.go -s http://localhost:8080` |

**Colima 管理：**
```bash
colima start --cpu 2 --memory 4   # 启动 Docker 运行时
colima stop                       # 停止
```

**数据库管理：**
```bash
docker exec -it ao-postgres psql -U ai_office -d ai_office    # 连接数据库
docker exec ao-postgres pg_isready -U ai_office -d ai_office  # 检查状态
```

**当前数据库表（public schema）：** `groups`, `enterprises`, `users`
**测试账号：** `admin@test.com` / `test123`（角色: operator）

---

## 🤖 全自动开发流程

### 流程概述

```
┌─────────────────────────────────────────────────────────────┐
│                    全自动开发流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: 任务初始化（使用 xianyu-task-openspec）      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  1. 读取 epics.md，解析所有 Epic 和 Story                   │
│     ↓                                                       │
│  2. 为每个 Story 生成 OpenSpec 变更目录                      │
│     → openspec/changes/epic-X-story-Y-<name>/               │
│     ↓                                                       │
│  3. 同步生成 task.json 任务条目                              │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  Phase 2: 任务执行循环                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  4. 读取 task.json，选择 passes=false 的任务                 │
│     ↓                                                       │
│  5. 检查依赖关系，确保前置任务已完成                          │
│     ↓                                                       │
│  6. 从任务获取 openspec_change 字段                        │
│     ↓                                                       │
│  7. 读取 OpenSpec 变更文档                                   │
│     → openspec/changes/<openspec_change>/                   │
│     → proposal.md + design.md + tasks.md + specs/spec.md    │
│     ↓                                                       │
│  8. 执行铁律合规检查                                         │
│     → PRD + 架构 + Epic 三方约束                             │
│     ↓                                                       │
│  9. 按照OpenSpec 变更文档设计实现(调用opensx-apply skill)功能代码                      │
│     ↓                                                       │
│  10. 执行测试验证                                            │
│     → go vet / go build / go test                           │
│     ↓                                                       │
│  11. 更新 progress.txt/标记tasks.md中的内容为已完成                   │
│     ↓                                                       │
│  12. 更新 task.json (passes: true)                           │
│     ↓                                                       │
│  13. 提交 git commit                                         │
│     ↓                                                       │
│  14. 返回 Step 4，读取 task.json，选择 passes=false 的任务，执行到 Step14，不断循环执行，直到所有任务 passes=true │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  Phase 3: 完成确认                                     │   │
│                                                             │
│  15. 所有任务 passes=true                                    │
│     ↓                                                       │
│  16. 执行最终集成测试                                         │
│     ↓                                                       │
│  17. 归档 OpenSpec 变更                                      │
│     → openspec/changes/archive/                             │
│     ↓                                                       │
│  18. 发布版本                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
---
新增注意事项：Qdrant 云端只接受数字或 UUID 格式的 ID
现有测试框架：参考：tests/README.md

---

# ai-office - 团队运营手册

> 由 CCteam-creator 自动生成，可按需修改。
> 此文件让 team-lead 的团队知识在上下文压缩后仍然保持。

## Team-Lead 控制平面

- team-lead = 主对话，不是生成的 agent
- team-lead 负责用户对齐、范围控制、任务分解和阶段推进
- team-lead 维护项目全局真相：主 `task_plan.md`、`decisions.md` 和此 `CLAUDE.md`
- team-lead 决定某个流程改进是项目本地的还是需要写回 `CCteam-creator` 的
- **禁用独立子智能体**：团队存在后，所有工作通过 SendMessage 交给队友。不要启动独立的 Agent/子智能体（Explore、general-purpose 等）——它们绕过团队的规划文件和协作体系。唯一例外：用 `team_name` 生成新队友加入团队

## 团队花名册（第3轮迭代）

| 名称 | 角色 | 模型 | 核心能力 |
|------|------|------|---------|
| backend-dev | 后端开发 | sonnet | Go API 服务端代码 + TDD |
| researcher | 探索/研究 | sonnet | 代码搜索 + 铁律文档对比（只读） |

> reviewer/custodian 按需在审查轮启动

## 任务下发协议

### 消息送达时序（关键）
`SendMessage` 只在接收方 idle 时送达——**无法**打断进行中的任务。初始派单必须前置上下文（没有中途追加），广播也没有抢占，实时状态靠直接读 `progress.md` / `findings.md`（**文件实时，消息不是**）。

### TaskCreate 描述格式（team-lead 上下文压缩后参考）

TaskCreate 描述：一句话范围 + 验收标准 + `.plans/` 路径。
示例：`"C1 差距分析。输出：优先差距列表。详见 .plans/ai-office/researcher/research-c1-gap/findings.md"`

### 大任务（功能开发、新模块）-- 停止检查后再发送

**在给任何智能体下发大任务前，检查消息中是否包含以下 4 项。如有缺失，先补上再发。**

1. **范围和目标**：要做什么、验收标准
2. **文档提醒**："请创建 `<前缀>-<任务名>/` 任务文件夹（含 task_plan.md + findings.md + progress.md），并在你的根 findings.md 中添加索引条目"
3. **依赖说明**：依赖哪些调研/任务的结论，关键文件路径和行号
4. **审查预期**：完成后是否需要代码审查

### 小任务（Bug 修复、配置变更）

直接发消息说明改动即可，不需要任务文件夹，也不需要审查。

## 通信速查

| 操作 | 命令 |
|------|------|
| 给单个智能体分配任务 | `SendMessage(to: "<名称>", message: "...")` |
| 广播给所有人（慎用） | `SendMessage(to: "*", message: "...")` |
| dev 请求代码审查 | dev 直接联系 reviewer（不经过 team-lead） |

## 状态检查

| 要检查什么 | 怎么做 |
|-----------|--------|
| 全局概览 | `TaskList` — 所有任务、负责人、阻塞情况一览 |
| 快速扫描 | 并行读取各 agent 的 `progress.md` |
| 深入了解 | 读 agent 的 `findings.md`（索引）→ 再看具体任务文件夹 |
| 方向检查 | 读 `.plans/ai-office/task_plan.md` |
| 恢复项目 | 读 `team-snapshot.md` → 检查陈旧度 → 从缓存 prompt 启动智能体 |

读取顺序：**progress**（到哪了）→ **findings**（遇到什么）→ **task_plan**（目标是什么）

## 文档索引（知识库）

> **导航地图**：`docs/index.md` 有各文档的 section 级导航（含行号范围）。
> custodian 维护 docs/index.md。需要在 docs/ 中查找信息时先 Read 它。

| 文档 | 位置 | 维护者 |
|------|------|--------|
| 导航地图 | .plans/ai-office/docs/index.md | custodian |
| 架构 | .plans/ai-office/docs/architecture.md | team-lead, devs |
| API 契约 | .plans/ai-office/docs/api-contracts.md | devs（API 变更时**必须**同步） |
| 不变量 | .plans/ai-office/docs/invariants.md | team-lead, reviewer |

**Doc-Code Sync 规则**：当代码变更了 API 或架构时，对应的 docs/ 文件**必须**在同一个任务中同步更新。

## 审查维度

| # | 维度 | 权重 | STRONG 表现 | WEAK 表现 |
|---|------|------|-----------|---------|
| RD-1 | 铁律合规 | 高 | 每个实现都有 PRD 编号来源，满足架构+Epic 双方约束 | 实现无 PRD 来源，或违反铁律文档 |
| RD-2 | 产品深度 | 高 | 涵盖真实用户边界情况（空状态、错误恢复、并发），不只是开心路径 | 仅开心路径工作，错误状态显示原始异常 |
| RD-3 | 代码质量 | 中 | 函数<50行，文件<800行，明确错误处理，Go 惯用模式 | 大函数，深层嵌套，吞异常 |
| RD-4 | 可测试性 | 中 | 关键行为被测试覆盖，添加新测试容易 | 无测试，或测试与实现耦合 |

## 核心协议

| 协议 | 触发时机 | 操作 |
|------|---------|------|
| 需求对齐 | 每循环开始 | researcher 对比铁律文档与代码实际，team-lead 与用户对齐 |
| 3-Strike 上报 | 智能体报告 3 次失败 | 读其 progress.md，给新方向或重新分配 |
| 代码审查 | 大功能/新模块完成 | dev 在 findings.md 写改动摘要，发给 reviewer |
| 阶段推进 | 循环完成 | 调研完：读 findings 更新主计划。开发完：等 reviewer [OK]/[WARN] |
| 上下文溢出 | 智能体报告上下文过长 | 进度已存文件，恢复或生成后继者 |
| CI 门禁 | 任何代码变更 | 运行 CI 脚本，所有检查 PASS 后才能提交审查 |
| 护栏捕获 | 3-Strike/reviewer [BLOCK] 修复后 | 问：会复现吗？如果会 → 追加到 Known Pitfalls |
| custodian 巡检 | 2-3 个 dev 任务完成后 | team-lead 触发 custodian 合规巡检 |

## Known Pitfalls

### KP-1: 构建日志提交到仓库
- 症状：build.txt / build_errors.txt 等大文件被提交到 git
- 根因：.gitignore 未覆盖构建日志文件
- 修复：删除文件 + 加入 .gitignore
- 预防：reviewer 审查时检查是否有大文本文件被提交

### KP-2: Go 生产代码使用 panic
- 症状：handler/service 层使用 panic 替代 error return
- 根因：开发时为方便使用 panic，未替换为错误处理
- 修复：恢复 error return 错误处理模式
- 预防：reviewer 审查 Go 代码时标记所有 panic 使用

### KP-3: 数据库迁移未同步
- 症状：model 变更后数据库 schema 未更新
- 根因：修改 model 后忘记创建对应的 migration
- 修复：每次 model 变更必须同步创建 migration 文件
- 预防：reviewer 审查时检查 model 变更是否有对应 migration

### KP-4: 多租户隔离遗漏
- 症状：查询未加 enterprise_id 过滤条件
- 根因：开发时忘记在 repository 层添加租户隔离条件
- 修复：所有 repository 查询必须包含 enterprise_id 条件
- 预防：reviewer 审查 repository 代码时检查多租户隔离

## 迭代节奏

6 循环 × 5 轮 = 30 轮。每循环：差距分析(R1) → 开发(R2-R3) → 测试(R4) → 审查(R4) → 清理(R5)

当前：第3轮迭代，循环1进行中。差距G1-G24，详见 .plans/ai-office/task_plan.md
