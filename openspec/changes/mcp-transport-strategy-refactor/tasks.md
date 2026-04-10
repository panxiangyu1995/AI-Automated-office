# Tasks: MCP模块-Transport层策略模式重构

## 实现类型

- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建transport.rs模块文件

- **描述**: 创建transport子模块，定义Transport trait和相关类型
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: 文件创建成功，Trait定义完整
- [x] **已完成**

### Task 2: 实现StdioTransport

- **描述**: 将现有的start_stdio逻辑重构为独立的StdioTransport实现
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: STDIO传输正常工作
- [x] **已完成**

### Task 3: 实现HttpTransport

- **描述**: 替换mock的HTTP传输实现，使用reqwest发送真实HTTP请求
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: HTTP传输正常工作
- [x] **已完成**

### Task 4: 实现WebSocketTransport

- **描述**: 替换mock的WebSocket传输实现，使用tokio-tungstenite
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: WebSocket传输正常工作
- [x] **已完成**

### Task 5: 实现TransportFactory

- **描述**: 创建工厂模式根据配置创建对应Transport实现
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: 工厂能正确创建各类型Transport
- [x] **已完成**

### Task 6: 重构MCPClient

- **描述**: 修改MCPClient使用Transport trait，委托给具体实现
- **文件**: `src-tauri/src/mcp/client.rs`
- **验收**: MCPClient功能与重构前一致
- [x] **已完成**

### Task 7: 添加单元测试

- **描述**: 为各Transport实现编写单元测试
- **文件**: `src-tauri/src/mcp/transport.rs`
- **验收**: 所有测试通过
- [x] **已完成**

### Task 8: 更新Cargo.toml

- **描述**: 添加async-trait和tokio-tungstenite依赖
- **文件**: `src-tauri/Cargo.toml`
- **验收**: cargo build成功
- [x] **已完成**

### Task 9: 更新mod.rs导出

- **描述**: 在mcp/mod.rs中导出新模块
- **文件**: `src-tauri/src/mcp/mod.rs`
- **验收**: 模块导出正确
- [x] **已完成**

## 测试要点

- [ ] 单元测试覆盖StdioTransport
- [ ] 单元测试覆盖HttpTransport
- [ ] 单元测试覆盖WebSocketTransport
- [ ] 单元测试覆盖TransportFactory
- [ ] 现有集成测试通过
- [ ] cargo clippy无警告

## 验收标准

- [ ] Transport trait定义完整
- [ ] StdioTransport实现功能正常
- [ ] HttpTransport实现功能正常
- [ ] WebSocketTransport实现功能正常
- [ ] TransportFactory能正确创建各类型
- [ ] MCPClient重构后功能不变
- [ ] 所有单元测试通过
- [ ] cargo clippy无警告
- [ ] 保持Tauri命令接口不变
