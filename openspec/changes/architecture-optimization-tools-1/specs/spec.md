# Specification: Agent Tools 架构优化

## 需求来源

本优化基于以下铁律文档约束：
- **PRD**: 工具系统是 Agent 核心能力的一部分（FR 涉及工具注册、权限、执行）
- **架构文档**: ARCH-01 分层微内核架构，工具系统属于 Agent Core Layer
- **Epic**: Epic 2 AI Agent核心能力

## 约束条件

### 功能不变性约束
1. 所有现有工具（web_search, web_fetch, sandbox_execute, pattern_search, file_read, file_write, file_edit, dir_list, browser_interact 等）必须保持功能不变
2. 工具的参数和返回值结构必须保持兼容
3. 权限检查和安全验证逻辑不能改变
4. 执行管道的生命周期不能改变

### 技术约束
1. API 接口必须保持向后兼容（ToolRegistry、ToolExecutor trait）
2. 编译必须成功，无 warning
3. 性能不能下降

### 架构约束
1. 遵循 SOLID 原则
2. 遵循 DRY 原则（消除重复代码）
3. 遵循 KISS 原则（保持简单）

## 验收标准

### 功能验收
- [ ] 所有工具注册流程正常
- [ ] 所有工具执行流程正常
- [ ] 工具参数验证正常
- [ ] 权限检查正常
- [ ] 敏感度评估正常

### 架构验收
- [ ] common 模块提供统一的 Builder、Helpers、ConfigManager
- [ ] Browser 模块拆分为多个子模块
- [ ] 代码重复消除（base_metadata、base_capabilities 不再分散）
- [ ] 配置管理统一

### 技术验收
- [ ] `cargo build` 成功
- [ ] `cargo clippy -- -D warnings` 无警告
- [ ] `cargo test` 单元测试通过
- [ ] 编译时间不增加超过 10%

## 优化范围

### 新增文件
- `src/agent/tools/common/mod.rs`
- `src/agent/tools/common/builder.rs`
- `src/agent/tools/common/helpers.rs`
- `src/agent/tools/common/config.rs`
- `src/agent/tools/common/errors.rs`
- `src/agent/tools/browser/mod.rs`
- `src/agent/tools/browser/control.rs`
- `src/agent/tools/browser/navigation.rs`
- `src/agent/tools/browser/snapshot.rs`
- `src/agent/tools/browser/interaction.rs`
- `src/agent/tools/browser/state.rs`
- `src/agent/tools/browser/storage.rs`
- `src/agent/tools/browser/network.rs`
- `src/agent/tools/browser/download.rs`

### 修改文件
- `src/agent/tools/mod.rs`
- `src/agent/tools/core.rs`
- `src/agent/tools/web.rs`
- `src/agent/tools/shell.rs`
- `src/agent/tools/filesystem.rs`

### 删除文件
- `src/agent/tools/browser.rs`
