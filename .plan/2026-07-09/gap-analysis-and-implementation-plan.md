# 差距分析与完善方案

**日期**: 2026-07-09
**阶段**: RESEARCH → INNOVATE → PLAN
**状态**: 计划待批准

---

## 一、目的与预期效果

### 目标

将 AI-Automated-office 项目的代码实现与 PRD 文档（286 条 FR）、架构文档（39 个 ADR）、Epic 文档（10 个 Epic / 128 个 Story）之间的差距系统性补齐，使代码实现与铁律文档规划完全一致。

### 预期效果

1. **CLI Skill 层面**: Agent 可通过 `ao-cli skill execute` 完成所有业务模块的 CRUD 和流程操作，覆盖 10+ 业务模块
2. **API 层面**: 补齐缺失的财务、售后、审批业务端点，FR 覆盖率从当前 ~70% 提升到 ~95%
3. **业务流程完整性**: 请款→审批→回款→对账→预测 的完整财务闭环，售后工单→报价→维修→签字 的完整售后闭环
4. **经营者层面**: 老板可通过信号灯/KPI/预警系统实时监控企业经营状况
5. **CLI 功能完整性**: 消息轮询实际可用，操作日志完整记录

---

## 二、问题点

### 2.1 CLI Skill 覆盖严重不足

| 现状 | 目标 | 差距 |
|------|------|------|
| 仅 4 个 data_export Skill | 10+ 模块 × 每模块 3-20 个 Skill | **~120 个 Skill 缺失** |

**影响**: Agent 无法通过 CLI 调用 HRM/CRM/IMS/Contract/Service/Finance/Workflow 等模块的业务功能，严重违背「CLI 唯一入口铁律」。

### 2.2 财务管理深度不足

PRD 定义 21 条 FR-FIN，当前只实现了 5 条基本 CRUD（payment/expense/invoice）。

**缺失的关键能力**:
- 请款申请与审批流（FR-FIN-005~008）
- 回款登记与自动金额更新（FR-FIN-009~011）
- 回款计划与到期提醒（FR-FIN-017~018）
- 往来款凭证（FR-FIN-019）
- 往来款对账（FR-FIN-020）
- 现金流预测（FR-FIN-021）
- 逾期未回款提醒（FR-FIN-015）

### 2.3 售后管理流程不完整

PRD 定义 12 条 FR-SVC，当前只有 ServiceOrder 基础 CRUD。

**缺失**: 维修工单、客户签字确认、报价附件上传、收费/免费工单区分

### 2.4 审批流缺少高级特性

PRD 定义 12 条 FR-WF，当前有基础定义/实例/审批模型。

**缺失**: 并行审批、条件路由、审批转交、拒绝后返回修改

### 2.5 经营者数据体系完全缺失

PRD 定义的 FR-OWNER-001~006 全部未实现：信号灯、预警订阅、KPI、归因分析、跨企业汇总。

### 2.6 其他缺失模块

- 客户成功与健康度（FR-CS-001~005）：全部缺失
- 安全增强（FR-SEC2-001~004）：MFA、数据脱敏、操作撤销、批量操作
- 运营商客制化服务（FR-OPSVC-001~011）：行业模板、Skill 矩阵
- CLI 消息轮询：pollMessages() 为 TODO 占位
- 操作日志集成：olog 包已就绪但未集成到 skill execute

---

## 三、研究结果

### 3.1 API 代码实际实现情况

通过 explore agent 全面扫描 `api/` 目录得出：

**已实现**:
- ~160+ API 端点，覆盖 10+ 业务模块
- 40 个 Model 文件，70+ 数据结构体
- 51 个 Service 文件，59 个 Repository 文件
- 完整中间件栈（19 个文件）：Auth、RBAC、Tenant、Audit、RateLimit、Quota、FeatureFlag、CLISourceOnly、EnterpriseOwnership
- 认证体系完整：OAuth 2.0 + JWT + Refresh Token + Device Code

**各模块端点统计**:

