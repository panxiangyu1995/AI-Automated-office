---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
workflowType: 'architecture'
lastStep: 9
status: 'complete'
completedAt: '2026-03-10'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/agent/README.md
  - _bmad-output/agent/01-架构总览.md
  - _bmad-output/agent/02-感知层架构.md
  - _bmad-output/agent/03-决策层架构.md
  - _bmad-output/agent/04-执行层架构.md
  - _bmad-output/agent/05-记忆层架构.md
  - _bmad-output/agent/06-工具调用系统.md
  - _bmad-output/agent/07-多智能体协作.md
  - _bmad-output/agent/08-安全机制设计.md
  - _bmad-output/agent/09-设计最佳实践.md
  - _bmad-output/errorshandl/README.md
  - _bmad-output/errorshandl/error-classification.md
  - _bmad-output/errorshandl/failover-retry.md
  - _bmad-output/errorshandl/loop-detection.md
  - _bmad-output/errorshandl/network-errors.md
  - _bmad-output/errorshandl/session-errors.md
  - _bmad-output/errorshandl/error-formatting.md
workflowType: 'architecture'
project_name: 'AI-Automated-office'
user_name: 'PAN'
date: '2026-03-10'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
项目共定义110个功能需求，覆盖平台核心（桌面端、Agent框架、插件系统、权限系统）和8个业务插件（人事管理、财务OCR、数据看板、销售自动化、售后工单、知识库RAG、仓库管理、标书制定）。核心架构围绕AI Agent能力展开，包括工具调用、MCP服务接入、会话管理、记忆管理和子代理协作。

**Non-Functional Requirements:**
- 性能：本地操作<100ms，云端<3s，空闲内存<500MB
- 安全：TLS 1.3传输加密、AES-256存储加密、多租户数据库级隔离
- 可靠性：系统可用性>99.5%、RPO<1h、RTO<4h、工具调用成功率>99%
- 可扩展性：单租户≥500用户、系统≥100租户、≥200插件支持
- 集成：OpenAI兼容格式、MCP协议、国内主流模型提供商

**Scale & Complexity:**

- Primary domain: Desktop App + 后端平台 + AI Agent框架
- Complexity level: 高
- Estimated architectural components: 15-20个核心组件

### Technical Constraints & Dependencies

- 桌面端技术栈：Tauri + Rust (Windows 10/11, macOS 11.0+)
- Agent运行位置：客户端本地运行
- 云服务职责：登录认证、租户管理、数据存储、实时同步
- 模型提供商：OpenAI兼容格式为通用接口标准，支持百炼、智谱AI、Minimax、DeepSeek等国内模型
- Token管理：支持客户自配API Key或统一中转服务

### Cross-Cutting Concerns Identified

1. **错误处理与容错** - 工具调用重试、故障转移、Auth Profile轮换、循环检测熔断
2. **安全性** - 细粒度RBAC权限、多租户数据隔离、API Key本地加密存储
3. **数据一致性** - 实时同步策略、冲突检测与处理、版本历史管理
4. **可观测性** - 操作审计日志、任务状态追踪、数据看板监控
5. **插件隔离** - 错误边界 + 优雅降级（插件全部自研，同进程运行）

### Reference Architecture Insights (OpenClaw)

参考架构提供了以下关键设计模式：
- **工具系统**：声明式工具定义、策略管道、沙箱隔离执行
- **子代理系统**：层级协作模式、状态持久化、结果通知机制
- **错误处理**：分层处理、可恢复性优先、故障隔离、用户友好

### Architecture Decision Records (ADR)

通过多架构师角色辩论、第一性原理分析、跨职能作战室和思维树探索，形成以下关键架构决策：

| 决策ID | 决策内容 | 来源 |
|--------|---------|------|
| ADR-001 | 采用分层微内核架构 | 架构师辩论 |
| ADR-002 | 插件作为模块化组件同进程运行，通过依赖注入和事件总线通信 | 第一性原理 + 用户澄清 |
| ADR-003 | 数据存储采用本地优先 + 增量同步 + 智能冲突解决策略 | 第一性原理 |
| ADR-004 | 使用事件总线解耦模块通信 | 架构师辩论 |
| ADR-005 | 多租户采用数据库级隔离 | Step 4决策 |
| ADR-006 | 插件系统提供低代码配置能力，支持非开发人员定制 | 跨职能作战室 |
| ADR-007 | 实现插件错误边界和热重载机制，防止单点故障 | 跨职能作战室 |
| ADR-008 | 建立统一的插件UI框架和加载状态规范 | 跨职能作战室 |
| ADR-009 | LLM接入采用适配器模式，以OpenAI兼容格式为基准 | 思维树分析 |
| ADR-010 | 工具系统采用混合模式：核心工具内置 + MCP工具 + 插件工具 | 思维树分析 |
| ADR-011 | 会话Key采用三层结构：`{tenantId}:{pluginId}:{sessionId}` | 架构讨论 2026-03-10 |
| ADR-012 | MVP阶段不实现多通道，专注桌面端核心功能 | 架构讨论 2026-03-10 |
| ADR-013 | 子代理最大深度限制为3层 | 架构讨论 2026-03-10 |
| ADR-014 | MVP阶段实现向量+BM25混合搜索 | 架构讨论 2026-03-10 |
| ADR-015 | MCP协议版本采用2024-11-05 | 架构讨论 2026-03-10 |
| ADR-016 | MVP阶段暂不实现Docker沙箱 | 架构讨论 2026-03-10 |
| ADR-017 | 工具命名采用`{plugin}_{entity}_{action}`格式 | 架构讨论 2026-03-10 |
| ADR-018 | 字段级权限采用后台动态配置 | 架构讨论 2026-03-10 |
| ADR-019 | 敏感操作确认采用聊天界面内弹出方式 | 架构讨论 2026-03-10 |
| ADR-020 | MCP工具优先级：内置工具优先，MCP工具Post-MVP实现 | 架构讨论 2026-03-10 |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│         Desktop Shell (Tauri) │ UI Components                │
├─────────────────────────────────────────────────────────────┤
│                    Agent Core Layer (微内核)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LLM Adapter Layer                       │    │
│  │  OpenAICompatibleAdapter + Provider Extensions      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Tool System (混合模式)                   │    │
│  │  Core Tools │ MCP Tools │ Plugin Tools              │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Session & Memory                        │    │
│  │  SessionManager │ MemoryManager │ ContextCompressor │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Plugin Layer (同进程模块化)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Plugin Manager                          │    │
│  │  - 依赖解析 │ 生命周期 │ 权限控制 │ 低代码配置        │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Plugin Registry                         │    │
│  │  HR │ Finance │ Sales │ Dashboard │ ...            │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer (本地优先)                      │
│  Local Store (SQLite) │ Sync Engine │ Conflict Resolver     │
├─────────────────────────────────────────────────────────────┤
│                    Cloud Layer                               │
│  Auth │ Tenant Mgmt │ Data Sync │ Object Storage            │
└─────────────────────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────────────────────┐
│                    Security Cross-Cutting                    │
│  RBAC │ Encryption │ Audit │ Error Boundary                 │
└─────────────────────────────────────────────────────────────┘
```

## Agent Framework Core Decisions

> 基于OpenClaw架构研究和四层标准架构设计，以下为Agent框架核心设计决策。

### 四层架构设计

Agent框架采用**四层标准架构**设计，遵循感知-决策-执行-记忆闭环模型：

```
┌─────────────────────────────────────────────────────────────────┐
│                    四层架构映射                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  感知层 (Perception)                                            │
│  ├── 前端UI输入 (Tauri + React)                                 │
│  ├── 插件事件输入 (Plugin Events)                               │
│  ├── 多模态输入 (图像/PDF)                                      │
│  └── 权限门控 (RBAC)                                            │
│                                                                 │
│  决策层 (Decision)                                              │
│  ├── 系统提示词构建 (System Prompt Builder)                     │
│  ├── 上下文管理 (Context Manager + Compressor)                  │
│  ├── LLM Adapter (OpenAI兼容格式)                               │
│  └── TAO循环 (Think-Act-Observe)                               │
│                                                                 │
│  执行层 (Execution)                                             │
│  ├── 工具系统 (核心工具 + MCP工具 + 插件工具)                   │
│  ├── 工具策略管道 (权限→沙箱→路径)                              │
│  ├── 循环检测 + 熔断器                                          │
│  └── 沙箱隔离 (MVP暂不实现Docker)                               │
│                                                                 │
│  记忆层 (Memory)                                                │
│  ├── Session Manager (会话管理)                                 │
│  ├── Memory Manager (STM + LTM)                                 │
│  ├── 向量存储 (sqlite-vec)                                      │
│  └── 混合搜索 (向量 + BM25)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 会话Key格式设计 (ADR-011)

