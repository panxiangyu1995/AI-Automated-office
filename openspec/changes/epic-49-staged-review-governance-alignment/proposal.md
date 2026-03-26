# Proposal: Staged Review Governance Alignment

## Why

铁律已经明确：AI 可以生成并暂存候选改动，但不能替代用户做最终接受或拒绝决定；变更清单与工具调用卡片也必须分开展示，避免把人类审阅动作误当成 AI 工具调用。

当前运行时已经有 `stagedReviewFlow` 的基础语义，但面板显性信息不足，默认页面上难以判断候选改动来自哪个承载区域、哪个暂存工具，削弱了审阅边界的可解释性。

## What Changes

- 在暂存审阅面板中补齐候选改动的来源区域和来源工具信息。
- 保持 `accept / reject / rollback` 继续作为用户专属动作，不进入 Tool Registry，也不允许 AI actor 直接定稿。
- 通过集成测试覆盖聊天区变更清单与 `workspace_stage_change` 来源链路，保证该面仍与工具调用卡片分离。
- 保留原 Story 49.x 和相关会话写回基础的历史追溯，但当前纠偏以本变更为准。

## Impact

- Affected code:
  - `src/features/agent/components/StagedReviewPanel.tsx`
  - `src/features/session/runtime/stagedReviewFlow.ts`
  - `tests/integration/agent-chat-staged-review.test.tsx`
- Affected traceability:
  - Story 49.1
  - Story 49.2
  - Story 49.3
  - Story 49.4
