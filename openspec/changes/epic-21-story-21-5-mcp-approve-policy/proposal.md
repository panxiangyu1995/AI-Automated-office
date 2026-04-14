# Epic 21 Story 21.5: MCP工具Approve策略系统

## Why

MCP工具是AI Agent能力的重要扩展，需要细粒度的调用控制。当前系统缺少Approve策略机制，存在以下风险：

1. **安全风险**：无法控制高危工具调用
2. **用户体验**：每次调用都需确认，繁琐
3. **管理困难**：无法批量配置
4. **决策困难**：用户不知如何设置策略

**量化收益**：
- 减少不必要确认 70%
- 提升工具调用效率 50%
- 降低安全事件风险 80%

## What Changes

### 新增功能

1. **三级Approve策略**
   - AutoApprove：自动批准
   - RequireConfirm：需确认
   - Deny：禁止

2. **批量配置**
   - 按工具类型批量设置
   - 按标签批量设置

3. **AI智能推荐**
   - 基于使用模式推荐
   - 风险评估

4. **企业默认策略**
   - 租户级默认配置
   - 部门级默认配置

5. **临时批准**
   - 一次调用批准
   - 过期时间控制

6. **决策日志**
   - 完整操作记录
   - 统计报表

## Capabilities

### New Capabilities

| Capability | 描述 |
|-----------|------|
| `mcp-approve-list` | 列表Approve策略 |
| `mcp-approve-create` | 创建策略 |
| `mcp-approve-update` | 更新策略 |
| `mcp-approve-delete` | 删除策略 |
| `mcp-approve-batch` | 批量配置 |
| `mcp-approve-recommend` | AI推荐 |
| `mcp-approve-temp` | 临时批准 |
| `mcp-approve-log` | 决策日志 |

## Impact

### 前端影响

| 文件 | 说明 |
|------|------|
| `src/features/settings/components/McpApprove/` | Approve策略管理 |
| `src/features/settings/components/BatchConfig/` | 批量配置 |
| `src/features/settings/components/TempApprove/` | 临时批准 |

### 后端影响

| 模块 | 说明 |
|------|------|
| `src-tauri/src/agent/permission/mcp_approve/` | Approve策略模块 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR825 | Approve策略定义 |
| FR826 | 策略检查 |
| FR827 | 批量配置 |
| FR828 | AI推荐 |
| FR829 | 临时批准 |
| FR830 | 日志记录 |
| FR831 | 默认策略 |
| FR832 | 策略导入导出 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 策略冲突 | 中 | 优先级机制 |
| 误配置 | 高 | 预览确认 |
| 性能影响 | 低 | 缓存策略 |
