# Proposal: MCP服务集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前系统已具备：
- Agent 工具系统（`src-tauri/src/agent/tools/`）
- Skill 系统（`src-tauri/src/agent/skill/`）
- 前端设置面板（`src/features/settings/components/`）

**缺失部分**：
- MCP 客户端实现
- MCP 服务配置 API
- MCP 工具桥接
- MCP 配置 UI

## 目标

实现 MCP 服务集成，支持 MCP 工具调用：
1. MCP 客户端 - 连接 MCP 服务
2. MCP 服务配置 API - 管理 MCP 服务连接
3. MCP 工具桥接 - 将 MCP 工具转换为系统工具
4. MCP 配置 UI - 前端界面配置 MCP 服务

## 范围

### 包含
- 实现 MCP 客户端，支持 JSON-RPC 协议
- 实现 MCP 服务配置 API（连接、断开、健康检查）
- 实现 MCP 工具桥接器
- 创建 MCP 配置 UI
- 编写 MCP 集成测试

### 不包含
- MCP 服务器实现（由第三方提供）
- MCP 工具的具体实现

## 影响范围

### 前端
- `src/features/settings/components/MCPServiceConnection.tsx` - 已有
- `src/features/settings/components/MCPServiceConfig.tsx` - 已有
- 新增 API 集成

### 后端
- `src-tauri/src/agent/tools/mcp/` (新建目录)
  - `client.rs` - MCP 客户端
  - `handler.rs` - MCP 请求处理
  - `bridge.rs` - MCP 工具桥接

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| MCP 服务不可用 | 中 | 中 | 健康检查和重连机制 |
| 协议不兼容 | 低 | 高 | 版本检测 |
| 工具调用超时 | 中 | 中 | 超时控制 |

## 依赖

- **前置依赖**: Task 145 (工具系统基础)
- **后置依赖**: Task 165 (MVP最终集成测试)

## 验收标准

1. MCP 客户端能够连接 MCP 服务
2. MCP 服务配置 API 工作正常
3. MCP 工具能够转换为系统工具
4. 前端 UI 能够配置 MCP 服务
5. MCP 集成测试通过