采用三层结构，简洁且易于解析：

**格式定义：**
```
{tenantId}:{pluginId}:{sessionId}
```

**字段说明：**

| 字段 | 含义 | 示例 |
|------|------|------|
| tenantId | 租户标识 | `main`, `tenant-001` |
| pluginId | 插件/模块标识 | `agent`, `hr`, `finance` |
| sessionId | 会话实例ID | `chat-001`, `session-abc` |

**子代理Key生成规则：**
```
父会话: tenant-001:agent:chat-001
子代理: tenant-001:agent:chat-001/sub:run-001
孙代理: tenant-001:agent:chat-001/sub:run-001/sub:run-002
```

**深度计算：** 统计 `/sub:` 出现次数，最大深度限制为3层 (ADR-013)

**设计优势：**
1. 简洁：三层结构，易于解析
2. 多租户友好：前缀区分租户
3. 插件隔离：中间层区分插件
4. 子代理支持：通过后缀实现嵌套

### 多通道决策 (ADR-012)

**MVP决策：不实现多通道**

| 决策项 | MVP | Post-MVP |
|--------|-----|----------|
| 多通道支持 | ❌ 不实现 | 插件化扩展 |
| 感知层设计 | 仅桌面UI输入 | + 移动端Web + 企业平台 |
| 移动端接入 | 通过云端Web服务 | 可选原生App |
| 企业平台集成 | 不支持 | 企业微信/钉钉机器人 |

**理由：**
1. 聚焦桌面端核心功能，降低复杂度
2. 移动端可通过云端Web服务访问
3. 企业平台集成作为Post-MVP插件扩展
4. 预留扩展接口，保持架构灵活性

### 子代理系统设计 (ADR-013)

**核心设计：** 沿用OpenClaw子代理系统模式

**关键参数：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 最大深度 | 3层 | 防止无限嵌套 |
| 运行模式 | oneshot + session | 单次执行 + 持久会话 |
| 通知机制 | Announce | 完成后通知父代理 |
| 状态持久化 | SQLite | 支持重启恢复 |

**生命周期管理：**
```
spawn → register → start → running → end → announce → cleanup
```

**子代理注册中心设计：**
```rust
pub struct SubagentRegistry {
    runs: HashMap<String, SubagentRunRecord>,
    db: Database,
}

pub struct SubagentRunRecord {
    run_id: String,
    requester_session_key: String,
    child_session_key: String,
    status: SubagentStatus,
    created_at: i64,
    started_at: Option<i64>,
    ended_at: Option<i64>,
    outcome: Option<SubagentOutcome>,
}
```

### 混合搜索设计 (ADR-014)

**MVP决策：实现向量+BM25混合搜索**

**架构设计：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    混合搜索架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Query ─→ 向量嵌入 ─→ 向量搜索 ─→ 路径1                         │
│       └──→ 关键词提取 ─→ BM25搜索 ─→ 路径2                      │
│                                    ↓                            │
│                              结果融合 (RRF)                      │
│                                    ↓                            │
│                              重排序 (可选)                       │
│                                    ↓                            │
│                              Top-K结果                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**融合算法 (RRF - Reciprocal Rank Fusion)：**
```rust
pub fn reciprocal_rank_fusion(
    vector_results: Vec<SearchResult>,
    bm25_results: Vec<SearchResult>,
    vector_weight: f32,  // 默认 0.6
    bm25_weight: f32,    // 默认 0.4
    k: usize,            // 常数，默认 60
) -> Vec<SearchResult> {
    // RRF公式: score = Σ(1 / (k + rank))
}
```

**性能指标：**
| 指标 | 单路召回 | 混合搜索 |
|------|---------|---------|
| 延迟 | ~50ms | ~200ms |
| 准确率 | 基准 | +15-25% |

### MCP集成设计 (ADR-015)

**协议版本：2024-11-05**

**连接模式：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Client Manager                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  连接管理 │ 健康检查 │ 重连机制                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                    │                    │            │
│         ↓                    ↓                    ↓            │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐       │
│  │ Stdio MCP │        │ HTTP MCP  │        │ SSE MCP   │       │
│  │ (本地进程) │        │ (远程服务) │        │ (流式)    │       │
│  └───────────┘        └───────────┘        └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Rust实现结构：**
```rust
pub struct McpClient {
    transport: McpTransport,
    tools: HashMap<String, Tool>,
    health_checker: HealthChecker,
}

pub enum McpTransport {
    Stdio { process: Child },
    Http { client: Client },
    Sse { stream: EventSource },
}
```

**配置示例：**
```toml
# config/mcp.toml
[[mcp_servers]]
name = "filesystem"
transport = "stdio"
command = "mcp-filesystem"
args = ["/path/to/workspace"]

[[mcp_servers]]
name = "database"
transport = "http"
url = "http://localhost:8080/mcp"
```

### 沙箱模式决策 (ADR-016)

**MVP决策：暂不实现Docker沙箱**

**替代方案：**
1. 工具策略管道（权限检查）
2. 路径访问限制
3. 命令审批机制
4. 循环检测熔断

**Post-MVP扩展：**
- 可选Docker沙箱隔离
- 容器镜像配置
- 资源限制（CPU/内存）

### 工具系统设计

**工具定义Schema：JSON Schema**（原生支持OpenAI Function Calling）

#### 工具设计原则 (ADR-017)

```
┌─────────────────────────────────────────────────────────────────┐
│                    工具设计原则                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 原子性 (Atomicity)                                          │
│     • 每个工具只做一件事                                        │
│     • 工具不可再分解                                            │
│     • 例：read_file 不是 read_and_process_file                  │
│                                                                 │
│  2. 独特性 (Uniqueness)                                         │
│     • 工具之间有明确边界                                        │
│     • 描述必须清晰区分                                          │
│     • 避免功能重叠                                              │
│                                                                 │
│  3. 幂等性 (Idempotency)                                        │
│     • 相同输入产生相同结果                                      │
│     • 重复调用不会产生副作用                                    │
│                                                                 │
│  4. 安全性 (Safety)                                             │
│     • 敏感操作需要确认                                          │
│     • 参数严格验证                                              │
│     • 权限自动检查                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 工具命名规范 (ADR-017)

**格式：`{plugin}_{entity}_{action}`**

```
示例：
- hr_employee_list     # 人事_员工_列表
- hr_employee_create   # 人事_员工_创建
- hr_attendance_query  # 人事_考勤_查询
- finance_invoice_ocr  # 财务_发票_识别
- finance_expense_submit # 财务_报销_提交
- knowledge_search     # 知识库_搜索 (无entity)
- db_query             # 数据库_查询 (核心工具)
```

#### 工具策略管道：

```
请求工具调用
     ↓
[参数验证]
     ↓
[白名单检查]
     ↓
[黑名单检查]
     ↓
[路径策略]
     ↓
[循环检测]
     ↓
[权限检查] ← 字段级权限
     ↓
[敏感操作确认] ← ADR-019
     ↓
[执行工具]
     ↓
[结果过滤]
```

#### 字段级权限设计 (ADR-018)

**后台动态配置实现：**

```rust
pub struct FieldPermission {
    pub field: String,
    pub visible_to: Vec<Role>,
    pub editable_by: Vec<Role>,
}

pub struct TablePermission {
    pub table: String,
    pub field_permissions: Vec<FieldPermission>,
    pub row_filter: RowFilter,
}

pub enum RowFilter {
    None,           // 管理员：无过滤
    ByUserId,       // 只能看自己的数据
    ByDepartment,   // 只能看部门数据
}