| 模块 | 端点数 | 覆盖度 |
|------|--------|--------|
| 组织架构 (ORG) | ~25 | 完整 |
| HRM | ~12 | 完整 |
| CRM | ~20 | 完整 |
| 进销存 (IMS) | ~30 | 完整 |
| 合同 (Contract) | ~15 | 完整 |
| 售后 (Service) | ~6 | 基础 CRUD |
| 财务 (Finance) | ~7 | 基础 CRUD |
| 工作流 (Workflow) | ~8 | 基础定义+审批 |
| 知识库 (KB) | ~9 | 基础 CRUD + 语义搜索 |
| 消息 (Message) | ~7 | 完整 |
| 文件 (File) | ~4 | 完整 |
| 权限管理 | ~6 | 完整 |
| Skill 管理 | ~3 | 基础 CRUD |
| 自定义字段 | ~4 | 完整 |
| AI 助手 | ~5 | 完整 |
| 导出 (Export) | ~4 | 完整 |
| 备份 (Backup) | ~8 | 完整 |
| 运营管理 (Operations) | ~19 | 部分 |
| 通知 (Notification) | ~2 | 短信+邮件 |

### 3.2 CLI 实际实现情况

- 6 个顶级命令：auth / init / skill / poll / service / log
- 16 个子命令
- 仅 4 个 Skill 定义（全部为 data_export 模块）
- poll.go 中 `pollMessages()` 为 TODO 占位实现
- olog 包（JSONL 日志）已完整实现但未集成到 skill execute
- API 客户端有完整的 Token 自动刷新机制

### 3.3 铁律文档覆盖范围

| 文档 | 规模 | 内容 |
|------|------|------|
| PRD | 1759 行 | 286 FR, 42 NFR, 32 模块 |
| Architecture | 8980 行 | 39 ADR, 完整 API 前缀定义, 40+ 数据表 |
| Epics | 3440 行 | 10 Epic, 128 Story, FR 覆盖映射 |

### 3.4 OpenSpec 变更目录现状

- 86 个活跃变更目录（epic-1 ~ epic-10）
- 1 个归档目录
- 每个变更目录包含 proposal.md + design.md + tasks.md + specs/
- **问题**: specs/ 下 spec.md 大多只有 21 行（模板骨架），具体规格未填充

### 3.5 数据库现状

- 所有业务表均在 public schema（未实现架构文档中 Schema 级隔离的 `ent_XXX` 模式）
- RLS 行级安全未实现
- 物化视图（汇总表）未实现
- `_operator` 表未找到

---

## 四、设计方案

### 4.1 总体策略

**自底向上**: 先补齐已有 API 端点的 Skill 定义（最快见效），再补齐缺失的 API 端点，最后补齐高级分析层。

**分层实现**: 每个模块严格遵循 `Model → Repository → Service → Handler → Router → Skill` 的分层顺序。

**参考模板**: 已实现的模块（CRM、IMS 基础 CRUD）是成熟的代码模板，新模块遵循相同的 handler/service/repository/model 结构和命名约定。

### 4.2 Phase 划分

```
Phase 1: CLI Skill 补齐 (6 个子变更)
  └── 为已有 API 端点定义 Skill，Agent 立即可用
  └── 产出: 85 个 Skill 定义，10 个 Go 文件

Phase 2: 财务管理增强 (5 个子变更)
  └── 请款申请 + 回款登记 + 回款计划 + 现金流预测 + 对账
  └── 产出: ~15 个新文件，~20 个新端点

Phase 3: 售后管理增强 (3 个子变更)
  └── 维修工单 + 客户签字 + 附件上传
  └── 产出: ~6 个新文件，~6 个新端点

Phase 4: 审批流增强 (1 个变更)
  └── 并行审批 + 条件路由 + 审批转交 + 退回修改
  └── 产出: 修改 4 个现有文件，~4 个新端点

Phase 5: CLI 功能完善 (2 个变更)
  └── 消息轮询实现 + 操作日志集成
  └── 产出: 修改 2 个文件

Phase 6: 经营者数据体系 (1 个变更)
  └── 信号灯 + KPI + 预警 + 跨企业汇总
  └── 产出: ~7 个新文件，~8 个新端点

Phase 7: 客户成功与健康度 (1 个变更)
  └── 活跃度评分 + 流失预警 + 健康度看板
  └── 产出: ~3 个新文件，~3 个新端点

Phase 8: 安全增强 (1 个变更)
  └── MFA + 操作撤销 + 数据脱敏
  └── 产出: ~5 个新文件，~6 个新端点
```

