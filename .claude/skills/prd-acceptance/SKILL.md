---
name: prd-acceptance
description: PRD 驱动的验收测试执行器。以 PRD 文档为唯一真相来源，解析 FR 功能需求，扫描代码实现，生成验收标准（AS），执行验收测试。当用户说"帮我验收 PRD"、"验收 Epic X"、"验收 Story X.X"、"验收 FRXX"、"帮我测试 XX 模块是否满足需求" 时触发。
---

# PRD Acceptance Tester

**核心原则**：PRD 文档是唯一的验收基准（Source of Truth），task.json 仅供内部任务跟踪，不参与验收。

## 核心流程

```
环境预检 → 自动启动缺失服务 → 验证全部就绪 → PRD 解析 FR → 代码实现扫描 → 生成 AS → E2E 测试 → HTML 报告
```

---

## 验收范围解析

### 支持的输入格式

| 用户输入 | 解析目标 |
|----------|----------|
| `Epic 2` / `epic2` | PRD 中 Epic 2 及关联的所有 FR |
| `Story 2.1` / `story2.1` | PRD 中 Story 2.1 及关联的 FR |
| `FR13` / `FR-13` | PRD 中 FR13 及依赖的 FR |
| `AI Agent` / `Agent模块` | PRD 中 AI Agent 核心能力（FR9-FR19） |
| `全部` / `all` | PRD 中所有 FR |
| 空 / 默认 | 询问用户要验收的范围 |

### 解析流程

1. 读取 `_bmad-output/planning-artifacts/prd.md`
2. 用正则匹配目标章节：
   - `Epic N` → 匹配 `## Epic N` 标题下的所有 Story 和 FR
   - `Story N.N` → 匹配该 Story 下的所有 FR
   - `FR\d+` → 匹配该 FR 编号的定义
   - `AI Agent核心能力` → 匹配 `## AI Agent 核心功能需求` 章节
3. 提取所有关联的 FR 编号和需求描述（**这是验收的唯一依据**）

---

## Step 0：环境就绪保障

### 0a. 环境状态检测

并行检测三个服务：

```bash
# 1. Tauri Runtime 检测
node -e "
  try {
    const { invoke } = require('@tauri-apps/api/core');
    console.log('TAURI:available');
  } catch (e) {
    console.log('TAURI:unavailable');
  }
"

# 2. Go 云端后端检测
curl -s -o /dev/null -w "BACKEND:%{http_code}" http://localhost:3000/health 2>/dev/null || echo "BACKEND:unavailable"

# 3. Vite 前端检测
curl -s -o /dev/null -w "FRONTEND:%{http_code}" http://localhost:1420 2>/dev/null || echo "FRONTEND:unavailable"
```

### 0b. 环境就绪判定

```
┌─────────────────────────────────────────────────────────────┐
│                    环境就绪检查流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 检测三服务状态                                      │
│     ↓                                                       │
│  Step 2: 统计缺失服务数量                                    │
│     ↓                                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 缺失数量 = 0 → 全部就绪，继续 Step 1                   │ │
│  │ 缺失数量 > 0 → 进入自动启动流程                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 0c. 自动启动缺失服务

**启动优先级**：前端 → Go 后端 → Tauri（按依赖顺序）

#### 启动 Tauri 桌面端（含前端）

```bash
# 检查是否有 tauri 进程在运行
ps aux | grep -i tauri | grep -v grep

# 如果没有，在后台启动（Windows 需使用 start /b 或 PowerShell）
cd "I:\AI-Automated-office" && npm run tauri dev &
TAURI_PID=$!

# 等待 Tauri 启动（最多 60s）
for i in {1..60}; do
  sleep 1
  curl -s -o /dev/null -w "%{http_code}" http://localhost:1420 2>/dev/null && break
done

# 验证 Tauri API 可用
node -e "
  try {
    const { invoke } = require('@tauri-apps/api/core');
    invoke('get_app_version').then(() => {
      console.log('TAURI:running');
    }).catch(() => {
      console.log('TAURI:api_not_ready');
    });
  } catch (e) {
    console.log('TAURI:failed');
  }
