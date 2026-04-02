# Proposal: Agent Tools System Refactoring Based on OpenClaw

## Why

当前 AI-Automated-office 的 Agent Tools 系统虽然已实现部分核心工具，但与参考项目 OpenClaw 的完整工具架构相比存在显著差距：

1. **缺乏 Profile 驱动的工具筛选机制**：OpenClaw 通过 `minimal/coding/messaging/full` 四种 Profile 动态控制工具集，当前系统仅有 Plan 模式的 read-only 过滤
2. **浏览器工具差距巨大**：OpenClaw 实现了完整的 Playwright 集成（8个子模块），当前系统仅为 CDP 框架占位
3. **缺少内存与记忆系统工具**：OpenClaw 有 `memory_search`/`memory_get`，当前系统无对应实现
4. **缺少会话与子 Agent 管理**：OpenClaw 有完整的 `sessions_spawn/yield/send` 机制，当前系统仅有 `agent_delegate` 占位
5. **缺少媒体处理工具**：OpenClaw 支持 image/tts/pdf/canvas，当前系统无对应能力

通过借鉴 OpenClaw 的成熟设计，可以快速补齐能力差距，提升 Agent 的自动化水平。

## What Changes

### 核心架构变更

**1. 引入 Profile 驱动的工具筛选机制**

参考 OpenClaw `tool-catalog.ts`，实现工具 Profile 系统：

```rust
pub enum ToolProfile {
    Minimal,   // 仅基础工具 (session_status)
    Coding,   // 编码工具集 (read/write/edit/exec/web/memory等)
    Messaging, // 消息工具集 (sessions/message)
    Full,     // 全功能
}
```

**2. 重构 Browser Tool 为完整 Playwright 集成**

参考 OpenClaw `pw-tools-core.*`，重构为 8 个功能子模块：

| 子模块 | 功能 | 状态 |
|:------|:-----|:-----|
| activity | 页面错误/网络/控制台监控 | 新实现 |
| downloads | 文件上传/对话框/下载处理 | 新实现 |
| interactions | 点击/输入/拖拽/批量操作 | 新实现 |
| responses | HTTP 响应体拦截 | 新实现 |
| snapshot | ARIA/AI 快照生成 | 新实现 |
| state | 离线/Headers/地理位置/设备模拟 | 新实现 |
| storage | Cookies/LocalStorage/SessionStorage | 新实现 |
| trace | 性能追踪录制 | 新实现 |

**3. 新增 Memory Tool**

参考 OpenClaw `memory-tool.ts`，实现向量语义搜索：

```
memory_search: 语义搜索记忆内容
memory_get: 按 ID 获取记忆详情
```

**4. 新增 Sessions Tool**

参考 OpenClaw `sessions-*.ts`，实现完整会话管理：

```
sessions_list: 列出可用会话
sessions_history: 获取会话历史
sessions_send: 发送消息到会话
sessions_spawn: 派生子 Agent
sessions_yield: 控制权让渡
session_status: 会话状态查询
```

**5. 新增 Media Tools**

参考 OpenClaw `image-tool.ts`/`tts-tool.ts`，实现媒体处理：

```
image_understand: 图片内容理解
tts_speak: 文本转语音
```

**6. 新增 Automation Tools**

```
cron_schedule: 定时任务调度
cron_list: 列出定时任务
cron_cancel: 取消定时任务
```

## Capabilities

### New Capabilities

| Capability ID | 描述 | Profile |
|:--------------|:-----|:--------|
| `profile-driven-tools` | Profile 驱动的工具筛选机制 | 全局 |
| `browser-full` | 完整 Playwright 浏览器自动化 | coding |
| `memory-search` | 语义记忆搜索 | coding |
| `memory-get` | 记忆详情获取 | coding |
| `sessions-management` | 完整会话生命周期管理 | coding |
| `media-processing` | 图片理解和语音合成 | coding |
| `cron-automation` | 定时任务调度 | coding |

### Modified Capabilities

| Capability ID | 修改内容 |
|:--------------|:---------|
| `tool-execution-pipeline` | 增强 Profile 过滤逻辑 |

## Impact

### 后端 (Rust/Tauri)

```
src-tauri/src/agent/tools/
├── mod.rs
├── registry.rs              # 增强 Profile 支持
├── pipeline.rs              # Profile 过滤集成
├── profile.rs               # [NEW] Profile 定义和工具映射
├── core/                    # [EXISTING]
│   ├── mod.rs
│   ├── core.rs
│   ├── filesystem.rs
│   ├── shell.rs
│   ├── web.rs
│   ├── browser.rs          # [REFACTOR] 完整 Playwright 集成
│   └── document.rs
├── memory/                  # [NEW]
│   ├── mod.rs
│   ├── memory_search.rs
│   └── memory_get.rs
├── sessions/               # [NEW]
│   ├── mod.rs
│   ├── sessions_list.rs
│   ├── sessions_history.rs
│   ├── sessions_send.rs
│   ├── sessions_spawn.rs
│   ├── sessions_yield.rs
│   └── session_status.rs
├── media/                   # [NEW]
│   ├── mod.rs
│   ├── image_understand.rs
│   └── tts_speak.rs
└── automation/              # [NEW]
    ├── mod.rs
    ├── cron_schedule.rs
    ├── cron_list.rs
    └── cron_cancel.rs
```

### 新增依赖

| 依赖 | 用途 | 版本 |
|:-----|:-----|:-----|
| playwright | 浏览器自动化 | 1.x |
| tokio-cron-scheduler | 定时任务调度 | 0.12.x |
| sqlite-vec | 向量存储 | 0.1.x |

### 配置变更

```yaml
# tools 配置
tools:
  profile: "coding"  # 当前使用的 Profile
  profiles:
    minimal:
      allow: ["session_status", "system_get_app_version"]
    coding:
      allow: ["read", "write", "edit", "exec", "web_search", "web_fetch", 
              "memory_search", "memory_get", "sessions_list", "sessions_history",
              "sessions_send", "sessions_spawn", "browser_interact"]
    messaging:
      allow: ["sessions_list", "sessions_history", "sessions_send", "message_send"]
    full:
      allow: []  # 无限制
```

### 前端

无直接变更（工具通过 Agent 对话调用）

## Alternatives Considered

### Alternative 1: 仅扩展现有工具，不引入 Profile

**缺点**: 无法实现按场景动态切换工具集，工具权限管理不够灵活

### Alternative 2: 直接移植 OpenClaw TypeScript 实现

**缺点**: 需要大量 TypeScript → Rust 转换工作，且与现有 Rust 架构整合困难

### Selected: 渐进式重构 + Profile 机制引入

**优点**:
1. 保留现有 Rust 架构优势
2. 引入 OpenClaw 的 Profile 驱动设计
3. 按优先级逐步实现各模块
4. 与现有工具注册/权限系统无缝集成
