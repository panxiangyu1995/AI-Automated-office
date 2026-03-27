# Agent 能力策略总表（2026-03-27）

**文档目的：** 统一收敛平台能力分流、Agent 平台 backlog、Skill 分层与内置清单，作为后续 OpenSpec、task 拆分与产品设计的单一参照。  
**适用范围：** 本文档为规划与实施参照，不替代铁律文档；若与 [prd.md](./prd.md)、[architecture.md](./architecture.md)、[epics.md](./epics.md) 冲突，以铁律文档为准。  
**覆盖主题：**
- 平台能力分流：`原生实现 / 外部复用 / 内部自建 skill`
- 平台实施优先级：`MVP先做 / Post-MVP再接 / 暂缓不做`
- 执行层级规划：`Tool -> Atomic Skill / Subskill -> Composite Skill / Long-task Skill -> Sub-Agent`
- 内置与可自建供给面：`平台级默认内置 / 部门能力包内置 / 用户可自建`

---

## 一、核心策略

### 1. 能力分流规则

#### 原生实现

以下能力必须由平台原生实现，不得下放给外部 skill、社区插件或临时脚本承担：

- 租户隔离、权限继承、审批、审计、沙箱、配额、风险控制
- Tool / Skill / MCP / Plugin / Template / Knowledge 的统一注册与配置治理
- Sub-Agent 编排、委派合同、链路追踪、回放、冻结快照
- 知识库、错题集、记忆、Trace、Capability Contract 等平台级持久化模型
- 对用户与管理员可见的控制台、治理页、状态页、调试页

#### 外部复用

以下能力优先复用外部生态或第三方平台，不优先自研：

- 通用 skill 市场与资源发现
- 通用 prompt 优化、eval、实验、效果对比类基础设施
- 通用 SOUL / 人设模板、公共 skill 模板
- 通用浏览器自动化、通用 workflow 模板等与企业业务模型弱绑定的资源

#### 内部自建 skill

以下能力优先做成平台内置 skill，而不是继续扩张原生平台表面积：

- 基于现有 Tools / MCP / 知识库的多步骤业务流程
- 需要 AI 总结、生成、整理、转换，但不改变平台治理边界的能力
- 某个部门或场景专用的流程自动化
- 可被多个 Agent / Sub-Agent 复用的“方法型能力”

### 2. 默认决策顺序

任何新需求默认按照以下顺序决策：

1. 是否已有可信的外部资源可复用
2. 若无，是否可以基于现有原生能力封装为内部 skill
3. 只有当能力涉及治理、隔离、审批、审计、持久化模型或运行时编排时，才升级为原生实现

### 3. 外部接入边界

- 公共市场资源只能作为“资源来源”，不能直接替代平台治理层
- 公共资源进入企业交付范围前，必须经过来源校验、白名单或私有镜像、静态分析、审批与审计
- 外部 skill 不得绕过平台的权限、审批、审计、数据边界和作用域覆盖规则

---

## 二、能力分流清单