// 权限管理器
impl PermissionManager {
    pub fn apply_field_permission(
        &self,
        query: &mut Query,
        table: &str,
        role: &Role,
        user_id: &str,
    ) -> Result<(), Error> {
        // 1. 从后台获取权限配置
        let permission = self.fetch_table_permission(table).await?;
        
        // 2. 过滤不可见字段
        for field in &query.fields {
            if !permission.is_field_visible(field, role) {
                query.remove_field(field);
            }
        }
        
        // 3. 应用行级过滤
        match permission.row_filter {
            RowFilter::ByUserId => {
                query.add_condition("user_id", "=", user_id);
            },
            RowFilter::ByDepartment => {
                let dept_id = self.get_user_department(user_id).await?;
                query.add_condition("department_id", "=", dept_id);
            },
            RowFilter::None => {},
        }
        
        Ok(())
    }
}
```

**后台配置API：**
```typescript
// 权限配置接口
interface PermissionConfigAPI {
  // 获取表权限配置
  getTablePermission(table: string): Promise<TablePermission>;
  
  // 更新字段权限
  updateFieldPermission(
    table: string,
    field: string,
    permission: FieldPermission
  ): Promise<void>;
  
  // 更新行级过滤规则
  updateRowFilter(
    table: string,
    filter: RowFilter
  ): Promise<void>;
}
```

**示例配置（员工表）：**
```json
{
  "table": "employees",
  "field_permissions": [
    {
      "field": "id",
      "visible_to": ["admin", "manager", "employee"],
      "editable_by": ["admin"]
    },
    {
      "field": "name",
      "visible_to": ["admin", "manager", "employee"],
      "editable_by": ["admin", "employee"]
    },
    {
      "field": "salary",
      "visible_to": ["admin", "manager"],
      "editable_by": ["admin"]
    },
    {
      "field": "bank_account",
      "visible_to": ["admin", "employee"],
      "editable_by": ["employee"]
    }
  ],
  "row_filter": "ByUserId"
}
```

#### 敏感操作确认设计 (ADR-019)

**聊天界面内弹出确认卡片：**

```typescript
// 敏感操作配置
interface SensitiveOperationConfig {
  operation_id: string;
  operation_name: string;
  tool_pattern: string;           // 工具匹配模式（支持通配符）
  sensitivity_level: 'high' | 'medium' | 'low';
  require_confirmation: boolean;
  confirmation_type: 'user' | 'manager' | 'admin';
  audit_log: boolean;
  enabled: boolean;
}

// 默认配置
const defaultSensitiveOperations: SensitiveOperationConfig[] = [
  {
    operation_id: 'delete_data',
    operation_name: '删除数据',
    tool_pattern: '*_delete',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'admin',
    audit_log: true,
    enabled: true,
  },
  {
    operation_id: 'approve_request',
    operation_name: '审批通过',
    tool_pattern: '*_approve',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'user',
    audit_log: true,
    enabled: true,
  },
  {
    operation_id: 'salary_modify',
    operation_name: '薪资修改',
    tool_pattern: 'hr_salary_*',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'admin',
    audit_log: true,
    enabled: true,
  },
];
```

**确认流程：**
```
用户请求 → LLM选择工具 → 检查敏感操作配置
                                   ↓
                              [是否敏感？]
                             /            \
                           否              是
                           ↓               ↓
                       直接执行      弹出确认卡片
                                           ↓
                                    [用户确认？]
                                   /            \
                                 取消            确认
                                  ↓               ↓
                              返回取消        执行工具
                              消息             ↓
                                          记录审计日志
```

**前端确认卡片组件：**
```tsx
// 聊天界面内的确认卡片
<ConfirmationCard
  operation={{
    tool: "hr_employee_delete",
    params: { employee_id: "12345" },
    description: "确认删除员工张三？此操作不可撤销。",
    sensitivity: "high"
  }}
  onConfirm={() => executeTool()}
  onCancel={() => cancelOperation()}
/>
```

#### 工具实现优先级 (ADR-020)

**MVP内置工具优先：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    工具实现优先级                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: MVP 内置工具                                          │
│  ├── 基础工具层                                                 │
│  │   ├── file_read      # 读取文件                             │
│  │   ├── file_write     # 写入文件                             │
│  │   ├── file_edit      # 编辑文件                             │
│  │   ├── dir_list       # 列出目录                             │
│  │   ├── file_search    # 搜索文件                             │
│  │   ├── sys_time       # 系统时间                             │
│  │   └── http_request   # HTTP请求                             │
│  │                                                              │
│  ├── 知识库工具层 (RAG Tools)                                   │
│  │   ├── knowledge_search   # 检索知识                         │
│  │   ├── knowledge_add      # 添加知识                         │
│  │   ├── knowledge_update   # 更新知识                         │
│  │   ├── knowledge_delete   # 删除知识（敏感）                 │
│  │   └── knowledge_list     # 知识库列表                       │
│  │                                                              │
│  ├── 云端数据工具层                                             │
│  │   ├── db_query    # 查询数据                                │
│  │   ├── db_insert   # 插入数据                                │
│  │   ├── db_update   # 更新数据（敏感）                        │
│  │   ├── db_delete   # 删除数据（敏感）                        │
│  │   └── api_call    # 业务API调用                             │
│  │                                                              │
│  └── 插件业务工具层                                             │
│      ├── hr_employee_list     # 员工列表                       │
│      ├── hr_employee_get      # 员工详情                       │
│      ├── hr_employee_create   # 创建员工                       │
│      ├── hr_employee_update   # 更新员工                       │
│      ├── hr_employee_delete   # 删除员工（敏感）               │
│      ├── hr_attendance_query  # 考勤查询                       │
│      ├── hr_leave_apply       # 请假申请                       │
│      ├── hr_leave_approve     # 请假审批（敏感）               │
│      ├── hr_salary_query      # 薪资查询（敏感）               │
│      └── ...其他插件工具                                       │
│                                                                 │
│  Phase 2: Post-MVP 扩展                                         │
│  └── MCP外部工具：通过MCP协议接入第三方服务                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 工具动态选择架构（大量工具场景）

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Router 架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户请求                                                       │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Tool Router (语义路由)                      │   │
│  │  1. 用户请求 → 向量嵌入                                   │   │
│  │  2. 检索相似历史记录（工具调用历史）                       │   │
│  │  3. 确定候选工具集（缩小选择范围）                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              候选工具集 (候选工具)                        │   │
│  │  根据请求类型筛选相关工具，而非全部工具                    │   │
│  │  例：人事查询 → 仅返回 hr_* 工具                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LLM 工具选择                                │   │
│  │  从候选工具中选择最合适的                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  工具执行                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**工具组定义：**
```typescript
const TOOL_GROUPS = {
  filesystem: ["file_read", "file_write", "file_edit", "file_search", "dir_list"],
  knowledge: ["knowledge_search", "knowledge_add", "knowledge_update", "knowledge_delete", "knowledge_list"],
  database: ["db_query", "db_insert", "db_update", "db_delete"],
  hr: ["hr_employee_list", "hr_employee_get", "hr_employee_create", "hr_employee_update", "hr_employee_delete", "hr_attendance_query", "hr_leave_apply", "hr_leave_approve", "hr_salary_query"],
  finance: ["finance_invoice_ocr", "finance_expense_submit", "finance_report_query"],
  sales: ["sales_lead_create", "sales_lead_update", "sales_opportunity_list"],
  // ...其他插件工具组
};
```

### 错误处理机制

**跨层错误处理设计：**

| 错误类型 | 处理层级 | 处理方式 |
|---------|---------|---------|
| LLM API错误（rate_limit, timeout） | LLM Adapter | Profile轮换 + 退避重试 |
| 工具执行错误 | Tool System | 返回错误给Observe层 |
| 循环检测触发 | Tool System | 直接终止，不重试 |
| 网络错误 | LLM Adapter | 指数退避重试 |

**循环检测机制：**
- 无进展检测：相同工具调用结果不变
- 乒乓检测：两个工具交替调用
- 熔断器：全局调用次数限制

### ReAct循环实现

**TAO循环 (Think-Act-Observe)：**
```
Think  → 分析当前状态与目标，规划下一步策略
Act    → 选择工具并生成参数，执行调用
Observe→ 获取执行结果，更新上下文理解
```

**终止条件：**
```rust
pub enum TerminationReason {
    TaskCompleted,           // 任务完成，输出最终答案
    MaxIterationsReached,    // 达到最大迭代次数（建议15-30）
    LoopDetected,            // 检测到循环
    TokenLimitExceeded,      // Token超限
    UserInterrupted,         // 用户中断
    ErrorUnrecoverable,      // 不可恢复错误
    TimeoutExceeded,         // 超时
}
```

## Starter Template Evaluation

### Primary Technology Domain

基于PRD需求分析，项目属于 **Desktop App + AI Agent平台** 类型。

### Technology Stack Decisions

| 领域 | 选择 | 版本 | 理由 |
|------|------|------|------|
| **桌面框架** | Tauri | 2.x | PRD已确定，轻量、安全、跨平台 |
| **后端语言** | Rust | latest | Tauri原生支持，高性能 |
| **前端框架** | React | 19.x | 生态最大、shadcn/ui完美支持、TypeScript友好 |
| **类型系统** | TypeScript | 5.x | 类型安全、开发体验好 |
| **UI样式** | Tailwind CSS | 4.x | 原子化CSS、快速开发 |
| **组件库** | shadcn/ui | latest | 可定制、复制粘贴模式、无运行时依赖 |
| **状态管理** | Zustand | latest | 轻量、简单、TypeScript友好 |
| **服务端状态** | TanStack Query | 5.x | 缓存、同步、后台更新 |
| **本地存储** | SQLite | via Tauri plugin | 本地优先策略、Tauri原生支持 |
| **Agent框架** | 自研 | - | 参考OpenClaw模式，完全可控 |
| **构建工具** | Vite | 6.x | 快速、HMR好、Tauri官方支持 |
| **测试框架** | Vitest + Playwright | latest | 单元测试 + E2E测试 |
| **包管理器** | pnpm | latest | 快速、磁盘效率高 |

### Initialization Commands

**推荐方式：官方模板 + 手动增强**

```bash
# 1. 创建基础项目
npm create tauri-app@latest ai-automated-office
# 选择: TypeScript/JavaScript → pnpm → React → TypeScript