### 4.3 各 Phase 详细设计

#### Phase 1: CLI Skill 补齐

**设计原则**:
- 每个 Skill 映射到已存在的 API 端点
- Skill 参数结构与 API 请求 JSON Body 一致
- 使用 `SkillDefinition` 结构体，编译时注册（非动态加载），与现有 `data_export.go` 保持一致
- 按模块分文件: `crm.go`, `hrm.go`, `ims.go`, `contract.go`, `service.go`, `sales.go`, `finance.go`, `message.go`, `knowledge.go`, `workflow.go`, `org.go`

**Skill 命名规范**: `{module}_{entity}_{action}`
- module: crm, hrm, ims, contract, sales, service, finance, message, kb, workflow, org
- entity: customer, employee, material, contract, sales_order, service_order, payment, message, doc, workflow, department
- action: create, update, delete, get, list, search, submit_approval, approve, reject, transfer, receive, ship, execute, issue

**文件结构**:
```
cli/internal/skill/definitions/
├── init.go          (修改 - 注册所有新 Skill)
├── data_export.go   (现有)
├── crm.go           (新建 - 16 Skills)
├── hrm.go           (新建 - 8 Skills)
├── ims.go           (新建 - 20 Skills)
├── contract.go      (新建 - 8 Skills)
├── service.go       (新建 - 5 Skills)
├── sales.go         (新建 - 3 Skills)
├── finance.go       (新建 - 6 Skills)
├── message.go       (新建 - 6 Skills)
├── knowledge.go     (新建 - 4 Skills)
├── workflow.go      (新建 - 5 Skills)
└── org.go           (新建 - 4 Skills)
```

#### Phase 2: 财务管理增强 — 详细设计

##### 2.1 请款申请 (PaymentRequest)

**Model** — `api/internal/model/payment_request.go`:
```
PaymentRequest {
  ID, EnterpriseID, CustomerID, ContractID(*), SalesOrderID(*)
  Amount float64, Status string, Notes string
  ApprovedBy(*uuid.UUID), ApprovedAt(*time.Time)
  RejectReason string
  Attachments []FileMetadata (has-many)
  BaseModel
}
```

**Repository 接口** — `api/internal/repository/payment_request_repo.go`:
- Create(pr *PaymentRequest) error
- Update(pr *PaymentRequest) error
- Delete(id uuid.UUID) error
- GetByID(id uuid.UUID) (*PaymentRequest, error)
- List(enterpriseID uuid.UUID, page, pageSize int, status string) ([]PaymentRequest, int64, error)

**Service 方法** — `api/internal/service/payment_request_service.go`:
- Create(enterpriseID, req) (*PaymentRequest, error) — 验证 ContractID 或 SalesOrderID 至少一个非空
- Update(id, req) (*PaymentRequest, error) — 仅 draft 状态可编辑
- Delete(id) error — 仅 draft 状态可删除
- Get(id) (*PaymentRequest, error)
- List(enterpriseID, page, pageSize, status) ([]PaymentRequest, int64, error)
- SubmitForApproval(id uuid.UUID) error — 触发审批流，状态 → pending_approval
- Approve(id, approverID uuid.UUID) error — 状态 → approved
- Reject(id, approverID uuid.UUID, reason string) error — 状态 → rejected
- UploadAttachment(id, fileName, contentType string, size int64, data io.Reader) (*model.FileMetadata, error)

