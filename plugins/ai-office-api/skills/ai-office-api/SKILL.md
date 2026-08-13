---
name: ai-office-api
description: AI-Automated-office 企业云服务 API 技能。让 Agent 通过 `ao-cli skill execute` 管理企业的全部业务--组织架构、HRM、CRM、进销存、合同、销售、售后、财务、知识库、消息、AI 对话等 169 个端点。当用户提到"员工"、"客户"、"合同"、"库存"、"采购"、"销售订单"、"发票"、"报销"、"知识库"、"消息"、"审批"、"仪表盘"、"报表"、"报告"等任何企业管理场景时触发。即使用户只是说"帮我查一下"、"新建一个"、"列表看看"、"生成报告"也应触发。
allowed-tools: Bash(*ao-cli*), Bash(*AO_CLI*), Write(*.html*), Read(*.html*)
---

# AI-Automated-office API 技能

Agent 通过此技能调用 AI-Automated-office 后端 API，完成企业经营管理的一切操作。

## ⚠ 重要约束（铁律）

**CLI 唯一入口：** Agent 禁止直接使用 `curl` 等 HTTP 客户端调用业务 API。所有业务操作必须通过 `ao-cli skill execute` 执行。用户在 CLI 输入一次凭证（`ao-cli init` + `ao-cli auth login`），CLI 统一管理 token 生命周期和自动刷新，Agent 不接触任何凭证。服务器端验证请求来源 Header `X-Request-Source: ao-cli`，拒绝非 CLI 请求。

## 快速开始

### 0. 前提条件

CLI 必须在系统中已安装，用户已执行 `ao-cli init` 配置 API 地址，并通过 `ao-cli auth login` 完成登录。

**⚠ 定位 CLI（每次会话首次调用前必须执行）：** Agent 运行在 non-interactive shell 中，用户的 shell 配置（`.zshrc`/`.bashrc`）不会被加载，`ao-cli` 可能不在 PATH 中。Agent 必须先从配置文件读取 CLI 路径：

```bash
AO_CLI=$(grep cli_path ~/.ai-office-cli/config.yaml | awk '{print $2}')
if [ -z "$AO_CLI" ] || [ ! -x "$AO_CLI" ]; then
  for p in /opt/homebrew/bin/ao-cli /usr/local/bin/ao-cli "$HOME/go/bin/ao-cli" "$HOME/.npm-global/bin/ao-cli" "$HOME/.ai-office/bin/ao-cli"; do
    if [ -x "$p" ]; then AO_CLI="$p"; break; fi
  done
fi
"$AO_CLI" auth status
```

之后所有 `ao-cli` 命令使用 `"$AO_CLI"` 替代：

```bash
"$AO_CLI" skill list
"$AO_CLI" skill execute hrm_employee_list --format json
```

### 1. 通用执行模式

所有业务操作遵循统一模式（使用 `"$AO_CLI"` 变量，见 §0）：

```bash
# 查询列表（JSON 格式，适合 Agent 解析）
"$AO_CLI" skill execute <skill-name> --format json [parameters...]

# 查询详情
"$AO_CLI" skill execute <skill-name> --id <UUID> --format json

# 创建资源
"$AO_CLI" skill execute <skill-name> --create --field1=value1 --field2=value2 --format json

# 更新资源
"$AO_CLI" skill execute <skill-name> --id <UUID> --update --field1=new_value --format json

# 删除资源
"$AO_CLI" skill execute <skill-name> --id <UUID> --delete --format json
```

### 2. Auth 端点特殊说明

`"$AO_CLI" auth login` 是 CLI 内置命令（非 skill），用户交互式输入邮箱密码完成认证：
```bash
"$AO_CLI" auth login
# 交互式输入: email / password
# CLI 自动保存 token 到 ~/.ao-cli/<hash>.token（base64 编码）
```

切换企业上下文：
```bash
"$AO_CLI" auth enterprise switch --enterprise-id <UUID>
```

## 通用请求模式

所有业务 API 通过 `ao-cli skill execute` 调用，遵循统一响应格式：

```
{ "data": ..., "error": { "code": "...", "message": "..." }, "meta": { "page": 1, "page_size": 20, "total": 100 } }
```

## API 端点总览（17 个模块，169 个端点）

