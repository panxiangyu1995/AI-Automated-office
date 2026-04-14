# Epic 58 Story 58.2: 文档资产与修订链

## Why

文档是平台的重要资产，需要一等公民地位和完整的修订历史。当前文档管理混乱：

1. **版本缺失**：无法追溯变更
2. **来源不明**：谁创建/修改不清楚
3. **审核缺失**：AI生成内容直接生效

**量化收益**：
- 提升文档可追溯性 100%
- 减少文档错误率 70%
- 增强合规性 90%

## What Changes

### 新增功能

1. **文档资产模型**
   - 一等公民地位
   - 唯一标识
   - 元数据

2. **修订链**
   - 版本历史
   - 变更记录
   - 对比功能

3. **来源追溯**
   - 创建来源
   - 修改来源
   - Agent操作记录

4. **Staged Review**
   - AI生成进入Staged
   - 人工审核通过
   - 发布流程

5. **知识闭环**
   - 文档转知识
   - 知识引用文档
   - 双向关联

## Capabilities

### New Capabilities

| Capability | 描述 |
|-----------|------|
| `doc-asset-create` | 创建文档 |
| `doc-asset-list` | 列表文档 |
| `doc-asset-revision` | 修订历史 |
| `doc-asset-diff` | 版本对比 |
| `doc-staged-review` | Staged Review |
| `doc-knowledge-loop` | 知识闭环 |

## Impact

### 前端影响

| 文件 | 说明 |
|------|------|
| `src/features/document/components/AssetManager/` | 文档资产管理 |

### 后端影响

| 模块 | 说明 |
|------|------|
| `src-tauri/src/document/` | 文档模块 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR1533 | 文档资产模型 |
| FR1534 | 修订链 |
| FR1535 | 来源追溯 |
| FR1536 | Staged Review |
| FR1537 | 知识闭环 |
| FR1538 | 权限隔离 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 版本膨胀 | 低 | 归档策略 |
| 循环依赖 | 中 | 关系检查 |
