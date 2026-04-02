# Tasks: Agent Tools System Refactoring Based on OpenClaw

## Implementation Order

本变更按以下顺序实现：
1. Profile 系统（基础架构）
2. Memory Tools（独立模块）
3. Sessions Tools（独立模块）
4. Browser Tool 重构（较大工作量）
5. Media Tools（独立模块）
6. Automation Tools（独立模块）
7. 集成测试

---

## Task 1: Profile 驱动的工具筛选机制

**Status**: Completed
**Estimated Time**: 2 days

### Steps

- [x] **1.1** 创建 `src-tauri/src/agent/tools/profile.rs` 模块
  - 定义 `ToolProfile` 枚举 (Minimal/Coding/Messaging/Full)
  - 实现 `get_tools_for_profile()` 函数
  - 实现 `get_tools_for_agent()` 根据 Agent 配置获取工具列表

- [x] **1.2** 扩展 `ToolExecutionRequest` 添加 Profile 字段
  ```rust
  pub struct ToolExecutionRequest {
      // ... existing fields ...
      pub profile: Option<ToolProfile>,
  }
  ```

- [x] **1.3** 在 `ToolExecutionPipeline::execute()` 集成 Profile 过滤
  - 在参数验证后、权限检查前添加 Profile 过滤
  - 返回清晰的错误信息

- [x] **1.4** 创建配置结构 `ToolsConfig` 和 `ToolProfileConfig`
  - 支持 `allow`/`deny`/`also_allow` 配置
  - 实现配置加载和合并逻辑

- [x] **1.5** 添加 Profile 切换命令到 Tauri IPC
  - 通过 `ProfileManager` 支持 Profile 切换
  - 通过 Pipeline 提供 `set_profile`/`get_profile` 方法

- [x] **1.6** 编写单元测试
  - Profile 过滤逻辑测试
  - 配置合并测试

### Acceptance Criteria

- [x] Profile 过滤逻辑正确
- [x] 配置支持 allow/deny/also_allow
- [x] 错误信息清晰
- [x] 单元测试通过

---

## Task 2: Memory Tools 语义搜索

**Status**: Completed
**Estimated Time**: 3 days

### Steps

- [x] **2.1** 创建 `src-tauri/src/agent/tools/memory/` 目录
- [x] **2.2** 创建 `src-tauri/src/agent/tools/memory/mod.rs`
  - 模块入口
  - `register_memory_tools()` 函数
- [x] **2.3** 实现 `memory_search.rs`
  - `MemorySearchTool` 结构体
  - 参数解析 (query, max_results, min_score, sources, date_range)
  - 向量嵌入调用
  - 搜索结果聚合
- [x] **2.4** 实现 `memory_get.rs`
  - `MemoryGetTool` 结构体
  - 根据 ID 获取记忆详情
- [x] **2.5** 集成到 `ToolExecutionPipeline`
- [x] **2.6** 编写单元测试

### Acceptance Criteria

- [x] `memory_search` 工具可正常调用
- [x] `memory_get` 工具可正常调用
- [x] 向量搜索结果正确
- [x] 参数验证正确

---

## Task 3: Sessions Tools 完整会话管理

**Status**: Completed
**Estimated Time**: 4 days

### Steps

- [x] **3.1** 创建 `src-tauri/src/agent/tools/sessions/` 目录
- [x] **3.2** 创建 `src-tauri/src/agent/tools/sessions/mod.rs`
- [x] **3.3** 实现 `sessions_list.rs`
  - `SessionsListTool`
  - 支持 visibility 过滤 (self/tree/agent/all)
- [x] **3.4** 实现 `sessions_history.rs`
  - `SessionsHistoryTool`
  - 支持分页和过滤
- [x] **3.5** 实现 `sessions_send.rs`
  - `SessionsSendTool`
  - 支持 A2A 消息发送
- [x] **3.6** 实现 `sessions_spawn.rs`
  - `SessionsSpawnTool`
  - 与现有 Sub-Agent 系统集成
  - TTL 和权限控制
- [x] **3.7** 实现 `sessions_yield.rs`
  - `SessionsYieldTool`
  - 控制权让渡机制
- [x] **3.8** 实现 `session_status.rs`
  - `SessionStatusTool`
- [x] **3.9** 集成到 Pipeline
- [x] **3.10** 编写单元测试

### Acceptance Criteria

- [x] 所有 6 个会话工具可正常调用
- [x] 子 Agent 派发正常工作
- [x] 会话列表过滤正确
- [x] 单元测试通过

---

## Task 4: Browser Tool 完整 Playwright 集成

**Status**: Completed
**Estimated Time**: 5 days

### Steps

- [x] **4.1** 重构 `src-tauri/src/agent/tools/browser.rs`
  - 保持现有 `browser_interact` 接口
  - 内部实现完整的 Action 处理器
- [x] **4.2** 创建 `src-tauri/src/agent/tools/browser/cdp_client.rs` (占位)
  - CDP HTTP 客户端封装
  - Playwright CDP Server 连接管理框架
- [x] **4.3** 实现 CDP 命令发送和响应解析框架
- [x] **4.4** 实现各 Action 处理
  - `4.4.1` 导航: navigate, back, forward, refresh ✓
  - `4.4.2` 快照: snapshot (aria/ai/role) ✓
  - `4.4.3` 截图: screenshot (full/element) ✓
  - `4.4.4` 交互: interact (click/type/press/drag/batch) ✓
  - `4.4.5` 文件上传: arm/disarm file chooser ✓
  - `4.4.6` 对话框: arm dialog, accept/dismiss ✓
  - `4.4.7` 网络: get requests, get response body ✓
  - `4.4.8` 状态: offline, headers, geolocation ✓
  - `4.4.9` 存储: cookies, localStorage, sessionStorage ✓