| 模块 | 端点数 | 详情文档 |
|------|--------|---------|
| Auth 认证 | 5 | [references/auth.md](references/auth.md) |
| Organization 组织架构 | 10 | [references/organization.md](references/organization.md) |
| HRM 人力资源 | 19 | [references/hrm.md](references/hrm.md) |
| CRM 客户关系 | 21 | [references/crm.md](references/crm.md) |
| IMS 进销存 | 32 | [references/ims.md](references/ims.md) |
| Contract 合同 | 12 | [references/contract.md](references/contract.md) |
| Sales/Service 销售/售后 | 6 | [references/sales.md](references/sales.md) |
| Finance 财务 | 7 | [references/finance.md](references/finance.md) |
| Knowledge Base 知识库 | 7 | [references/knowledge-base.md](references/knowledge-base.md) |
| Messages 消息/文件 | 4 | [references/messages.md](references/messages.md) |
| AI 对话 | 5 | [references/ai.md](references/ai.md) |
| Operations 运营 | 20 | [references/operations.md](references/operations.md) |
| Skills 技能 | 2 | [references/skills.md](references/skills.md) |
| Reports 报表 | 1 | [references/reports.md](references/reports.md) |
| Quota/Features 配额/特性 | 4 | [references/quota-features.md](references/quota-features.md) |
| Backup 备份 | 8 | [references/backup.md](references/backup.md) |

**执行任何 API 调用前，先读取对应模块的 references 文档获取完整参数和权限要求。**

## 角色权限速查

| 角色 | 权限范围 |
|------|---------|
| operator | 系统配置、集团/企业管理、财务读写、审计日志、备份 |
| owner | 企业全部权限（*） |
| admin | 部门/员工/客户/合同/订单管理，财务只读 |
| manager | 本部门员工、客户/合同/订单创建修改，财务只读 |
| employee | 只读查看（员工信息、客户、库存、合同、知识库） |

## 错误处理

```json
{ "error": { "code": "ERROR_CODE", "message": "描述" } }
```

常见错误码及恢复策略：

| 错误码 | 含义 | Agent 自动恢复 |
|--------|------|---------------|
| `AUTH_TOKEN_EXPIRED` | Token 过期 | 执行 `"$AO_CLI" auth login` 重新登录后重试 |
| `PERMISSION_DENIED` | 无权限 | 告知用户当前角色无此权限，建议联系管理员 |
| `VALIDATION_ERROR` | 参数校验失败 | 根据错误信息修正参数后重试 |
| `QUOTA_EXCEEDED` | API 配额超限 | 告知用户配额已用完 |
| `NOT_FOUND` | 资源不存在 | 确认 ID 是否正确 |
| `RATE_LIMITED` | 请求过快 | 等待后重试 |

## 操作确认规则

以下操作执行前必须向用户确认：
- DELETE 任何资源（不可逆）
- 创建合同（涉及金额和法律效力）
- 审批/拒绝操作（影响业务流程）
- 备份恢复（覆盖现有数据）
- 批量导入（影响大量数据）

## 典型使用场景

**"帮我创建一个员工"** → 读 [references/hrm.md](references/hrm.md) → 收集必填参数 → 确认 → `"$AO_CLI" skill execute hrm_employee_create --create --name="张三" --email="zhangsan@test.com" --department_id="xxx" --format json`

**"看看库存不足的物料"** → 读 [references/ims.md](references/ims.md) → `"$AO_CLI" skill execute ims_low_stock_list --format table`

**"审批这个报销"** → 读 [references/finance.md](references/finance.md) → 确认 → `"$AO_CLI" skill execute finance_expense_approve --id="xxx" --action=approve --format json`

**"搜索知识库"** → 读 [references/knowledge-base.md](references/knowledge-base.md) → `ao-cli skill execute kb_search --query="xxx" --format json`

**"查看本月销售报表"** → 读 [references/reports.md](references/reports.md) → `ao-cli skill execute report_sales --month=2026-07 --format markdown`

## HTML 报告生成（数据可视化）

### 设计原则

本项目是**无前端 SaaS**，Agent 对话界面信息展示能力有限（画幅小、不支持复杂表格/图表）。因此，当返回数据量较大或需要可视化呈现时，Agent 生成独立 HTML 文件供用户在浏览器中查看。

