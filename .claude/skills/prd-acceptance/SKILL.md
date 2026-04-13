---
name: prd-acceptance
description: PRD 驱动的验收测试执行器。根据 PRD 需求生成验收标准（AS），执行两层测试——模拟数据测试（工厂 + 单元/集成） + 实际运行测试（前后端 + 云端 + agent-browser E2E）。当用户说"帮我验收 EpicX"、"帮我验收 StoryX.X"、"帮我验收 FR13"、"帮我验收 AGENT 模块"、"验收测试"、"根据需求做验收"、"执行 AS"、"验收 Story" 时触发。使用方式：用户提供要验收的 Epic/Story/FR/模块名称 → Agent 自动解析 PRD → 生成 AS → 执行测试 → 报告结果。
---

# PRD Acceptance Tester

根据 PRD 需求执行严格的两层验收测试。所有测试必须完全通过，lint/build 无报错，AS 全部 pass 才能结束。

## 核心原则

1. **测试分层**：模拟测试（快）→ 实际运行测试（慢）→ 两层都 pass 才算完成
2. **AS 优先**：先制定验收标准，再执行测试
3. **重试策略**：单点失败重试最多 2 次，总失败次数不超过 3 次，超限立即停下深度反思
4. **不 Mock 自有 API**：E2E 阶段不得 Mock 自身后端 API
5. **零容忍 lint/build**：lint 错误和 build 失败必须全部修复

---

## 验收范围解析

### 支持的输入格式

| 用户输入 | 解析目标 |
|----------|----------|
| `Epic 2` / `epic2` | PRD 中 Epic 2 及其所有 Story |
| `Story 2.1` / `story2.1` | PRD 中 Story 2.1 及关联的 FR |
| `FR13` / `FR-13` | PRD 中 FR13 及其依赖的 FR |
| `AGENT 模块` / `Agent模块` | PRD 中 AI Agent 核心能力（FR9-FR19） |

### 解析流程

1. 读取 `_bmad-output/planning-artifacts/prd.md`
2. 用正则匹配目标章节（`Epic N`、`Story N.N`、`FR\d+`、`AI Agent核心能力`）
3. 提取所有关联的 FR 编号和需求描述
4. 如存在 `task.json` 中对应的 task，取其 `steps` 作为补充验收点

---

## 验收标准（AS）制定

### AS 生成规则（严格版本）

**必须为每条 FR 生成至少 4 个维度的 AS：**

| 维度 | 强制要求 | 说明 |
|------|----------|------|
| **功能正确性** | 必须有 | 验证 FR 描述的核心功能是否实现 |
| **边界与异常** | 必须有 | 无效输入、超限输入、空状态、并发、超时 |
| **前后端一致性** | 必须有 | API 契约、类型一致性、渲染一致性 |
| **UI/交互可操作性** | 必须有 | 按钮、输入、反馈、加载态、错误态 |

**每个 AS 结构（强制7字段）：**

```
AS-[FR编号]-[维度缩写]-[序号]
来源：FR-XX（对应PRD具体条目）
类型：[功能/边界/一致性/UI/安全/性能]
前置条件：[必须可复现的环境状态]
操作步骤：[精确到每一步，包含具体输入值]
预期结果：[精确到字段和值的预期]
验证方式：[必须包含4种验证]
  - lint/build：命令 + 预期
  - 模拟测试：SQL/API + 预期
  - API测试：curl/请求 + 预期响应
  - E2E测试：操作 + 检查点
优先级：P0/P1/P2
```

**强制要求：**

1. **FR 子需求拆分**：FR14 这种带 `-1`、`-2` 后缀的必须每个子需求单独生成 AS
2. **负向测试**：每 3 个正向 AS 必须包含至少 1 个负向 AS（无效输入、权限越界、超时降级）
3. **PRD 行号引用**：每个 AS 必须标注来源 FR 的 PRD 行号，便于追溯
4. **无假设**：不得假设"应该"、"大概"、"正常情况"，必须穷举所有状态
5. **可复现**：所有前置条件和操作必须可精确复现

### AS 覆盖率检查表（生成后必检）

