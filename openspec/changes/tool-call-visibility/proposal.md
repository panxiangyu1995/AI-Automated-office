# Proposal: 工具调用可见性增强

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/session/components/ToolHistory.tsx`
后端工具模块已存在：`src-tauri/src/agent/tools/`

**缺失部分**：实时推送、参数结果展示、失败重试 UI。

## 目标

完善工具调用可见性 (FR69-FR80)：
1. 实现工具调用实时推送
2. 实现参数和结果展示
3. 实现失败重试 UI
4. 实现手动输入结果
5. 实现批量断点续传

## 影响范围

### 前端
- `src/features/session/components/ToolHistory.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/agent/tools/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 157 (Agent E2E集成测试)

## 验收标准

1. 工具调用能够实时推送
2. 参数结果能够展示
3. 失败重试能够工作