**核心原则（三条）**：
1. **按需生成**：不是所有对话都需要 HTML，只在高价值场景生成（见下方决策矩阵）
2. **复用优先**：同一事务（相同报告类型+相同查询维度）的 HTML 不重复生成，当日有效期内直接复用
3. **生命周期管理**：过时/超量的 HTML 由 Agent 主动清理，保持输出目录干净

**PRD 铁律引用**：
> "数据即服务：Agent 调用 API 获取数据后，可生成 HTML/文档进行可视化展示"
> "文档即展示：Agent 生成的 HTML/文档作为展示层"

### 生成决策矩阵（何时生成 HTML）

**前置判断（依次检查，任一不满足则用对话/表格文本回答）：**

| 检查项 | 生成条件 | 不满足时的处理 |
|--------|---------|--------------|
| 用户意图 | 用户要求"报告/报表/页面/图表" | 用 markdown 表格直接回答 |
| 数据量 | 列表数据 > 10 行 | ≤10 行用 markdown 表格回答 |
| 数据复杂度 | 多维数据 / 需图表 / 需状态色标识 | 简单计数直接文字回答 |
| 结构类型 | 仪表盘/KPI/信号面板/审计时间线 | 单条详情用对话展示 |
| 复用检查 | **先查 test-flie/ 是否已有同事务有效报告** | 有则复用，不重新生成 |

**决策结论（简化版）：**

| 场景 | 生成/复用 HTML？ | 原因 |
|------|----------------|------|
| 仪表盘/KPI/经营驾驶舱 | **是** | 卡片布局+红黄绿状态，对话无法呈现 |
| 列表数据 > 10 行 | **是** | 长表格 + 搜索/排序交互 |
| 审计日志/操作记录（>10 条） | **是** | 时间线+筛选交互 |
| 多维度对比/趋势分析 | **是** | 图表+交互 |
| 用户明确要求"生成报告" | **是**（即使数据少） | 用户意图优先 |
| 列表数据 ≤ 10 行 | 否 | markdown 表格即可 |
| 单条记录详情 | 否 | 对话展示 |
| 创建/更新/删除结果 | 否 | 一行确认 |
| 简单计数/汇总查询 | 否 | 直接文字回答 |
| 会话中已生成过同一事务 | **复用** | 不重复生成 |

### 事务标识与复用机制

**命名规范（核心，支持复用）：**

```
{报告类型}_{维度标识}_{YYYYMMDD}.html

- 报告类型：employee-list / customer-list / material-list / dashboard / audit-log / work-report / owner-kpi ...
- 维度标识：查询条件的稳定摘要（如 all / active / dept-{name} / level-{name} / month-{YYYYMM}），无查询条件用 all
- 日期：YYYYMMDD（当日有效）
```

**示例：**
```
employee-list_all_20260813.html        ← 全部员工，当日有效
employee-list_active_20260813.html     ← 在职员工筛选
customer-list_all_20260813.html        ← 全部客户
dashboard_all_20260813.html            ← 经营驾驶舱
audit-log_all_20260813.html            ← 审计日志
```

**复用规则：**

```
生成前必须执行：
  ls test-flie/ | grep "{报告类型}_{维度标识}_"

命中条件（全部满足才复用）：
  1. 文件存在
  2. 文件日期 = 今天（YYYYMMDD）
  3. 报告类型 + 维度标识 与本次请求一致

复用动作：
  - 不重新获取数据、不重新生成文件
  - 回复用户："报告已存在，直接打开：test-flie/{文件名}"
  - 如需更新数据，告知用户文件生成时间，询问是否强制刷新

强制刷新条件：
  - 用户明确要求"刷新/重新生成"
  - 数据源刚发生变更（如刚创建/删除了一批记录，与报告内容直接相关）
  - 跨天（日期不同 → 必然重新生成）
```

### 清理机制（生命周期管理）

**保留策略：**

```
1. 每个报告类型最多保留最近 5 份（按文件名日期）
2. 超过 5 份的，删除最旧的（保留最新）
3. 生成新报告时顺带执行清理（不单独扫描，节省操作）
```