**Handler 端点**:
```
POST   /enterprises/:enterprise_id/payment-requests
GET    /enterprises/:enterprise_id/payment-requests
GET    /enterprises/:enterprise_id/payment-requests/:id
PUT    /enterprises/:enterprise_id/payment-requests/:id
DELETE /enterprises/:enterprise_id/payment-requests/:id
POST   /enterprises/:enterprise_id/payment-requests/:id/submit
POST   /enterprises/:enterprise_id/payment-requests/:id/approve
POST   /enterprises/:enterprise_id/payment-requests/:id/reject
POST   /enterprises/:enterprise_id/payment-requests/:id/attachments
```

##### 2.2 回款登记 (CollectionRecord)

**关键业务逻辑**:
- Create 时启动数据库事务
- 事务内: 创建 CollectionRecord + 更新关联 Contract 的 `paid_amount`（累加）
- 如果回款金额 == 应收未收余额（全额回款），标记应收款状态为 `paid`
- 如果回款金额 < 应收余额（部分回款），应收款状态保持 `partial`

**Model**: `collection_records` 表，关联 `receivable_id`（应收款记录）

##### 2.3 回款计划 (PaymentPlan)

**定时提醒调度设计**:
- 在 `api/cmd/server/main.go` 启动时初始化 Scheduler
- 使用 `time.Ticker` 每 1 小时执行一次检查
- 查询条件: `plan_date <= NOW() AND status = 'pending' AND reminder_sent = false`
- 对每个逾期计划创建 Message 通知
- 使用 Redis 分布式锁（SETNX）防止多实例重复执行

##### 2.4 现金流预测 — 纯计算 API

无新数据表，从已有数据计算:
- Inflow: 按 `payment_plans.plan_date` 按月分组汇总（status = pending）
- Outflow: 按采购订单预计付款日期按月分组汇总
- 支持 forecast 参数: 3/6/12 个月

##### 2.5 往来款对账 — 纯计算 API

无新数据表，按客户维度汇总:
- 期初余额: 开始日期之前的未回款金额
- 应收明细: 时间范围内新生成的应收记录
- 回款明细: 时间范围内登记的回款记录
- 期末余额: 期初 + 应收 - 回款

#### Phase 3: 售后管理增强 — 详细设计

##### 3.1 维修工单 (RepairOrder)

**状态关联**:
- ServiceOrder 状态变更为 `confirmed` 时可创建 RepairOrder
- 创建 RepairOrder 后 ServiceOrder 状态自动变更为 `repairing`
- RepairOrder 完成后 ServiceOrder 状态可流转到 `pending_sign`

##### 3.2 客户签字确认

**流程**: 维修完成 → 生成签字请求 → 客户上传签字图片 → ServiceOrder 状态 → `completed`

**实现**: 复用现有 FileService，文件类型标记为 `service_signature`

##### 3.3 工单附件

**端点**:
```
POST /service-orders/:id/attachments  → UploadAttachment (multipart/form-data)
GET  /service-orders/:id/attachments  → ListAttachments
```

复用现有 FileService，refType = "service_order", refID = serviceOrderID

#### Phase 4: 审批流增强 — 详细设计

##### 并行审批逻辑

```
当 WfDefinition.ApprovalMode == "parallel":
  1. 创建 WfInstance 时，将所有当前层级节点写入 ParallelNodes JSONB
  2. 每个节点的审批人独立审批（不阻塞其他节点）
  3. 当 ParallelNodes 中所有节点 status == "approved" → 进入下一层
  4. 任一个节点 status == "rejected" → 整个实例 rejected
```

##### 条件路由逻辑

```
当节点有 ConditionRule:
  1. 解析 JSON: {"field": "amount", "operator": ">", "value": 50000}
  2. 从 WfInstance 关联的业务单据获取 field 值
  3. 比较: 满足条件 → 走此节点，不满足 → 跳过此节点
```

##### 审批转交

```
POST /workflows/:id/transfer
Body: { "to_approver_id": "uuid" }
逻辑: 更新 WfInstance 中当前节点的审批人 ID
```

##### 退回修改