cd ai-automated-office

# 2. 安装额外依赖
pnpm add zustand @tanstack/react-query

# 3. 初始化 shadcn/ui
npx shadcn@latest init

# 4. 安装 Tauri 插件
pnpm tauri add sqlite
pnpm tauri add shell
pnpm tauri add notification

# 5. 启动开发服务器
pnpm tauri dev
```

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (已确定):**
- 多租户隔离策略：数据库级隔离
- 本地数据存储：SQLite多文件
- 前后端通信：Tauri IPC Commands
- 认证方式：自建账号体系

**Important Decisions (已确定):**
- 数据同步冲突解决：时间戳优先
- 权限模型：RBAC + 数据权限
- 云端API设计：RESTful API
- 实时通信：WebSocket

**Deferred Decisions (Post-MVP):**
- 容器化部署迁移（当前传统服务器）
- 第三方OAuth集成（可选扩展）

### Data Architecture

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 多租户隔离 | 数据库级隔离 | - | 最强隔离、符合PRD安全要求 |
| 本地存储引擎 | SQLite | 3.45+ | 轻量、嵌入式、跨平台 |
| 本地存储策略 | 多文件分库 | - | 按插件分库、隔离更好、便于管理 |
| 数据同步策略 | 本地优先 + 增量同步 | - | 离线友好、减少网络依赖 |
| 冲突解决 | 时间戳优先 | - | 简单有效、最后修改者胜出 |
| 云端数据库 | PostgreSQL | 16.x | 开源、功能强大、社区活跃 |

### Authentication & Security

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 认证方式 | 自建账号体系 | - | 完全可控、无第三方依赖 |
| 密码加密 | bcrypt | - | 安全性高、强度因子≥12 |
| API Key存储 | 加密文件 | AES-256 | 本地加密、实现简单、跨平台 |
| 权限模型 | RBAC + 数据权限 | - | 角色 + 部门/个人数据隔离 |
| 传输加密 | TLS 1.3 | - | PRD要求、最新安全标准 |
| 存储加密 | AES-256 | - | PRD要求、敏感数据加密 |

### API & Communication Patterns

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 前后端通信 | Tauri IPC Commands | 2.0 | 原生方式、性能最好、类型安全 |
| 云端API风格 | RESTful API | - | 简单、通用、易缓存 |
| 实时通信 | WebSocket | - | 全双工、实时性好 |
| API文档 | OpenAPI 3.1 | - | 标准化、自动生成 |

### Frontend Architecture

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 框架 | React | 19.x | 生态最大、社区活跃 |
| 语言 | TypeScript | 5.x | 类型安全、开发体验好 |
| UI组件库 | Tailwind + shadcn/ui | 4.x | 现代化、可定制 |
| 状态管理 | Zustand | 5.x | 轻量、简单、性能好 |
| Store划分 | 按类型分离 | - | UI/业务/缓存状态分离、职责清晰 |
| 路由 | React Router | 7.x | 成熟稳定、社区最大 |
| 组件模式 | 容器/展示分离 | - | 逻辑与UI分离、可测试 |
| 构建工具 | Vite | 6.x | 快速、现代 |

### Infrastructure & Deployment

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 桌面框架 | Tauri | 2.0 | 轻量、安全、跨平台 |
| 后端语言 | Rust | 1.75+ | 高性能、内存安全 |
| 云服务部署 | 传统云服务器 | 阿里云/腾讯云 | 完全控制、成本可控 |
| CI/CD | GitHub Actions | - | 与GitHub集成、免费额度充足 |
| 日志监控 | ELK Stack | 8.x | 完全控制、功能全面 |
| 数据库 | PostgreSQL | 16.x | 开源、功能强大、社区活跃 |

### Decision Impact Analysis

**Implementation Sequence:**
1. 项目初始化 (Tauri + React + shadcn/ui)
2. 核心框架搭建（Agent Core - Rust）
3. 插件系统基础（Plugin Manager）
4. 权限系统（RBAC + 数据权限）
5. 第一个插件（人事管理 - P0）
6. 数据同步机制（Sync Engine）
7. 其他插件（按依赖顺序）

**Cross-Component Dependencies:**
```
人事管理插件 (基础层 P0)
    ↓
财务OCR、知识库RAG、仓库管理 (数据层 P1/P2)
    ↓
售后工单、标书制定、销售自动化 (业务层 P1/P2)
    ↓
数据看板 (展示层 P1)
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 15个领域需要统一模式以防止AI Agent实现冲突

### Naming Patterns

**Database Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 表名 | snake_case复数 | `users`, `orders`, `chat_sessions` |
| 列名 | snake_case | `user_id`, `created_at`, `is_active` |
| 主键 | `id` | `id` (自增或UUID) |
| 外键 | `{table}_id` | `user_id`, `order_id` |
| 索引 | `idx_{table}_{columns}` | `idx_users_email`, `idx_orders_user_id` |
| 布尔字段 | `is_{state}` | `is_active`, `is_deleted` |

**API Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 端点 | 复数名词 | `/users`, `/users/:id` |
| 子资源 | 嵌套路径 | `/users/:id/orders` |
| 动作 | HTTP动词表达 | GET /users, POST /users |
| 查询参数 | snake_case | `?page_size=10&sort_by=created_at` |
| 路径参数 | 冒号前缀 | `/users/:id` |

**Code Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 组件文件 | PascalCase.tsx | `UserCard.tsx`, `ChatPanel.tsx` |
| Hook文件 | use开头.ts | `useAuth.ts`, `useChat.ts` |
| 工具函数 | camelCase.ts | `formatDate.ts`, `apiClient.ts` |
| 类型文件 | PascalCase.types.ts | `User.types.ts` |
| 常量文件 | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| 变量 | camelCase | `userName`, `isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 接口/类型 | PascalCase | `User`, `ApiResponse<T>` |

### Structure Patterns

**Project Organization:**
```
src/
├── components/           # 可复用UI组件
│   ├── ui/              # shadcn/ui组件
│   └── common/          # 业务通用组件
├── features/            # 功能模块
│   ├── agent/           # Agent功能
│   ├── auth/            # 认证功能
│   └── plugin/          # 插件功能
├── hooks/               # 自定义Hooks
├── stores/              # Zustand状态
│   ├── uiStore.ts       # UI状态
│   ├── appStore.ts      # 应用状态
│   └── cacheStore.ts    # 缓存状态
├── lib/                 # 工具和服务
│   ├── api.ts           # API客户端
│   ├── utils.ts         # 工具函数
│   └── constants.ts     # 常量定义
├── types/               # 全局类型
└── styles/              # 全局样式