| Epic / FR | 能力项 | 分流归类 | 推荐落法 | 说明 |
|---|---|---|---|---|
| Epic 5 / FR69-FR80 | 工具调用可见性、失败重试、手动输入、状态监控、历史统计 | 原生实现 | Runtime UI + 审计链路 | 属于用户可控性基础设施 |
| Epic 5 / FR470-FR489 | 工具权限检查、敏感操作确认、审批、回滚、通知 | 原生实现 | Permission Gate + Approval Flow | 决定越权与高风险操作边界 |
| Epic 6 / FR14-3, FR81-FR89, FR313-FR329 | 纠偏反馈学习、错题集、规则治理、规则注入、学习统计 | 原生实现 | 错题集与规则治理子系统 | 可参考外部方法，但核心能力必须平台持有 |
| 审批中心 / FR121 | tools + skills 自动创建流程模板 | 内部自建 skill | `approval-template-generator` | 典型流程编排，不应继续扩张平台原生表面积 |
| Epic 9 / FR250-FR251, FR253-FR254, FR940-FR949, FR954-FR960 | 知识库管理、检索、ACL、绑定、审核、去重提示 | 原生实现 | Knowledge Base + ACL + Audit | 企业知识治理必须原生 |
| Epic 9 / FR252, FR950-FR953 | 工单转知识、AI 整理知识并提交审核 | 内部自建 skill | `knowledge-curation` / `ticket-to-knowledge` | 依赖原生知识库写回与审批边界 |
| Epic 10 / FR700-FR704, FR706-FR710 | SKILL.md 解析、导入、本地/私有安装、版本与审计 | 原生实现 | Compatibility Adapter + Skill Registry | 兼容能力本身是平台能力 |
| Epic 10 / FR705, FR730-FR732 | ClawHub 公共市场浏览、搜索、安装入口 | 外部复用 | 复用外部市场作为资源源头 | 不建议直接等同企业生产交付 |
| Epic 10 / FR721-FR728 | SOUL 模板生态 | 外部复用 | 以 import / 适配为主 | 模板内容优先复用，不必重建生态 |
| Epic 10 / FR733-FR755 | 私有市场、来源验证、签名、静态分析、安装审批、执行审计 | 原生实现 | 私有市场 + 安全治理层 | 企业安全与合规底座 |
| Epic 21 / FR800-FR820 | LLM 提供商与 MCP 服务配置、状态、日志、导入导出 | 原生实现 | Provider Registry + MCP Manager | 属于平台控制面 |
| Epic 21 / FR825-FR832 | MCP approve 策略 | 原生实现 | Tool Policy Engine | 必须平台统一管控 |
| Epic 21 / FR835-FR840 + 实施边界 | Skill 启停、参数、测试、访问权限、个人草稿与共享发布流 | 原生实现 | Skill Config Center + Skill Studio | 用户可自建个人声明式 skill，但共享发布与治理必须原生 |
| Epic 21 / FR850-FR863, FR865-FR875 | Prompt 管理、Rules、分层加载、安全护栏、知识写回 | 原生实现 | Prompt Store + Rule Engine | 受审计和版本治理约束 |
| Epic 21 / FR880-FR883, FR885-FR888 | Prompt 预览、调试、AB、日志、效果追踪 | 原生实现 | 调试与治理 UI | 用户操作面必须在产品内完成 |
| Epic 21 / FR884 | Prompt 优化建议 | 外部复用 | 复用外部评测/优化平台 | 建议可外部生成，应用仍需平台审阅 |
| Epic 21 / FR890-FR900, FR905-FR925, FR930-FR938 | Sub-Agent 管理、角色配置、权限、路由、链路追踪 | 原生实现 | Sub-Agent Registry + Delegation Contract | Agent Runtime 核心能力 |
| Epic 21 / FR913-FR914 | AI 辅助生成 Sub-Agent 角色提示词 | 内部自建 skill | `subagent-role-generator` | 生成器适合 skill 化 |
| Epic 24 / FR1020-FR1027 | 工具权限声明、风险等级、沙箱配额、执行限制、继承 | 原生实现 | Sandbox + Capability Contract + Policy Resolver | 平台安全底座 |
| Epic 58 / FR1551-FR1553, FR1555 | 能力契约、健康指标、治理看板、人工审阅边界 | 原生实现 | Capability Governance | 属于平台治理面 |
| Epic 58 / FR1554 | 基于失败链路与 Trace 的改进建议引擎 | 外部复用 + 原生承接 | 外部评测/观测 + 平台建议包生成 | 可复用外部分析，但建议包、审批与落地必须原生 |

---

## 三、执行层级模型

### 1. 四层模型

| 层级 | 核心作用 | 典型粒度 | MVP 建议数量 | 平台级默认内置 | 部门能力包内置 | 用户可自建 |
|---|---|---|---|---|---|---|
| Tool | 单一动作原语 | 1 个动作，最小副作用 | 12-15 | 是 | 是，但统一注册 | 否 |
| Atomic Skill / Subskill | 可复用方法块 | 1 个明确输入，1 个明确输出，2-5 步 | 10-12 | 是 | 是 | 是 |
| Composite Skill / Long-task Skill | 边界清晰的任务包 | 1 个业务目标，编排多个 Atomic Skill | 6-8 | 是 | 是 | 是 |
| Sub-Agent | 独立角色执行体 | 独立角色 + 模型 + 知识 + 权限 + 委派 | 3-5 模板 | 是 | 是 | 是，但受治理约束 |

### 2. 分层规则

1. `Tool` 只做最小能力原语，不承载复杂业务流程。
2. `Atomic Skill` 是默认的办公能力主力层，负责高复用方法块。
3. `Composite Skill` 只负责边界清晰的任务包，不演变为“伪 Agent”。
4. `Sub-Agent` 只用于需要独立角色、模型、知识范围、权限边界或委派契约的能力。
5. 用户默认只能自建 `声明式 / 组合型 skill`，不能绕过平台扩展治理。