```
POST /workflows/:id/return
Body: { "reason": "材料不完整" }
逻辑: WfInstance 状态 → returned，记录退回原因
申请人通过 POST /workflows/:id/resubmit 重新提交
```

#### Phase 5: CLI 功能完善

##### 消息轮询实现

`pollMessages` 函数逻辑:
```go
1. 读取本地缓存消息 ID 列表
2. 调用 GET {server}/api/v1/enterprises/{eid}/messages/poll?timeout=60
3. 收到新消息列表 → 过滤掉已缓存的 ID
4. 新消息输出到 stdout (JSON Lines 格式)
5. 更新本地缓存 (~/.ai-office-cli/cache/messages.json)
6. 继续下一轮轮询
```

##### 操作日志集成

`skill execute` 函数修改:
```go
startTime := time.Now()
result, err := executeSkillCall(skill, action, params)
duration := time.Since(startTime)
olog.Record(olog.Entry{
    Timestamp: time.Now(),
    SkillName: skill.Name,
    Action:    action,
    Params:    params,
    Result:    result,
    Error:     errStr,
    DurationMs: duration.Milliseconds(),
})
```

#### Phase 6-8: 高级功能设计概要

| Phase | 模块 | 核心数据表 | 关键端点 |
|-------|------|-----------|---------|
| 6 | 经营者 | alert_rules | GET /owner/signals, GET /owner/kpi, POST /owner/alert-rules |
| 7 | 客户成功 | enterprise_health_scores | GET /operator/enterprises/:id/health, GET /operator/health-dashboard |
| 8 | 安全 | user.mfa_secret | POST /auth/mfa/setup, POST /auth/mfa/verify, POST /:resource/:id/restore |

---

## 五、备选方案

### 5.1 Skill 定义方式

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **方案 A**: Go 编译时注册（当前方案） | 类型安全，无运行时依赖 | 新增 Skill 需重新编译 | **采用** |
| 方案 B: YAML/JSON 配置文件动态加载 | 热更新，无需重编译 | 需解析器，调试困难 | 不采用 |
| 方案 C: 从 API 服务端动态下载 Skill 定义 | 运营可实时更新 | 增加网络依赖复杂度 | 暂不采用 (FR-CLI-002 的长期方案) |

### 5.2 定时任务调度方式

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **方案 A**: 内嵌 Go ticker + Redis 分布式锁 | 简单，无外部依赖 | 需自行处理锁逻辑 | **采用** |
| 方案 B: 引入 robfig/cron 库 | 功能丰富，Cron 表达式 | 增加依赖 | 备选 |
| 方案 C: 外部调度器 (Airflow/Temporal) | 专业调度 | 过度工程，MVP 不需要 | 不采用 |

### 5.3 支付集成方式

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **方案 A**: 定义支付网关抽象接口 | 解耦具体支付商 | 需自行实现对接逻辑 | **采用 (MVP)** |
| 方案 B: 直接对接支付宝/微信 SDK | 开箱即用 | 与具体支付商耦合 | P1 阶段 |
| 方案 C: 使用第三方支付聚合 (Ping++) | 一站式 | 依赖第三方服务 | 不采用 |

### 5.4 数据脱敏实现方式

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **方案 A**: 响应序列化层拦截 (Middleware) | 统一处理，无侵入 | 性能略有损失 | **采用** |
| 方案 B: 数据库视图层脱敏 | 数据库级别安全 | PostgreSQL 视图复杂度 | 备选 |
| 方案 C: Service 层手动脱敏 | 精确控制 | 代码重复，容易遗漏 | 不采用 |

---

## 六、实施清单

按顺序执行，共 70 步：

### Phase 1: CLI Skill 补齐

