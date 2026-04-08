# Tasks: 工具权限沙箱实现

## 实现类型
- **类型**: enhancement
- **优先级**: high (P1)
- **阶段**: Phase 3 - P1核心

## 任务列表

### Task 1: 创建沙箱模块
- **描述**: 创建ToolSandbox和数据结构
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs` (新建)
- **验收**: 基础结构完成
- **状态**: ✅ 已完成

### Task 2: 实现匹配引擎
- **描述**: 实现五种匹配模式
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs`
- **验收**: 匹配准确
- **状态**: ✅ 已完成

### Task 3: 实现权限判断
- **描述**: 实现黑白灰名单判断
- **文件**:
  - `src-tauri/src/agent/permission/sandbox.rs`
- **验收**: 符合ADR-022-1
- **状态**: ✅ 已完成

### Task 4: 集成到工具执行管道
- **描述**: 工具执行前检查权限
- **文件**:
  - `src-tauri/src/commands/sandbox.rs`
- **验收**: 未授权工具被阻止
- **状态**: ✅ 已完成

### Task 5: 集成测试
- **描述**: 测试沙箱功能
- **验收**: 测试通过
- **状态**: ⏳ 待测试

## 已实现功能

### 后端 (Rust)

1. **agent/permission/sandbox.rs** - 工具权限沙箱
   - `MatchPattern` - 匹配模式
     - Exact: 精确匹配
     - Prefix: 前缀匹配
     - Suffix: 后缀匹配
     - Contains: 包含匹配
     - Regex: 正则匹配
     - Group: 分组匹配 (支持通配符)
   - `PermissionResult` - 权限结果
     - Allowed: 允许
     - Denied: 拒绝
     - Ask: 需要确认
   - `SandboxConfig` - 沙箱配置
   - `ToolSandbox` - 工具沙箱服务
     - add_to_blacklist/whitelist/graylist
     - check_permission
     - check_batch_permissions
     - get_stats/reset_stats

2. **commands/sandbox.rs** - Tauri命令
   - check_tool_permission - 检查工具权限
   - batch_check_tool_permissions - 批量检查
   - add_to_blacklist/whitelist/graylist
   - get_blacklist/whitelist/graylist
   - add_sandbox_group/get_sandbox_group
   - get_sandbox_stats/reset_sandbox_stats
   - clear_sandbox_rules

## 需求覆盖

| FR | 需求 | 实现位置 |
|----|------|----------|
| FR1020 | 工具命令需权限配置 | sandbox.rs:ToolSandbox |
| FR1021 | 黑名单机制 | sandbox.rs:add_to_blacklist |
| FR1022 | 白名单机制 | sandbox.rs:add_to_whitelist |
| FR1023 | 灰名单机制 | sandbox.rs:add_to_graylist |
| FR1024 | 精确/前缀/后缀匹配 | MatchPattern types |
| FR1025 | 分组匹配 | MatchPattern::Group |
| FR1026 | 执行隔离 | check_permission before execution |
| FR1027 | 审计日志 | SandboxStats tracking |