### 3. 升级规则

- `Composite Skill` 调用 `Atomic Skill` 或 `Tool` 时，只能继承或收缩调用者权限，不得放大数据范围、审批权限或知识范围。
- 当一个 `Composite Skill` 需要独立角色提示词、独立模型、独立知识范围、独立记忆隔离、独立审批策略或开放式多分支委派时，必须升级为 `Sub-Agent`，而不是继续堆叠 skill 调用。
- Planner 与 Runtime 必须能区分 `tool_call`、`atomic_skill_call`、`composite_skill_call`、`subagent_call` 四类节点，并纳入统一 Trace。

---

## 四、平台级默认内置

### 1. Tool

平台默认只提供稳定、确定性强、跨部门复用的能力原语：

- `file_read`
- `file_import`
- `doc_parse`
- `table_extract`
- `knowledge_query`
- `template_query`
- `field_writeback`
- `document_writeback`
- `approval_submit`
- `approval_status_query`
- `message_send`
- `trace_record`
- `audit_record`
- `search_history`

### 2. Atomic Skill / Subskill

平台级默认内置的 Atomic Skill 应覆盖所有部门都会高频遇到的办公方法能力：

> 平台首批正式内置办公技能包共 `21` 个，其中 `13` 个为 Atomic Skill，`8` 个为 Composite Skill。对外可统一展示为“内置办公技能包”，不强制用户理解内部层级。

| 名称 | 主要用途 |
|---|---|
| `file-intake` | 导入本地文件、附件、资料并归类到工作区或知识空间 |
| `document-draft` | 起草合同、方案、审批说明、制度文本、汇报材料 |
| `document-rewrite` | 改写、压缩、扩写、统一语气、摘要 |
| `template-fill` | 将已有模板与结构化数据自动合成文档草稿 |
| `structured-extraction` | 从 PDF/OCR/表单/邮件中提取结构化字段 |
| `sheet-cleanup` | 清洗表格、对齐字段、去重、规范格式 |
| `sheet-analysis` | 汇总、异常识别、趋势说明、生成分析结论 |
| `slides-outline-generate` | 从文档、表格或纪要生成 PPT 大纲与页结构 |
| `meeting-minutes` | 提取纪要、行动项、责任人和截止时间 |
| `approval-package-draft` | 整理申请说明、附件摘要、风险点和审批建议 |
| `knowledge-curation` | 把结果沉淀成知识草稿并提交审核 |
| `cross-department-summary` | 生成跨部门交接摘要、进展摘要、影响说明 |
| `skill-creator-assistant` | 帮用户创建个人草稿 skill、生成测试样例与发布申请草稿 |

### 3. Composite Skill / Long-task Skill

平台级默认内置的 Composite Skill 只做跨部门通用任务包：

| 名称 | 编排目标 |
|---|---|
| `approval-request-pack` | 汇总资料、提炼理由、生成审批包并准备提交 |
| `approval-template-generator` | 基于既有流程与资料生成审批模板草案 |
| `knowledge-submission-pack` | 整理业务结果、生成知识草稿、准备审核提交流 |
| `ticket-to-knowledge` | 将工单、案例、处理记录转换为知识候选包 |
| `document-production-pack` | 基于模板、资料和结构抽取结果生成可审阅文档包 |
| `report-pack` | 汇总表格、分析结果与文档摘要，形成周报/月报包 |
| `ops-brief-pack` | 面向管理层生成经营概览、重点风险和跨部门摘要 |
| `self-improvement-review-pack` | 基于纠偏记录、失败链路、审批摩擦和 Trace 生成待审阅改进建议包 |

### 4. Sub-Agent 模板

平台级默认只预置少量通用模板：

| 模板 | 适用定位 |
|---|---|
| `通用助手` | 通用问答、资料读取、基础办公协助 |
| `审批助手` | 审批资料整理、流程说明、审批上下文解释 |
| `知识管理员` | 知识整理、审核建议、知识范围解释 |
| `经营分析助手` | 汇总报告、经营摘要、管理视图输出 |

---

## 五、部门能力包内置

### 1. Department Atomic Skills

部门能力包默认优先内置专业化 Atomic Skill，而不是直接做很多部门 Sub-Agent。

