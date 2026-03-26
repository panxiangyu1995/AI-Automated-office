# Proposal: React Memo Best Practice Alignment

## Why

通过 Context7 对 React 官方文档的最佳实践核对，当前若干运行治理面板把简单的“有入参就用入参，否则退回 mock 数据”逻辑也包进了 `useMemo`。这类值既不昂贵，也不依赖复杂派生，继续使用 memo 只会增加阅读成本，让真正有价值的聚合和过滤 memo 与无收益 memo 混在一起。

这些面板本身承载日志、指标、错误分类、Failover 与会话修复等治理信息，后续会继续扩展。先把简单回退值改回渲染期直接派生，有利于保持代码可读性，也更符合 React 官方关于“不要为简单表达式使用 memo”的指导。

## What Changes

- 将 `ErrorClassificationGuidance`、`FailoverSessionRepair`、`LogMetricsCenter` 中简单 fallback 值的 `useMemo` 去掉，改成渲染期直接派生。
- 保留统计、筛选、排序、聚合等真正会重复计算的 `useMemo`。
- 保持默认样例数据、搜索筛选、详情弹窗和导出等用户可见行为不变。
- 保留原 Story 32.1、36.1、36.2 的业务追溯，但本次实现方式纠偏以后续最佳实践为准。

## Impact

- Affected code:
  - `src/features/agent/components/ErrorClassificationGuidance.tsx`
  - `src/features/agent/components/FailoverSessionRepair.tsx`
  - `src/features/agent/components/LogMetricsCenter.tsx`
- Affected traceability:
  - Story 32.1
  - Story 36.1
  - Story 36.2