**清理执行时机：**
- 生成/复用 HTML 后，顺带执行一次：`ls test-flie/*.html | 按类型分组统计，超出 5 份删除最旧`
- 用户明确要求"清理报告/删除过期报告"时，全量清理：
  - 删除所有非当日报告（保留当日）
  - 或按用户指定条件删除

**清理命令示例：**

```bash
# 查看现有报告
ls -la test-flie/*.html

# 删除指定报告
rm test-flie/employee-list_all_20260810.html

# 清理某类型超出保留数量的旧报告（保留最近5份）
ls test-flie/employee-list_*.html | sort | head -n -5 | xargs rm -f

# 清理所有非当日报告
find test-flie -name "*.html" ! -name "*_$(date +%Y%m%d).html" -exec rm {} \;
```

**安全规则：**
- 只清理 `test-flie/` 目录内的 .html 文件
- 不使用 `rm -rf` 清理目录本身
- 删除前在回复中告知用户删除了哪些文件

### HTML 生成流程

```
1. 复用检查：ls test-flie/ 查找同事务当日报告 → 命中则复用（跳到第 6 步）
2. 通过 ao-cli skill execute 获取 JSON 数据
3. 解析 JSON，提取关键字段
4. 根据数据类型选择 HTML 模板（见 references/html-templates.md）
5. 用真实数据填充模板，生成完整 HTML 文件（含交互组件）
6. 执行清理：检查各类型报告数量，超出 5 份删除最旧
7. 告知用户文件路径（含文件名+相对路径），建议用浏览器打开
```

### 输出目录

HTML 报告默认保存到项目根目录的 `test-flie/` 文件夹。如果用户指定了其他目录，使用用户指定的目录。

```bash
# 确保目录存在
mkdir -p test-flie
```

### 交互性要求（必须包含）

生成的 HTML 报告**必须**包含以下交互能力（原生 JS 实现，无外部依赖）：

| 交互 | 适用报告 | 说明 |
|------|---------|------|
| 搜索过滤 | 列表类（员工/客户/物料/审计） | 输入关键词实时过滤表格行 |
| 表头排序 | 列表类 | 点击表头升/降序切换 |
| 状态筛选 | 列表类（有状态/等级字段） | 点击 badge 或下拉筛选 |
| 行数统计 | 列表类 | 显示"显示 X / 共 Y 条" |
| 折叠/展开 | 长列表（>50 行） | 折叠卡片区域，减少滚动 |
| CSV 导出 | 列表类 | 一键导出当前过滤结果为 CSV |
| 打印 | 所有报告 | 打印按钮调用 window.print() |
| 回到顶部 | 长页面 | 右下角浮动按钮 |
| 图表 tooltip | 含图表报告 | Canvas 图表 hover 显示数值 |

**交互实现规范见 [references/html-templates.md](references/html-templates.md) 的「交互组件库」。**

### 字段展示本地化（必须执行）

**原则：使用者是业务人员（老板/经理/员工），不是开发者。API 返回的枚举值是机器值（英文），HTML 展示时必须转换为用户能理解的中文。** 对话中的 markdown 表格同理。

**展示值分类规则：**

| 字段类别 | 处理方式 | 示例 |
|---------|---------|------|
| 业务枚举（状态/角色/等级/优先级） | **必须中文映射**（见下方映射表） | `active` → 在职；`admin` → 管理员 |
| 业务编码（SKU/工号/合同编号/单号） | 保留原样（数据标识） | `SKU-PC-LAPTOP`、`EMP001` |
| 联系数据（邮箱/电话/地址/网址） | 保留原样 | `zhangsan@test.com` |
| 日期时间 | 统一 `YYYY-MM-DD HH:mm:ss` | `2026-08-13 15:10:00` |
| 金额 | `¥` + 千分位，保留 2 位小数 | `¥5,999.00` |
| 布尔值 | `是` / `否` | `true` → 是 |
| 业界通用缩写（VIP/SKU/KPI/SLA/CRM） | 保留 | `VIP` 客户 |
| 未收录枚举 | 保留原值（兜底，不臆造翻译） | `archived` |

**枚举值中文映射表（完整，必须照此转换）：**

