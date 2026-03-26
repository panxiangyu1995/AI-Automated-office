# Proposal: Sub-Agent Ownership Alignment

## Why

四份铁律已经明确主体验证模型是“每用户一个主 Agent + 可配置多个 Sub-Agent”，部门只负责上下文、权限、能力和数据边界，不再是独立 Agent 实体。

当前代码虽然已有 Sub-Agent 设置面板，但仍混有“部门专属助手”“HR/财务/销售助手”等旧 mock 叙事，会继续把后续实现拉回旧方向，直接偏离新的产品模型和 UX 表达。

## What Changes

- 将 `SubAgentRegistry`、角色配置、工具绑定、权限配置、模型配置、路由和执行监控全部收敛到“当前用户主 Agent 挂载的 Sub-Agent”模型。
- 删除部门专属 Agent mock，统一改用共享的纠偏 fixture，保证名称、描述、默认角色、推荐工具和调用样例一致。
- 让角色配置默认继承所选 Sub-Agent 模板的 `defaultRole` 和调用描述，避免新建后仍回退到旧旧 mock 文案。
- 让部门在 UI 中只以“权限/能力/知识范围边界”的形式出现，不再以 Agent 身份出现。
- 保留原 Story 21.17-21.23 的历史追溯，但后续针对该面的实现应以本纠偏变更为准。

## Impact

- Affected code:
  - `src/features/settings/components/SubAgentRegistry.tsx`
  - `src/features/settings/components/SubAgentPersonaConfig.tsx`
  - `src/features/settings/components/SubAgentPermissionConfig.tsx`
  - `src/features/settings/components/SubAgentModelConfig.tsx`
  - `src/features/settings/components/SubAgentRouting.tsx`
  - `src/features/settings/components/SubAgentExecutionMonitor.tsx`
  - `src/features/settings/components/SubAgentToolBinding.tsx`
- Affected traceability:
  - Story 21.17
  - Story 21.18
  - Story 21.19
  - Story 21.20
  - Story 21.21
  - Story 21.22
  - Story 21.23
