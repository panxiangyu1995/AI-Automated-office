# Proposal: LLM三级配置UI完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

后端 ProviderConfig 已存在 (`src-tauri/src/commands/provider_config.rs`)，前端 `ModelProviderSettings.tsx` 已实现基础 UI。

**缺失部分**：平台/租户/用户级配置界面、配置优先级预览、Plan/Act 双配置 UI。

## 目标

完善 LLM 三级配置 UI (ADR-054, ADR-055)：
1. 平台官方 API 配置界面
2. 租户级配置界面
3. 用户级配置界面
4. 配置优先级预览
5. Plan/Act 双配置 UI

## 影响范围

### 前端
- `src/features/settings/components/ModelProviderSettings.tsx` - 扩展现有组件
- 新增配置层级选择 UI

### 后端
- `src-tauri/src/commands/provider_config.rs` - 添加层级配置支持

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 配置优先级冲突 | 中 | 中 | 提供明确的可视化预览 |
| 敏感信息泄露 | 低 | 高 | 密钥加密存储 |

## 依赖

- **前置依赖**: Task 134 (LLM Provider 配置)
- **后置依赖**: Task 188 (路由模式四档完善)

## 验收标准

1. 三级配置界面能够正常工作
2. 配置优先级能够预览
3. Plan/Act 双配置能够切换