"
```

#### 启动 Go 云端后端

```bash
# 检查是否有 go 进程在运行
ps aux | grep "cloud-server" | grep -v grep

# 如果没有，在后台启动
cd "I:\AI-Automated-office\cloud-server"
# 首次运行需要初始化 go mod
go mod tidy 2>/dev/null || true
go run main.go &
BACKEND_PID=$!

# 等待后端就绪（最多 30s）
for i in {1..30}; do
  sleep 1
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null && break
done
```

#### 启动 Vite 前端（备用）

```bash
# 如果 Tauri 未运行但需要纯前端测试
cd "I:\AI-Automated-office"
npm run dev &
FRONTEND_PID=$!

# 等待前端就绪（最多 30s）
for i in {1..30}; do
  sleep 1
  curl -s -o /dev/null -w "%{http_code}" http://localhost:1420 2>/dev/null && break
done
```

### 0d. 启动失败处理策略

```
启动失败时的处理流程：

1. 首次失败 → 分析错误日志，尝试修复
   - 端口被占用 → 查找并 kill 占用进程
   - 依赖缺失 → 安装依赖
   - 配置错误 → 检查并修复配置
   - 代码错误 → 记录错误，继续其他服务

2. 第二次尝试 → 使用修复后的配置重试

3. 第三次尝试仍失败 → 停止启动流程
   - 输出详细的阻塞报告
   - 标明需要人工介入的具体问题
   - 不执行 E2E 测试（因为环境不完整）

4. 阻塞报告格式：
   ```
   🔴 环境启动阻塞 - 需要人工介入

   **缺失服务**: [服务名]
   **失败阶段**: [启动/初始化/健康检查]
   **错误日志**: [最后 50 行日志]
   **已尝试修复**:
     - 尝试 1: [操作] → [结果]
     - 尝试 2: [操作] → [结果]
     - 尝试 3: [操作] → [结果]

   **需要人工帮助**:
     1. [具体步骤 1]
     2. [具体步骤 2]

   **状态**: 阻塞
   ```
```

### 0e. 环境就绪确认

**全部就绪的标准**：

| 服务 | 就绪条件 |
|------|----------|
| Tauri | `TAURI:available` + 端口 1420 可访问 |
| Go 后端 | `BACKEND:200` + 健康检查通过 |
| Vite 前端 | 端口 1420 可访问 |

```
环境状态: ✅ 全部就绪
├── Tauri Runtime: ✅ http://localhost:1420
├── Go Backend:    ✅ http://localhost:3000
└── Vite Frontend: ✅ http://localhost:1420
```

---

## Step 1：PRD 解析 FR

### 1a. 读取 PRD 文档

```bash
# 读取 PRD 功能需求章节
rg "^##? (AI Agent 核心功能需求|Functional Requirements|Epic \d)" \
  "_bmad-output/planning-artifacts/prd.md" -n
```

### 1b. 提取 FR 列表

对于目标范围，提取所有 FR 编号和描述：

```
FR9: 多轮对话能力
  → 多轮会话上下文管理
  → 消息历史存储和检索
  → 对话状态机

FR10: 工具调用
  → Core Tools 注册和调用
  → MCP Tools 集成
  → 工具参数处理
```

---

## Step 2：代码实现扫描

### 2a. FR 代码覆盖率扫描

```bash
# 示例：扫描 FR9（多轮对话）相关代码
rg -l "session|messages|conversation" --type ts --type rust -g "src/**" -g "src-tauri/**"
```

### 2b. FR 实现状态判定

| 状态 | 含义 | 标记 |
|------|------|------|
| `IMPLEMENTED` | 代码存在且逻辑完整 | ✅ |
| `PARTIAL` | 代码存在但不完整 | ⚠️ |
| `NOT_FOUND` | 未找到相关代码 | ❌ |
| `PLACEHOLDER` | 只有注释或空函数 | 🔶 |

### 2c. 关键逻辑验证

```bash
# 示例：验证会话创建逻辑
rg "create.*session|session.*create" --type ts -A 5 -g "src/features/agent/**"
```

---

## Step 3：构建验证

```bash
# 前端构建
npm run lint && npm run build

