# Proposal: Capability Supply Visibility Alignment

## Why

铁律已经把工具系统和能力供给收束为 Tool Calling 2.0 的分层模型：少量原子通用工具、平台工具、部门能力工具，以及平台内置 Skills / 部门内置 Skills / 用户安装 Skills 的统一治理链路。

当前代码里仍残留旧的“部门模块状态”“db_query 默认外显”“所有能力看起来像同一来源”的示例和标签。这会误导后续功能继续沿用错误的工具分类和能力可见性模型。

## What Changes

- 将能力状态、工具历史和观测面板的术语统一到 Tool Calling 2.0：通用工具、平台工具、部门能力工具。
- 将 `db_query` 一类受限低层能力从默认用户可见样例中移除，用受控的部门能力工具样例替代。
- 在默认可见样例中显式区分平台内置 Skills、部门能力包内置 Skills、用户安装 Skills 的来源。
- 保留原 Story 5.6、5.12、5.13 和 Story 21.9 的历史追溯，但后续实现以该纠偏变更为准。

## Impact

- Affected code:
  - `src/features/session/components/ModuleCapabilityStatus.tsx`
  - `src/features/session/components/ToolHistory.tsx`
  - `src/features/session/components/AgentObservabilityPanel.tsx`
  - `src/features/settings/components/SubAgentToolBinding.tsx`
- Affected traceability:
  - Story 5.6
  - Story 5.12
  - Story 5.13
  - Story 21.9