tests/
├── unit/                # 单元测试
│   ├── components/
│   └── hooks/
├── integration/         # 集成测试
└── e2e/                 # E2E测试
```

**File Structure Rules:**
- 测试文件放在 `tests/` 目录，镜像源码结构
- 每个功能模块可包含自己的 `components/`, `hooks/`, `types/`
- 共享工具统一放在 `lib/`

### Format Patterns

**API Response Format:**
```typescript
// 成功响应
{
  "code": 0,
  "data": { ... },
  "message": "success"
}

// 错误响应
{
  "code": 1001,
  "data": null,
  "message": "用户不存在"
}

// 分页响应
{
  "code": 0,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 10
  },
  "message": "success"
}
```

**Date/Time Format:**
```typescript
// ISO 8601 格式
"2024-01-15T10:30:00Z"           // UTC
"2024-01-15T18:30:00+08:00"      // 带时区

// 前端显示时使用 dayjs 格式化
dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
```

**JSON Field Naming:**
- API和数据库统一使用 `snake_case`
- 前端接收后保持原样，不进行转换
- TypeScript接口使用 `snake_case` 字段名

### Communication Patterns

**Event Naming Convention:**
```typescript
// 事件命名：{domain}.{action_past_tense}
"user.created"
"user.updated"
"user.deleted"
"message.sent"
"message.received"
"plugin.installed"
"plugin.activated"

// 事件载荷结构
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": 123,
    "username": "john"
  }
}
```

**State Update Pattern:**
```typescript
// Zustand Store 示例
interface AppState {
  user: User | null;
  isLoading: boolean;
  
  // 直接使用 set 更新
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

**Error Handling Pattern:**
```typescript
// 组件内局部错误处理
const MyComponent = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const handleSubmit = async () => {
    try {
      await submitForm();
    } catch (err) {
      setError(err as Error);
      // 显示错误提示
      toast.error((err as Error).message);
    }
  };
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return <Form onSubmit={handleSubmit} />;
};
```

### Process Patterns

**Loading State Pattern:**
```typescript
// 组件内局部loading状态
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getData();
      setData(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return <Content />;
};
```

**Form Validation Pattern:**
```typescript
// 提交时验证
const MyForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (values: FormValues) => {
    const errors: Record<string, string> = {};
    if (!values.username) errors.username = '用户名必填';
    if (!values.email) errors.email = '邮箱必填';
    return errors;
  };
  
  const handleSubmit = (values: FormValues) => {
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // 提交表单
    submitForm(values);
  };
  
  return <Form onSubmit={handleSubmit} errors={errors} />;
};
```

**Structured Logging Pattern:**
```typescript
// 日志格式
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "context": "AgentService",
  "message": "Tool execution started",
  "data": {
    "tool_name": "read_file",
    "session_id": "abc123"
  }
}

// 前端日志工具
const logger = {
  info: (context: string, message: string, data?: object) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context,
      message,
      data
    }));
  },
  error: (context: string, message: string, error?: Error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context,
      message,
      error: error?.message,
      stack: error?.stack
    }));
  }
};
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. 遵循所有命名规范，不得自创风格
2. 将测试文件放在 `tests/` 目录
3. 使用统一的API响应格式
4. 使用ISO 8601日期格式
5. 事件命名使用 `domain.action_past_tense` 格式
6. 使用结构化日志格式

**Pattern Enforcement:**
- 代码审查时检查命名规范
- ESLint规则强制文件命名
- TypeScript接口强制API响应格式
- PR模板包含模式检查清单

### Pattern Examples

**Good Examples:**
```typescript
// ✅ 正确的组件命名
export const UserCard: React.FC<UserCardProps> = ({ user }) => { ... }

// ✅ 正确的API响应
return { code: 0, data: user, message: "success" };

// ✅ 正确的事件命名
eventBus.emit("user.created", { user_id: 123 });
```

**Anti-Patterns:**
```typescript
// ❌ 错误的组件命名
export const userCard = ({ user }) => { ... }

// ❌ 错误的API响应
return { success: true, result: user };

// ❌ 错误的事件命名
eventBus.emit("createUser", { user_id: 123 });
```

## Additional Implementation Patterns

### UI Resources Patterns

**Icon Library:**
- 图标库：Lucide Icons（shadcn/ui默认）
- 使用方式：React组件方式
- 安装：`pnpm add lucide-react`

```typescript
// 图标使用示例
import { User, Settings, MessageSquare } from 'lucide-react';

export const MyComponent = () => {
  return (
    <div>
      <User className="w-4 h-4" />
      <Settings className="w-5 h-5 text-muted-foreground" />
      <MessageSquare className="w-6 h-6" />
    </div>
  );
};
```

**Icon Naming Convention:**
| 用途 | 图标 | 示例 |
|------|------|------|
| 用户相关 | User, Users, UserPlus | `<User />` |
| 操作相关 | Plus, Edit, Trash, Save | `<Plus />` |
| 状态相关 | Check, X, AlertCircle | `<Check />` |
| 导航相关 | Menu, ChevronLeft, ArrowRight | `<Menu />` |

### Dependency Management Patterns

**Frontend Dependency Versioning:**
```json
{
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "zustand": "5.0.0",
    "@tanstack/react-query": "5.50.0"
  },
  "devDependencies": {
    "typescript": "5.5.0",
    "vite": "6.0.0",
    "tailwindcss": "4.0.0"
  }
}
```

**Rust Dependency Versioning:**
```toml
[dependencies]
tauri = { version = "2.0.0", features = ["shell-open"] }
serde = { version = "1.0.200", features = ["derive"] }
serde_json = "1.0.120"
tokio = { version = "1.38.0", features = ["full"] }
sqlx = { version = "0.7.0", features = ["runtime-tokio", "sqlite"] }
```

**Dependabot Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    
  - package-ecosystem: "cargo"
    directory: "/src-tauri"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### Code Quality Patterns

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**ESLint Configuration:**
```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

**Conventional Commits:**
```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整（不影响逻辑）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关

示例：
feat(agent): 添加智谱AI适配器
fix(plugin): 修复插件加载顺序问题
docs(readme): 更新安装说明
```

**Git Flow Branches:**
```
main           # 生产分支，始终稳定
  ↑
release/*      # 发布分支，准备发布
  ↑
develop        # 开发分支，集成最新功能
  ↑
feature/*      # 功能分支，开发新功能
hotfix/*       # 热修复分支，紧急修复
```

### Internationalization & Theme Patterns

**国际化策略：**
- MVP阶段：仅支持中文
- Post-MVP：预留i18n接口，后续扩展

```typescript
// 预留国际化接口
const i18n = {
  t: (key: string) => {
    // TODO: 实现多语言支持
    return key;
  }
};

// 当前使用方式
const text = i18n.t('登录');
```

**Theme Switching:**
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
}
```

```typescript
// 主题切换实现
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };
  
  return { theme, toggleTheme };
};
```

### Documentation & Comment Patterns

**代码注释规范：**
- 注释语言：中文
- 文档规范：无强制规范，按需添加
- 复杂逻辑必须添加注释说明

```typescript
// 用户认证状态管理
// 支持本地存储持久化和自动刷新
export const useAuth = () => {
  // 从本地存储恢复会话
  const restoreSession = async () => {
    // 实现逻辑...
  };
  
  return { restoreSession };
};
```

### Security & Privacy Patterns

**敏感数据处理：**
```typescript
// API Key 加密存储
import { invoke } from '@tauri-apps/api/core';

// 保存API Key（加密）
const saveApiKey = async (provider: string, key: string) => {
  await invoke('save_encrypted_data', {
    key: `api_key_${provider}`,
    value: key
  });
};

// 读取API Key（解密）
const getApiKey = async (provider: string): Promise<string> => {
  return await invoke('get_decrypted_data', {
    key: `api_key_${provider}`
  });
};
```

**日志脱敏规则：**
- 敏感字段手动处理
- 禁止记录：password, api_key, token, secret
- 必须脱敏：email、phone（部分隐藏）

```typescript
// 日志脱敏示例
const sanitizeLog = (data: object) => {
  const sensitiveFields = ['password', 'api_key', 'token', 'secret'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  // 手机号部分隐藏
  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return sanitized;
};
```

### Performance & Monitoring Patterns

**自研埋点方案：**
```typescript
// 性能埋点工具
const perfLogger = {
  // 记录操作耗时
  track: (operation: string, duration: number, metadata?: object) => {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      operation,
      duration_ms: duration,
      metadata
    };
    
    // 本地存储 + 可选云端上报
    console.log(JSON.stringify(log));
    invoke('log_performance', { log });
  },
  
  // 计时器
  startTimer: (operation: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      perfLogger.track(operation, duration);
    };
  }
};

