---
name: prd-acceptance
description: PRD 驱动的验收测试执行器。根据 PRD 需求生成验收标准（AS），执行两层测试——模拟数据测试（工厂 + 单元/集成） + 实际运行测试（前后端 + 云端 + agent-browser E2E）。当用户说"帮我验收 EpicX"、"帮我验收 StoryX.X"、"帮我验收 FR13"、"帮我验收 AGENT 模块"、"验收测试"、"根据需求做验收"、"执行 AS"、"验收 Story" 时触发。使用方式：用户提供要验收的 Epic/Story/FR/模块名称 → Agent 自动解析 PRD → 生成 AS → 执行测试 → 报告结果。
---

# PRD Acceptance Tester

根据 PRD 需求执行严格的两层验收测试。所有测试必须完全通过，lint/build 无报错，AS 全部 pass 才能结束。

> **核心目的**：通过 AS 验收测试**发现并修复代码问题**，而非修改测试来迁就代码。
> - 代码有问题 → 修复代码，使 AS 通过
> - 测试本身有问题 → 修复测试，使其正确反映 PRD 需求
> - **禁止**：为了通过测试而修改 AS 的预期结果、降低验收标准、或删除失败用例
> - **原则**：测试正确则代码必须正确，代码错误则必须修复代码

## 核心原则

1. **测试驱动修复**：AS 验收的目的是发现代码问题，修复代码使其通过测试；严禁通过修改 AS 来迁就代码
2. **测试分层**：模拟测试（快）→ 实际运行测试（慢）→ 两层都 pass 才算完成
3. **AS 优先**：先制定验收标准，再执行测试；AS 一旦生成，预期结果不可随意修改
4. **重试策略**：单点失败重试最多 2 次，总失败次数不超过 3 次，超限立即停下深度反思
5. **不 Mock 自有 API**：E2E 阶段不得 Mock 自身后端 API
6. **零容忍 lint/build**：lint 错误和 build 失败必须全部修复

**失败时的处理原则**：
- AS 执行失败 → 先分析是代码问题还是测试问题
  - 代码问题 → 修复代码，重新执行该 AS
  - 测试问题 → 修复测试（调整测试逻辑或补充缺失的前置条件），但不改变预期结果本身
- 禁止行为：删除失败的 AS、降低 AS 验收标准、修改预期结果迁就代码
- AS 判定规则：预期结果明确写什么，代码就必须做到什么

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

---

## 测试执行流程（5 步）

### Step 0：环境预检（新增）

**在任何测试执行前，必须先进行环境预检，判断可用环境并选择对应路径。**

#### 0a. Tauri 桌面端检测

```bash
# 检测是否为 Tauri 桌面端环境（npm run tauri dev 或 npm run tauri build）
node -e "
  try {
    const { invoke } = require('@tauri-apps/api/core');
    const { listen } = require('@tauri-apps/api/event');
    console.log('TAURI_RUNTIME:available');
  } catch (e) {
    console.log('TAURI_RUNTIME:unavailable');
    console.log('TAURI_ERROR:' + e.message);
  }
"
```

**判定规则：**

| 检测结果 | 含义 | 后续行动 |
|----------|------|----------|
| `TAURI_RUNTIME:available` | Tauri 桌面端运行中 | E2E 使用 playwright 直接测试（Tauri 窗口内） |
| `TAURI_RUNTIME:unavailable` + `transformCallback` | Vite dev 无 Tauri | 警告：切换到 `npm run tauri dev` 以完成 E2E；先用 `playwright` 测试纯 UI 部分 |
| `TAURI_RUNTIME:unavailable` + 其他错误 | 其他环境问题 | 记录错误，继续 lint/build/模拟测试，E2E 跳过 |

#### 0b. 后端服务检测

```bash
# 检测云端后端是否可用
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "BACKEND:unavailable"
```

**判定规则：**

| 检测结果 | 含义 | 后续行动 |
|----------|------|----------|
| `200` | 后端服务运行中 | 执行 API 测试（curl） |
| `BACKEND:unavailable` 或其他 | 后端未启动 | API 测试跳过（不记为失败），记录跳过原因 |

#### 0c. 前端服务检测

```bash
# 检测 Vite dev server 是否可用
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "FRONTEND:unavailable"
```

---

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
# 使用 vitest 运行单元/集成测试
npx vitest run tests/unit/... tests/integration/...

# 使用 playwright 运行纯 UI 的 E2E 测试（不需要 Tauri API 的部分）
npx playwright test tests/e2e/...
```

---

### Step 3：API 测试（curl）

**先执行 Step 0b 检测后端服务状态：**
- 后端不可用 → **跳过**（标记为 `SKIP`，不计入失败）
- 后端可用 → 执行 curl 测试

```bash
# 示例：测试会话创建 API
curl -X POST http://localhost:8080/api/v1/agent/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试会话"}'

