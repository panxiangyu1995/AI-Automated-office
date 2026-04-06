# Tasks: Complete Agent Tools Integration

## Implementation Type
- **类型**: refactor (模块集成)
- **优先级**: high
- **阶段**: Phase 1

## Task List

### Task 1: 修改 mod.rs 添加模块声明

- **描述**: 在 `src-tauri/src/agent/tools/mod.rs` 中添加 memory、sessions、media、automation 模块声明
- **文件**: `src-tauri/src/agent/tools/mod.rs`
- **验收**:
  - [x] mod.rs 包含 `pub mod memory;`
  - [x] mod.rs 包含 `pub mod sessions;`
  - [x] mod.rs 包含 `pub mod media;`
  - [x] mod.rs 包含 `pub mod automation;`
  - [ ] `cargo check` 通过

### Task 2: 验证模块依赖导入

- **描述**: 检查并修复各模块的依赖导入
- **文件**:
  - `src-tauri/src/agent/tools/memory/mod.rs`
  - `src-tauri/src/agent/tools/sessions/mod.rs`
  - `src-tauri/src/agent/tools/media/mod.rs`
  - `src-tauri/src/agent/tools/automation/mod.rs`
- **验收**:
  - [x] memory/mod.rs 正确导入 descriptor 和 pipeline 类型
  - [x] sessions/mod.rs 正确导入 descriptor 和 pipeline 类型
  - [x] media/mod.rs 正确导入 descriptor 和 pipeline 类型
  - [x] automation/mod.rs 正确导入 descriptor 和 pipeline 类型

### Task 3: 更新 Profile 工具映射

- **描述**: 将新工具添加到 profile.rs 的工具列表中
- **文件**: `src-tauri/src/agent/tools/profile.rs`
- **验收**:
  - [x] `MINIMAL_TOOLS` 包含 `session_status`
  - [x] `CODING_TOOLS` 包含所有新工具（memory_search, memory_get, sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, image_understand, tts_speak, cron_schedule, cron_list, cron_cancel）
  - [x] `MESSAGING_TOOLS` 包含 sessions 相关工具
  - [x] `FULL_TOOLS` 包含所有工具（空列表 = 无限制）

### Task 4: 验证工具注册流程

- **描述**: 确认 pipeline.rs 中的注册调用正确工作
- **文件**: `src-tauri/src/agent/tools/pipeline.rs`
- **验收**:
  - [x] `memory::register_memory_tools` 被调用
  - [x] `sessions::register_sessions_tools` 被调用
  - [x] `media::register_media_tools` 被调用
  - [x] `automation::register_automation_tools` 被调用

### Task 5: 编译验证

- **描述**: 运行 cargo check 和 cargo build 验证编译
- **验收**:
  - [ ] `cargo check --lib` 无错误
  - [ ] `cargo build --lib` 成功
- **备注**: 由于终端环境限制，需要手动运行 `cargo check`

### Task 6: 补充单元测试

- **描述**: 为缺少测试的工具添加单元测试
- **文件**: 各工具实现文件
- **验收**:
  - [x] sessions 模块单元测试覆盖（sessions_history, sessions_send, sessions_spawn, sessions_yield, session_status）
  - [x] media 模块单元测试覆盖（tts_speak 已有完整测试，image_understand 已有测试）
  - [x] automation 模块单元测试覆盖（cron_schedule, cron_list 已有测试）
- **备注**: memory_search 已有完整测试

### Task 7: 创建集成测试

- **描述**: 创建完整的工具集成测试
- **文件**: `src-tauri/tests/tools/integration_tests.rs`
- **验收**:
  - [x] 测试所有新工具通过 pipeline 注册
  - [x] 测试 Profile 工具筛选
  - [x] 测试权限检查

## Test Points

- [ ] 单元测试 - memory 模块
- [ ] 单元测试 - sessions 模块
- [ ] 单元测试 - media 模块
- [ ] 单元测试 - automation 模块
- [ ] 集成测试 - 工具注册表
- [ ] 集成测试 - Profile 筛选
- [ ] 集成测试 - 权限检查
- [ ] E2E 测试 - 通过 Agent 调用工具