```
□ 1.  创建 cli/internal/skill/definitions/crm.go — 16 个 CRM Skill
□ 2.  修改 cli/internal/skill/definitions/init.go — Register(crm Skills)
□ 3.  创建 cli/internal/skill/definitions/hrm.go — 8 个 HRM Skill
□ 4.  修改 cli/internal/skill/definitions/init.go — Register(hrm Skills)
□ 5.  创建 cli/internal/skill/definitions/ims.go — 20 个 IMS Skill
□ 6.  修改 cli/internal/skill/definitions/init.go — Register(ims Skills)
□ 7.  创建 cli/internal/skill/definitions/contract.go — 8 个 Contract Skill
□ 8.  修改 cli/internal/skill/definitions/init.go — Register(contract Skills)
□ 9.  创建 cli/internal/skill/definitions/service.go — 5 个 Service Skill
□ 10. 创建 cli/internal/skill/definitions/sales.go — 3 个 Sales Skill
□ 11. 创建 cli/internal/skill/definitions/finance.go — 6 个 Finance Skill
□ 12. 修改 cli/internal/skill/definitions/init.go — Register(service/sales/finance Skills)
□ 13. 创建 cli/internal/skill/definitions/message.go — 6 个 Message Skill
□ 14. 创建 cli/internal/skill/definitions/knowledge.go — 4 个 KB Skill
□ 15. 创建 cli/internal/skill/definitions/workflow.go — 5 个 Workflow Skill
□ 16. 创建 cli/internal/skill/definitions/org.go — 4 个 Org Skill
□ 17. 修改 cli/internal/skill/definitions/init.go — Register(message/kb/workflow/org Skills)
```

### Phase 2: 财务管理增强

```
□ 18. 创建 api/internal/model/payment_request.go
□ 19. 创建 api/internal/repository/payment_request_repo.go (接口)
□ 20. 创建 api/internal/repository/payment_request_repo_impl.go (实现)
□ 21. 创建 api/internal/service/payment_request_service.go
□ 22. 创建 api/internal/handler/payment_request_handler.go
□ 23. 修改 api/internal/router/router.go — 注册 PaymentRequest 路由
□ 24. 创建 api/internal/model/collection_record.go
□ 25. 创建 api/internal/repository/collection_record_repo.go (接口)
□ 26. 创建 api/internal/repository/collection_record_repo_impl.go (实现)
□ 27. 创建 api/internal/service/collection_service.go
□ 28. 创建 api/internal/handler/collection_handler.go
□ 29. 修改 api/internal/router/router.go — 注册 Collection 路由
□ 30. 创建 api/internal/model/payment_plan.go
□ 31. 创建 api/internal/repository/payment_plan_repo.go (接口)
□ 32. 创建 api/internal/repository/payment_plan_repo_impl.go (实现)
□ 33. 创建 api/internal/service/payment_plan_service.go
□ 34. 创建 api/internal/handler/payment_plan_handler.go
□ 35. 创建 api/internal/scheduler/reminder_scheduler.go
□ 36. 修改 api/internal/router/router.go — 注册 PaymentPlan 路由
□ 37. 创建 api/internal/service/cashflow_service.go
□ 38. 创建 api/internal/handler/cashflow_handler.go
□ 39. 修改 api/internal/router/router.go — 注册 CashFlow 路由
□ 40. 创建 api/internal/service/reconciliation_service.go
□ 41. 创建 api/internal/handler/reconciliation_handler.go
□ 42. 修改 api/internal/router/router.go — 注册 Reconciliation 路由
```

### Phase 3: 售后管理增强

```
□ 43. 创建 api/internal/model/repair_order.go
□ 44. 创建 api/internal/repository/repair_order_repo.go (接口)
□ 45. 创建 api/internal/repository/repair_order_repo_impl.go (实现)
□ 46. 创建 api/internal/service/repair_order_service.go
□ 47. 创建 api/internal/handler/repair_order_handler.go
□ 48. 修改 api/internal/router/router.go — 注册 RepairOrder 路由
□ 49. 修改 api/internal/handler/service_order_handler.go — 添加 Sign/Attachment 方法
□ 50. 修改 api/internal/service/service_order_service.go — 添加 Sign 方法
□ 51. 修改 api/internal/router/router.go — 注册 Sign/Attachment 路由
```

### Phase 4: 审批流增强