# 预期：201 Created，返回 session_id
```

---

### Step 4：E2E 浏览器测试

#### 4a. 根据环境选择测试路径

**Step 0a 检测结果决定 E2E 策略：**

**路径 A - Tauri 桌面端可用**：
```bash
# 直接使用 playwright 测试 Tauri 窗口
npx playwright test tests/e2e/smoke/agent-panel.spec.ts
# 或使用 agent-browser MCP 工具
```

**路径 B - Tauri 桌面端不可用（纯浏览器 dev 环境）**：

执行两步策略：

**Step 4b-1：纯 UI 测试（不需要 Tauri API）**
```bash
# 测试登录页、静态页面、纯前端路由等
npx playwright test tests/e2e/smoke/login.spec.ts
npx playwright test tests/e2e/accessibility/...
```

**Step 4b-2：agent-browser MCP 测试（Tauri API 部分）**
```bash
# 使用 playwright-mcp 工具
# 1. 尝试打开页面
# 2. 如果出现 transformCallback 错误，判定为"Tauri 环境缺失"
# 3. 跳过 Agent 核心功能测试，标记为 SKIP
```

**路径 C - Playwright MCP 工具测试（参考）**

使用 `plugin-playwright-playwright` MCP 工具：

```
1. browser_navigate → 导航到页面
2. browser_snapshot → 获取可访问性树
3. 如果出现大量 "transformCallback undefined" 错误：
   → 判定为 Tauri API 不可用
   → 报告 Tauri 环境缺失，跳过 Agent 核心功能 E2E
   → 建议切换到 npm run tauri dev
4. 如果页面正常渲染：
   → 继续执行交互测试
   → 逐 AS 验证，记录截图和日志
```

#### 4c. 通过 agent-browser skill 执行 E2E 测试

通过 agent-browser skill 执行全面的浏览器 E2E 测试。读取 `.claude/commands/intest.md` 获取基础指令，但测试必须覆盖以下所有维度。

##### 4c-1. UI 渲染检测

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

##### 4c-2. 前端数据传递检测

| 检查项 | 操作 | 预期结果 |
|--------|------|----------|
| 输入同步 | 表单输入值变化 | 状态立即更新 |
| 表单提交 | 填写表单并提交 | 数据完整发送 |
| 数据回显 | 编辑已有数据 | 初始值正确回填 |
| 多选联动 | 切换下拉选项 | 关联字段联动 |
| 数值格式化 | 输入大数字 | 显示千分位格式 |
| 日期选择 | 选择日期范围 | 正确传递给后端 |

##### 4c-3. 前后端一致性检测

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

##### 4c-4. 操作路径穷举测试

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

##### 4c-5. 浏览器控制台检测

| 检查项 | 触发方式 | 预期结果 |
|--------|----------|----------|
| Error日志 | 触发异常操作 | 无console.error |
| Warning日志 | 边界操作 | 无严重警告（可忽略的React警告不计入） |
| API失败日志 | 断网/接口异常 | 正确显示错误，不静默 |
| 内存泄漏 | 频繁操作 | 控制台无持续增长的内存警告 |
| 网络请求 | F12 Network | 无404/500请求 |

##### 4c-6. E2E 测试执行规范

```
执行要求：
1. 每个 AS 必须执行 E2E 测试，不得跳过
2. 每个操作路径必须截图记录（成功 + 失败各一张）
3. 每个检查点必须报告：通过/失败/跳过 + 具体数据
4. 失败项：记录失败操作、失败现象、失败截图
5. 完成后：报告总操作数、通过率、失败列表
```

##### 4c-7. E2E 测试输出格式

```html
<!-- E2E 详细记录写入 HTML，每个 AS 一段 -->
<div class="as-detail" id="as-fr9-ui-01">
  <h4>AS-FR9-UI-01: AI助手面板渲染</h4>
  <div class="as-meta">
    <span class="badge P0">P0</span>
    <span class="badge FUNC">功能正确性</span>
    <span class="badge PASS">✅ PASS</span>
  </div>

  <!-- 操作序列表格 -->
  <table class="op-table">
    <thead><tr><th>#</th><th>操作</th><th>预期</th><th>实际</th><th>状态</th><th>截图</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>打开应用首页</td><td>页面加载</td><td>加载成功</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-01.png">截图</a></td></tr>
      <tr><td>2</td><td>定位AI助手面板</td><td>面板可见</td><td>面板可见</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-02.png">截图</a></td></tr>
      <tr><td>3</td><td>截图元素可见性</td><td>各字段可见</td><td>各字段可见</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-03.png">截图</a></td></tr>
      <tr><td>4</td><td>检查输入框可交互</td><td>可编辑</td><td>可编辑</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-04.png">截图</a></td></tr>
      <tr><td>5</td><td>触发网络异常</td><td>显示错误提示</td><td>显示错误提示</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-05.png">截图</a></td></tr>
      <tr><td>6</td><td>恢复网络</td><td>恢复正常</td><td>恢复正常</td><td class="pass">✅</td><td><a href="screenshots/fr9-ui-01-06.png">截图</a></td></tr>
      <tr><td>7</td><td>控制台Error日志</td><td>0个Error</td><td>0个Error</td><td class="pass">✅</td><td>-</td></tr>
      <tr><td>8</td><td>控制台Warning日志</td><td>无严重警告</td><td>1个(React key警告，不计入)</td><td class="pass">✅</td><td>-</td></tr>
    </tbody>
  </table>

  <div class="console-log">
    <details>
      <summary>控制台日志</summary>
      <pre>[INFO] 页面加载完成
