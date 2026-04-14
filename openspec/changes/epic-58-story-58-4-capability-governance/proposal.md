# Epic 58 Story 58.4: 能力治理与Principal Membership

## Why

平台需要统一的能力治理和主体身份管理：

1. **治理缺失**：无法评估能力健康度
2. **身份混乱**：主体关系不清晰
3. **关联分散**：Document/Approval/Knowledge无关联

**量化收益**：
- 提升能力可见性 100%
- 减少问题定位时间 70%
- 增强平台可控性 90%

## What Changes

### 新增功能

1. **能力契约**
   - 统一声明
   - 版本管理
   - 接口规范

2. **Fitness Board**
   - 健康指标
   - 趋势分析
   - 问题预警

3. **改进建议**
   - 基于Trace分析
   - 建议生成
   - 审核机制

4. **Principal Membership**
   - 用户身份
   - Agent身份
   - 群组身份

5. **DAK Graph**
   - Document-Approval-Knowledge
   - 关系图谱
   - 可视化

## Capabilities

### New Capabilities

| Capability | 描述 |
|-----------|------|
| `governance-contract` | 能力契约 |
| `governance-fitness` | Fitness Board |
| `governance-suggest` | 改进建议 |
| `principal-membership` | Principal管理 |
| `dak-graph` | DAK图 |

## Impact

### 前端影响

| 文件 | 说明 |
|------|------|
| `src/features/governance/` | 治理模块 |

### 后端影响

| 模块 | 说明 |
|------|------|
| `src-tauri/src/governance/` | 治理模块 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 |
|--------|------|
| FR1551 | 能力契约 |
| FR1552 | 健康指标 |
| FR1553 | Fitness Board |
| FR1554 | 改进建议 |
| FR1555 | 建议审核 |
| FR1556 | Principal模型 |
| FR1557 | 主体关系 |
| FR1558 | DAK Graph |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据延迟 | 低 | 定期刷新 |
| 建议质量 | 中 | 人工审核 |
