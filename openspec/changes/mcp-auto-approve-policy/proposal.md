# Proposal: MCP工具自动审批

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/settings/components/MCPServiceConfig.tsx`
后端 MCP Client 已存在：`src-tauri/src/mcp/`

**缺失部分**：Per-Tool Auto-Approve 策略、正则匹配、STDIO 文件监视。

## 目标

实现 MCP 工具自动审批 (ADR-051, ADR-057)：
1. 实现 Per-Tool 配置存储
2. 实现正则匹配 Auto-Approve
3. 实现 STDIO 文件监视
4. 实现动态启用/禁用
5. 与前端 MCP 配置 UI 集成

## 影响范围

### 前端
- `src/features/settings/components/MCPServiceConfig.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/mcp/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 164 (MCP服务集成)

## 验收标准

1. Per-Tool 配置能够保存
2. 正则匹配能够正常工作
3. 动态启用/禁用能够工作