| 部门 | Atomic Skill 建议 |
|---|---|
| 审批中心 | `approval-material-normalize`, `approval-risk-summary` |
| 销售部 | `quote-structure-fill`, `customer-visit-summary`, `sales-followup-summary` |
| 财务部 | `invoice-field-extract`, `ledger-sheet-cleanup`, `expense-proof-summary` |
| 人事部 | `candidate-profile-extract`, `interview-summary`, `onboarding-checklist-fill` |
| 仓储部 | `inventory-diff-extract`, `shipment-note-summary`, `warehouse-alert-summary` |
| 管理层 | `kpi-brief-summary`, `cross-unit-risk-summary` |
| 售后服务 | `ticket-summary`, `issue-root-cause-note` |
| 招投标 | `bid-requirement-extract`, `qualification-material-summary`, `section-outline-fill` |
| 市场宣传 | `campaign-brief-summary`, `content-plan-draft` |

### 2. Department Composite Skills

每个部门先只做 1-3 个高频 Composite Skill，避免一开始把业务流程做成巨型 skill。

| 部门 | Composite Skill 建议 |
|---|---|
| 审批中心 | `approval-template-generator`, `approval-case-pack` |
| 销售部 | `quote-proposal-pack`, `customer-followup-pack` |
| 财务部 | `invoice-to-ledger-draft`, `monthly-finance-summary-pack` |
| 人事部 | `resume-screening-pack`, `onboarding-document-pack` |
| 仓储部 | `inventory-warning-report-pack`, `inbound-outbound-discrepancy-pack` |
| 管理层 | `weekly-ops-brief-pack`, `cross-department-risk-digest` |
| 售后服务 | `ticket-to-knowledge`, `service-case-summary-pack` |
| 招投标 | `bid-proposal-draft-pack`, `qualification-response-pack` |
| 市场宣传 | `campaign-review-pack`, `content-production-pack` |

### 3. Department Sub-Agent 模板

只有当部门能力需要独立角色与独立边界时，才做部门 Sub-Agent 模板：

| 部门 | Sub-Agent 模板建议 |
|---|---|
| 财务部 | `财务助手` |
| 销售部 | `销售助手` |
| 人事部 | `人事助手` |
| 招投标 | `招投标助手` |
| 售后服务 | `售后诊断助手` |
| 管理层 | `经营分析助手` |

---

## 六、用户可自建

### 1. 允许自建的层级

| 层级 | 是否允许自建 | 说明 |
|---|---|---|
| Tool | 否 | 用户不能直接新增 Tool，只能复用平台已注册 Tool |
| Atomic Skill | 是 | 默认允许，适合围绕现有 Tool 编排方法块 |
| Composite Skill | 是 | 默认允许，适合围绕明确业务目标编排任务包 |
| Sub-Agent | 是 | 可创建，但必须走现有 Sub-Agent 配置治理模型 |

### 2. 推荐边界

适合用户自建的 Atomic Skill：

- 某类固定会议纪要模板
- 某类固定表格清洗规则
- 某类常用合同/方案改写套路
- 某类固定审批说明生成规则

适合用户自建的 Composite Skill：

- 某个团队自己的周报包
- 某个岗位固定的客户跟进包
- 某类固定投标资料整理包
- 某类固定知识整理提交流

不适合用户直接自建的：

- 需要新增脚本或执行代码的能力
- 需要新增外部 API 凭证或连接器的能力
- 需要独立高权限访问范围的能力
- 需要跨租户、跨部门放大权限的能力

---

## 七、实施优先级

### 1. MVP先做

#### 原生平台能力

