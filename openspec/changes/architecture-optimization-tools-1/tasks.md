# Tasks: Agent Tools 架构优化

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建 tools/common 模块基础结构
- **描述**: 创建 tools/common 目录，实现 Builder、Helpers、ConfigManager、Errors
- **文件**:
  - 新增: `tools/common/mod.rs`
  - 新增: `tools/common/builder.rs`
  - 新增: `tools/common/helpers.rs`
  - 新增: `tools/common/config.rs`
  - 新增: `tools/common/errors.rs`
- **验收**:
  - [ ] common 模块编译通过
  - [ ] ToolDescriptorBuilder 可正常构建 ToolDescriptor
  - [ ] 辅助函数可正常使用
- **验证**: `cargo build --lib 2>&1 | grep common`

### Task 2: 重构 core.rs 使用 common 模块
- **描述**: 更新 core.rs 使用 common/helpers 和 common/builder
- **文件**: `tools/core.rs`
- **验收**:
  - [ ] core.rs 不再定义重复的 base_metadata/base_capabilities
  - [ ] 使用 common 模块的辅助函数
  - [ ] 所有核心工具仍正常工作
- **验证**: `cargo build 2>&1 | grep -E "(error|warning)"`

### Task 3: 重构 web.rs 使用 common 模块
- **描述**: 更新 web.rs 使用 common/helpers 和 common/config
- **文件**: `tools/web.rs`
- **验收**:
  - [ ] web.rs 使用统一的配置管理器
  - [ ] 使用 common 模块的辅助函数
  - [ ] web_search 和 web_fetch 工具正常
- **验证**: `cargo build 2>&1`

### Task 4: 重构 shell.rs 使用 common 模块
- **描述**: 更新 shell.rs 使用 common/helpers 和 common/config
- **文件**: `tools/shell.rs`
- **验收**:
  - [ ] shell.rs 使用统一的配置管理器
  - [ ] 使用 common 模块的辅助函数
  - [ ] sandbox_execute 和 pattern_search 工具正常
- **验证**: `cargo build 2>&1`

### Task 5: 重构 filesystem.rs 使用 common 模块
- **描述**: 更新 filesystem.rs 使用 common/helpers
- **文件**: `tools/filesystem.rs`
- **验收**:
  - [ ] filesystem.rs 使用 common 模块的辅助函数
  - [ ] 文件系统工具正常
- **验证**: `cargo build 2>&1`

### Task 6: 创建 browser 子模块目录结构
- **描述**: 创建 browser/ 目录，将 browser.rs 拆分为子模块
- **文件**:
  - 新增: `tools/browser/mod.rs`
  - 新增: `tools/browser/control.rs`
  - 新增: `tools/browser/navigation.rs`
  - 新增: `tools/browser/snapshot.rs`
  - 新增: `tools/browser/interaction.rs`
  - 新增: `tools/browser/state.rs`
  - 新增: `tools/browser/storage.rs`
  - 新增: `tools/browser/network.rs`
  - 新增: `tools/browser/download.rs`
- **验收**:
  - [ ] browser 模块目录创建成功
  - [ ] 各子模块正确导出
- **验证**: `cargo build 2>&1 | grep browser`

### Task 7: 迁移 browser 模块状态管理
- **描述**: 将 BrowserState、CdpClient 等核心类型迁移到 browser/mod.rs
- **文件**: `tools/browser/mod.rs`
- **验收**:
  - [ ] BrowserState 可正常访问
  - [ ] 状态管理函数正常工作
- **验证**: `cargo build 2>&1`

### Task 8: 迁移 browser 控制操作
- **描述**: 迁移 status/start/stop/profiles/tabs 操作到 browser/control.rs
- **文件**: `tools/browser/control.rs`
- **验收**:
  - [ ] execute_status 等函数正常
  - [ ] 编译通过
- **验证**: `cargo build 2>&1`

### Task 9: 迁移 browser 导航操作
- **描述**: 迁移 open/close/focus/navigate/back/forward/refresh 操作
- **文件**: `tools/browser/navigation.rs`
- **验收**:
  - [ ] 导航操作正常
  - [ ] 编译通过
- **验证**: `cargo build 2>&1`

### Task 10: 迁移 browser 其他操作
- **描述**: 迁移 snapshot/screenshot/interaction/state/storage/network/download 操作
- **文件**: `tools/browser/snapshot.rs`, `interaction.rs`, `state.rs`, `storage.rs`, `network.rs`, `download.rs`
- **验收**:
  - [ ] 所有操作正常
  - [ ] 编译通过
- **验证**: `cargo build 2>&1`

### Task 11: 删除旧的 browser.rs 并更新导出
- **描述**: 删除 tools/browser.rs，更新 tools/mod.rs 导出
- **文件**:
  - 删除: `tools/browser.rs`
  - 修改: `tools/mod.rs`
- **验收**:
  - [ ] 旧文件删除
  - [ ] 新模块正确导出
  - [ ] 所有功能正常
- **验证**: `cargo build 2>&1 && cargo clippy -- -D warnings`

## 测试要点

- [ ] 单元测试覆盖 - 现有单元测试继续通过
- [ ] 集成测试覆盖 - 工具注册流程正常
- [ ] 功能回归测试 - 所有工具功能验证
- [ ] 编译验证 - `cargo build` 成功
- [ ] Lint 检查 - `cargo clippy -- -D warnings` 无警告

## 注意事项

1. **功能不变性**：所有优化必须在不改变现有功能的前提下进行
2. **分步验证**：每完成一个任务即验证编译通过
3. **向后兼容**：保持 ToolRegistry、ToolExecutor 接口不变
4. **配置兼容**：ConfigManager 需要兼容现有的配置结构