```
[ ] 每条 FR 至少 4 个 AS
[ ] FR14-X 系列每个子需求都有独立 AS
[ ] 正向/负向测试比例 ≤ 3:1
[ ] 每个 AS 都有 lint/build + 模拟 + API + E2E 四层验证
[ ] 所有 AS 都能在不修改代码的情况下执行
[ ] 边界条件覆盖：空值、超限、非法类型、并发、权限越界
[ ] UI 状态覆盖：加载中、成功、失败、空状态、网络异常
```

### 示例：FR9 多轮对话（严格版）

```
AS-FR9-FUNC-01
来源：FR9，PRD行2223
类型：功能正确性
前置条件：用户已登录，AI助手面板已加载
操作步骤：
  1. 在AI输入框输入 "你好"
  2. 点击发送按钮（或按Enter）
  3. 等待AI响应
预期结果：
  - 输入框内容清空
  - 用户消息立即显示在聊天区（role=user）
  - AI响应在5秒内显示（role=assistant）
  - 响应内容非空
  - 会话ID已创建/更新
验证方式：
  - lint/build: npm run lint --quiet && npm run build
  - 模拟: INSERT会话 + 消息，SELECT验证入库
  - API: POST /api/v1/agent/messages 返回201+message_id
  - E2E: agent-browser skill → 输入"你好" → 截图确认消息显示
优先级：P0

AS-FR9-BOUND-01
来源：FR9，PRD行2223
类型：边界与异常
前置条件：用户已登录，网络正常
操作步骤：
  1. 输入超过4096字符的文本
  2. 发送超长消息
预期结果：
  - 系统返回422或正确截断，不崩溃
  - 错误提示"输入超长"
验证方式：
  - lint/build: npm run lint --quiet && npm run build
  - 模拟: 模拟4097字符输入，API返回长度校验
  - API: POST超长文本返回422+error.message包含"超长"
  - E2E: agent-browser skill → 粘贴4097字符 → 检查错误提示
优先级：P1

AS-FR9-BOUND-02
来源：FR9，PRD行2223
类型：边界与异常
前置条件：用户已登录
操作步骤：
  1. AI响应过程中断开网络
  2. 等待超时
预期结果：
  - 加载动画停止
  - 显示错误提示"网络异常"
  - 无console.error级别日志
验证方式：
  - lint/build: npm run lint --quiet && npm run build
  - 模拟: 模拟网络超时异常
  - API: 触发timeout，检查响应格式
  - E2E: agent-browser skill → 禁用网络 → 发送消息 → 检查错误态
优先级：P1

AS-FR9-UI-01
来源：FR9，PRD行2223
类型：UI/交互可操作性
前置条件：用户已登录，AI助手面板已加载
操作步骤：
  1. 页面加载完成
  2. 检查AI助手面板各元素可见性
预期结果：
  - 面板头部显示"AI助手"
  - 输入框可见且可编辑
  - 发送按钮可见
  - 历史消息列表（如有）可见
  - 加载态/空状态正确显示
验证方式：
  - lint/build: npm run lint --quiet && npm run build
  - 模拟: N/A
  - API: N/A
  - E2E: agent-browser skill → 截图 → 逐元素检查可见性
优先级：P0

AS-FR9-SEC-01
来源：FR9，PRD行2223
类型：安全/权限
前置条件：未登录用户访问AI助手
操作步骤：
  1. 清除登录状态
  2. 访问AI助手面板
预期结果：
  - 重定向到登录页
  - 输入框不可交互
  - 提示"请先登录"
验证方式：
  - lint/build: npm run lint --quiet && npm run build
  - 模拟: 模拟未登录token
  - API: 携带无效token请求返回401
  - E2E: agent-browser skill → 清除cookie → 访问 → 检查登录页
优先级：P0
```

---

## 测试执行流程（4 步）

### Step 1：构建验证

```bash
# 前端构建
npm run lint && npm run build

# Rust 后端构建（如涉及）
cd src-tauri && cargo build --release
```

**通过标准**：无任何 lint 错误，build 成功。

---

### Step 2：模拟数据测试

#### 2a. 数据库迁移验证

```bash
# 执行迁移 SQL
sqlite3 data/app.db < migrations/xxx.sql

# 验证表结构
sqlite3 data/app.db ".schema" | grep -E "表名"
```

#### 2b. SQL 数据工厂

根据 FR 需求生成测试数据 SQL，直接写入本地数据库：