[INFO] AI助手面板已挂载
[ERROR] 无
[WARN] React key警告 (不计入失败)
      </pre>
    </details>
  </div>
</div>

<!-- 失败 AS 示例 -->
<div class="as-detail failure" id="as-fr9-bound-02">
  <h4>AS-FR9-BOUND-02: 超长输入边界</h4>
  <div class="as-meta">
    <span class="badge P1">P1</span>
    <span class="badge BOUND">边界与异常</span>
    <span class="badge FAIL">❌ FAIL</span>
  </div>
  <div class="failure-box">
    <strong>失败现象：</strong>超时后重试按钮点击无响应<br/>
    <strong>根因分析：</strong>onClick事件未绑定API调用<br/>
    <strong>修复建议：</strong>在重试按钮的onClick中调用retryMessage()
  </div>
  <table class="op-table">
    <thead><tr><th>#</th><th>操作</th><th>预期</th><th>实际</th><th>状态</th><th>截图</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>触发AI响应超时</td><td>显示超时提示+重试按钮</td><td>显示超时提示+重试按钮</td><td class="pass">✅</td><td><a href="screenshots/fr9-bound-02-01.png">截图</a></td></tr>
      <tr><td>2</td><td>点击重试按钮</td><td>重新发起请求</td><td>无响应</td><td class="fail">❌</td><td><a href="screenshots/fr9-bound-02-02.png">截图</a></td></tr>
    </tbody>
  </table>
</div>

<!-- Tauri 环境缺失示例（SKIP） -->
<div class="as-detail skipped" id="as-fr9-func-01">
  <h4>AS-FR9-FUNC-01: 多轮对话交互</h4>
  <div class="as-meta">
    <span class="badge P0">P0</span>
    <span class="badge FUNC">功能正确性</span>
    <span class="badge SKIP">⏭️ SKIP</span>
  </div>
  <div class="skip-reason">
    <strong>跳过原因：</strong>Tauri API 在纯浏览器环境中不可用（transformCallback undefined）<br/>
    <strong>涉及 Tauri API：</strong>useGlobalShortcuts、useAgentRuntime、useUpdate、useNetworkStatus<br/>
    <strong>下一步：</strong>启动 Tauri 桌面端（npm run tauri dev）后重新执行此 AS 的 E2E 测试
  </div>
  <table class="op-table">
    <thead><tr><th>#</th><th>操作</th><th>预期</th><th>实际</th><th>状态</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>导航到应用首页</td><td>页面加载</td><td>transformCallback undefined</td><td class="skip">⏭️ SKIP</td></tr>
    </tbody>
  </table>
</div>
```

---

### Step 5：AS 全量验证

逐条验证所有 AS，每个 AS 必须完成全部 4 层验证：

```
[AS-FR9-FUNC-01] 多轮对话基础交互
  来源: FR9, PRD行2223
  类型: 功能正确性

  验证链路:
  [P0] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P0] 模拟数据:     INSERT会话+消息 → SELECT验证入库            → ✅ 2条记录
  [P0] curl API:     POST /api/v1/agent/messages                  → ⏭️ SKIP(后端不可用)
  [P0] 浏览器E2E:    agent-browser skill → "你好" → 截图确认   → ⏭️ SKIP(Tauri不可用)