| 优先级 | Epic / FR | 能力项 | 交付目标 | 说明 |
|---|---|---|---|---|
| P0 | Epic 43 | Agent Session 与消息分片引擎 | 建立 `session -> message -> part` 统一数据模型，支持流式输出、中断、恢复、结果归档 | 后续 Planner、Trace、审批和写回的事件骨架 |
| P0 | Epic 44 | Agent Runtime 与 Planner | 建立任务状态机、结构化计划、Step 执行与失败重规划 | 没有这一层，skill 和工具调用无法标准化 |
| P0 | Epic 45 + FR1551 最小集 | 统一 Capability Runtime 与最小能力契约 | 统一 Tool / Atomic Skill / Composite Skill / MCP 描述、参数校验、执行入口、风险级别、审批策略 | Epic 58 的最小能力契约字段应前置吸收到 MVP Runtime |
| P0 | Epic 46 + FR470-FR489 + FR825-FR832 | Permission Gate 与 Human-in-the-loop | 建立风险分级、敏感操作确认、审批放行、回滚与拒绝链路 | Agent 能进入真实业务流的前提 |
| P0 | Epic 47 + Epic 9 最小集 | Context Assembler 与 Memory MVP | 注入用户/租户/部门/页面上下文，提供 Session 摘要与最小知识检索接入 | 先做 Session Memory + 企业知识检索，不做图记忆 |
| P0 | Epic 48 | Audit、Trace 与可观测性 MVP | 建立 Trace ID、工具调用审计、失败定位、基础指标与调试视图 | 后续建议包、优化、合规追踪都依赖这层 |
| P0 | Epic 49 | Agent 到动态 UI 的安全写回 | 支持表单、详情页、工作台卡片、编辑器内容的受控写回 | 没有写回，Agent 只能停留在聊天建议层 |
| P0 | FR800-FR820 | LLM 提供商与 MCP 服务配置 | 提供 Provider Registry、MCP Service Manager、配置测试、启停、日志 | 属于产品级控制面，不应滞后于 Runtime |
| P0 | FR835-FR840 + Epic 10 最小集 | Skill 管理基线 | 支持平台内置 skill、部门内置 skill、用户安装 skill 的状态、参数、权限、测试和审计 | MVP 先支持本地导入与私有安装，不开放公共市场直连 |
| P1 | FR835-FR840 + 实施边界 | Skill Studio 与个人草稿 skill 发布流 | 支持用户创建、测试、启用个人声明式 skill，并提交部门/租户共享审核 | 技能生态自增长入口，但必须受统一治理约束 |
| P0 | FR850-FR863, FR865-FR875 | Prompt 与 Rules 基线 | 支持分层加载、版本管理、安全护栏、知识写回审阅边界 | 纠偏和改进都必须落回这套治理面 |
| P0 | Epic 9 / FR250-FR254, FR940-FR960 | 知识库治理与 Agent 绑定 | 支持知识库创建、ACL、Agent/Sub-Agent 绑定、AI 写回审核、去重提示 | 企业知识能力，不下放给外部 skill |
| P1 | FR890-FR895, FR905-FR912, FR915-FR923, FR930-FR934 最小集 | Sub-Agent 最小可用版本 | 支持创建、启停、基础角色提示词、工具/知识库范围、权限继承、手动指定调用、链路追踪 | MVP 先做“可用且受控” |

#### 首批正式内置 skill 名单（21个）

| 类型 | 内置 skill | 主要定位 |
|---|---|---|
| Atomic | `file-intake` | 导入本地文件、附件、历史资料 |
| Atomic | `structured-extraction` | 从 PDF、OCR、邮件、附件提取字段和表格 |
| Atomic | `document-draft` | 起草合同、方案、审批说明、制度、汇报材料 |
| Atomic | `document-rewrite` | 改写、润色、压缩、扩写、统一语气 |
| Atomic | `template-fill` | 按企业模板自动填充文档 |
| Atomic | `sheet-cleanup` | 清洗表格、去重、列对齐、格式标准化 |
| Atomic | `sheet-analysis` | 汇总、异常识别、趋势分析、生成结论 |
| Atomic | `slides-outline-generate` | 生成 PPT 大纲和页结构 |
| Atomic | `meeting-minutes` | 会议纪要、行动项、责任人、截止时间提取 |
| Atomic | `cross-department-summary` | 跨部门交接、协同摘要、影响说明 |
| Atomic | `approval-package-draft` | 整理申请理由、附件摘要、风险点、审批建议 |
| Atomic | `knowledge-curation` | 把高质量结果沉淀成知识草稿 |
| Atomic | `skill-creator-assistant` | 帮用户创建个人 skill 并提交共享发布申请 |
| Composite | `document-production-pack` | 将资料读取、抽取、模板填充、文档生成串成完整文档包 |
| Composite | `report-pack` | 将表格清洗、分析、摘要串成周报/月报包 |
| Composite | `approval-request-pack` | 将审批资料准备和提交流串成完整审批任务包 |
| Composite | `approval-template-generator` | 生成审批模板草案 |
| Composite | `knowledge-submission-pack` | 整理并提交待审核知识包 |
| Composite | `ticket-to-knowledge` | 将工单、案例、处理记录转成知识条目包 |
| Composite | `ops-brief-pack` | 生成经营摘要和重点风险简报 |
| Composite | `self-improvement-review-pack` | 基于纠偏记录和 Trace 产出待审阅改进建议包 |

