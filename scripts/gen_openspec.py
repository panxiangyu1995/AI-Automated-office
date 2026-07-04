#!/usr/bin/env python3
"""
Generate OpenSpec artifacts for all Epics/Stories defined in epics.md.
Also generates the complete task.json.

Usage: python3 scripts/gen_openspec.py
"""

import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHANGES_DIR = os.path.join(BASE, "openspec", "changes")

# ─── Story Data (extracted from epics.md) ───

STORIES = [
    # ========== Epic 1: 平台基础与认证授权 ==========
    {
        "epic": 1, "story": "1.1", "title": "Go API 项目初始化",
        "as_a": "开发者",
        "i_want": "创建一个可运行的 Go API 项目脚手架（Go + Gin + GORM + PostgreSQL）",
        "so_that": "后续所有业务模块可以在标准化的项目结构上开发",
        "ac": [
            "执行 go run cmd/server/main.go，API 服务启动并监听配置端口（默认 8080）",
            "项目结构遵循 api/cmd/server、api/internal/handler/service/repository/model、api/pkg 分层",
            "go mod init github.com/ai-office/api 已完成",
            "Gin 框架和 GORM 已引入",
        ],
        "frs": ["FR-AUTH-011"], "nfrs": ["NFR-EXT-001"], "deps": [],
        "capability": "go-api-scaffold",
    },
    {
        "epic": 1, "story": "1.2", "title": "CLI 项目初始化（Cobra）",
        "as_a": "开发者",
        "i_want": "创建一个可运行的 CLI 项目脚手架（Go + Cobra）",
        "so_that": "Agent 可以通过 CLI 调用后端 API",
        "ac": [
            "执行 go run main.go，CLI 工具启动并显示帮助信息",
            "项目结构遵循 cli/cmd、cli/internal/skill、cli/internal/poller 分层",
            "go mod init github.com/ai-office/cli 已完成",
            "Cobra 框架已引入",
        ],
        "frs": ["FR-AUTH-011"], "nfrs": ["NFR-INT-002"], "deps": [],
        "capability": "cli-scaffold",
    },
    {
        "epic": 1, "story": "1.3", "title": "Docker Compose 部署配置",
        "as_a": "运维人员",
        "i_want": "通过 Docker Compose 一键启动 PostgreSQL + Redis + API 服务",
        "so_that": "开发和部署环境可以快速搭建",
        "ac": [
            "执行 docker-compose up -d，PostgreSQL 15+、Redis 7、API 服务容器全部启动",
            "API 服务可以连接 PostgreSQL 和 Redis",
            ".env.example 包含所有必要环境变量模板",
        ],
        "frs": ["FR-DEPLOY-001"], "nfrs": ["NFR-DEP-001", "NFR-DEP-003"], "deps": ["1.1"],
        "capability": "docker-compose-deploy",
    },
    {
        "epic": 1, "story": "1.4", "title": "数据库连接与多租户 Schema 管理",
        "as_a": "系统管理员",
        "i_want": "系统能够自动管理 PostgreSQL Schema 实现多租户数据隔离",
        "so_that": "不同企业的数据完全隔离，互不可见",
        "ac": [
            "创建新企业时，系统自动创建该企业专属的 PostgreSQL Schema（如 tenant_{uuid}）",
            "Schema 包含所有业务表的初始结构",
            "Schema 创建失败时返回明确错误码",
            "API 请求携带企业上下文时，所有 SQL 自动路由到对应企业的 Schema",
            "任何查询无法跨越企业 Schema 边界",
        ],
        "frs": ["FR-AUTH-012"], "nfrs": ["NFR-SEC-003"], "deps": ["1.1"],
        "capability": "multi-tenant-schema",
    },
    {
        "epic": 1, "story": "1.5", "title": "统一响应格式与结构化错误码体系",
        "as_a": "Agent 开发者",
        "i_want": "所有 API 返回统一格式的响应和结构化错误码",
        "so_that": "Agent 可以理解错误并自动恢复",
        "ac": [
            "请求成功返回 { data: ..., meta: { page, page_size, total } } 格式",
            "请求失败返回 { error: { code, message, details } } 格式",
            "错误码格式为 {模块}_{错误类型}_{序号}（如 AUTH_TOKEN_EXPIRED）",
            "Agent 可根据 error.code 程序化处理错误",
        ],
        "frs": ["FR-AUTH-010"], "nfrs": ["NFR-INT-001"], "deps": ["1.1"],
        "capability": "unified-response-format",
    },
    {
        "epic": 1, "story": "1.6", "title": "OAuth 2.0 认证（登录/刷新/登出）",
        "as_a": "用户",
        "i_want": "通过 OAuth 2.0 流程登录系统、刷新令牌和登出",
        "so_that": "我可以安全地访问系统 API",
        "ac": [
            "POST /api/v1/auth/login 返回 Access Token（JWT，1小时）和 Refresh Token（30天）",
            "Access Token 包含 user_id、enterprise_id、role 等声明",
            "POST /api/v1/auth/refresh 返回新的 Access Token 和 Refresh Token，旧 Refresh Token 失效",
            "POST /api/v1/auth/logout 使当前 Token 均失效，后续请求返回 401",
        ],
        "frs": ["FR-AUTH-001", "FR-AUTH-002"], "nfrs": ["NFR-SEC-001", "NFR-INT-003"], "deps": ["1.4", "1.5"],
        "capability": "oauth2-authentication",
    },
    {
        "epic": 1, "story": "1.7", "title": "JWT 认证中间件与 RBAC 权限控制",
        "as_a": "系统开发者",
        "i_want": "所有 API 请求经过 JWT 认证和 RBAC 权限验证",
        "so_that": "无权限的请求被拦截并返回 403",
        "ac": [
            "未携带 Authorization 头的请求返回 401 Unauthorized",
            "Token 中角色无权访问时返回 403 Forbidden，错误码 AUTH_PERMISSION_DENIED",
            "定义 5 种角色：Operator、Owner、Admin、Manager、Employee",
            "各角色只能访问其权限范围内的 API",
        ],
        "frs": ["FR-AUTH-003", "FR-AUTH-005"], "nfrs": ["NFR-SEC-004"], "deps": ["1.6"],
        "capability": "jwt-rbac-middleware",
    },
    {
        "epic": 1, "story": "1.8", "title": "审计日志（基础操作记录）",
        "as_a": "管理员",
        "i_want": "系统自动记录所有业务操作的审计日志",
        "so_that": "我可以追溯谁在什么时间做了什么操作",
        "ac": [
            "用户执行任何业务操作时，系统自动记录操作者 ID、时间、类型、目标实体、变更内容",
            "可按时间范围、用户、操作类型筛选查询审计日志，支持分页",
        ],
        "frs": ["FR-AUTH-006", "FR-AUTH-007"], "nfrs": ["NFR-REL-005"], "deps": ["1.7"],
        "capability": "audit-log",
    },
    {
        "epic": 1, "story": "1.9", "title": "自动定时备份",
        "as_a": "管理员",
        "i_want": "配置自动定时数据库备份",
        "so_that": "数据可以在故障时恢复",
        "ac": [
            "管理员配置备份策略（每日备份时间），到达时间自动执行 pg_dump 备份指定企业 Schema",
            "备份文件存储在配置的目录",
            "管理员触发手动恢复时，选择备份文件恢复该企业 Schema，不影响其他企业数据",
        ],
        "frs": ["FR-AUTH-008", "FR-AUTH-013"], "nfrs": ["NFR-REL-002", "NFR-REL-003"], "deps": ["1.4"],
        "capability": "auto-backup",
    },
    {
        "epic": 1, "story": "1.10", "title": "API 配额管理与功能开关",
        "as_a": "运营商",
        "i_want": "管理企业的 API 调用配额和功能模块开关",
        "so_that": "可以防止滥用并控制企业可用功能",
        "ac": [
            "企业 API 调用量达到配额限制时返回 429 Too Many Requests，错误码 AUTH_QUOTA_EXCEEDED",
            "配额按周期自动重置",
            "运营商关闭某企业的功能模块后，该企业用户访问该模块 API 返回 403，错误码 AUTH_FEATURE_DISABLED",
        ],
        "frs": ["FR-AUTH-015", "FR-AUTH-016"], "nfrs": [], "deps": ["1.7"],
        "capability": "api-quota-feature-flags",
    },
    {
        "epic": 1, "story": "1.11", "title": "Rate Limiting 中间件",
        "as_a": "系统开发者",
        "i_want": "实现 API 请求频率限制",
        "so_that": "单个企业或 IP 不会压垮系统",
        "ac": [
            "配置 Rate Limit 规则（每企业 1000 QPS，每 IP 100 QPS）",
            "请求频率超过限制时返回 429 Too Many Requests",
            "响应头包含 X-RateLimit-Limit、X-RateLimit-Remaining、X-RateLimit-Reset",
        ],
        "frs": [], "nfrs": ["NFR-PERF-003"], "deps": ["1.7"],
        "capability": "rate-limiting",
    },
    {
        "epic": 1, "story": "1.12", "title": "可观测性架构（日志/监控/链路追踪）",
        "as_a": "运维人员",
        "i_want": "系统具备结构化日志、Prometheus 指标和 OpenTelemetry 链路追踪",
        "so_that": "我可以监控系统健康状态和排查问题",
        "ac": [
            "API 输出结构化 JSON 日志到 stdout，包含请求 ID、时间、方法、路径、状态码、耗时",
            "Prometheus /metrics 端点返回 API 请求总数、响应时间分布、错误率等指标",
            "OpenTelemetry 链路追踪 ID 在服务间传递，可在 Jaeger 中查看完整调用链",
        ],
        "frs": ["FR-AUTH-017"], "nfrs": ["NFR-OBS-001", "NFR-OBS-002", "NFR-OBS-003"], "deps": ["1.1"],
        "capability": "observability",
    },
    {
        "epic": 1, "story": "1.13", "title": "CLI 多平台构建与后台服务模式",
        "as_a": "用户",
        "i_want": "CLI 工具可以在 Windows/macOS/Linux 上运行，并支持开机自启为后台服务",
        "so_that": "我可以在不同操作系统上使用 CLI 并持续接收消息",
        "ac": [
            "执行交叉编译构建，生成 Windows（.exe）、macOS、Linux 三个平台的可执行文件",
            "CLI 以后台服务模式运行时，支持 ao-cli service install/start/stop/uninstall 命令",
        ],
        "frs": ["FR-AUTH-011", "FR-AUTH-014"], "nfrs": ["NFR-INT-002"], "deps": ["1.2"],
        "capability": "cli-cross-platform",
    },
    # ========== Epic 2: 组织架构与多企业管理 ==========
    {
        "epic": 2, "story": "2.1", "title": "集团管理（创建/编辑/删除）",
        "as_a": "运营商",
        "i_want": "创建、编辑和删除集团账号",
        "so_that": "可以为拥有多个企业的老板建立集团管理入口",
        "ac": [
            "POST /api/v1/groups 创建集团记录，返回集团 ID 和名称，自动创建集团 Owner 用户账号",
            "PUT /api/v1/groups/{group_id} 更新集团信息",
            "DELETE /api/v1/groups/{group_id} 软删除集团（集团下无活跃企业时才允许删除）",
        ],
        "frs": ["FR-ORG-001", "FR-GROUP-001"], "nfrs": [], "deps": ["1.7"],
        "capability": "group-management",
    },
    {
        "epic": 2, "story": "2.2", "title": "企业管理（创建/编辑/查看）",
        "as_a": "集团老板或运营商",
        "i_want": "创建和管理企业",
        "so_that": "可以在企业内搭建组织架构",
        "ac": [
            "POST /api/v1/enterprises 创建企业记录，同时自动创建企业专属 PostgreSQL Schema，返回企业 ID 和初始管理员账号",
            "GET /api/v1/enterprises 返回所有企业列表及使用情况",
            "PUT /api/v1/enterprises/{enterprise_id} 更新企业基本信息",
        ],
        "frs": ["FR-ORG-002", "FR-GROUP-002", "FR-OP-001"], "nfrs": [], "deps": ["1.4", "2.1"],
        "capability": "enterprise-management",
    },
    {
        "epic": 2, "story": "2.3", "title": "部门管理（创建/编辑/删除/树形结构）",
        "as_a": "企业管理员",
        "i_want": "创建、编辑、删除部门并查询组织架构树",
        "so_that": "可以建立符合企业实际的组织结构",
        "ac": [
            "POST /api/v1/enterprises/{enterprise_id}/departments 创建部门记录，支持多级树形结构",
            "PUT /api/v1/departments/{department_id} 更新部门信息",
            "DELETE /api/v1/departments/{department_id} 软删除部门（部门下无员工时才允许删除）",
            "GET /api/v1/enterprises/{enterprise_id}/departments/tree 返回树形结构的组织架构",
        ],
        "frs": ["FR-ORG-003", "FR-ORG-009"], "nfrs": [], "deps": ["2.2"],
        "capability": "department-management",
    },
    {
        "epic": 2, "story": "2.4", "title": "部门经理设置与权限",
        "as_a": "企业管理员",
        "i_want": "设置部门经理并赋予部门级管理权限",
        "so_that": "部门经理可以管理本部门员工和业务",
        "ac": [
            "PUT /api/v1/departments/{department_id}/manager 指定员工 ID 成为部门经理，获得 Manager 角色",
            "部门经理可以编辑本部门信息，禁止修改其他部门信息",
        ],
        "frs": ["FR-ORG-004", "FR-ORG-005"], "nfrs": [], "deps": ["2.3", "2.5"],
        "capability": "department-manager",
    },
    {
        "epic": 2, "story": "2.5", "title": "员工档案基础 CRUD",
        "as_a": "企业管理员",
        "i_want": "创建、编辑、删除员工档案",
        "so_that": "可以为企业员工建立账号和归属关系",
        "ac": [
            "POST /api/v1/enterprises/{enterprise_id}/employees 创建员工记录，生成登录凭证，员工必须归属某个部门",
            "PUT /api/v1/employees/{employee_id} 更新员工信息",
            "DELETE /api/v1/employees/{employee_id} 软删除员工（标记为离职，保留历史数据）",
        ],
        "frs": ["FR-ORG-006", "FR-ORG-007"], "nfrs": [], "deps": ["2.3"],
        "capability": "employee-crud",
    },
    {
        "epic": 2, "story": "2.6", "title": "员工查询（按角色/姓名模糊搜索）",
        "as_a": "企业用户",
        "i_want": "按角色或姓名模糊搜索员工",
        "so_that": "可以快速找到需要联系的同事",
        "ac": [
            "GET /api/v1/employees?role=manager 返回所有 Manager 角色的员工列表",
            "GET /api/v1/employees?name=张 返回姓名包含'张'的员工列表",
            "GET /api/v1/employees?position=仓库管理员 返回岗位为'仓库管理员'的员工列表",
        ],
        "frs": ["FR-ORG-011", "FR-ORG-012"], "nfrs": [], "deps": ["2.5", "2.7"],
        "capability": "employee-search",
    },
    {
        "epic": 2, "story": "2.7", "title": "岗位定义与管理",
        "as_a": "企业管理员",
        "i_want": "定义和管理岗位（职位）",
        "so_that": "员工档案可以关联岗位，新员工可以通过 Agent 查询岗位职责",
        "ac": [
            "POST /api/v1/positions 创建岗位定义",
            "GET /api/v1/positions 返回所有岗位列表",
            "PUT /api/v1/positions/{position_id} 更新岗位信息",
        ],
        "frs": ["FR-ORG-013"], "nfrs": [], "deps": ["2.2"],
        "capability": "position-management",
    },
    {
        "epic": 2, "story": "2.8", "title": "老板跨企业视角切换",
        "as_a": "集团老板",
        "i_want": "在不同企业之间切换视角",
        "so_that": "可以查看和管理不同企业的数据",
        "ac": [
            "POST /api/v1/auth/switch-enterprise 携带目标企业 ID，返回该企业的新 Access Token",
            "老板切换到企业 A 后查询员工列表，只返回企业 A 的员工",
        ],
        "frs": ["FR-ORG-008", "FR-GROUP-003"], "nfrs": [], "deps": ["1.6", "2.2"],
        "capability": "cross-enterprise-view-switch",
    },
    {
        "epic": 2, "story": "2.9", "title": "跨企业权限管理",
        "as_a": "集团老板或企业管理员",
        "i_want": "为员工开通跨企业访问权限",
        "so_that": "核心员工可以访问多个企业的数据",
        "ac": [
            "POST /api/v1/cross-enterprise/permissions 为员工开通跨企业权限",
            "PUT /api/v1/cross-enterprise/permissions/{permission_id} 调整跨企业员工的可访问数据范围",
            "拥有跨企业权限的员工只能访问被授权范围内的数据，所有操作记录审计日志",
        ],
        "frs": ["FR-AUTH-004", "FR-GROUP-004", "FR-GROUP-005", "FR-GROUP-006", "FR-GROUP-008"], "nfrs": [], "deps": ["2.5", "2.2"],
        "capability": "cross-enterprise-permissions",
    },
    {
        "epic": 2, "story": "2.10", "title": "精细化权限分配",
        "as_a": "企业管理员或老板",
        "i_want": "自定义员工的权限（精细化到具体操作）",
        "so_that": "可以按需授权，而非仅依赖角色粗粒度控制",
        "ac": [
            "POST /api/v1/employees/{employee_id}/permissions 为员工设置精细化权限",
            "系统优先检查精细化权限，再检查角色权限",
            "精细化权限可限制到具体模块、具体操作（如'只能查看合同，不能创建'）",
        ],
        "frs": ["FR-AUTH-009"], "nfrs": [], "deps": ["1.7", "2.5"],
        "capability": "fine-grained-permissions",
    },
    {
        "epic": 2, "story": "2.11", "title": "跨企业经营汇总",
        "as_a": "集团老板",
        "i_want": "查看跨企业的经营汇总数据",
        "so_that": "可以一览集团下所有企业的经营状况",
        "ac": [
            "GET /api/v1/groups/{group_id}/summary 返回集团下所有企业的核心经营指标",
            "支持按企业对比",
        ],
        "frs": ["FR-GROUP-007"], "nfrs": [], "deps": ["2.2"],
        "capability": "cross-enterprise-summary",
    },
    # ========== Epic 3: HRM 员工管理 ==========
    {
        "epic": 3, "story": "3.1", "title": "员工入职（创建档案）",
        "as_a": "企业管理员",
        "i_want": "创建员工档案并记录入职信息",
        "so_that": "新员工可以在系统中拥有账号和完整信息",
        "ac": [
            "POST /api/v1/employees 创建员工档案，自动生成登录凭证，记录入职日期，员工状态为'在职'",
        ],
        "frs": ["FR-HRM-001", "FR-ORG-010"], "nfrs": [], "deps": ["2.5"],
        "capability": "employee-onboarding",
    },
    {
        "epic": 3, "story": "3.2", "title": "员工档案编辑",
        "as_a": "企业管理员",
        "i_want": "编辑员工档案信息",
        "so_that": "员工信息变更时可以及时更新",
        "ac": [
            "PUT /api/v1/employees/{employee_id} 更新员工档案信息，变更记录写入审计日志",
        ],
        "frs": ["FR-HRM-002"], "nfrs": [], "deps": ["2.5"],
        "capability": "employee-profile-edit",
    },
    {
        "epic": 3, "story": "3.3", "title": "员工离职",
        "as_a": "企业管理员",
        "i_want": "标记员工离职",
        "so_that": "离职员工无法继续访问系统",
        "ac": [
            "POST /api/v1/employees/{employee_id}/resign 员工状态变为'离职'，记录离职日期",
            "该员工的 Access Token 和 Refresh Token 立即失效",
            "保留所有历史数据",
        ],
        "frs": ["FR-HRM-003", "FR-ORG-010"], "nfrs": [], "deps": ["2.5", "1.6"],
        "capability": "employee-resignation",
    },
    {
        "epic": 3, "story": "3.4", "title": "员工列表与详情查询",
        "as_a": "企业管理员",
        "i_want": "查看所有员工列表和单个员工详情",
        "so_that": "可以了解企业人员全貌",
        "ac": [
            "GET /api/v1/employees?page=1&page_size=20 返回员工列表，支持分页、按部门/状态筛选",
            "GET /api/v1/employees/{employee_id} 返回员工详细信息（含部门、岗位、入职日期、状态）",
        ],
        "frs": ["FR-HRM-004"], "nfrs": [], "deps": ["2.5"],
        "capability": "employee-list-detail",
    },
    {
        "epic": 3, "story": "3.5", "title": "员工自助查看个人信息",
        "as_a": "员工",
        "i_want": "查看自己的档案和基本信息",
        "so_that": "不需要找管理员就能了解自己的信息",
        "ac": [
            "GET /api/v1/me/profile 返回当前员工的档案信息（姓名、部门、岗位、入职日期、联系方式），不返回薪资等敏感字段",
        ],
        "frs": ["FR-HRM-005", "FR-ASSIST-003"], "nfrs": [], "deps": ["2.5"],
        "capability": "employee-self-service",
    },
    {
        "epic": 3, "story": "3.6", "title": "批量导入员工",
        "as_a": "企业管理员",
        "i_want": "通过 Excel/CSV 批量导入员工",
        "so_that": "新企业初始化或大批量入职时不需要逐个创建",
        "ac": [
            "POST /api/v1/employees/import 上传符合模板的文件，逐行解析并创建员工档案",
            "返回导入结果（成功数、失败数、失败行明细）",
            "格式正确的行正常导入，错误的行跳过并返回错误原因",
        ],
        "frs": ["FR-HRM-006"], "nfrs": [], "deps": ["2.5"],
        "capability": "batch-import-employees",
    },
    {
        "epic": 3, "story": "3.7", "title": "调岗操作",
        "as_a": "企业管理员",
        "i_want": "执行员工调岗（从原部门移到新部门）",
        "so_that": "组织调整时可以快速变更员工归属",
        "ac": [
            "POST /api/v1/employees/{employee_id}/transfer 员工从原部门移除，添加到新部门",
            "记录调岗历史（原部门、新部门、调岗日期）",
            "如果是部门经理调岗，原部门经理自动清空",
        ],
        "frs": ["FR-HRM-007"], "nfrs": [], "deps": ["2.5", "2.3", "2.4"],
        "capability": "employee-transfer",
    },
    {
        "epic": 3, "story": "3.8", "title": "员工销售业绩查询",
        "as_a": "管理员或部门经理",
        "i_want": "按时间范围查询员工的销售业绩",
        "so_that": "可以评估员工绩效",
        "ac": [
            "GET /api/v1/employees/{employee_id}/sales-performance 返回指定时间范围内的销售业绩（销售额、订单数、回款额）",
            "部门经理只能查询本部门员工",
        ],
        "frs": ["FR-HRM-008"], "nfrs": [], "deps": ["2.5"],
        "capability": "employee-sales-performance",
    },
    # ========== Epic 4: CRM 客户关系管理 ==========
    {
        "epic": 4, "story": "4.1", "title": "客户档案 CRUD",
        "as_a": "销售人员",
        "i_want": "创建、编辑、删除客户档案",
        "so_that": "可以管理企业的客户资源",
        "ac": [
            "POST /api/v1/customers 创建客户档案，客户以公司名称为企业内唯一标识，同一企业内不可创建公司名称重复的客户",
            "PUT /api/v1/customers/{customer_id} 更新客户信息",
            "DELETE /api/v1/customers/{customer_id} 软删除客户（有关联合同/订单时禁止删除）",
        ],
        "frs": ["FR-CRM-001", "FR-CRM-002"], "nfrs": [], "deps": ["2.2"],
        "capability": "customer-crud",
    },
    {
        "epic": 4, "story": "4.2", "title": "客户分级管理",
        "as_a": "企业管理员",
        "i_want": "对客户进行分级（VIP/重要/普通/潜在）并自定义分级规则",
        "so_that": "可以差异化服务不同级别的客户",
        "ac": [
            "POST /api/v1/customer-levels 创建自定义客户分级",
            "系统配置自动升级规则，客户达到阈值时自动升级到对应级别",
            "PUT /api/v1/customers/{customer_id}/level 手动调整客户分级",
        ],
        "frs": ["FR-CRM-003"], "nfrs": [], "deps": ["4.1"],
        "capability": "customer-level-management",
    },
    {
        "epic": 4, "story": "4.3", "title": "客户自由标签",
        "as_a": "销售人员",
        "i_want": "为客户添加多个自定义标签",
        "so_that": "可以灵活分类和筛选客户",
        "ac": [
            "POST /api/v1/customers/{customer_id}/tags 为客户添加标签",
            "GET /api/v1/customers?tags=战略合作 返回包含指定标签的客户列表",
        ],
        "frs": ["FR-CRM-004"], "nfrs": [], "deps": ["4.1"],
        "capability": "customer-tags",
    },
    {
        "epic": 4, "story": "4.4", "title": "客户全景视图 API",
        "as_a": "Agent",
        "i_want": "通过一个 API 获取客户的全景数据",
        "so_that": "可以为用户生成完整的客户画像",
        "ac": [
            "GET /api/v1/customers/{customer_id}/panorama 一次性返回该客户的所有关联数据：联系人列表、商机列表、关联合同列表、关联售后工单列表、往来款汇总",
        ],
        "frs": ["FR-CRM-005"], "nfrs": [], "deps": ["4.1", "4.6", "4.8"],
        "capability": "customer-panorama-api",
    },
    {
        "epic": 4, "story": "4.5", "title": "客户关联查询（合同/售后/往来款）",
        "as_a": "销售人员",
        "i_want": "查询客户关联的合同、售后工单和往来款",
        "so_that": "可以全面了解客户业务状况",
        "ac": [
            "GET /api/v1/customers/{customer_id}/contracts 返回该客户的合同列表，支持按状态筛选",
            "GET /api/v1/customers/{customer_id}/service-orders 返回售后工单列表，支持按状态筛选",
            "GET /api/v1/customers/{customer_id}/financial-summary 返回往来款汇总",
        ],
        "frs": ["FR-CRM-006", "FR-CRM-007", "FR-CRM-008"], "nfrs": [], "deps": ["4.1"],
        "capability": "customer-related-queries",
    },
    {
        "epic": 4, "story": "4.6", "title": "联系人 CRUD",
        "as_a": "销售人员",
        "i_want": "管理客户下的联系人",
        "so_that": "可以记录和维护客户对接人信息",
        "ac": [
            "POST /api/v1/customers/{customer_id}/contacts 创建联系人，必须归属某个客户",
            "PUT /api/v1/contacts/{contact_id} 更新联系人信息",
            "DELETE /api/v1/contacts/{contact_id} 软删除联系人",
        ],
        "frs": ["FR-CRM-009", "FR-CRM-010"], "nfrs": [], "deps": ["4.1"],
        "capability": "contact-crud",
    },
    {
        "epic": 4, "story": "4.7", "title": "联系人按角色筛选查询",
        "as_a": "销售人员",
        "i_want": "按客户和角色标记筛选联系人",
        "so_that": "可以快速找到关键决策人",
        "ac": [
            "GET /api/v1/customers/{customer_id}/contacts?role=decision_maker 返回该客户下角色为'决策人'的联系人列表",
        ],
        "frs": ["FR-CRM-011"], "nfrs": [], "deps": ["4.6"],
        "capability": "contact-filter-search",
    },
    {
        "epic": 4, "story": "4.8", "title": "商机 CRUD",
        "as_a": "销售人员",
        "i_want": "创建和管理商机",
        "so_that": "可以跟踪潜在的销售机会",
        "ac": [
            "POST /api/v1/opportunities 创建商机，必须归属某个客户",
            "PUT /api/v1/opportunities/{opportunity_id} 更新商机信息",
            "PATCH /api/v1/opportunities/{opportunity_id}/status 更新商机状态（跟进中→报价中→成交/失败）",
        ],
        "frs": ["FR-CRM-012", "FR-CRM-013"], "nfrs": [], "deps": ["4.1"],
        "capability": "opportunity-crud",
    },
    # ========== Epic 5: 进销存管理 ==========
    {
        "epic": 5, "story": "5.1", "title": "物料（SKU）管理",
        "as_a": "仓库管理员",
        "i_want": "创建、编辑、删除物料（SKU）",
        "so_that": "可以管理企业的所有物料品类",
        "ac": [
            "POST /api/v1/materials 创建物料 SKU，包含名称、类型、规格参数（JSON）、单位、单价",
            "PUT /api/v1/materials/{material_id} 更新物料信息",
            "GET /api/v1/materials?type=finished_product 返回指定类型的物料列表",
        ],
        "frs": ["FR-IMS-001", "FR-IMS-002"], "nfrs": [], "deps": ["2.2"],
        "capability": "material-sku-management",
    },
    {
        "epic": 5, "story": "5.2", "title": "供应商管理",
        "as_a": "采购人员",
        "i_want": "创建、编辑、删除供应商",
        "so_that": "可以管理物料采购来源",
        "ac": [
            "POST /api/v1/suppliers 创建供应商",
            "PUT /api/v1/suppliers/{supplier_id} 更新供应商信息",
            "DELETE /api/v1/suppliers/{supplier_id} 软删除供应商（有关联采购订单时禁止删除）",
        ],
        "frs": ["FR-IMS-003", "FR-IMS-004"], "nfrs": [], "deps": ["2.2"],
        "capability": "supplier-management",
    },
    {
        "epic": 5, "story": "5.3", "title": "多仓库管理",
        "as_a": "仓库管理员",
        "i_want": "创建、编辑、停用仓库",
        "so_that": "可以管理多个物理仓库",
        "ac": [
            "POST /api/v1/warehouses 创建仓库",
            "PATCH /api/v1/warehouses/{warehouse_id}/status 停用仓库（仓库下有库存时禁止停用）",
        ],
        "frs": ["FR-IMS-015"], "nfrs": [], "deps": ["2.2"],
        "capability": "multi-warehouse-management",
    },
    {
        "epic": 5, "story": "5.4", "title": "按仓库维度的库存查询与预警",
        "as_a": "仓库管理员",
        "i_want": "按仓库维度查询库存并设置安全库存预警",
        "so_that": "可以及时发现库存不足",
        "ac": [
            "GET /api/v1/warehouses/{warehouse_id}/inventory 返回该仓库所有物料的库存数量、安全库存、在途数量",
            "GET /api/v1/materials/{material_id}/inventory 返回该物料在各仓库的库存分布",
            "某物料在某仓库的数量低于安全库存时，触发出库操作使库存低于阈值，系统生成库存预警",
        ],
        "frs": ["FR-IMS-011", "FR-IMS-012", "FR-IMS-016", "FR-IMS-023"], "nfrs": [], "deps": ["5.1", "5.3"],
        "capability": "warehouse-inventory-alert",
    },
    {
        "epic": 5, "story": "5.5", "title": "采购订单与入库",
        "as_a": "采购人员",
        "i_want": "创建采购订单、审批、入库",
        "so_that": "可以完成采购流程并增加库存",
        "ac": [
            "POST /api/v1/purchase-orders 创建采购订单（草稿状态）",
            "POST /api/v1/purchase-orders/{order_id}/stock-in 自动增加对应仓库的库存，生成入库流水记录",
            "在数据库事务中保证库存和流水的一致性",
        ],
        "frs": ["FR-IMS-005", "FR-IMS-008", "FR-IMS-019", "FR-IMS-020"], "nfrs": [], "deps": ["5.1", "5.2", "5.3"],
        "capability": "purchase-order-stock-in",
    },
    {
        "epic": 5, "story": "5.6", "title": "采购质检流程",
        "as_a": "质检员",
        "i_want": "采购入库前触发质检流程",
        "so_that": "不合格物料不会进入库存",
        "ac": [
            "采购订单配置了质检流程，货物到达后系统生成质检任务",
            "质检结果为合格允许正式入库",
            "质检结果为不合格触发退换货流程，禁止入库",
        ],
        "frs": ["FR-IMS-006", "FR-IMS-007"], "nfrs": [], "deps": ["5.5"],
        "capability": "purchase-quality-inspection",
    },
    {
        "epic": 5, "story": "5.7", "title": "销售出库与库存扣减",
        "as_a": "销售人员",
        "i_want": "创建销售订单并执行出库",
        "so_that": "可以完成销售发货流程",
        "ac": [
            "POST /api/v1/sales-orders 创建销售订单",
            "POST /api/v1/sales-orders/{order_id}/stock-out 自动扣减对应仓库的库存，生成出库流水记录",
            "库存不足时禁止出库，返回错误码 IMS_INSUFFICIENT_STOCK",
        ],
        "frs": ["FR-IMS-009", "FR-IMS-010", "FR-IMS-019", "FR-IMS-020"], "nfrs": [], "deps": ["5.1", "5.3"],
        "capability": "sales-order-stock-out",
    },
    {
        "epic": 5, "story": "5.8", "title": "仓库间调拨",
        "as_a": "仓库管理员",
        "i_want": "在仓库之间调拨物料",
        "so_that": "可以平衡各仓库库存",
        "ac": [
            "POST /api/v1/stock-transfers 创建调拨单（草稿状态）",
            "调拨单审批通过后，源仓库出库并扣减库存，生成出库流水（transfer_out）",
            "调拨货物到达目标仓库后，填写实收数量，目标仓库库存增加，生成入库流水（transfer_in）",
            "实收数量与调拨数量不一致时记录差异",
        ],
        "frs": ["FR-IMS-017", "FR-IMS-018", "FR-IMS-019"], "nfrs": [], "deps": ["5.3", "5.1"],
        "capability": "warehouse-transfer",
    },
    {
        "epic": 5, "story": "5.9", "title": "物料领用申请",
        "as_a": "员工",
        "i_want": "申请领用物料",
        "so_that": "可以领用办公或业务所需物料",
        "ac": [
            "POST /api/v1/requisitions 创建领用申请（草稿状态）",
            "领用申请审批通过后，仓库确认出库并填写实发数量，扣减对应仓库库存，生成出库流水（requisition_out）",
            "实发数量可少于申请数量",
        ],
        "frs": ["FR-IMS-021", "FR-IMS-022", "FR-IMS-019"], "nfrs": [], "deps": ["5.1", "5.3"],
        "capability": "material-requisition",
    },
    {
        "epic": 5, "story": "5.10", "title": "库存盘点（盘库）",
        "as_a": "仓库管理员",
        "i_want": "执行库存盘点",
        "so_that": "可以核对系统库存与实际库存",
        "ac": [
            "POST /api/v1/inventory-checks 创建盘点任务",
            "盘点人录入实盘数量提交盘点结果后，系统自动生成盘盈盘亏明细",
            "支持按批次号/效期维度分别盘点",
            "盘点结果审批通过后，自动生成盘点调整出入库流水（type=adjustment），更新系统库存数量",
        ],
        "frs": ["FR-IMS-024", "FR-IMS-025", "FR-IMS-026", "FR-IMS-027", "FR-IMS-019"], "nfrs": [], "deps": ["5.3", "5.4"],
        "capability": "inventory-check",
    },
    {
        "epic": 5, "story": "5.11", "title": "物料报价管理",
        "as_a": "销售人员",
        "i_want": "查询物料历史报价并设置差异化报价策略",
        "so_that": "可以为不同客户级别制定不同价格",
        "ac": [
            "GET /api/v1/materials/{material_id}/price-history 返回该物料的历史报价记录",
            "POST /api/v1/materials/{material_id}/pricing-strategies 配置差异化报价策略",
        ],
        "frs": ["FR-IMS-013", "FR-IMS-014"], "nfrs": [], "deps": ["5.1", "4.2"],
        "capability": "material-pricing",
    },
    {
        "epic": 5, "story": "5.12", "title": "统一出入库流水查询",
        "as_a": "企业用户",
        "i_want": "查询统一的出入库流水",
        "so_that": "可以追溯所有库存变动",
        "ac": [
            "GET /api/v1/inventory-transactions 返回匹配的出入库流水列表，支持按类型、仓库、时间、物料筛选",
            "GET /api/v1/inventory-transactions/{transaction_id} 返回流水详情（含批次号、效期、序列号、规格参数、源单据类型）",
        ],
        "frs": ["FR-IMS-019", "FR-IMS-020"], "nfrs": [], "deps": ["5.5", "5.7", "5.8", "5.9", "5.10"],
        "capability": "inventory-transaction-query",
    },
    # ========== Epic 6: 合同、销售与售后管理 ==========
    {
        "epic": 6, "story": "6.1", "title": "合同 CRUD 与状态机",
        "as_a": "销售人员",
        "i_want": "创建、编辑、删除合同并管理合同状态流转",
        "so_that": "可以管理合同全生命周期",
        "ac": [
            "POST /api/v1/contracts 创建合同（草稿状态）",
            "PATCH /api/v1/contracts/{contract_id}/status 状态按规则流转：草稿→审批中→已生效→已履行→已终止，非法状态流转返回错误码 CON_INVALID_STATUS_TRANSITION",
            "DELETE /api/v1/contracts/{contract_id} 仅草稿状态可删除（软删除）",
        ],
        "frs": ["FR-CON-001", "FR-CON-002", "FR-CON-006"], "nfrs": [], "deps": ["4.1"],
        "capability": "contract-crud-state-machine",
    },
    {
        "epic": 6, "story": "6.2", "title": "合同关联业务单据",
        "as_a": "销售人员",
        "i_want": "合同关联客户、销售订单、采购订单和出库记录",
        "so_that": "可以追踪合同相关的所有业务数据",
        "ac": [
            "POST /api/v1/contracts/{contract_id}/sales-orders 合同关联一个或多个销售订单",
            "POST /api/v1/contracts/{contract_id}/purchase-orders 合同关联采购订单（客户付款后关联）",
            "POST /api/v1/contracts/{contract_id}/delivery-records 合同绑定出库记录",
        ],
        "frs": ["FR-CON-003", "FR-CON-007", "FR-CON-008"], "nfrs": [], "deps": ["6.1"],
        "capability": "contract-related-documents",
    },
    {
        "epic": 6, "story": "6.3", "title": "合同附件与审批流",
        "as_a": "销售人员",
        "i_want": "上传合同附件（扫描件、补充协议）并提交审批",
        "so_that": "合同可以走审批流程",
        "ac": [
            "POST /api/v1/contracts/{contract_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/contracts/{contract_id}/attachments/",
            "POST /api/v1/contracts/{contract_id}/submit-approval 合同状态变为'审批中'，触发审批工作流",
            "审批通过后自动变为'已生效'",
        ],
        "frs": ["FR-CON-004", "FR-CON-005"], "nfrs": [], "deps": ["6.1", "8.1"],
        "capability": "contract-attachments-approval",
    },
    {
        "epic": 6, "story": "6.4", "title": "Agent 自然语言修改合同字段",
        "as_a": "Agent",
        "i_want": "通过自然语言修改合同字段",
        "so_that": "用户可以说'把合同金额改成 50 万'来修改合同",
        "ac": [
            "Agent 解析自然语言为结构化字段修改请求，调用 PATCH /api/v1/contracts/{contract_id} 更新指定字段",
            "只允许修改草稿和审批中状态的合同",
            "修改记录写入审计日志",
        ],
        "frs": ["FR-CON-009"], "nfrs": [], "deps": ["6.1", "8.10"],
        "capability": "agent-natural-language-contract",
    },
    {
        "epic": 6, "story": "6.5", "title": "销售订单 CRUD 与状态机",
        "as_a": "销售人员",
        "i_want": "创建、编辑、删除销售订单并管理状态流转",
        "so_that": "可以管理销售流程",
        "ac": [
            "POST /api/v1/sales-orders 创建销售订单（草稿状态），必须关联客户",
            "状态按规则流转：草稿→审批中→已确认→已出库→已完成",
            "DELETE /api/v1/sales-orders/{order_id} 仅草稿状态可删除（软删除）",
        ],
        "frs": ["FR-SALES-001", "FR-SALES-002", "FR-SALES-003", "FR-SALES-009"], "nfrs": [], "deps": ["4.1"],
        "capability": "sales-order-crud-state-machine",
    },
    {
        "epic": 6, "story": "6.6", "title": "销售订单关联合同与出库",
        "as_a": "销售人员",
        "i_want": "销售订单绑定合同和出库记录",
        "so_that": "可以追踪订单关联的合同和发货情况",
        "ac": [
            "POST /api/v1/sales-orders/{order_id}/contract 销售订单绑定合同",
            "POST /api/v1/sales-orders/{order_id}/delivery 创建出库记录，出库配件/产品必须与关联合同一致",
            "销售订单审批流与合同审批流可独立运行",
        ],
        "frs": ["FR-SALES-004", "FR-SALES-005", "FR-SALES-006", "FR-SALES-007", "FR-SALES-008"], "nfrs": [], "deps": ["6.5", "6.1", "5.7"],
        "capability": "sales-order-contract-delivery",
    },
    {
        "epic": 6, "story": "6.7", "title": "售后工单 CRUD 与状态机",
        "as_a": "售后人员",
        "i_want": "创建、编辑、删除售后工单并管理状态流转",
        "so_that": "可以管理售后服务流程",
        "ac": [
            "POST /api/v1/service-orders 创建售后工单（创建状态）",
            "状态流转：创建→报价中→确认→维修中→待签字→已完成",
            "DELETE /api/v1/service-orders/{order_id} 仅创建状态可删除（软删除）",
        ],
        "frs": ["FR-SVC-001", "FR-SVC-002", "FR-SVC-011"], "nfrs": [], "deps": ["4.1"],
        "capability": "service-order-crud-state-machine",
    },
    {
        "epic": 6, "story": "6.8", "title": "收费工单报价流程",
        "as_a": "售后人员",
        "i_want": "为收费工单上传报价单并等待客户确认",
        "so_that": "收费售后需要客户确认后才进入维修",
        "ac": [
            "POST /api/v1/service-orders/{order_id}/quote 上传报价单附件，工单状态变为'报价中'",
            "POST /api/v1/service-orders/{order_id}/confirm-quote 客户确认报价后，工单状态变为'确认'，可进入维修",
        ],
        "frs": ["FR-SVC-003", "FR-SVC-004", "FR-SVC-005", "FR-SVC-006"], "nfrs": [], "deps": ["6.7", "8.1"],
        "capability": "paid-service-order-quote",
    },
    {
        "epic": 6, "story": "6.9", "title": "维修工单与签字确认",
        "as_a": "售后人员",
        "i_want": "生成维修工单并完成客户签字确认",
        "so_that": "维修过程和结果有据可查",
        "ac": [
            "POST /api/v1/service-orders/{order_id}/repair-order 携带故障点、维修内容，生成维修工单",
            "POST /api/v1/service-orders/{order_id}/sign-off 上传客户签字确认件，工单状态变为'待签字'",
            "POST /api/v1/service-orders/{order_id}/complete 工单状态变为'已完成'",
        ],
        "frs": ["FR-SVC-007", "FR-SVC-008", "FR-SVC-009", "FR-SVC-010"], "nfrs": [], "deps": ["6.7", "6.8"],
        "capability": "repair-order-sign-off",
    },
    {
        "epic": 6, "story": "6.10", "title": "售后工单附件管理",
        "as_a": "售后人员",
        "i_want": "上传工单相关附件（问题图片、处理凭证等）",
        "so_that": "售后过程有完整的证据链",
        "ac": [
            "POST /api/v1/service-orders/{order_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/service-orders/{order_id}/",
            "支持图片、PDF 等文件类型",
        ],
        "frs": ["FR-SVC-012"], "nfrs": [], "deps": ["6.7", "8.1"],
        "capability": "service-order-attachments",
    },
    # ========== Epic 7: 财务管理与审批工作流 ==========
    {
        "epic": 7, "story": "7.1", "title": "收款记录管理",
        "as_a": "财务人员",
        "i_want": "创建和管理收款记录",
        "so_that": "可以追踪客户付款情况",
        "ac": [
            "POST /api/v1/payment-receivables 创建收款记录",
            "GET /api/v1/payment-receivables?contract_id={id}&status=pending 返回匹配的收款记录列表",
            "PATCH /api/v1/payment-receivables/{id}/confirm 确认收款，更新合同已收金额",
        ],
        "frs": ["FR-FIN-001", "FR-FIN-002", "FR-FIN-003"], "nfrs": [], "deps": ["6.1"],
        "capability": "receivable-management",
    },
    {
        "epic": 7, "story": "7.2", "title": "付款记录管理",
        "as_a": "财务人员",
        "i_want": "创建和管理付款记录",
        "so_that": "可以追踪向供应商的付款情况",
        "ac": [
            "POST /api/v1/payment-payables 创建付款记录",
            "GET /api/v1/payment-payables?purchase_order_id={id}&status=pending 返回匹配的付款记录列表",
            "PATCH /api/v1/payment-payables/{id}/confirm 确认付款，更新采购订单已付金额",
        ],
        "frs": ["FR-FIN-004", "FR-FIN-005", "FR-FIN-006"], "nfrs": [], "deps": ["5.5"],
        "capability": "payable-management",
    },
    {
        "epic": 7, "story": "7.3", "title": "发票管理",
        "as_a": "财务人员",
        "i_want": "开具和管理发票",
        "so_that": "可以管理开票和收票",
        "ac": [
            "POST /api/v1/invoices 创建发票记录",
            "PATCH /api/v1/invoices/{id}/status 状态流转：待开票→已开票→已寄出→已签收",
            "POST /api/v1/invoices/receipt 上传收到的供应商发票，创建收票记录",
        ],
        "frs": ["FR-FIN-007", "FR-FIN-008", "FR-FIN-009"], "nfrs": [], "deps": ["6.1", "7.1"],
        "capability": "invoice-management",
    },
    {
        "epic": 7, "story": "7.4", "title": "费用报销管理",
        "as_a": "员工",
        "i_want": "提交费用报销申请",
        "so_that": "可以报销业务相关费用",
        "ac": [
            "POST /api/v1/expense-claims 创建报销申请（待审批状态）",
            "PATCH /api/v1/expense-claims/{id}/status 状态流转：待审批→审批中→已批准→已打款→已拒绝",
            "GET /api/v1/expense-claims?department_id={id}&status=pending 部门经理查看本部门待审批报销列表",
        ],
        "frs": ["FR-FIN-010", "FR-FIN-011", "FR-FIN-012"], "nfrs": [], "deps": ["2.5", "7.7"],
        "capability": "expense-claim-management",
    },
    {
        "epic": 7, "story": "7.5", "title": "财务对账与统计",
        "as_a": "财务人员",
        "i_want": "查看财务对账和统计报表",
        "so_that": "可以掌握企业财务状况",
        "ac": [
            "GET /api/v1/financial-summary 返回指定期间收支汇总",
            "GET /api/v1/financial-reconciliation?contract_id={id} 返回合同维度的对账明细",
            "GET /api/v1/financial-statistics 返回企业财务统计数据（月度收支趋势、费用分类占比）",
        ],
        "frs": ["FR-FIN-013", "FR-FIN-014", "FR-FIN-015", "FR-FIN-016"], "nfrs": [], "deps": ["7.1", "7.2", "7.3"],
        "capability": "financial-reconciliation-statistics",
    },
    {
        "epic": 7, "story": "7.6", "title": "财务审批关联",
        "as_a": "财务人员",
        "i_want": "收付款和发票操作关联审批流",
        "so_that": "关键财务操作需要审批后才能执行",
        "ac": [
            "收款确认需要审批，触发审批工作流，审批通过后才确认收款",
            "付款操作需要审批，触发审批工作流，审批通过后才确认付款",
            "发票开具需要审批，触发审批工作流，审批通过后才开具发票",
        ],
        "frs": ["FR-FIN-017", "FR-FIN-018", "FR-FIN-019"], "nfrs": [], "deps": ["7.1", "7.2", "7.3", "7.7"],
        "capability": "financial-approval-integration",
    },
    {
        "epic": 7, "story": "7.7", "title": "审批流程定义与管理",
        "as_a": "企业管理员",
        "i_want": "定义和管理审批流程模板",
        "so_that": "不同业务场景可以配置不同的审批规则",
        "ac": [
            "POST /api/v1/workflow-definitions 创建审批流程定义",
            "PUT /api/v1/workflow-definitions/{id} 更新审批流程定义（已生效的流程不可修改，需创建新版本）",
            "GET /api/v1/workflow-definitions?type=contract 按业务类型查询审批流程定义列表",
        ],
        "frs": ["FR-WF-001", "FR-WF-002", "FR-WF-003"], "nfrs": [], "deps": ["2.2"],
        "capability": "workflow-definition-management",
    },
    {
        "epic": 7, "story": "7.8", "title": "审批流程执行与通知",
        "as_a": "审批人",
        "i_want": "接收审批通知并执行审批操作",
        "so_that": "可以及时处理待审批事项",
        "ac": [
            "业务单据提交审批时，当前审批节点对应的审批人收到消息通知",
            "POST /api/v1/workflow-instances/{id}/approve 审批通过流转到下一节点",
            "POST /api/v1/workflow-instances/{id}/reject 审批拒绝退回给提交人",
            "GET /api/v1/workflow-instances/pending 返回当前用户待审批的流程实例列表",
        ],
        "frs": ["FR-WF-004", "FR-WF-005", "FR-WF-006"], "nfrs": [], "deps": ["7.7", "8.4"],
        "capability": "workflow-execution-notification",
    },
    {
        "epic": 7, "story": "7.9", "title": "多级审批与条件分支",
        "as_a": "企业管理员",
        "i_want": "配置多级审批和条件分支",
        "so_that": "不同金额或类型的业务走不同的审批路径",
        "ac": [
            "审批流程定义包含条件分支，根据条件自动选择审批路径",
            "审批流程定义包含多级审批，当前节点审批通过后自动流转到下一级审批节点",
            "条件分支判断失败时返回错误码 WF_CONDITION_EVALUATION_FAILED",
        ],
        "frs": ["FR-WF-007", "FR-WF-008", "FR-WF-009"], "nfrs": [], "deps": ["7.7"],
        "capability": "multi-level-approval-conditions",
    },
    {
        "epic": 7, "story": "7.10", "title": "审批历史与催办",
        "as_a": "审批提交人",
        "i_want": "查看审批历史和催办审批人",
        "so_that": "可以追踪审批进度并加速流程",
        "ac": [
            "GET /api/v1/workflow-instances/{id}/history 返回审批历史（每个节点的审批人、时间、结果、备注）",
            "POST /api/v1/workflow-instances/{id}/urge 向当前审批人发送催办通知",
            "GET /api/v1/workflow-instances/statistics 返回审批统计数据（平均审批时长、超时率、各审批人处理量）",
        ],
        "frs": ["FR-WF-010", "FR-WF-011", "FR-WF-012"], "nfrs": [], "deps": ["7.8"],
        "capability": "approval-history-urge",
    },
    {
        "epic": 7, "story": "7.11", "title": "财务数据权限与审计",
        "as_a": "企业管理员",
        "i_want": "财务数据受权限控制且操作可审计",
        "so_that": "财务数据安全合规",
        "ac": [
            "非财务角色用户访问财务相关 API 时返回 403 权限不足",
            "财务人员执行收付款操作后，操作记录写入审计日志（操作人、时间、金额、关联单据）",
            "GET /api/v1/financial-audit-log 返回财务审计日志，支持按操作人、时间、类型筛选",
        ],
        "frs": ["FR-FIN-020", "FR-FIN-021"], "nfrs": [], "deps": ["7.1", "7.2", "1.8"],
        "capability": "financial-permissions-audit",
    },
    # ========== Epic 8: 附件、消息、知识库与 Skill 系统 ==========
    {
        "epic": 8, "story": "8.1", "title": "文件上传与存储",
        "as_a": "企业用户",
        "i_want": "上传文件到系统并获取文件 URL",
        "so_that": "业务单据可以关联附件",
        "ac": [
            "POST /api/v1/files/upload 上传文件（multipart/form-data），文件存储到 /storage/{enterprise_id}/{module}/{entity_id}/，返回文件 ID 和访问 URL",
            "上传文件超过大小限制时返回错误码 FILE_SIZE_EXCEEDED",
            "上传不支持的文件类型时返回错误码 FILE_TYPE_NOT_ALLOWED",
        ],
        "frs": ["FR-FILE-001", "FR-FILE-002", "FR-FILE-003"], "nfrs": [], "deps": ["1.4"],
        "capability": "file-upload-storage",
    },
    {
        "epic": 8, "story": "8.2", "title": "文件下载与预览",
        "as_a": "企业用户",
        "i_want": "下载和预览已上传的文件",
        "so_that": "可以查看业务单据关联的附件内容",
        "ac": [
            "GET /api/v1/files/{file_id}/download 返回文件内容（Content-Disposition: attachment）",
            "GET /api/v1/files/{file_id}/preview 对于图片/PDF 返回预览内容，其他类型返回不支持预览错误",
            "用户无文件访问权限（跨企业）时返回 403 权限不足",
        ],
        "frs": ["FR-FILE-004", "FR-FILE-005"], "nfrs": [], "deps": ["8.1"],
        "capability": "file-download-preview",
    },
    {
        "epic": 8, "story": "8.3", "title": "文件版本与删除",
        "as_a": "企业用户",
        "i_want": "管理文件版本和删除文件",
        "so_that": "可以更新附件并清理不需要的文件",
        "ac": [
            "POST /api/v1/files/{file_id}/versions 创建文件新版本，保留历史版本",
            "GET /api/v1/files/{file_id}/versions 返回文件版本列表",
            "DELETE /api/v1/files/{file_id} 软删除文件（标记 deleted_at），已关联业务单据的文件不可删除",
        ],
        "frs": ["FR-FILE-006", "FR-FILE-007", "FR-FILE-008", "FR-FILE-009"], "nfrs": [], "deps": ["8.1"],
        "capability": "file-version-deletion",
    },
    {
        "epic": 8, "story": "8.4", "title": "消息发送与轮询",
        "as_a": "Agent",
        "i_want": "通过消息轮询获取待处理消息",
        "so_that": "Agent 可以实时接收系统通知和任务",
        "ac": [
            "GET /api/v1/messages/poll 返回未读消息列表（审批通知、任务分配、系统公告等）",
            "CLI 每 60 秒轮询一次时返回增量消息（上次轮询后的新消息）",
            "POST /api/v1/messages/{id}/ack 标记消息为已读",
        ],
        "frs": ["FR-MSG-001", "FR-MSG-002", "FR-MSG-003"], "nfrs": [], "deps": ["1.6"],
        "capability": "message-send-polling",
    },
    {
        "epic": 8, "story": "8.5", "title": "消息类型与推送",
        "as_a": "系统管理员",
        "i_want": "配置消息类型和推送规则",
        "so_that": "不同业务事件触发不同类型的消息通知",
        "ac": [
            "系统产生业务事件（审批待办、合同到期、库存预警等）时自动生成对应类型的消息并推送给相关用户",
            "GET /api/v1/messages?type=approval&status=unread 按类型和状态筛选消息列表",
            "GET /api/v1/messages/summary 返回各类型未读消息数量汇总",
        ],
        "frs": ["FR-MSG-004", "FR-MSG-005", "FR-MSG-006"], "nfrs": [], "deps": ["8.4"],
        "capability": "message-types-push",
    },
    {
        "epic": 8, "story": "8.6", "title": "消息已读与归档",
        "as_a": "企业用户",
        "i_want": "批量标记消息已读和归档消息",
        "so_that": "可以高效管理消息",
        "ac": [
            "POST /api/v1/messages/batch-ack 批量标记消息为已读",
            "POST /api/v1/messages/{id}/archive 归档消息（从收件箱移到归档箱）",
            "GET /api/v1/messages/archived 返回已归档消息列表",
        ],
        "frs": ["FR-MSG-007"], "nfrs": [], "deps": ["8.4"],
        "capability": "message-read-archive",
    },
    {
        "epic": 8, "story": "8.7", "title": "知识库文档 CRUD",
        "as_a": "企业管理员",
        "i_want": "创建、编辑、删除知识库文档",
        "so_that": "可以积累和管理企业知识资产",
        "ac": [
            "POST /api/v1/knowledge-base/documents 创建知识库文档（标题、分类、Markdown 内容）",
            "PUT /api/v1/knowledge-base/documents/{id} 更新知识库文档（保留历史版本）",
            "DELETE /api/v1/knowledge-base/documents/{id} 软删除知识库文档",
        ],
        "frs": ["FR-KB-001", "FR-KB-002", "FR-KB-003"], "nfrs": [], "deps": ["2.2"],
        "capability": "knowledge-base-document-crud",
    },
    {
        "epic": 8, "story": "8.8", "title": "知识库分类与搜索",
        "as_a": "企业用户",
        "i_want": "按分类浏览和搜索知识库",
        "so_that": "可以快速找到需要的知识文档",
        "ac": [
            "GET /api/v1/knowledge-base/categories 返回知识库分类树形结构",
            "GET /api/v1/knowledge-base/search?keyword=合同模板&category=法务 返回匹配的知识库文档列表，支持全文搜索",
            "GET /api/v1/knowledge-base/documents/{id} 返回知识库文档详情（含内容、版本历史、关联分类）",
        ],
        "frs": ["FR-KB-004", "FR-KB-005"], "nfrs": [], "deps": ["8.7"],
        "capability": "knowledge-base-category-search",
    },
    {
        "epic": 8, "story": "8.9", "title": "Skill 注册与发现",
        "as_a": "Agent",
        "i_want": "发现和调用系统注册的 Skill",
        "so_that": "Agent 可以通过 Skill 执行业务操作",
        "ac": [
            "GET /api/v1/skills 返回当前企业可用的 Skill 列表（名称、描述、参数定义、API 端点）",
            "GET /api/v1/skills/{skill_name} 返回 Skill 详情（含参数 Schema、调用示例）",
            "POST /api/v1/skills 注册新 Skill（name、description、parameters、api_endpoint、module）",
        ],
        "frs": ["FR-SKILL-001", "FR-SKILL-002", "FR-SKILL-003"], "nfrs": [], "deps": ["1.7"],
        "capability": "skill-registry-discovery",
    },
    {
        "epic": 8, "story": "8.10", "title": "Skill 执行与结果",
        "as_a": "Agent",
        "i_want": "调用 Skill 并获取执行结果",
        "so_that": "可以通过 Skill 完成业务操作",
        "ac": [
            "POST /api/v1/skills/{skill_name}/execute 携带参数，执行 Skill 对应的 API 调用，返回执行结果",
            "Skill 参数不合法时返回结构化错误码 SKILL_INVALID_PARAMETER",
            "Agent 无 Skill 调用权限时返回 403 权限不足",
        ],
        "frs": ["FR-SKILL-004", "FR-SKILL-005", "FR-SKILL-006"], "nfrs": [], "deps": ["8.9"],
        "capability": "skill-execution-results",
    },
    {
        "epic": 8, "story": "8.11", "title": "Skill 权限与模块映射",
        "as_a": "企业管理员",
        "i_want": "控制 Skill 的访问权限和模块映射",
        "so_that": "不同角色的 Agent 只能调用授权范围内的 Skill",
        "ac": [
            "POST /api/v1/skills/{skill_name}/permissions 配置 Skill 的可访问角色",
            "GET /api/v1/skills?module=hrm 返回 HRM 模块下的所有 Skill",
            "功能开关关闭某模块时返回错误码 SKILL_MODULE_DISABLED",
        ],
        "frs": ["FR-SKILL-007", "FR-SKILL-008"], "nfrs": [], "deps": ["8.9", "1.10"],
        "capability": "skill-permissions-module-mapping",
    },
    {
        "epic": 8, "story": "8.12", "title": "知识库向量化与语义检索",
        "as_a": "Agent",
        "i_want": "通过语义检索查找知识库文档",
        "so_that": "可以用自然语言查询找到最相关的知识",
        "ac": [
            "知识库文档创建/更新后自动将文档内容向量化并存入 Qdrant",
            "POST /api/v1/knowledge-base/semantic-search 携带自然语言查询，返回语义最相关的知识库文档列表",
            "向量化服务不可用时文档正常保存，向量化任务进入重试队列",
        ],
        "frs": ["FR-KB2-001", "FR-KB2-002", "FR-KB2-003"], "nfrs": [], "deps": ["8.7"],
        "capability": "knowledge-base-vector-search",
    },
    {
        "epic": 8, "story": "8.13", "title": "知识库文档分块与引用",
        "as_a": "Agent",
        "i_want": "获取知识库文档的分块内容和来源引用",
        "so_that": "Agent 回答用户问题时可以引用知识库的具体段落",
        "ac": [
            "语义检索返回结果时包含文档分块内容、来源文档 ID、分块位置",
            "GET /api/v1/knowledge-base/documents/{id}/chunks 返回文档的分块列表",
            "文档更新重新向量化时，旧分块向量删除，新分块向量生成",
        ],
        "frs": ["FR-KB2-004", "FR-KB2-005", "FR-KB2-006"], "nfrs": [], "deps": ["8.12"],
        "capability": "knowledge-base-chunks-citation",
    },
    # ========== Epic 9: 运营平台与商业闭环 ==========
    {
        "epic": 9, "story": "9.1", "title": "运营仪表盘",
        "as_a": "运营商",
        "i_want": "查看平台运营数据仪表盘",
        "so_that": "可以掌握平台整体运营状况",
        "ac": [
            "GET /api/v1/operator/dashboard 返回平台核心指标（企业总数、活跃企业数、用户总数、本月新增、收入汇总）",
            "GET /api/v1/operator/dashboard/trends?period=30d 返回趋势数据（日活企业、日活用户、日收入）",
        ],
        "frs": ["FR-OP-001", "FR-OP-002"], "nfrs": [], "deps": ["1.7", "2.2"],
        "capability": "operator-dashboard",
    },
    {
        "epic": 9, "story": "9.2", "title": "租户企业管理",
        "as_a": "运营商",
        "i_want": "管理平台上的集团和企业租户",
        "so_that": "可以控制租户的开通、暂停和注销",
        "ac": [
            "POST /api/v1/operator/enterprises 创建企业租户，自动创建独立 Schema",
            "PATCH /api/v1/operator/enterprises/{id}/suspend 暂停企业（冻结所有 API 访问），保留数据",
            "PATCH /api/v1/operator/enterprises/{id}/activate 恢复企业访问",
            "DELETE /api/v1/operator/enterprises/{id} 注销企业（30天保留期后彻底删除 Schema 和数据）",
        ],
        "frs": ["FR-OP-003", "FR-OP-004", "FR-OP-005"], "nfrs": [], "deps": ["2.2", "1.4"],
        "capability": "tenant-enterprise-management",
    },
    {
        "epic": 9, "story": "9.3", "title": "运营审计与日志",
        "as_a": "运营商",
        "i_want": "查看平台级审计日志和操作记录",
        "so_that": "可以追踪平台上的所有管理操作",
        "ac": [
            "GET /api/v1/operator/audit-log 返回平台审计日志（租户创建/暂停/恢复/注销、套餐变更等）",
            "GET /api/v1/operator/enterprises/{id}/activity 返回指定企业的活动日志（API 调用量、活跃用户数、存储用量）",
        ],
        "frs": ["FR-OP-006", "FR-OP-007"], "nfrs": [], "deps": ["1.8", "9.2"],
        "capability": "operator-audit-log",
    },
    {
        "epic": 9, "story": "9.4", "title": "订阅套餐定义",
        "as_a": "运营商",
        "i_want": "定义和管理订阅套餐",
        "so_that": "企业可以选择不同的服务等级",
        "ac": [
            "POST /api/v1/operator/plans 创建订阅套餐（名称、价格、功能列表、用户数限制、存储配额）",
            "PUT /api/v1/operator/plans/{id} 更新套餐定义（已订阅的套餐不可删除，只能创建新版本）",
            "GET /api/v1/operator/plans 返回所有套餐列表",
        ],
        "frs": ["FR-BILL-001", "FR-BILL-002", "FR-BILL-003"], "nfrs": [], "deps": ["1.7"],
        "capability": "subscription-plan-definition",
    },
    {
        "epic": 9, "story": "9.5", "title": "企业订阅与续费",
        "as_a": "企业管理员",
        "i_want": "为企业订阅套餐和管理续费",
        "so_that": "可以使用平台服务",
        "ac": [
            "POST /api/v1/subscriptions 创建订阅，关联到当前企业",
            "订阅即将到期（距到期日 30 天内）时系统自动发送续费提醒消息",
            "POST /api/v1/subscriptions/{id}/renew 续费订阅，延长有效期",
            "订阅过期后 7 天内降级为只读模式，超过 7 天暂停服务",
        ],
        "frs": ["FR-BILL-004", "FR-BILL-005", "FR-BILL-006", "FR-BILL-007"], "nfrs": [], "deps": ["9.4", "8.4"],
        "capability": "enterprise-subscription-renewal",
    },
    {
        "epic": 9, "story": "9.6", "title": "用量计费与账单",
        "as_a": "企业管理员",
        "i_want": "查看用量和账单",
        "so_that": "可以了解费用明细",
        "ac": [
            "GET /api/v1/billing/usage?period=2026-06 返回当月用量明细（API 调用量、存储用量、用户数）",
            "GET /api/v1/billing/invoices 返回账单列表（周期、金额、状态）",
            "GET /api/v1/billing/invoices/{id} 返回账单详情（含用量明细和费用计算）",
        ],
        "frs": ["FR-BILL-008", "FR-BILL-009", "FR-BILL-010"], "nfrs": [], "deps": ["9.5"],
        "capability": "usage-billing-invoice",
    },
    {
        "epic": 9, "story": "9.7", "title": "客户服务工单",
        "as_a": "运营商客服",
        "i_want": "创建和管理客户服务工单",
        "so_that": "可以处理企业客户的服务请求",
        "ac": [
            "POST /api/v1/operator/service-tickets 创建客服工单",
            "PATCH /api/v1/operator/service-tickets/{id}/status 状态流转：待处理→处理中→已解决→已关闭",
            "GET /api/v1/operator/service-tickets?status=open&priority=high 按状态和优先级筛选工单列表",
        ],
        "frs": ["FR-CS-001", "FR-CS-002", "FR-CS-003"], "nfrs": [], "deps": ["9.1"],
        "capability": "customer-service-tickets",
    },
    {
        "epic": 9, "story": "9.8", "title": "客户服务SLA与统计",
        "as_a": "运营商",
        "i_want": "监控客户服务 SLA 和统计指标",
        "so_that": "可以保证服务质量",
        "ac": [
            "GET /api/v1/operator/service-metrics 返回客服指标（平均响应时间、解决率、SLA 达标率）",
            "工单超时未响应时超过 SLA 配置的响应时间，自动升级工单优先级并通知客服主管",
        ],
        "frs": ["FR-CS-004", "FR-CS-005"], "nfrs": [], "deps": ["9.7"],
        "capability": "customer-service-sla-statistics",
    },
    {
        "epic": 9, "story": "9.9", "title": "运营服务管理",
        "as_a": "运营商",
        "i_want": "管理平台级服务配置和运维操作",
        "so_that": "可以维护平台稳定运行",
        "ac": [
            "GET /api/v1/operator/services 返回平台服务列表（API 服务、数据库、Redis、Qdrant 状态）",
            "POST /api/v1/operator/maintenance 设置维护窗口，维护期间 API 返回 503",
            "GET /api/v1/operator/system-health 返回系统健康状态（CPU、内存、磁盘、数据库连接池）",
        ],
        "frs": ["FR-OPSVC-001", "FR-OPSVC-002", "FR-OPSVC-003", "FR-OPSVC-004"], "nfrs": [], "deps": ["1.12"],
        "capability": "operator-service-management",
    },
    {
        "epic": 9, "story": "9.10", "title": "运营通知与公告",
        "as_a": "运营商",
        "i_want": "发布平台公告和通知",
        "so_that": "企业用户可以了解平台动态和维护信息",
        "ac": [
            "POST /api/v1/operator/announcements 发布平台公告",
            "GET /api/v1/announcements 返回当前生效的公告列表",
            "PATCH /api/v1/operator/announcements/{id}/revoke 撤回公告",
        ],
        "frs": ["FR-OPSVC-005", "FR-OPSVC-006", "FR-OPSVC-007"], "nfrs": [], "deps": ["8.4"],
        "capability": "operator-announcements",
    },
    {
        "epic": 9, "story": "9.11", "title": "运营数据导出与备份",
        "as_a": "运营商",
        "i_want": "导出运营数据和执行企业级备份",
        "so_that": "可以满足合规要求和数据安全",
        "ac": [
            "POST /api/v1/operator/data-export 创建数据导出任务，异步执行",
            "POST /api/v1/operator/enterprises/{id}/backup 触发企业 Schema 级备份",
            "POST /api/v1/operator/enterprises/{id}/restore 从备份恢复企业数据",
        ],
        "frs": ["FR-OPSVC-008", "FR-OPSVC-009", "FR-OPSVC-010", "FR-OPSVC-011"], "nfrs": [], "deps": ["1.9", "9.2"],
        "capability": "operator-data-export-backup",
    },
    {
        "epic": 9, "story": "9.12", "title": "客户自助服务",
        "as_a": "企业管理员",
        "i_want": "通过自助服务管理企业订阅和查看用量",
        "so_that": "不需要联系运营商就能完成常见操作",
        "ac": [
            "GET /api/v1/customer/subscription 返回当前企业订阅信息（套餐、到期日、用量）",
            "POST /api/v1/customer/subscription/upgrade 升级订阅（立即生效，差价按天计算）",
            "POST /api/v1/customer/support-tickets 创建客户支持工单",
            "GET /api/v1/customer/support-tickets 返回本企业的支持工单列表",
        ],
        "frs": ["FR-CUST-001", "FR-CUST-002", "FR-CUST-003", "FR-CUST-004", "FR-CUST-005", "FR-CUST-006"], "nfrs": [], "deps": ["9.5", "9.7"],
        "capability": "customer-self-service",
    },
    # ========== Epic 10: 数据智能与私有化部署 ==========
    {
        "epic": 10, "story": "10.1", "title": "老板驾驶舱报表",
        "as_a": "老板",
        "i_want": "查看企业经营数据驾驶舱",
        "so_that": "可以一目了然掌握企业核心经营指标",
        "ac": [
            "GET /api/v1/reports/owner-dashboard 返回驾驶舱数据（营收趋势、合同金额、回款率、员工效率、客户增长）",
            "GET /api/v1/reports/owner-dashboard?period=quarter 按月/季/年维度切换报表数据",
            "GET /api/v1/reports/owner-dashboard?enterprise_id=all 返回跨企业汇总数据",
        ],
        "frs": ["FR-OWNER-001", "FR-OWNER-002", "FR-OWNER-003"], "nfrs": [], "deps": ["2.2"],
        "capability": "owner-dashboard-reports",
    },
    {
        "epic": 10, "story": "10.2", "title": "老板数据穿透与对比",
        "as_a": "老板",
        "i_want": "穿透查看报表背后的明细数据并进行跨期对比",
        "so_that": "可以从宏观到微观理解经营状况",
        "ac": [
            "GET /api/v1/reports/owner-drilldown?metric=revenue&period=2026-Q2 返回指标穿透明细（从季度→月→周→单据）",
            "GET /api/v1/reports/owner-compare?metric=revenue&periods=2026-Q1,2026-Q2 返回跨期对比数据",
            "GET /api/v1/reports/owner-ranking?type=department&metric=revenue 返回部门排名数据",
        ],
        "frs": ["FR-OWNER-004", "FR-OWNER-005", "FR-OWNER-006"], "nfrs": [], "deps": ["10.1"],
        "capability": "owner-data-drilldown-compare",
    },
    {
        "epic": 10, "story": "10.3", "title": "通用数据报表",
        "as_a": "企业用户",
        "i_want": "按模块查看业务数据报表",
        "so_that": "可以从数据维度分析业务状况",
        "ac": [
            "GET /api/v1/reports/sales?period=2026-06 返回销售报表",
            "GET /api/v1/reports/inventory?warehouse_id={id} 返回库存报表",
            "GET /api/v1/reports/finance?period=2026-06 返回财务报表",
            "GET /api/v1/reports/service?period=2026-06 返回售后报表",
        ],
        "frs": ["FR-REPORT-001", "FR-REPORT-002", "FR-REPORT-003", "FR-REPORT-004"], "nfrs": [], "deps": ["2.2"],
        "capability": "general-business-reports",
    },
    {
        "epic": 10, "story": "10.4", "title": "自定义报表与导出",
        "as_a": "企业管理员",
        "i_want": "创建自定义报表并导出数据",
        "so_that": "可以按需分析业务数据",
        "ac": [
            "POST /api/v1/reports/custom 创建自定义报表定义",
            "GET /api/v1/reports/custom/{id}/run 执行报表查询并返回结果",
            "GET /api/v1/reports/custom/{id}/export?format=csv 导出报表数据为 CSV/Excel 格式",
        ],
        "frs": ["FR-REPORT-005", "FR-REPORT-006", "FR-REPORT-007", "FR-REPORT-008"], "nfrs": [], "deps": ["10.3"],
        "capability": "custom-reports-export",
    },
    {
        "epic": 10, "story": "10.5", "title": "审计日志查询与导出",
        "as_a": "企业管理员",
        "i_want": "查询和导出审计日志",
        "so_that": "可以追溯所有系统操作",
        "ac": [
            "GET /api/v1/audit-log?user_id={id}&action=update&start_date=2026-01-01 返回审计日志列表",
            "GET /api/v1/audit-log/{id} 返回审计日志详情（操作前后数据差异）",
            "GET /api/v1/audit-log/export?format=csv&start_date=2026-01-01 导出审计日志为 CSV 格式",
        ],
        "frs": ["FR-AUDIT-001", "FR-AUDIT-002", "FR-AUDIT-003"], "nfrs": [], "deps": ["1.8"],
        "capability": "audit-log-query-export",
    },
    {
        "epic": 10, "story": "10.6", "title": "数据备份与恢复审计",
        "as_a": "企业管理员",
        "i_want": "查看数据备份记录和恢复操作日志",
        "so_that": "可以确保数据安全合规",
        "ac": [
            "GET /api/v1/audit-backup 返回备份记录列表（备份时间、大小、状态）",
            "GET /api/v1/audit-restore 返回恢复操作日志（恢复时间、操作人、恢复范围）",
        ],
        "frs": ["FR-AUDIT-004", "FR-AUDIT-005", "FR-AUDIT-006"], "nfrs": [], "deps": ["1.9"],
        "capability": "data-backup-restore-audit",
    },
    {
        "epic": 10, "story": "10.7", "title": "数据导入",
        "as_a": "企业管理员",
        "i_want": "批量导入业务数据",
        "so_that": "可以快速初始化系统或批量更新数据",
        "ac": [
            "POST /api/v1/data-import/upload 上传 CSV/Excel 文件，解析并返回预览",
            "POST /api/v1/data-import/execute 执行导入，返回导入结果（成功数、失败数、错误明细）",
            "导入数据校验失败时返回错误明细（行号、字段、错误原因），允许部分导入或全部回滚",
        ],
        "frs": ["FR-IMPORT-001", "FR-IMPORT-002", "FR-IMPORT-003"], "nfrs": [], "deps": ["2.2"],
        "capability": "data-import",
    },
    {
        "epic": 10, "story": "10.8", "title": "数据导出",
        "as_a": "企业用户",
        "i_want": "导出业务数据",
        "so_that": "可以在本地分析或备份",
        "ac": [
            "POST /api/v1/data-export 创建异步导出任务",
            "GET /api/v1/data-export/{id}/download 下载导出文件",
            "GET /api/v1/data-export/history 返回导出历史列表",
        ],
        "frs": ["FR-IMPORT-004", "FR-IMPORT-005", "FR-IMPORT-006"], "nfrs": [], "deps": ["2.2"],
        "capability": "data-export",
    },
    {
        "epic": 10, "story": "10.9", "title": "Webhook 注册与触发",
        "as_a": "企业管理员",
        "i_want": "配置 Webhook 接收业务事件通知",
        "so_that": "可以与外部系统实时集成",
        "ac": [
            "POST /api/v1/webhooks 注册 Webhook（URL、事件类型列表、密钥）",
            "业务事件触发时向已注册的 Webhook URL 发送 POST 请求（含事件数据和签名）",
            "Webhook 调用失败时按重试策略重试（最多3次，指数退避），记录调用日志",
        ],
        "frs": ["FR-WEBHOOK-001", "FR-WEBHOOK-002", "FR-WEBHOOK-003"], "nfrs": [], "deps": ["2.2"],
        "capability": "webhook-registration-trigger",
    },
    {
        "epic": 10, "story": "10.10", "title": "Webhook 管理与日志",
        "as_a": "企业管理员",
        "i_want": "管理 Webhook 配置和查看调用日志",
        "so_that": "可以监控和调试 Webhook 集成",
        "ac": [
            "GET /api/v1/webhooks 返回 Webhook 列表",
            "PATCH /api/v1/webhooks/{id} 更新 Webhook 配置",
            "GET /api/v1/webhooks/{id}/logs 返回 Webhook 调用日志",
            "POST /api/v1/webhooks/{id}/test 发送测试事件到 Webhook URL",
        ],
        "frs": ["FR-WEBHOOK-004", "FR-WEBHOOK-005", "FR-WEBHOOK-006"], "nfrs": [], "deps": ["10.9"],
        "capability": "webhook-management-logs",
    },
    {
        "epic": 10, "story": "10.11", "title": "国际化与多语言",
        "as_a": "系统管理员",
        "i_want": "配置系统语言和翻译资源",
        "so_that": "不同地区用户可以使用母语操作系统",
        "ac": [
            "PATCH /api/v1/settings/language 更新企业默认语言",
            "API 返回错误信息时按用户偏好语言返回错误码和错误消息",
            "GET /api/v1/i18n/translations?locale=en 返回指定语言的翻译资源",
            "POST /api/v1/i18n/translations 自定义翻译覆盖默认翻译",
        ],
        "frs": ["FR-I18N-001", "FR-I18N-002", "FR-I18N-003", "FR-I18N-004"], "nfrs": [], "deps": ["1.5"],
        "capability": "internationalization-i18n",
    },
    {
        "epic": 10, "story": "10.12", "title": "时区与格式本地化",
        "as_a": "企业用户",
        "i_want": "系统支持时区和本地化格式",
        "so_that": "时间和数据显示符合本地习惯",
        "ac": [
            "API 返回时间字段时按企业时区格式化返回",
            "PATCH /api/v1/settings/locale 更新企业本地化格式配置",
            "用户个人偏好语言与企业不同时，个人语言优先级高于企业默认",
        ],
        "frs": ["FR-I18N-005", "FR-I18N-006"], "nfrs": [], "deps": ["10.11"],
        "capability": "timezone-locale-localization",
    },
    {
        "epic": 10, "story": "10.13", "title": "安全增强与数据加密",
        "as_a": "系统管理员",
        "i_want": "敏感数据加密存储和访问控制增强",
        "so_that": "系统安全性满足企业级要求",
        "ac": [
            "敏感字段（密码、手机号、身份证号等）使用 AES-256 加密存储",
            "GET /api/v1/security/settings 返回安全配置",
            "PATCH /api/v1/security/settings 更新安全配置（密码策略、会话超时）",
            "IP 白名单启用时，非白名单 IP 访问 API 返回 403",
        ],
        "frs": ["FR-SEC2-001", "FR-SEC2-002", "FR-SEC2-003", "FR-SEC2-004"], "nfrs": [], "deps": ["1.6"],
        "capability": "security-encryption-enhancement",
    },
    {
        "epic": 10, "story": "10.14", "title": "AI 助手对话",
        "as_a": "Agent",
        "i_want": "通过 AI 助手获取业务操作建议",
        "so_that": "Agent 可以更智能地辅助用户完成业务操作",
        "ac": [
            "POST /api/v1/assistant/chat 携带用户问题和上下文，AI 助手返回操作建议",
            "AI 助手需要执行操作时返回操作建议及对应 Skill 调用参数",
            "AI 助手回答无法确定时返回免责声明并建议咨询人工",
        ],
        "frs": ["FR-ASSIST-001", "FR-ASSIST-002"], "nfrs": [], "deps": ["8.9", "8.10"],
        "capability": "ai-assistant-chat",
    },
    {
        "epic": 10, "story": "10.15", "title": "AI 助手上下文与偏好",
        "as_a": "Agent",
        "i_want": "AI 助手记住对话上下文和用户偏好",
        "so_that": "多轮对话可以连贯进行",
        "ac": [
            "用户有多轮对话时，AI 助手结合历史上下文生成回复",
            "PATCH /api/v1/assistant/preferences 更新企业级 AI 助手偏好设置",
            "DELETE /api/v1/assistant/sessions/{id} 清除指定会话的上下文数据",
        ],
        "frs": ["FR-ASSIST-004", "FR-ASSIST-005"], "nfrs": [], "deps": ["10.14"],
        "capability": "ai-assistant-context-preferences",
    },
    {
        "epic": 10, "story": "10.16", "title": "CLI 认证与配置",
        "as_a": "Agent 运维人员",
        "i_want": "通过 CLI 工具完成认证和系统配置",
        "so_that": "可以通过命令行管理系统",
        "ac": [
            "执行 ao-cli auth login，输入用户名和密码，CLI 通过 OAuth 2.0 认证，保存 Token 到本地",
            "执行 ao-cli auth logout，清除本地 Token，调用 API 撤销 Token",
            "执行 ao-cli config set api_url，更新 CLI 配置文件中的 API 地址",
        ],
        "frs": ["FR-CLI-001", "FR-CLI-002", "FR-CLI-003"], "nfrs": [], "deps": ["1.2", "1.6"],
        "capability": "cli-auth-configuration",
    },
    {
        "epic": 10, "story": "10.17", "title": "CLI 消息轮询与 Skill 执行",
        "as_a": "Agent",
        "i_want": "通过 CLI 轮询消息和执行 Skill",
        "so_that": "Agent 可以自动化业务操作",
        "ac": [
            "执行 ao-cli poll start，CLI 后台启动消息轮询（每60秒），收到新消息时输出到终端",
            "执行 ao-cli poll stop 停止消息轮询",
            "执行 ao-cli skill execute hrm_employee_create --name='张三'，CLI 调用对应 Skill API 并返回执行结果",
            "执行 ao-cli skill list，列出当前企业所有可用 Skill",
        ],
        "frs": ["FR-CLI-004", "FR-CLI-005", "FR-CLI-006", "FR-CLI-007", "FR-CLI-008"], "nfrs": [], "deps": ["10.16", "8.4", "8.10"],
        "capability": "cli-message-polling-skill-execution",
    },
    {
        "epic": 10, "story": "10.18", "title": "Docker 私有化部署",
        "as_a": "运维人员",
        "i_want": "通过 Docker Compose 一键部署私有化环境",
        "so_that": "企业可以在局域网内运行完整平台",
        "ac": [
            "执行 docker-compose up -d，启动 API 服务、PostgreSQL、Redis、Qdrant 全部组件",
            "修改 .env 文件中的数据库密码、JWT 密钥等，首次启动自动初始化数据库 Schema",
            "GET /api/v1/health 返回服务健康状态（所有组件就绪）",
        ],
        "frs": ["FR-DEPLOY-001", "FR-DEPLOY-002", "FR-DEPLOY-003"], "nfrs": [], "deps": ["1.3"],
        "capability": "docker-private-deployment",
    },
    {
        "epic": 10, "story": "10.19", "title": "私有化部署配置与升级",
        "as_a": "运维人员",
        "i_want": "配置私有化部署参数和执行版本升级",
        "so_that": "可以定制部署和保持系统更新",
        "ac": [
            "更新 docker-compose.yml 中的环境变量，重启服务后配置生效",
            "新版本发布时，拉取新镜像并执行升级脚本，自动执行数据库迁移，保留现有数据",
            "GET /api/v1/system/info 返回系统版本、部署模式、运行时间",
        ],
        "frs": ["FR-DEPLOY-004", "FR-DEPLOY-005", "FR-DEPLOY-006"], "nfrs": [], "deps": ["10.18"],
        "capability": "private-deployment-config-upgrade",
    },
    {
        "epic": 10, "story": "10.20", "title": "私有化备份恢复与监控",
        "as_a": "运维人员",
        "i_want": "执行私有化环境的数据备份恢复和系统监控",
        "so_that": "可以保障私有化环境的数据安全和稳定运行",
        "ac": [
            "执行 ./scripts/backup.sh 备份 PostgreSQL 数据、Redis RDB、Qdrant 快照",
            "执行 ./scripts/restore.sh --backup-dir=/backups/2026-07-04 从备份恢复所有数据",
            "GET /api/v1/system/metrics 返回 Prometheus 兼容的系统指标",
        ],
        "frs": ["FR-DEPLOY-007", "FR-DEPLOY-008"], "nfrs": [], "deps": ["10.18"],
        "capability": "private-deployment-backup-monitor",
    },
]


