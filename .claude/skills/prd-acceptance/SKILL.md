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

### AS 生成规则

为每条 FR 生成结构化验收标准：

```
AS-[FR编号]-[序号]
条件：[具体前置条件]
操作：[执行动作]
预期：[预期结果]
验证：[验证方式]
```

### 示例：FR13 MCP 接入

```
AS-FR13-01
条件：MCP 服务配置已就绪
操作：调用 MCP 工具（hr_employee_list）
预期：返回员工列表 JSON
验证：SQL 查询验证数据一致 + 浏览器检查渲染

AS-FR13-02
条件：MCP 服务异常（网络断开）
操作：触发 MCP 工具调用
预期：降级提示，不崩溃
验证：浏览器控制台无 Error 级别日志
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

通过 agent-browser skill 执行浏览器 E2E 测试：

1. **UI 渲染测试**：检查组件是否正确渲染，无警告/错误
2. **数据传递测试**：检查前端状态与后端数据一致性
3. **操作路径测试**：模拟各种可能的用户操作路径
4. **前后端一致性**：检查 API 响应与 UI 显示是否一致

---

### Step 4：AS 全量验证

逐条验证所有 AS：

```
[AS-FR9-01] 多轮对话基础交互
  ✅ lint/build: 通过
  ✅ 模拟数据: 会话创建成功
  ✅ curl API: 201 Created
  ✅ 浏览器 E2E: 输入框可用，消息显示正常

[AS-FR13-01] MCP 服务接入
  ✅ lint/build: 通过
  ✅ 模拟数据: MCP 工具注册成功
  ✅ curl API: 工具调用返回正确
  ❌ 浏览器 E2E: 按钮点击后无响应

[重试 1/2] 检查 MCP 按钮事件绑定...
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

### 验收报告

```markdown
# PRD 验收报告 - [验收范围]

**执行时间**: YYYY-MM-DD HH:mm
**执行人**: PRD Acceptance Tester
**范围**: [Epic 2 / Story 2.1 / FR13 / Agent 模块]

## AS 总览

| AS 编号 | 描述 | 状态 | 验证方式 |
|---------|------|------|----------|
| AS-FR9-01 | 多轮对话基础交互 | ✅ PASS | 模拟 + E2E |
| AS-FR9-02 | 历史会话管理 | ✅ PASS | API + E2E |
| AS-FR13-01 | MCP 工具调用 | ✅ PASS | 模拟 + API |

**通过率**: 12/12 (100%)

## 测试详情

### AS-FR9-01: 多轮对话基础交互

**条件**: 用户已登录
**操作**: 发送消息 "你好"
**预期**: AI 回复，进入多轮对话
**验证结果**:
- [x] npm run lint: 通过
- [x] npm run build: 成功
- [x] 模拟数据: 会话创建成功
- [x] curl API: 201 Created
- [x] 浏览器 E2E: 消息显示正常

**结论**: ✅ PASS

---

## 执行摘要

- 总 AS 数：12
- 通过：12
- 失败：0
- 阻塞：0
- **最终结论**: ✅ 验收通过

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