#### MVP 验收出口

1. 用户可配置 Provider、MCP、Prompt、Rules、Skill，并看到明确的生效来源。
2. Agent 可在权限门禁下调用 Tool / Skill / MCP，并能在单轮任务中组合多次不同的 skill 调用，且产生完整 Trace。
3. Agent 结果可被写回业务页面或编辑器，并经过审批或确认后生效。
4. 至少一个业务试点场景可完整跑通“读取资料 -> 生成候选 -> 审阅确认 -> 写回业务对象 -> 沉淀知识”闭环。
5. 用户可创建个人草稿 skill 并立即自用；共享给部门或企业前必须完成审核发布。

### 2. Post-MVP再接

| 优先级 | Epic / FR | 能力项 | 建议 |
|---|---|---|---|
| P2 | Epic 10 / FR705, FR730-FR732 | ClawHub 公共市场浏览、搜索、安装入口 | 在私有镜像、来源校验、审批链成熟后再开放 |
| P2 | Epic 10 / FR721-FR728 | SOUL 模板导入与复用 | 以 import / 适配为主，不重建一套 persona 生态 |
| P2 | FR884 | Prompt 优化建议接入外部平台 | 复用外部 eval / optimization 基础设施，结果以建议包形式回流 |
| P2 | FR1554 | 基于失败链路和 Trace 的改进建议引擎 | 复用外部观测/评测能力生成建议，但必须由平台原生治理面承接 |
| P2 | FR913-FR914 | AI 辅助生成 Sub-Agent 角色提示词 | 做成内置 skill `subagent-role-generator`，不是核心运行时能力 |
| P2 | FR896-FR900, FR924-FR925, FR935-FR938 | Sub-Agent 模板、审计增强、并发、嵌套与失败回退 | 在最小可用 Sub-Agent 稳定后再增强 |
| P2 | FR733-FR755 | 私有市场服务、更新同步、来源扫描与签名强化 | MVP 先做本地/私有导入，完整企业市场服务后置 |
| P2 | FR1552-FR1553, Story 58.6 | 能力健康度量、Fitness Board、治理看板 | 必须建立在完整 Trace、审批对象与能力契约之上 |
| P2 | FR14-7, FR300-FR304 | 图记忆层 | 在 Session Memory 和知识检索稳定后推进 |

#### Post-MVP 内置 skill 扩展

- `subagent-role-generator`
- `template-distillation`
- `meeting-decision-pack`
- `change-package-organizer`

### 3. 暂缓不做

- 直接向租户开放“公开市场直连安装”，尤其是在没有白名单、私有镜像、审批和审计前提下。
- 允许外部 skill 或建议引擎自动修改 Prompt、Skill、Policy、Template、Tool 配置。
- 把产品方向拉向高自治 swarm、AI 公司模拟器或研发型 AI 编程平台。
- 在 Trace、Permission Gate、Capability Contract 未成熟前，先做复杂的自动优化平台集成。
- 在隔离执行、资源配额和安全扫描未成熟前，优先支持不受控的公共 TypeScript 插件运行时。

---

## 八、产品呈现建议

### 普通用户默认看到什么

- 首屏主要展示 `Composite Skill`
- 常用办公型 `Atomic Skill` 作为快捷操作入口
- `Subskill` 不应全部暴露到首页，更适合作为被编排能力存在

### 高级用户在 Skill Studio 里看到什么

- Atomic Skill 创建入口
- Composite Skill 创建入口
- 测试与预览
- 发布申请
- 被哪些 Tool / Skill 依赖的引用关系

### Agent 管理中心展示什么

- Sub-Agent 模板
- 用户自建 Sub-Agent
- 角色提示词、模型、知识范围、权限与路由规则
- 调用链路与运行监控

---

## 九、一句话规则

- 平台级默认内置：优先做跨部门高复用能力
- 部门能力包内置：优先做专业化 Atomic Skill 和少量高频 Composite Skill
- 用户可自建：优先做个人/团队专用的 Atomic Skill 与 Composite Skill
- Sub-Agent：只留给真正需要独立角色和独立运行边界的能力
