# Tasks: MCP模块-桥接层解耦重构

## 实现类型

- **类型**: optimize
- **优先级**: medium
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 定义ToolBridge trait

- **描述**: 定义ToolBridge trait接口
- **文件**: `src-tauri/src/mcp/bridge.rs`
- **验收**: trait定义完整
- [x] **已完成**

### Task 2: 实现AgentToolBridge

- **描述**: 实现AgentToolBridge适配ToolRegistry
- **文件**: `src-tauri/src/mcp/bridge.rs`
- **验收**: AgentToolBridge功能正常
- [x] **已完成**

### Task 3: 实现PluginToolBridge

- **描述**: 实现PluginToolBridge适配插件系统
- **文件**: `src-tauri/src/mcp/bridge.rs`
- **验收**: PluginToolBridge功能正常
- [x] **已完成**（简化为可扩展设计）

### Task 4: 重构MCPToolBridge

- **描述**: 修改MCPToolBridge使用ToolBridge trait
- **文件**: `src-tauri/src/mcp/bridge.rs`
- **验收**: MCPToolBridge正常工作
- [x] **已完成**

### Task 5: 添加单元测试

- **描述**: 为各Bridge实现编写单元测试
- **文件**: `src-tauri/src/mcp/bridge.rs`
- **验收**: 所有测试通过
- [x] **已完成**