```sql
-- 示例：为 FR9（多轮对话）生成测试会话
INSERT INTO agent_sessions (id, tenant_id, user_id, title, created_at)
VALUES ('test-session-001', 'tenant-001', 'user-001', '测试会话', datetime('now'));

INSERT INTO agent_messages (id, session_id, role, content, created_at)
VALUES 
  ('msg-001', 'test-session-001', 'user', '你好', datetime('now', '-1 minute')),
  ('msg-002', 'test-session-001', 'assistant', '你好，有什么可以帮您？', datetime('now'));
```

#### 2c. 单元/集成测试

```bash
# 运行相关测试文件
npx playwright test tests/unit/xxx.spec.ts
npx playwright test tests/integration/xxx.spec.ts
```

---

### Step 3：实际运行测试

#### 3a. 启动后端服务

```bash
# 启动云端后端（如需要）
cd cloud-server && go run main.go

# 或启动 Tauri 开发模式
npm run tauri dev
```

#### 3b. API 测试（curl）

```bash
# 示例：测试会话创建 API
curl -X POST http://localhost:8080/api/v1/agent/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试会话"}'

# 预期：201 Created，返回 session_id
```

#### 3c. 使用 agent-browser skill 执行 E2E 测试

通过 agent-browser skill 执行全面的浏览器 E2E 测试。读取 `.claude/commands/intest.md` 获取基础指令，但测试必须覆盖以下所有维度。

##### 3c-1. UI 渲染检测

| 检查项 | 操作 | 预期结果 |
|--------|------|----------|
| 组件可见性 | 截图表单各字段 | 每个字段可见 |
| 文本渲染 | 检查中文字符 | 无乱码、无截断 |
| 加载态 | 触发异步操作 | 显示加载动画 |
| 空状态 | 进入无数据页面 | 显示空状态提示 |
| 错误态 | 触发异常操作 | 显示错误提示，不白屏 |
| 模态框 | 打开弹窗 | 遮罩 + 内容居中 |
| 表单验证 | 提交空表单 | 显示字段级错误提示 |
| 响应式布局 | 窗口 resize | 布局不乱，内容不溢出 |

##### 3c-2. 前端数据传递检测

| 检查项 | 操作 | 预期结果 |
|--------|------|----------|
| 输入同步 | 表单输入值变化 | 状态立即更新 |
| 表单提交 | 填写表单并提交 | 数据完整发送 |
| 数据回显 | 编辑已有数据 | 初始值正确回填 |
| 多选联动 | 切换下拉选项 | 关联字段联动 |
| 数值格式化 | 输入大数字 | 显示千分位格式 |
| 日期选择 | 选择日期范围 | 正确传递给后端 |

##### 3c-3. 前后端一致性检测

| 检查项 | 操作 | 预期结果 |
|--------|------|----------|
| API响应渲染 | 调用列表接口 | 返回条数 = 渲染条数 |
| 分页一致性 | 翻页操作 | 当前页数据与API一致 |
| 搜索结果 | 搜索关键字 | 过滤结果精确匹配 |
| 新增后刷新 | 新增记录后刷新 | 新记录出现在列表 |
| 编辑后刷新 | 修改记录后刷新 | 数据已更新 |
| 删除后刷新 | 删除记录后刷新 | 记录已消失 |
| 数字精度 | 金额字段 | 后端精度与前端一致 |
| 时间时区 | 创建/更新时间 | UTC存储，显示本地时间 |

##### 3c-4. 操作路径穷举测试

必须模拟所有可能的操作路径，不能只测 happy path：

| 路径类型 | 操作序列 | 检测点 |
|----------|----------|--------|
| 基础CRUD | 创建→查看→编辑→删除 | 每步状态正确 |
| 快速连击 | 按钮双击/三击 | 不触发多次请求 |
| 操作取消 | 填写→取消→离开 | 数据未提交 |
| 表单重置 | 填写→重置 | 值恢复初始 |
| 并发提交 | 多Tab同时提交 | 状态不混乱 |
| 刷新中断 | 加载中刷新页面 | 不崩溃，数据一致 |
| 回退操作 | 编辑→返回列表 | 列表数据未污染 |
| 权限越界 | 低权限用户操作 | 正确拦截 |
| 超时处理 | 操作后等待超时 | 显示超时提示 |
| 离线操作 | 断网后操作 | 正确降级 |
| 快捷键 | Tab/Enter/Esc | 对应功能响应 |

##### 3c-5. 浏览器控制台检测