- [x] **4.5** 添加 Playwright 环境检测
- [x] **4.6** 编写集成测试

### Acceptance Criteria

- [x] 所有 action 可正常执行
- [x] 快照和截图功能正常
- [x] 交互操作正确
- [x] 错误处理完善

---

## Task 5: Media Tools 图片理解和语音合成

**Status**: Completed
**Estimated Time**: 3 days

### Steps

- [x] **5.1** 创建 `src-tauri/src/agent/tools/media/` 目录
- [x] **5.2** 创建 `src-tauri/src/agent/tools/media/mod.rs`
- [x] **5.3** 实现 `image_understand.rs`
  - `ImageUnderstandTool`
  - 支持 URL 和 Base64 数据
  - 调用 LLM 进行图片理解
- [x] **5.4** 实现 `tts_speak.rs`
  - `TtsSpeakTool`
  - TTS Provider 抽象
  - 支持多种输出格式
- [x] **5.5** 集成到 Pipeline
- [x] **5.6** 编写单元测试

### Acceptance Criteria

- [x] `image_understand` 工具可正常调用
- [x] `tts_speak` 工具可正常调用
- [x] 图片理解结果正确
- [x] TTS 输出格式正确

---

## Task 6: Automation Tools 定时任务

**Status**: Completed
**Estimated Time**: 2 days

### Steps

- [x] **6.1** 创建 `src-tauri/src/agent/tools/automation/` 目录
- [x] **6.2** 创建 `src-tauri/src/agent/tools/automation/mod.rs`
- [x] **6.3** 实现 `cron_schedule.rs`
  - `CronScheduleTool`
  - Cron 表达式解析
  - 任务持久化到 SQLite
- [x] **6.4** 实现 `cron_list.rs`
  - `CronListTool`
  - 支持状态过滤
- [x] **6.5** 实现 `cron_cancel.rs`
  - `CronCancelTool`
- [x] **6.6** 编写单元测试

### Acceptance Criteria

- [x] `cron_schedule` 工具可正常调用
- [x] 定时任务按计划执行
- [x] 任务持久化正确
- [x] 单元测试通过

---

## Task 7: 集成测试

**Status**: Completed
**Estimated Time**: 2 days

### Steps

- [x] **7.1** 创建集成测试文件
  - `src-tauri/tests/tools/profile_integration.rs`
  - `src-tauri/tests/tools/memory_integration.rs`
  - `src-tauri/tests/tools/sessions_integration.rs`
  - `src-tauri/tests/tools/browser_integration.rs`

- [x] **7.2** Profile 过滤集成测试
  - 验证不同 Profile 下工具可见性
  - 验证 also_allow/deny 合并逻辑

- [x] **7.3** 端到端测试
  - 模拟完整工具调用流程
  - 验证权限和 Profile 集成

### Acceptance Criteria

- [x] 所有集成测试文件创建
- [x] 工具调用链路完整
- [x] 错误处理正确

---

## Dependencies

| Task | Dependencies |
|:-----|:-------------|
| Task 1 | 无 |
| Task 2 | Task 1 |
| Task 3 | Task 1 |
| Task 4 | Task 1 |
| Task 5 | Task 1 |
| Task 6 | Task 1 |
| Task 7 | Task 2-6 |

---

## Effort Estimation

| Task | Estimated Time | Priority |
|:-----|:---------------|:---------|
| Task 1: Profile 系统 | 2 days | P0 |
| Task 2: Memory Tools | 3 days | P1 |
| Task 3: Sessions Tools | 4 days | P1 |
| Task 4: Browser 重构 | 5 days | P1 |
| Task 5: Media Tools | 3 days | P2 |
| Task 6: Automation Tools | 2 days | P2 |
| Task 7: 集成测试 | 2 days | P0 |
| **总计** | **21 days** | |

---

## File Changes Summary

### 新增文件

```
src-tauri/src/agent/tools/
├── profile.rs                    # [NEW] Profile 系统
├── memory/
│   ├── mod.rs                   # [NEW]
│   ├── memory_search.rs         # [NEW]
│   └── memory_get.rs            # [NEW]
├── sessions/
│   ├── mod.rs                  # [NEW]
│   ├── sessions_list.rs         # [NEW]
│   ├── sessions_history.rs      # [NEW]
│   ├── sessions_send.rs         # [NEW]
│   ├── sessions_spawn.rs        # [NEW]
│   ├── sessions_yield.rs        # [NEW]
│   └── session_status.rs        # [NEW]
├── browser/
│   ├── mod.rs                  # [REFACTOR]
│   └── cdp_client.rs            # [NEW]
├── media/
│   ├── mod.rs                  # [NEW]
│   ├── image_understand.rs     # [NEW]
│   └── tts_speak.rs            # [NEW]
└── automation/
    ├── mod.rs                  # [NEW]
    ├── cron_schedule.rs         # [NEW]
    ├── cron_list.rs            # [NEW]
    └── cron_cancel.rs          # [NEW]
```

### 修改文件

```
src-tauri/src/agent/tools/
├── mod.rs                       # 添加新模块导出
├── registry.rs                  # 增强 Profile 支持
├── pipeline.rs                 # Profile 过滤集成
└── browser.rs                  # 重构为完整实现
```

### 新增测试

```
src-tauri/tests/tools/
├── profile_integration.rs
├── memory_integration.rs
├── sessions_integration.rs
├── browser_integration.rs
├── media_integration.rs
└── automation_integration.rs
```

### Cargo.toml 新增依赖

```toml
# 新增依赖
playwright = "1.40"           # 浏览器自动化
tokio-cron-scheduler = "0.12" # 定时任务
```