// 使用示例
const endTimer = perfLogger.startTimer('tool_execution');
await executeTool('read_file');
endTimer();
```

**错误上报机制：**
```typescript
// 错误上报服务
const errorReporter = {
  report: async (error: Error, context: object) => {
    const payload = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      system: {
        platform: navigator.platform,
        userAgent: navigator.userAgent
      }
    };
    
    // 上报到云端
    await fetch('/api/errors/report', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// 全局错误捕获
window.addEventListener('error', (event) => {
  errorReporter.report(event.error, { type: 'global' });
});

window.addEventListener('unhandledrejection', (event) => {
  errorReporter.report(event.reason, { type: 'unhandled_promise' });
});
```

### Complete Patterns Summary Table

| 类别 | 模式项 | 选择 |
|------|--------|------|
| **命名模式** | 数据库命名 | snake_case |
| | API端点命名 | 复数名词 (RESTful) |
| | 文件命名 | PascalCase (.tsx/.ts) |
| | 变量命名 | camelCase |
| | 常量命名 | UPPER_SNAKE_CASE |
| **结构模式** | 测试文件位置 | 独立 tests/ 目录 |
| | 组件组织 | 按类型分 |
| | 共享工具 | 单一 lib/ 目录 |
| **格式模式** | API响应格式 | 统一包装 { code, data, message } |
| | 日期时间格式 | ISO 8601 字符串 |
| | JSON字段命名 | snake_case |
| **通信模式** | 事件命名 | 点分隔+过去式 (user.created) |
| | 状态更新 | Zustand内置方式 |
| | 错误处理 | 局部错误处理 |
| **流程模式** | 加载状态 | 局部加载状态 |
| | 表单验证 | 提交时验证 |
| | 日志规范 | 结构化日志 (JSON) |
| **UI资源** | 图标库 | Lucide Icons |
| | 图标使用 | 组件方式 |
| **依赖管理** | 前端版本 | 固定版本 |
| | Rust版本 | 固定版本 |
| | 更新策略 | Dependabot |
| **代码质量** | 格式化工具 | Prettier |
| | Git提交规范 | Conventional Commits |
| | 分支策略 | Git Flow |
| **国际化主题** | 国际化 | 暂不实现(MVP仅中文) |
| | 主题切换 | CSS变量 |
| **文档注释** | 注释语言 | 中文 |
| | 文档规范 | 无强制规范 |
| **安全隐私** | 敏感数据 | 本地加密存储 |
| | 日志脱敏 | 手动脱敏 |
| **性能监控** | 性能监控 | 自研埋点 |
| | 错误上报 | 云端上报 |

## Project Structure

### 完整项目目录结构

```
ai-automated-office/
├── 📁 配置文件
│   ├── package.json                    # 前端依赖配置
│   ├── pnpm-lock.yaml                  # pnpm锁定文件
│   ├── tsconfig.json                   # TypeScript配置
│   ├── tsconfig.node.json              # Node环境TS配置
│   ├── vite.config.ts                  # Vite构建配置
│   ├── tailwind.config.js              # Tailwind配置
│   ├── postcss.config.js               # PostCSS配置
│   ├── .env.example                    # 环境变量示例
│   ├── .gitignore                      # Git忽略配置
│   ├── .eslintrc.cjs                   # ESLint配置
│   ├── .prettierrc                     # Prettier配置
│   ├── components.json                 # shadcn/ui配置
│   └── README.md                       # 项目说明
│
├── 📁 GitHub配置
│   └── .github/
│       ├── workflows/
│       │   ├── ci.yml                  # CI工作流
│       │   ├── release.yml             # 发布工作流
│       │   └── test.yml                # 测试工作流
│       ├── ISSUE_TEMPLATE/
│       │   ├── bug_report.md
│       │   └── feature_request.md
│       └── dependabot.yml              # Dependabot配置
│
├── 📁 前端源码 (src/)
│   ├── main.tsx                        # 应用入口
│   ├── App.tsx                         # 根组件
│   ├── vite-env.d.ts                   # Vite类型声明
│   │
│   ├── components/                     # UI组件
│   │   ├── ui/                         # shadcn/ui基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── common/                     # 业务通用组件
│   │   │   ├── AppLayout.tsx           # 应用布局
│   │   │   ├── Sidebar.tsx             # 侧边栏
│   │   │   ├── Header.tsx              # 头部导航
│   │   │   ├── LoadingSpinner.tsx      # 加载动画
│   │   │   ├── ErrorBoundary.tsx       # 错误边界
│   │   │   └── EmptyState.tsx          # 空状态
│   │   └── plugin/                     # 插件相关组件
│   │       ├── PluginCard.tsx          # 插件卡片
│   │       ├── PluginPanel.tsx         # 插件面板
│   │       └── PluginSettings.tsx      # 插件设置
│   │
│   ├── features/                       # 功能模块
│   │   ├── agent/                      # Agent核心功能
│   │   │   ├── components/
│   │   │   │   ├── ChatPanel.tsx       # 对话面板
│   │   │   │   ├── MessageList.tsx     # 消息列表
│   │   │   │   ├── MessageInput.tsx    # 消息输入
│   │   │   │   └── ToolCallDisplay.tsx # 工具调用展示
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts          # 对话Hook
│   │   │   │   └── useAgent.ts         # Agent Hook
│   │   │   └── types/
│   │   │       └── agent.types.ts      # Agent类型
│   │   │
│   │   ├── auth/                       # 认证功能
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx       # 登录表单
│   │   │   │   └── UserInfo.tsx        # 用户信息
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts          # 认证Hook
│   │   │   └── types/
│   │   │       └── auth.types.ts       # 认证类型
│   │   │
│   │   ├── plugin/                     # 插件系统
│   │   │   ├── components/
│   │   │   │   ├── PluginManager.tsx   # 插件管理器
│   │   │   │   └── PluginMarket.tsx    # 插件市场
│   │   │   ├── hooks/
│   │   │   │   └── usePlugin.ts        # 插件Hook
│   │   │   └── types/
│   │   │       └── plugin.types.ts     # 插件类型
│   │   │
│   │   └── settings/                   # 设置功能
│   │       ├── components/
│   │       │   ├── SettingsPanel.tsx   # 设置面板
│   │       │   ├── ModelConfig.tsx     # 模型配置
│   │       │   └── ApiKeyManager.tsx   # API密钥管理
│   │       └── types/
│   │           └── settings.types.ts
│   │
│   ├── hooks/                          # 全局Hooks
│   │   ├── useTauri.ts                 # Tauri IPC封装
│   │   ├── useEventBus.ts              # 事件总线Hook
│   │   └── useLocalStorage.ts          # 本地存储Hook
│   │
│   ├── stores/                         # Zustand状态
│   │   ├── uiStore.ts                  # UI状态(主题、面板)
│   │   ├── appStore.ts                 # 应用状态(用户、会话)
│   │   ├── cacheStore.ts               # 缓存状态(临时数据)
│   │   └── pluginStore.ts              # 插件状态
│   │
│   ├── lib/                            # 工具和服务
│   │   ├── api.ts                      # 云端API客户端
│   │   ├── tauri.ts                    # Tauri命令封装
│   │   ├── utils.ts                    # 工具函数
│   │   ├── constants.ts                # 常量定义
│   │   ├── logger.ts                   # 日志工具
│   │   └── validators.ts               # 验证工具
│   │
│   ├── types/                          # 全局类型
│   │   ├── global.d.ts                 # 全局类型声明
│   │   ├── api.types.ts                # API响应类型
│   │   └── models.types.ts             # 数据模型类型
│   │
│   └── styles/                         # 全局样式
│       ├── globals.css                 # 全局CSS
│       └── themes/                     # 主题文件
│           ├── light.css
│           └── dark.css
│
├── 📁 Tauri/Rust后端 (src-tauri/)
│   ├── Cargo.toml                      # Rust依赖配置
│   ├── Cargo.lock                      # Rust锁定文件
│   ├── tauri.conf.json                 # Tauri配置
│   ├── build.rs                        # 构建脚本
│   │
│   └── src/
│       ├── main.rs                     # Rust入口
│       ├── lib.rs                      # 库入口
│       │
│       ├── agent/                      # Agent核心
│       │   ├── mod.rs
│       │   ├── llm/                    # LLM适配器
│       │   │   ├── mod.rs
│       │   │   ├── provider.rs         # Provider trait
│       │   │   ├── openai.rs           # OpenAI适配器
│       │   │   ├── zhipu.rs            # 智谱适配器
│       │   │   ├── dashscope.rs        # 百炼适配器
│       │   │   └── deepseek.rs         # DeepSeek适配器
│       │   │
│       │   ├── tools/                  # 工具系统
│       │   │   ├── mod.rs
│       │   │   ├── registry.rs         # 工具注册表
│       │   │   ├── executor.rs         # 工具执行器
│       │   │   ├── core/               # 核心工具
│       │   │   │   ├── mod.rs
│       │   │   │   ├── fs.rs           # 文件系统工具
│       │   │   │   ├── shell.rs        # Shell工具
│       │   │   │   └── http.rs         # HTTP工具
│       │   │   └── mcp/                # MCP工具
│       │   │       ├── mod.rs
│       │   │       ├── client.rs       # MCP客户端
│       │   │       └── handler.rs      # MCP处理器
│       │   │
│       │   ├── memory/                 # 记忆管理
│       │   │   ├── mod.rs
│       │   │   ├── store.rs            # 记忆存储
│       │   │   ├── compressor.rs       # 上下文压缩
│       │   │   └── embeddings.rs       # 向量嵌入
│       │   │
│       │   └── session/                # 会话管理
│       │       ├── mod.rs
│       │       ├── manager.rs          # 会话管理器
│       │       └── history.rs          # 历史记录
│       │
│       ├── plugins/                    # 插件系统
│       │   ├── mod.rs
│       │   ├── manager.rs              # 插件管理器
│       │   ├── registry.rs             # 插件注册表
│       │   ├── loader.rs               # 插件加载器
│       │   └── dependency.rs           # 依赖管理
│       │
│       ├── sync/                       # 数据同步
│       │   ├── mod.rs
│       │   ├── engine.rs               # 同步引擎
│       │   ├── conflict.rs             # 冲突解决
│       │   └── delta.rs                # 增量同步
│       │
│       ├── storage/                    # 本地存储
│       │   ├── mod.rs
│       │   ├── sqlite.rs               # SQLite操作
│       │   └── encryption.rs           # 加密存储
│       │
│       ├── auth/                       # 认证授权
│       │   ├── mod.rs
│       │   ├── user.rs                 # 用户管理
│       │   ├── permission.rs           # 权限管理
│       │   └── tenant.rs               # 租户管理
│       │
│       ├── commands/                   # Tauri命令
│       │   ├── mod.rs
│       │   ├── agent.rs                # Agent命令
│       │   ├── plugin.rs               # 插件命令
│       │   ├── storage.rs              # 存储命令
│       │   └── system.rs               # 系统命令
│       │
│       └── utils/                      # 工具函数
│           ├── mod.rs
│           ├── logger.rs               # 日志工具
│           └── error.rs                # 错误处理
│
├── 📁 业务插件 (plugins/)
│   ├── hr/                             # 人事管理插件 (P0)
│   │   ├── package.json
│   │   ├── index.ts                    # 插件入口
│   │   ├── manifest.json               # 插件清单
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── backend/
│   │
│   ├── finance/                        # 财务OCR插件 (P1)
│   ├── knowledge/                      # 知识库RAG插件 (P1)
│   ├── warehouse/                      # 仓库管理插件 (P2)
│   ├── sales/                          # 销售自动化插件 (P1)
│   ├── service/                        # 售后工单插件 (P1)
│   ├── tender/                         # 标书制定插件 (P2)
│   └── dashboard/                      # 数据看板插件 (P1)
│
├── 📁 测试 (tests/)
│   ├── unit/                           # 单元测试
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── integration/                    # 集成测试
│   │   ├── agent/
│   │   ├── plugins/
│   │   └── sync/
│   └── e2e/                            # E2E测试
│       ├── auth.spec.ts
│       ├── chat.spec.ts
│       └── plugin.spec.ts
│
├── 📁 云端后端 (cloud-server/)
│   ├── go.mod                          # Go模块配置
│   ├── go.sum                          # Go依赖锁定
│   ├── main.go                         # Go入口
│   ├── config/                         # 配置
│   │   └── config.yaml
│   ├── api/                            # API路由
│   │   ├── auth.go
│   │   ├── tenant.go
│   │   └── sync.go
│   ├── models/                         # 数据模型
│   ├── services/                       # 业务服务
│   ├── middleware/                     # 中间件
│   └── docker-compose.yml
│
├── 📁 配置与日志
│   ├── config/                         # 配置文件(TOML)
│   │   ├── app.toml                    # 应用配置
│   │   ├── database.toml               # 数据库配置
│   │   └── logging.toml                # 日志配置
│   └── logs/                           # 日志目录
│       ├── app.log                     # 应用日志
│       ├── error.log                   # 错误日志
│       └── performance.log             # 性能日志
│
└── 📁 静态资源 (assets/)
    ├── icons/                          # 应用图标
    │   ├── icon.ico                    # Windows图标
    │   ├── icon.icns                   # macOS图标
    │   └── icon.png                    # Linux图标
    └── images/                         # 图片资源
        └── splash.png                  # 启动画面
```

### 架构边界定义

**API边界：**

| 边界 | 协议 | 说明 |
|------|------|------|
| 前端 ↔ Rust后端 | Tauri IPC | 同步命令调用，类型安全 |
| 客户端 ↔ 云服务 | REST + WebSocket | HTTP API + 实时推送 |
| Rust ↔ 插件 | 函数调用 | 同进程，直接调用 |

**组件边界：**

```
┌─────────────────────────────────────────────────────────┐
│  前端组件层                                              │
│  ├── UI组件 (components/ui/)      # 无业务逻辑          │
│  ├── 容器组件 (components/common/) # 业务逻辑 + 状态     │
│  └── 插件组件 (components/plugin/) # 插件专属UI          │
├─────────────────────────────────────────────────────────┤
│  状态管理层                                             │
│  ├── uiStore         # UI状态(主题、面板)               │
│  ├── appStore        # 应用状态(用户、会话)             │
│  └── pluginStore     # 插件状态                         │
├─────────────────────────────────────────────────────────┤
│  Tauri IPC层                                            │
│  └── commands/       # Rust命令暴露                     │
├─────────────────────────────────────────────────────────┤
│  Rust后端层                                              │
│  ├── agent/          # Agent核心                        │
│  ├── plugins/        # 插件系统                         │
│  └── storage/        # 本地存储                         │
└─────────────────────────────────────────────────────────┘
```

**数据边界：**

| 数据类型 | 存储位置 | 同步策略 |
|---------|---------|---------|
| 用户认证 | 云端PostgreSQL | 实时同步 |
| Agent会话 | 本地SQLite | 按需同步 |
| 插件数据 | 本地SQLite(分库) | 插件各自同步 |
| 配置数据 | 本地TOML文件 | 可选同步 |
| 日志数据 | 本地logs/目录 | 不同步 |

## Critical Gap Solutions

### 云端后端技术栈

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 后端语言 | Go | 1.22+ | 高性能、部署简单、内存占用低 |
| Web框架 | Gin | 1.10+ | 轻量、高性能、生态丰富 |
| 数据库驱动 | pgx | 5.x | PostgreSQL原生驱动、性能好 |

**Go后端项目结构：**
```
cloud-server/
├── main.go                 # 入口
├── config/                 # 配置管理
├── api/                    # API路由
│   ├── auth.go            # 认证API
│   ├── tenant.go          # 租户API
│   ├── sync.go            # 同步API
│   └── websocket.go       # WebSocket处理
├── models/                 # 数据模型
├── services/               # 业务逻辑
├── middleware/             # 中间件
│   ├── auth.go            # 认证中间件
│   ├── cors.go            # CORS中间件
│   └── ratelimit.go       # 限流中间件
└── docker-compose.yml      # Docker编排
```

### OCR能力方案

| 决策项 | 选择 | 说明 |
|--------|------|------|
| OCR引擎 | PaddleOCR | 离线可用、无费用 |
| 部署方式 | Python微服务 | 独立进程、按需启动 |
| 模型 | PP-OCRv4 | 中文识别准确率高 |

**PaddleOCR集成架构：**
```
┌─────────────────────────────────────────────────────────┐
│                    财务OCR插件                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              OCR Service (Python)                │    │
│  │  PaddleOCR + Flask API                          │    │
│  └─────────────────────────────────────────────────┘    │
│                        ↕ HTTP                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Rust OCR Client                     │    │
│  │  HTTP调用 + 结果解析                             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 向量数据库方案

| 方案 | 触发条件 | 说明 |
|------|---------|------|
| SQLite + sqlite-vec | 默认 | 轻量、无需额外服务 |
| 本地Chroma | 用户选择 | 专为RAG设计、功能丰富 |
| Qdrant本地版 | 用户选择 | 高性能、功能全面 |
| 云端向量库 | 用户选择 | 无需本地维护 |

**向量数据库配置界面：**
```typescript
// 向量数据库配置类型
interface VectorDbConfig {
  type: 'sqlite-vec' | 'chroma' | 'qdrant' | 'cloud';
  endpoint?: string;      // 云端地址
  apiKey?: string;        // 云端API Key
  collection?: string;    // 集合名称
}
```

### 文件存储方案

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 本地存储 | 应用数据目录 | `{app_data}/files/` |
| 云端备份 | 阿里云OSS/腾讯云COS | 用户配置选择 |
| 同步策略 | 本地优先 + 后台上传 | 不阻塞用户操作 |

**文件存储架构：**
```
┌─────────────────────────────────────────────────────────┐
│                    文件存储服务                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              本地存储层                           │    │
│  │  {app_data}/files/{tenant_id}/{plugin_id}/      │    │
│  └─────────────────────────────────────────────────┘    │
│                        ↕ 后台同步                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              云端存储层                           │    │
│  │  OSS Bucket: {tenant_id}/{plugin_id}/           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 配置与日志

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 配置文件格式 | TOML | Rust生态常用、可读性好 |
| 配置存储位置 | `config/` 目录 | 应用安装目录下 |
| 日志存储位置 | `logs/` 目录 | 应用安装目录下 |
| 日志格式 | JSON结构化 | 便于分析和查询 |

**配置文件示例：**
```toml
# config/app.toml
[app]
name = "ai-automated-office"
version = "0.1.0"

[database]
type = "sqlite"
path = "./data/app.db"

[logging]
level = "info"
path = "./logs/"
max_size_mb = 100
max_files = 10

[cloud]
api_endpoint = "https://api.example.com"
ws_endpoint = "wss://ws.example.com"
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
所有技术选型决策均兼容一致：
- Tauri 2.0 + React 19 + TypeScript 5.x 前端栈完整兼容
- Rust 后端与 Tauri 原生集成
- Go 云端后端与 RESTful API 设计匹配
- SQLite 本地 + PostgreSQL 云端 数据库架构一致

**Pattern Consistency:**
实现模式与架构决策完全对齐：
- 命名规范 (snake_case) 与 PostgreSQL/SQLite 兼容
- 目录结构支持分层微内核架构
- 事件命名规范与事件总线通信模式一致
- API响应格式与RESTful设计匹配

**Structure Alignment:**
项目结构充分支持架构决策：
- 前端目录结构支持 Agent Core Layer 组件化
- Rust目录结构支持微内核架构分层
- 插件目录结构支持同进程模块化运行
- 测试目录结构支持多层级测试策略

### Requirements Coverage Validation ✅

**功能需求覆盖:**

| FR类别 | 架构支持 | 状态 |
|--------|---------|------|
| 桌面端UI | Tauri + React + shadcn/ui | ✅ |
| AI Agent核心 | Agent Core Layer (Rust) | ✅ |
| 插件系统 | Plugin Layer + Manager | ✅ |
| 权限系统 | Auth模块 + RBAC | ✅ |
| 多租户 | 数据库级隔离 | ✅ |
| 数据同步 | Sync Engine + WebSocket | ✅ |
| 8个业务插件 | Plugin目录结构 + 插件API | ✅ |

**非功能需求覆盖:**

| NFR | 架构支持 | 状态 |
|-----|---------|------|
| 本地操作<100ms | Tauri IPC + 本地SQLite | ✅ |
| 云端<3s | RESTful API + WebSocket | ✅ |
| 内存<500MB | Rust后端 + 轻量前端 | ⚠️ 实现验证 |
| TLS 1.3 | 传输加密 | ✅ |
| AES-256 | 存储加密 | ✅ |
| 多租户隔离 | 数据库级隔离 | ✅ |
| 可用性>99.5% | 部署策略 | ⚠️ 运维保障 |

**关键能力补充:**

| 能力 | 方案 | 状态 |
|------|------|------|
| OCR识别 | PaddleOCR本地服务 | ✅ 已确定 |
| 向量存储 | 4种方案可选 | ✅ 已确定 |
| 文件存储 | 本地 + 云端OSS | ✅ 已确定 |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- 核心技术栈版本：全部指定 ✅
- 数据库架构：PostgreSQL + SQLite ✅
- API设计：RESTful + WebSocket ✅
- 安全机制：认证、加密、权限 ✅
- 云端后端：Go + Gin ✅
- OCR方案：PaddleOCR ✅
- 向量数据库：4种可选 ✅
- 文件存储：本地 + OSS ✅

**Pattern Completeness:**
- 命名规范：全面覆盖 ✅
- 目录结构：完整定义 ✅
- 代码示例：各模式都有示例 ✅
- 反模式警告：提供错误示例 ✅

**Structure Completeness:**
- 项目结构：完整定义 ✅
- 组件边界：清晰划分 ✅
- API边界：明确指定 ✅
- 数据边界：完整定义 ✅

### Gap Analysis Results

**已解决的关键差距:**

| # | 原差距 | 解决方案 |
|---|--------|---------|
| 1 | 云端后端技术栈未明确 | Go (Gin框架) |
| 2 | OCR能力方案未定义 | PaddleOCR本地服务 |
| 3 | 向量数据库方案未定义 | 4种方案可选，前端配置 |
| 4 | 文件存储方案未明确 | 本地 + 云端OSS |
| 5 | 日志存储位置未定义 | 应用安装目录 `./logs/` |
| 6 | 配置文件格式未确定 | TOML格式 |
| 7 | 项目结构未保存 | 已添加完整结构 |

**无明显遗留差距**

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 项目上下文全面分析
- [x] 规模和复杂度评估
- [x] 技术约束识别
- [x] 跨切面关注点映射

**✅ Architectural Decisions**
- [x] 关键决策已文档化并指定版本
- [x] 技术栈完全指定
- [x] 集成模式已定义
- [x] 性能考量已处理

**✅ Implementation Patterns**
- [x] 命名规范已建立
- [x] 结构模式已定义
- [x] 通信模式已指定
- [x] 流程模式已文档化

**✅ Project Structure**
- [x] 完整目录结构已定义
- [x] 组件边界已建立
- [x] 集成点已映射
- [x] 需求到结构映射完成

**✅ Gap Solutions**
- [x] 云端后端技术栈已确定
- [x] OCR能力方案已定义
- [x] 向量数据库方案已定义
- [x] 文件存储方案已定义
- [x] 配置与日志方案已定义

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
1. 完整的技术栈定义，前后端云端全覆盖
2. 详细的实现模式，减少AI Agent实现冲突
3. 灵活的配置选项，支持多种向量数据库
4. 清晰的项目结构，便于团队协作

**Areas for Future Enhancement:**
1. 容器化部署方案（Post-MVP）
2. 第三方OAuth集成（可选扩展）
3. 性能监控仪表板（Post-MVP）
4. 多语言国际化支持（Post-MVP）

### Implementation Handoff

**AI Agent Guidelines:**
1. 严格遵循所有架构决策
2. 使用统一的实现模式
3. 遵守项目结构和边界
4. 参考本文档解决架构问题

**First Implementation Priority:**
```bash
# 项目初始化命令
npm create tauri-app@latest ai-automated-office
# 选择: TypeScript/JavaScript → pnpm → React → TypeScript

cd ai-automated-office
pnpm add zustand @tanstack/react-query lucide-react
npx shadcn@latest init
pnpm tauri add sqlite
```