| 检查项 | 触发方式 | 预期结果 |
|--------|----------|----------|
| Error日志 | 触发异常操作 | 无console.error |
| Warning日志 | 边界操作 | 无严重警告（可忽略的React警告不计入） |
| API失败日志 | 断网/接口异常 | 正确显示错误，不静默 |
| 内存泄漏 | 频繁操作 | 控制台无持续增长的内存警告 |
| 网络请求 | F12 Network | 无404/500请求 |

##### 3c-6. E2E 测试执行规范

```
执行要求：
1. 每个 AS 必须执行 E2E 测试，不得跳过
2. 每个操作路径必须截图记录（成功 + 失败各一张）
3. 每个检查点必须报告：通过/失败/跳过 + 具体数据
4. 失败项：记录失败操作、失败现象、失败截图
5. 完成后：报告总操作数、通过率、失败列表
```

##### 3c-7. E2E 测试输出格式

```markdown
## E2E 测试报告

### AS-FR9-UI-01: AI助手面板渲染

**操作序列**:
1. [agent-browser] 打开应用首页
2. [agent-browser] 定位到AI助手面板
3. [agent-browser] 截图并分析各元素可见性
4. [agent-browser] 检查输入框可交互状态
5. [agent-browser] 检查发送按钮可见性
6. [agent-browser] 检查历史消息区
7. [agent-browser] 触发网络异常，检查降级态
8. [agent-browser] 恢复网络，检查恢复态
9. [agent-browser] 控制台检查Error/Warning日志

**结果**:
- 面板头部显示 ✅
- 输入框可见且可编辑 ✅
- 发送按钮可见 ✅
- 历史消息区可见 ✅
- 加载态显示 ✅
- 错误态显示 ✅
- console.error: 0 ✅
- console.warning: 1 ⚠️ (React key警告，不计入)

**结论**: ✅ PASS

---

## E2E 总览

| AS编号 | 操作数 | 通过 | 失败 | 截图数 | 结论 |
|--------|--------|------|------|--------|------|
| FR9-UI-01 | 9 | 9 | 0 | 9 | ✅ |
| FR9-BOUND-02 | 6 | 5 | 1 | 6 | ❌ |

**失败详情**:
- AS-FR9-BOUND-02: 超时后重试按钮点击无响应，控制台无Error

**E2E通过率**: 14/15 (93.3%)
```

---

### Step 4：AS 全量验证

逐条验证所有 AS，每个 AS 必须完成全部 4 层验证：

```
[AS-FR9-FUNC-01] 多轮对话基础交互
  来源: FR9, PRD行2223
  类型: 功能正确性

  验证链路:
  [P0] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P0] 模拟数据:     INSERT会话+消息 → SELECT验证入库            → ✅ 2条记录
  [P0] curl API:     POST /api/v1/agent/messages                  → 201 + message_id
  [P0] 浏览器E2E:    agent-browser skill → "你好" → 截图确认     → ✅ 消息显示

[AS-FR9-BOUND-01] 超长输入边界
  来源: FR9, PRD行2223
  类型: 边界与异常

  验证链路:
  [P1] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P1] 模拟数据:    模拟4097字符输入 → API返回长度校验          → ✅ 422
  [P1] curl API:    POST 4097字符文本                            → 422 + error
  [P1] 浏览器E2E:   agent-browser skill → 粘贴4097字符          → ✅ 错误提示

[AS-FR13-FUNC-01] MCP工具调用
  来源: FR13, PRD行2227
  类型: 功能正确性

  验证链路:
  [P0] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P0] 模拟数据:    MCP工具注册 → 调用 → 返回结果                → ✅ JSON正确
  [P0] curl API:    POST /api/v1/mcp/call                         → 200 + result
  [P0] 浏览器E2E:   agent-browser skill → 点击MCP按钮           → ❌ 无响应

  [重试 1/2] 检查MCP按钮事件绑定...
  [重试 2/2] 检查API端点是否可达...
  [超限] 深度反思: MCP按钮onClick未绑定invoke('mcp_call')
```

---

## 异常处理

### 重试策略

| 失败类型 | 重试次数 | 行为 |
|----------|----------|------|
| 单点失败（API/UI） | 2 次 | 等待 5s 后重试，分析日志修复 |
| 整体失败 | 3 次 | 深度反思，分析根因，输出阻塞报告 |
| lint/build 失败 | 不重试 | 立即修复 lint/build 错误 |