def task_id_counter():
    n = 0
    while True:
        n += 1
        yield n


def main():
    counter = task_id_counter()
    tasks_json = []
    changes_created = 0

    for s in STORIES:
        epic_num = s["epic"]
        story_num = s["story"]
        title = s["title"]
        story_index = story_num.split(".")[1]
        change_name = f"epic-{epic_num}-story-{story_index}-{s['capability']}"
        change_dir = os.path.join(CHANGES_DIR, change_name)

        epic_full = f"Epic {epic_num}"
        story_full = f"Story {story_num}"

        # ── proposal.md ──
        proposal = f"""## Why

As a {s["as_a"]}，我需要 {s["i_want"]}，以便 {s["so_that"]}。这是 {epic_full} 的关键功能点。

## What Changes

"""
        for ac in s["ac"]:
            proposal += f"- {ac}\n"
        proposal += f"""
## Capabilities

### New Capabilities
- `{s["capability"]}`: {s["title"]}的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
"""
        os.makedirs(os.path.join(change_dir, "specs"), exist_ok=True)
        with open(os.path.join(change_dir, "proposal.md"), "w", encoding="utf-8") as f:
            f.write(proposal)

        # ── design.md ──
        design = f"""## Context

{epic_full} 的 {story_full} 功能实现。技术栈：Go + Gin + GORM + PostgreSQL。

## Goals / Non-Goals

**Goals:**
- 实现 {s["title"]} 的完整 API 端点
- 遵循项目分层架构（handler → service → repository）
- 确保多租户数据隔离

**Non-Goals:**
- 不涉及前端 UI（无前端 SaaS）
- 不涉及第三方服务集成（除非明确需要）

## Decisions

- 遵循 RESTful API 设计规范
- 使用 GORM 作为 ORM 层
- Schema 级多租户隔离
- 结构化错误码体系

## Risks / Trade-offs

- 状态机转换需确保原子性
- 批量操作需考虑性能
"""
        with open(os.path.join(change_dir, "design.md"), "w", encoding="utf-8") as f:
            f.write(design)

        # ── specs/spec.md ──
        spec = f"""## ADDED Requirements

### Requirement: {s["title"]}

As a {s["as_a"]}，I want {s["i_want"]}，So that {s["so_that"]}。

"""
        for i, ac in enumerate(s["ac"], 1):
            spec += f"#### Scenario {i}: 验收场景\n"
            spec += f"- **GIVEN** 用户已认证\n"
            spec += f"- **WHEN** 执行相关操作\n"
            spec += f"- **THEN** {ac}\n\n"

        with open(os.path.join(change_dir, "specs", "spec.md"), "w", encoding="utf-8") as f:
            f.write(spec)

        # ── tasks.md ──
        tasks = f"""## 1. 数据模型与数据库

- [ ] 1.1 定义 {s["title"]} 相关的数据模型（model）
- [ ] 1.2 创建数据库 Migration 文件
- [ ] 1.3 验证 Schema 自动创建和迁移

## 2. Repository 层

- [ ] 2.1 实现 {s["title"]} 的 Repository 接口和实现
- [ ] 2.2 确保所有查询包含 enterprise_id 多租户过滤
- [ ] 2.3 编写 Repository 单元测试

## 3. Service 层

- [ ] 3.1 实现 {s["title"]} 的 Service 业务逻辑
- [ ] 3.2 添加参数校验和错误处理
- [ ] 3.3 编写 Service 单元测试

## 4. Handler 层

- [ ] 4.1 实现 {s["title"]} 的 HTTP Handler
- [ ] 4.2 注册路由和中间件
- [ ] 4.3 实现统一响应格式

## 5. 测试与验证

- [ ] 5.1 编写 API 集成测试
- [ ] 5.2 go vet 通过
- [ ] 5.3 go build 通过
- [ ] 5.4 go test ./... 通过
- [ ] 5.5 API 端点功能验证
"""
        with open(os.path.join(change_dir, "tasks.md"), "w", encoding="utf-8") as f:
            f.write(tasks)

        # ── task.json entry ──
        task_id = next(counter)
        deps_full = []
        for dep in s["deps"]:
            if "." in str(dep):
                parts = str(dep).split(".")
                deps_full.append(f"Epic {parts[0]} Story {dep}")
            else:
                deps_full.append(str(dep))

        task_entry = {
            "id": task_id,
            "epic": epic_full,
            "story": story_full,
            "title": s["title"],
            "description": f"As a {s['as_a']}, I want {s['i_want']}, So that {s['so_that']}",
            "implementationType": "new",
            "openspec_change": change_name,
            "steps": [f"完成 {change_name} 变更的所有 task"],
            "frs_covered": s["frs"],
            "nfrs_covered": s["nfrs"],
            "arch_covered": [],
            "ux_covered": [],
            "dependencies": [f"Story {d}" for d in s["deps"]] if s["deps"] else [],
            "passes": False,
        }
        tasks_json.append(task_entry)
        changes_created += 1

    # Write task.json
    task_json_path = os.path.join(BASE, "task.json")
    task_json_content = {
        "plan_version": "3.0",
        "plan_date": "2026-07-04",
        "description": "AI-Automated-office 开发任务清单 (v3.0) - 基于 Epics 1-10 的完整 OpenSpec 变更",
        "total_tasks": len(tasks_json),
        "completed_tasks": 0,
        "implementation_status": {
            "overall": "0% - 所有 Story 的 OpenSpec 变更已生成，等待实现",
        },
        "tasks": tasks_json,
    }

    with open(task_json_path, "w", encoding="utf-8") as f:
        json.dump(task_json_content, f, ensure_ascii=False, indent=2)

    print(f"Generated {changes_created} OpenSpec changes")
    print(f"task.json: {len(tasks_json)} tasks")


if __name__ == "__main__":
    main()