[AS-FR9-BOUND-01] 超长输入边界
  来源: FR9, PRD行2223
  类型: 边界与异常

  验证链路:
  [P1] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P1] 模拟数据:    模拟4097字符输入 → API返回长度校验          → ✅ 422
  [P1] curl API:    POST 4097字符文本                            → ⏭️ SKIP(后端不可用)
  [P1] 浏览器E2E:   agent-browser skill → 粘贴4097字符          → ⏭️ SKIP(Tauri不可用)

[AS-FR13-FUNC-01] MCP工具调用
  来源: FR13, PRD行2227
  类型: 功能正确性

  验证链路:
  [P0] lint/build:  npm run lint --quiet && npm run build         → ✅ 通过
  [P0] 模拟数据:    MCP工具注册 → 调用 → 返回结果                → ✅ JSON正确
  [P0] curl API:    POST /api/v1/mcp/call                         → ⏭️ SKIP(后端不可用)
  [P0] 浏览器E2E:   agent-browser skill → 点击MCP按钮           → ⏭️ SKIP(Tauri不可用)

  [结论] 由于 Tauri 环境限制，此 AS 无法在当前环境完成 E2E 验证
  [建议] 切换到 npm run tauri dev 后重新执行
```

---

## 报告输出规范

### 输出目录

```
.report/{YYYY-MM-DD}/           # 每日报告目录，自动创建
  ├── index.html                # 当日总报告入口
  ├── [epic-{n}].html           # Epic 级别报告
  ├── [fr-{n}].html             # FR 级别详细报告
  └── [as-{fr}-{dim}-{n}].html # 单个 AS 详细报告（可选）
```

- 目录不存在时自动创建
- 每次执行追加到当日目录，不覆盖历史报告
- 报告文件名格式：`{时间戳}-{范围}.html`

### HTML 报告格式要求

**必须元素**：
- 顶部状态栏：验收范围 / 执行时间 / 通过率 / 状态（✅/❌）
- 环境预检结果：Tauri状态 / 后端状态 / 前端状态
- AS 统计看板：总AS数 / 通过 / 失败 / 跳过 / 重试次数 / lint错误数 / build状态
- 失败项高亮区块：红色背景，标明 AS 编号 + 失败原因 + 修复建议
- 跳过项说明区块：橙色背景，标明 Tauri 环境缺失或后端不可用等跳过原因
- 通过项绿色标记：每个通过的 AS 带 ✅ 图标
- 可折叠详情：点击展开查看 E2E 截图、操作序列、控制台日志
- 进度条：通过率用进度条可视化

**禁止**：
- 纯文本报告
- 无格式的列表堆砌
- 截图不标注操作说明

**报告结构**：

```html
<!-- 示例结构 -->
<div class="report-header">
  <span class="status-badge PARTIAL">⚠️ 验收部分阻塞</span>
  <div class="env-precheck">
    <span class="env-badge TAURI-MISSING">⚠️ Tauri: 不可用（纯浏览器环境）</span>
    <span class="env-badge BACKEND-MISSING">⚠️ 后端: 不可用</span>
    <span class="env-badge FRONTEND-OK">✅ 前端: http://localhost:5173</span>
  </div>
  <div class="stats-grid">
    <div class="stat">AS总数: <strong>24</strong></div>
    <div class="stat">通过: <strong class="green">12</strong></div>
    <div class="stat">失败: <strong class="red">2</strong></div>
    <div class="stat">跳过: <strong class="orange">10</strong></div>
    <div class="stat">lint错误: <strong class="green">0</strong></div>
    <div class="stat">build: <strong class="green">✅</strong></div>
    <div class="stat">通过率: <strong>85.7%</strong></div>
  </div>
  <div class="progress-bar"><div class="fill" style="width:85.7%"></div></div>
</div>

<!-- Tauri 环境缺失说明 -->
<div class="tauri-block">
  <h2>⚠️ Tauri 环境缺失（10项 AS 跳过）</h2>
  <div class="tauri-explanation">
    以下 AS 依赖 Tauri API（invoke/listen），在纯浏览器环境中无法执行：
    <ul>
      <li>useGlobalShortcuts - 快捷键监听</li>
      <li>useAgentRuntime - Agent 运行时通信</li>
      <li>useUpdate - 版本更新检查</li>
      <li>useNetworkStatus - 网络状态监听</li>
    </ul>
    <strong>解决方案：</strong>启动 Tauri 桌面端后重新执行验收测试
    <code>npm run tauri dev</code>
  </div>
</div>