# Rust 后端构建（如涉及）
cd src-tauri && cargo build --release 2>&1 | tail -20
```

---

## Step 4：生成验收标准（AS）

根据扫描结果，为每个 FR 生成 AS：

### AS 结构（强制 7 字段）

```
AS-[FR编号]-[维度缩写]-[序号]
来源：FR-XX（对应PRD具体条目和行号）
类型：[功能/边界/一致性/UI/安全/性能]
前置条件：[必须可复现的环境状态]
操作步骤：[精确到每一步]
预期结果：[精确到字段和值的预期]
验证方式：[lint/build/代码扫描/E2E]
优先级：P0/P1/P2
```

### 维度要求

| 维度 | 必须有 | 说明 |
|------|--------|------|
| **功能正确性** | ✅ | FR 描述的核心功能是否实现 |
| **边界与异常** | ✅ | 无效输入、超限、空状态、并发 |
| **前后端一致性** | ✅ | API 契约、类型一致性 |
| **UI/交互** | ✅ | 按钮、输入、反馈、加载态 |

---

## Step 5：E2E 浏览器测试

### 5a. 前置条件确认

执行 E2E 前必须确认：

```
环境就绪: ✅ 全部服务正常运行
├── Tauri:      ✅ http://localhost:1420
├── Go Backend:  ✅ http://localhost:3000/health
└── 前端:        ✅ 可交互
```

### 5b. 使用 agent-browser skill

```
1. browser_navigate → http://localhost:1420
2. browser_snapshot → 获取页面结构
3. 执行 AS 操作步骤
4. 截图记录结果
5. 检查控制台错误
```

### 5c. 测试维度

| 检查项 | 操作 | 预期结果 |
|--------|------|----------|
| UI 渲染 | 截图各字段 | 每个字段可见 |
| 文本渲染 | 检查中文 | 无乱码 |
| 加载态 | 异步操作 | 显示加载动画 |
| 空状态 | 无数据页面 | 显示空状态 |
| 错误态 | 异常操作 | 显示错误提示 |
| 表单验证 | 提交空表单 | 显示错误提示 |
| 控制台 | 触发操作 | 无 Error 日志 |

---

## Step 6：AS 全量验证

### 验证链路

```
[AS-FR9-FUNC-01] 多轮对话-会话创建
  来源: FR9, PRD行2223
  类型: 功能正确性

  验证链路:
  [P0] lint/build:  npm run lint && npm run build              → ✅ 通过
  [P0] 代码扫描:    session manager 存在 create_session         → ✅ IMPLEMENTED
  [P0] E2E:        agent-browser → 输入"你好" → 验证响应      → ✅ 通过
```

---

## 报告输出规范

### 输出目录

```
.report/{YYYY-MM-DD}/{范围}/
  ├── index.html              # 总报告
  ├── as-{fr}-{n}.html      # 单个 AS 报告
  └── screenshots/           # 截图