| 枚举字段 | 英文值 | 中文显示 |
|---------|--------|---------|
| 角色 `role` | owner | 老板 |
| | admin | 管理员 |
| | manager | 经理 |
| | employee | 员工 |
| 通用状态 `status` | active | 生效中（员工=在职/物料=在用/合同=履约中，按上下文） |
| | inactive | 停用 |
| | pending | 待处理 |
| | pending_approval | 待审批 |
| | draft | 草稿 |
| | confirmed | 已确认 |
| | shipped | 已发货 |
| | fulfilled | 已完结 |
| | completed | 已完成 |
| | approved | 已批准 |
| | rejected | 已拒绝 |
| | cancelled | 已取消 |
| | expired | 已过期 |
| | issued | 已开票 |
| | received | 已收货 |
| | refunded | 已退款 |
| | returned | 已退货 |
| | paid | 已付款 |
| | overdue / past_due | 已逾期 |
| | open | 待处理 |
| | running | 进行中 |
| | frozen | 已冻结 |
| | resigned | 已离职 |
| | cleared | 已结清 |
| | success | 成功 |
| | error / failed | 失败 |
| | enabled | 已启用 |
| | disabled | 已禁用 |
| 优先级 `priority` | normal | 普通 |
| | low | 低 |
| | high | 高 |
| | urgent / critical | 紧急 |
| 信号状态 `signal.status` | red | 差/红色告警（配合 badge-red） |
| | yellow | 警告/黄色预警（配合 badge-yellow） |
| | green | 健康（配合 badge-green） |

**执行规则：**
1. 生成 HTML 前，遍历 JSON 中每个字段，凡命中映射表的枚举值**必须**转换为中文
2. 转换后的值用于展示；筛选/排序逻辑基于**中文值**运行（badge 文字即筛选键）
3. 状态色 badge 仍按原始枚举值映射颜色（`red`→红色、`green`→绿色），**文字**用中文
4. 检查清单项：「无英文枚举值残留」必查

### HTML 技术要求

- **单文件**：所有 CSS/JS 内联，不依赖外部资源（便于分享和打开）
- **响应式**：使用 CSS Grid/Flexbox，适配桌面和移动端
- **暗色主题**：使用深色背景+亮色文字，专业感强
- **数据安全**：不包含敏感凭证信息，只展示业务数据
- **图表**：使用 Canvas 原生绘制（无需外部库），或使用 CSS 实现简单图表
- **中文支持**：`<meta charset="UTF-8">`，所有文案使用中文

### 报告类型与对应 API

| 报告类型 | API Skill | 关键数据字段 |
|---------|-----------|------------|
| 经营驾驶舱 | `finance_owner_signals` + `finance_owner_kpi` | signals[], total_revenue, collection_rate, active_employees |
| 员工列表 | `hrm_employee_list` | name, email, department, position, status |
| 客户列表 | `crm_customer_list` | name, contact, level, status, created_at |
| 审计日志 | `operator_audit_logs` | action, resource_type, details, created_at, user_id |
| 工作报告 | `assist_work_report` | period, summary, approvals_count, business_stats |
| 库存清单 | `ims_material_list` | name, sku, stock, unit, warehouse |
| 物料预警 | `ims_low_stock_list` | name, sku, stock, threshold |

### 完整示例：生成经营驾驶舱 HTML

```bash
# Step 0: 复用检查
ls test-flie/ | grep "dashboard_all_$(date +%Y%m%d)"
# → 有结果则直接复用，无需以下步骤

# Step 1: 获取数据
AO_CLI="/Users/pxy1995/go/bin/ao-cli"
SIGNALS=$("$AO_CLI" skill execute finance_owner_signals --format json)
KPI=$("$AO_CLI" skill execute finance_owner_kpi --format json)

# Step 2: 解析并生成 HTML（Agent 直接写文件，不需要中间脚本）
# Agent 读取 JSON 输出，提取字段值，用 Write 工具写入 HTML 文件
# 文件命名：dashboard_all_$(date +%Y%m%d).html

# Step 3: 清理（超出保留数量删除最旧）
ls test-flie/dashboard_*.html | sort | head -n -5 | xargs rm -f 2>/dev/null

# Step 4: 告知用户
# "已生成经营驾驶舱报告，请用浏览器打开：test-flie/dashboard_all_20260813.html"
```

详细的 HTML 模板规范和交互组件代码示例见 [references/html-templates.md](references/html-templates.md)。