<div class="failure-block">
  <h2>🔴 失败项（2项）</h2>
  <div class="as-card failure">
    <div class="as-title">AS-FR13-FUNC-01: MCP工具调用</div>
    <div class="as-meta">来源: FR13, PRD行2227 | 类型: 功能正确性 | 优先级: P0</div>
    <div class="failure-reason">
      <strong>失败现象：</strong>点击MCP按钮无响应<br/>
      <strong>根因分析：</strong>onClick未绑定invoke('mcp_call')<br/>
      <strong>修复建议：</strong>在Button的onClick中调用window.__TAURI__.core.invoke('mcp_call', {...})
    </div>
  </div>
</div>

<div class="pass-block">
  <h2>🟢 通过项（12项）</h2>
  <!-- 表格形式，简洁列出 -->
</div>

<div class="detail-block collapsible">
  <h3>📋 E2E 详细操作记录</h3>
  <!-- 折叠内容：每个AS的操作序列、截图、控制台日志 -->
</div>
```

---

## 异常处理

### 重试策略

| 失败类型 | 重试次数 | 行为 |
|----------|----------|------|
| 单点失败（API/UI） | 2 次 | 等待 5s 后重试，分析日志修复 |
| 整体失败 | 3 次 | 深度反思，分析根因，输出阻塞报告 |
| lint/build 失败 | 不重试 | 立即修复 lint/build 错误 |
| Tauri 环境缺失 | 不重试 | 标记 SKIP，建议切换到 tauri dev |

### 阻塞报告格式

**类型 A - 代码缺陷（需修复代码）**：

```
🔴 验收失败 - 代码缺陷

**当前验收范围**: [Epic X / Story X.X / FR13]
**阻塞阶段**: [E2E测试]
**失败 AS**: [AS-FR13-FUNC-01]

**失败 AS 根因分析**:
- AS-FR13-FUNC-01:
  - 失败现象: [描述]
  - 根因分析: [代码哪里有问题]
  - 代码修复方案: [具体的修复步骤]

**需要人工帮助**:
1. [具体的代码修复步骤 1]
2. [具体的代码修复步骤 2]

**禁止的行为**:
- ❌ 删除失败的 AS
- ❌ 修改 AS 预期结果迁就代码
- ❌ 降低验收标准
```

**类型 B - 环境缺失（需切换环境，不算验收失败）**：

```
⚠️ 验收跳过 - Tauri 环境缺失

**当前验收范围**: [Epic X / Story X.X / FR13]
**跳过阶段**: [E2E测试]
**跳过 AS**: [AS-FR9-FUNC-01, AS-FR13-FUNC-01, ...] 共 N 项

**跳过原因**: Tauri API 在纯浏览器环境中不可用

**涉及 Tauri API**:
- useGlobalShortcuts (listen)
- useAgentRuntime (listen/invoke)
- useUpdate (invoke)
- useNetworkStatus (listen)
- pluginSidebarRegistry (getBadges)

**解决方案**:
1. 停止当前 Vite dev server
2. 运行 npm run tauri dev 启动 Tauri 桌面端
3. 重新执行 prd-acceptance --scope [范围]

**状态判定**: SKIP（不算验收失败）
**说明**: 这是开发环境约束而非代码缺陷。切换到 tauri dev 后请重新验收。
```

---

## 输出格式

### 验收报告（HTML格式）

执行完成后，生成 HTML 报告到 `.report/{YYYY-MM-DD}/` 目录，参考上方"报告输出规范"章节的 HTML 模板生成。

**报告文件**：
- `.report/{YYYY-MM-DD}/index.html` — 当日总报告入口
- 每个 AS 的 E2E 截图保存在同目录 `screenshots/` 子目录

**报告内容**：
- 顶部状态栏（范围/时间/通过率/状态）
- 环境预检结果（Tauri/后端/前端三色标签）
- AS 统计看板（总/通过/失败/跳过/lint/build）
- Tauri 环境缺失说明（橙色区块，列出涉及 API 和解决方案）
- 失败项高亮区块（红色背景，附截图 + 修复建议）
- 通过项表格（绿色标记，简洁列出）
- E2E 详细记录（HTML格式，每个 AS 的操作序列表格 + 截图 + 控制台日志）
- 进度条（通过率可视化）

**HTML 样式规范**：使用内联 CSS，确保单文件可独立打开：
- 状态色：#22c55e(绿-通过) / #ef4444(红-失败) / #f59e0b(橙-跳过/重试) / #3b82f6(蓝-信息)
- 字体：system-ui, sans-serif
- 表格：边框线清晰，hover 高亮行
- 截图：thumbnail 显示，点击放大
- 失败项：红色背景 #1f0a0a，红色边框 #ef4444
- 跳过项：橙色背景 #1a1400，橙色边框 #f59e0b
- 可折叠区块：`<details><summary>` 实现

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
