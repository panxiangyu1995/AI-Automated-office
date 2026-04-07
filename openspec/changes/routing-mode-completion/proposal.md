# Proposal: 路由模式四档完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：
- `src/features/settings/components/YoloModeConfig.tsx`
- `src/features/settings/components/PlanActModeConfig.tsx`
- `src-tauri/src/commands/provider_config.rs` - Provider 配置

**缺失部分**：Manual/Auto/Hybrid 模式、敏感度分级、二次确认。

## 目标

完善路由模式 (ADR-056)：
1. 实现 Manual 逐项审批模式
2. 实现 Auto 智能评估模式
3. 实现 Hybrid 混合模式
4. 实现敏感度分级
5. 实现二次确认防误触

## 影响范围

### 前端
- `src/features/settings/components/YoloModeConfig.tsx` - 扩展现有组件
- `src/features/settings/components/PlanActModeConfig.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/commands/provider_config.rs` - 扩展现有模块

## 依赖

- **前置依赖**: Task 134 (LLM Provider 配置), Task 135 (Provider 路由)

## 验收标准

1. 四种模式能够正确切换
2. 敏感度分级能够生效
3. 二次确认能够正常工作