```
□ 52. 修改 api/internal/model/workflow.go — 扩展字段
□ 53. 修改 api/internal/service/workflow_service.go — 并行/条件/转交/退回逻辑
□ 54. 修改 api/internal/handler/workflow_handler.go — 新端点
□ 55. 修改 api/internal/router/router.go — 注册工作流增强路由
```

### Phase 5: CLI 功能完善

```
□ 56. 修改 cli/cmd/poll.go — 实现 pollMessages
□ 57. 修改 cli/cmd/skill.go — 集成 olog 操作日志
```

### Phase 6: 经营者数据体系

```
□ 58. 创建 api/internal/model/alert_rule.go
□ 59. 创建 api/internal/repository/alert_rule_repo.go (接口)
□ 60. 创建 api/internal/repository/alert_rule_repo_impl.go (实现)
□ 61. 创建 api/internal/service/owner_service.go
□ 62. 创建 api/internal/handler/owner_handler.go
□ 63. 创建 api/internal/scheduler/alert_scheduler.go
□ 64. 修改 api/internal/router/router.go — 注册经营者路由
```

### Phase 7: 客户成功与健康度

```
□ 65. 创建 api/internal/service/health_service.go
□ 66. 创建 api/internal/handler/health_handler.go
□ 67. 修改 api/internal/router/router.go — 注册健康度路由
```

### Phase 8: 安全增强

```
□ 68. 创建 api/internal/service/mfa_service.go + handler/mfa_handler.go + middleware/mfa.go
□ 69. 创建 api/internal/service/restore_service.go
□ 70. 修改 api/internal/router/router.go — 注册 MFA/恢复路由
```

### 验证步骤

```
□ 71. cd api && go vet ./... && go build ./... && go test ./...
□ 72. cd cli && go vet ./... && go build ./... && go test ./...
□ 73. 运行 CLI 单元测试验证 Skill 注册
□ 74. 启动 API 服务验证新端点可访问
```

---

## 七、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| router.go 频繁修改产生冲突 | 高 | 严格按照既定位置添加路由组，不重排现有代码 |
| 财务事务一致性 | 高 | 回款登记 + 金额更新使用数据库事务 |
| Skill 参数与 API 参数不一致 | 中 | 参考 handler 的请求结构体定义 Skill Parameters |
| 定时任务重复执行 | 中 | Redis SETNX 分布式锁 |
| 新 Model 自动迁移失败 | 低 | 先在测试环境验证 AutoMigrate |
| 与现有 OpenSpec 变更冲突 | 低 | 检查对应 Story 目录是否已有实现代码 |

---

## 八、与现有 OpenSpec 变更的关系

| 本方案 Phase | 对应 OpenSpec 变更 | 关系 |
|-------------|-------------------|------|
| Phase 1 (CLI Skills) | epic-8-story-9, epic-8-story-10, epic-8-story-11 | **新增** Skill 定义（现有 specs 为空骨架） |
| Phase 2.1 (PaymentRequest) | epic-7-story-1, epic-7-story-4 | **新增** 详细实现（现有 specs 有 21 行模板） |
| Phase 2.2 (CollectionRecord) | epic-7-story-1 | **增强** 现有实现 |
| Phase 2.3 (PaymentPlan) | epic-7-story-1, epic-7-story-5 | **新增** 功能 |
| Phase 2.4-2.5 (对账/预测) | epic-7-story-5 | **新增** 功能 |
| Phase 3 (RepairOrder/Sign) | epic-6-story-9, epic-6-story-10 | **增强** 现有实现 |
| Phase 4 (审批流增强) | epic-7-story-7, epic-7-story-9 | **增强** 现有实现 |
| Phase 6 (经营者) | epic-10-story-1, epic-10-story-2 | **新增** 详细实现 |
| Phase 7 (客户成功) | epic-9-story-12 | **新增** 功能 |

---

## 九、下一步行动

1. **批准此计划** → 进入 EXECUTE 模式
2. **执行顺序**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
3. **每个 Phase 完成后**: go vet + go build + go test 验证
4. **全部完成后**: 更新 task.json 和 progress.txt