```

### HTML 报告格式

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PRD 验收报告</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #1E3A5F; color: white; padding: 20px; border-radius: 8px; }
    .env-status { display: flex; gap: 20px; margin: 20px 0; }
    .env-ok { color: #22c55e; }
    .env-fail { color: #ef4444; }
    .fr-block { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .fr-implemented { border-left: 4px solid #22c55e; }
    .fr-partial { border-left: 4px solid #f59e0b; }
    .fr-notfound { border-left: 4px solid #ef4444; background: #fef2f2; }
    .stats { display: flex; gap: 30px; margin: 20px 0; }
    .stat { font-size: 24px; font-weight: bold; }
    .implemented { color: #22c55e; }
    .partial { color: #f59e0b; }
    .notfound { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .pass { color: #22c55e; }
    .fail { color: #ef4444; }
    .skip { color: #f59e0b; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRD 验收报告</h1>
    <div>范围: {范围} | 时间: {时间} | FR数: {FR数} | AS数: {AS数}</div>
  </div>

  <div class="env-status">
    <div class="env-ok">✅ Tauri Runtime: http://localhost:1420</div>
    <div class="env-ok">✅ Go Backend: http://localhost:3000</div>
    <div class="env-ok">✅ Frontend: http://localhost:1420</div>
  </div>

  <div class="stats">
    <div class="stat implemented">✅ 已实现: {IMPLEMENTED数}</div>
    <div class="stat partial">⚠️ 部分: {PARTIAL数}</div>
    <div class="stat notfound">❌ 未实现: {NOT_FOUND数}</div>
    <div class="stat">总计: {FR总数}</div>
  </div>

  <div class="fr-list">
    <!-- 每个 FR 一段 -->
    <div class="fr-block fr-implemented" id="fr9">
      <h2>FR9 - 多轮对话 <span class="pass">✅ IMPLEMENTED</span></h2>
      <div class="files">
        <code>src/features/agent/components/ChatPanel.tsx</code>
        <code>src-tauri/src/agent/session/manager.rs</code>
      </div>
      <table>
        <tr><th>AS</th><th>类型</th><th>lint/build</th><th>代码扫描</th><th>E2E</th></tr>
        <tr><td>AS-FR9-FUNC-01</td><td>功能</td><td class="pass">✅</td><td class="pass">✅</td><td class="pass">✅</td></tr>
      </table>
    </div>

    <div class="fr-block fr-notfound" id="fr220">
      <h2>FR220 - 售后服务工单 <span class="fail">❌ NOT_FOUND</span></h2>
      <div class="files">未找到相关代码</div>
      <div class="blocker">
        <strong>阻塞:</strong> 依赖 Story 15.1 未开发
      </div>
    </div>
  </div>
</body>
</html>
```

---

## AS 判定规则

| 代码扫描结果 | AS 标记 | 含义 |
|-------------|---------|------|
| 找到完整实现 | ✅ IMPLEMENTED | 代码满足 FR 描述 |
| 找到部分实现 | ⚠️ PARTIAL | 代码部分满足 FR |
| 未找到代码 | ❌ NOT_FOUND | FR 尚未实现 |
| 只有占位符 | 🔶 PLACEHOLDER | 有框架但无实质逻辑 |

---

## 快速参考

| 场景 | 命令 |
|------|------|
| 验收 Epic 2 | `prd-acceptance` → 输入 "Epic 2" |
| 验收单个 FR | `prd-acceptance` → 输入 "FR9" |
| 验收 Agent 模块 | `prd-acceptance` → 输入 "AI Agent" |
| 验收全部 | `prd-acceptance` → 输入 "全部" |

---

## 环境启动阻塞处理流程图

```
┌─────────────────────────────────────────────────────────────┐
│                  环境就绪保障流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 检测三服务状态                                      │
│     ├── Tauri Runtime: ?                                    │
│     ├── Go Backend: ?                                       │
│     └── Frontend: ?                                         │
│     ↓                                                       │
│  Step 2: 统计缺失服务                                        │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 缺失数量 = 0                                         │   │
│  │ → ✅ 全部就绪，继续验收                               │   │
│  └─────────────────────────────────────────────────────┘   │
│     ↓ 缺失数量 > 0                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 启动缺失服务（最多尝试 3 次）                         │   │
│  │                                                     │   │
│  │ 尝试 1: 首次启动                                      │   │
│  │   ├── 成功 → 继续                                    │   │
│  │   └── 失败 → 分析错误 → 修复 → 尝试 2               │   │
│  │                                                     │   │
│  │ 尝试 2: 修复后重试                                    │   │
│  │   ├── 成功 → 继续                                    │   │
│  │   └── 失败 → 分析错误 → 修复 → 尝试 3               │   │
│  │                                                     │   │
│  │ 尝试 3: 最终尝试                                      │   │
│  │   ├── 成功 → 继续                                    │   │
│  │   └── 失败 → 🔴 输出阻塞报告，停止验收              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
