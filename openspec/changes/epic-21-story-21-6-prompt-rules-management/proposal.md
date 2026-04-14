# Epic 21 Story 21.6: 系统提示词与Rules规则管理

## Why

系统提示词和Rules规则是Agent行为的核心控制机制。当前缺少统一的管理界面，存在以下问题：

1. **维护困难**：提示词分散在代码中
2. **版本混乱**：无法追踪变更
3. **测试不便**：无法对比效果
4. **规则复杂**：Rules条件难以配置

**量化收益**：
- 提升提示词维护效率 70%
- 减少配置错误 60%
- 加快问题定位 80%

## What Changes

### 新增功能

1. **提示词编辑器**
   - 可视化编辑
   - 变量预览
   - 实时保存

2. **模板管理**
   - 创建模板
   - 导入导出
   - 分类管理

3. **版本管理**
   - 版本列表
   - 版本对比
   - 一键回滚

4. **Rules规则管理**
   - 规则列表
   - 条件构建器
   - 启用禁用

5. **调试模式**
   - Token统计
   - A/B测试
   - 效果对比

## Capabilities

### New Capabilities

| Capability | 描述 |
|-----------|------|
| `prompt-template-list` | 模板列表 |
| `prompt-template-create` | 创建模板 |
| `prompt-version-list` | 版本列表 |
| `prompt-version-rollback` | 版本回滚 |
| `rules-list` | 规则列表 |
| `rules-create` | 创建规则 |
| `rules-toggle` | 启用禁用 |
| `prompt-debug` | 调试会话 |

## Impact

### 前端影响

| 文件 | 说明 |
|------|------|
| `src/features/settings/components/PromptEditor/` | 提示词编辑器 |
| `src/features/settings/components/RulesManager/` | Rules管理 |

### 后端影响

| 模块 | 说明 |
|------|------|
| `src-tauri/src/agent/prompt/` | 提示词管理 |
| `src-tauri/src/agent/rules/` | Rules规则 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR850 | 提示词编辑 |
| FR851 | 模板管理 |
| FR852 | 版本管理 |
| FR853 | Rules列表 |
| FR854 | 条件触发 |
| FR855 | 强制规则 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 版本冲突 | 中 | 乐观锁 |
| 规则冲突 | 中 | 优先级 |