### 阻塞报告格式

```
🚫 验收阻塞 - 需要人工介入

**当前验收范围**: [Epic X / Story X.X / FR13]
**阻塞阶段**: [构建/模拟测试/API测试/E2E测试]
**失败 AS**: [AS-FR13-01]

**已通过的测试**:
- AS-FR9-01: ✅
- AS-FR9-02: ✅

**阻塞原因**:
- [具体说明]

**需要人工帮助**:
1. [具体步骤 1]
2. [具体步骤 2]

**解除阻塞后**:
- 运行 `npm run test:acceptance -- --scope FR13` 继续
```

---

## 输出格式

### 验收报告（严格版）

```markdown
# PRD 验收报告 - [验收范围]

**执行时间**: YYYY-MM-DD HH:mm
**执行人**: PRD Acceptance Tester
**范围**: [Epic 2 / Story 2.1 / FR13 / Agent 模块]
**PRD版本**: [读取prd.md的lastEdited日期]

---

## AS 覆盖率统计

| FR编号 | FR描述 | AS数量 | FUNC | BOUND | UI | SEC | 状态 |
|--------|--------|--------|------|-------|-----|-----|------|
| FR9    | 多轮对话交互 | 5 | 1 | 2 | 1 | 1 | ✅ PASS |
| FR10   | 会话管理 | 4 | 1 | 1 | 1 | 1 | ✅ PASS |
| FR14-1 | 长期偏好存储 | 4 | 1 | 1 | 1 | 1 | ✅ PASS |
| FR14-2 | 会话上下文记忆 | 4 | 1 | 1 | 1 | 1 | ✅ PASS |
| ... | ... | ... | ... | ... | ... | ... | ... |

**覆盖率**: FR9-FR14共20条FR → 生成88个AS → 全部PASS

---

## 测试详情

### AS-FR9-FUNC-01: 多轮对话基础交互
**来源**: FR9, PRD行2223
**类型**: 功能正确性 | **优先级**: P0

**前置条件**: 用户已登录，AI助手面板已加载
**操作步骤**:
  1. 在AI输入框输入 "你好"
  2. 点击发送按钮（或按Enter）
  3. 等待AI响应

**预期结果**:
  - 输入框内容清空
  - 用户消息立即显示（role=user）
  - AI响应在5秒内显示（role=assistant）
  - 响应内容非空
  - 会话ID已创建/更新

**验证链路**:
| 层级 | 验证方式 | 命令/操作 | 预期结果 | 实际结果 | 状态 |
|------|----------|-----------|----------|----------|------|
| P0 | lint/build | `npm run lint --quiet && npm run build` | 无错误 | ✅ 无错误 | ✅ PASS |
| P0 | 模拟数据 | INSERT会话+消息 → SELECT | 2条记录 | ✅ 2条 | ✅ PASS |
| P0 | curl API | `POST /api/v1/agent/messages` | 201 + message_id | 201 ok | ✅ PASS |
| P0 | E2E浏览器 | agent-browser → "你好" → 截图 | 消息显示 | ✅ 截图确认 | ✅ PASS |

**结论**: ✅ PASS | 重试次数: 0

---

## 失败 AS 详情（无）

本次验收无失败项。

---

## 执行摘要

| 指标 | 数值 |
|------|------|
| 验收FR数 | 20 |
| 生成AS总数 | 88 |
| 通过AS | 88 |
| 失败AS | 0 |
| 阻塞数 | 0 |
| 重试次数 | 0 |
| lint/build错误 | 0 |
| 通过率 | 100% |
| **最终结论** | **✅ 验收通过** |

---
```

---

## 快速参考

| 场景 | 命令 |
|------|------|
| 验收 Epic 2 | `prd-acceptance --scope epic2` |
| 验收 Story 2.1 | `prd-acceptance --scope story2.1` |
| 验收 FR13 | `prd-acceptance --scope FR13` |
| 验收 Agent 模块 | `prd-acceptance --scope agent` |
| 仅生成 AS | `prd-acceptance --scope FR13 --dry-run` |
| 跳过浏览器测试 | `prd-acceptance --scope FR13 --no-browser` |

> **注意**：当前版本不支持命令行参数，由 Agent 自动解析用户输入并执行。
