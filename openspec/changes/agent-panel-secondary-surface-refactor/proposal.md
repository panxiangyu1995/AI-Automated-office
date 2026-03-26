# Proposal: Agent Panel Secondary Surface Refactor

## Why

当前固定右侧 `AI Chat Panel` 内部又长期占着一条“会话 / 历史”次级侧栏，形成“固定辅助侧栏里再嵌套常驻侧栏”的双层挤压结构。这和铁律里的 `固定壳层 + AI 一级入口 + 次级工具按需出现` 不一致，也直接损害主对话区的可读性与专注度。

同时，TopBar 的 `助手 / 视图` 入口、布局控制按钮、快捷键默认值与提示文案并没有走同一条交互链路。尤其 `Ctrl+Shift+I` 与 `Ctrl+Shift+D` 的默认值分裂，导致用户看到的入口说明和真实行为不一致，需要在继续扩展 Agent 壳层之前先完成收敛。

## What Changes

- 将 AI 面板默认态收敛为“对话优先”，不再常驻显示会话 / 历史次级侧栏。
- 把会话列表和历史浏览改造成 AI 面板内部的按需次级视图，通过显式入口打开，并在选择、关闭或按下 `Escape` 后退出。
- 为 Agent 相关入口建立统一的壳层状态契约，让 TopBar `助手 / 视图` 菜单、布局控制按钮、面板内部动作都驱动同一套打开 / 收起 / 次级视图逻辑。
- 收敛 AI 面板快捷键的默认值与展示文案，确保新默认值、设置页、TopBar 提示和 Tauri 默认注册一致。
- 补充针对 AI 面板次级视图、TopBar 菜单联动、快捷键默认值与浏览器 smoke 路径的回归测试。

## Capabilities

### New Capabilities
- `agent-panel-secondary-surface`: 约束固定 AI 面板中的会话 / 历史浏览只能作为按需次级视图出现，并统一其入口、默认态和关闭行为。

### Modified Capabilities
None. 当前仓库里尚无对应的 `openspec/specs` 基线能力，本次以新增能力形式建立这条交互契约。

## Impact

- Affected code:
  - `src/components/common/AiChatPanel.tsx`
  - `src/components/common/AppLayout.tsx`
  - `src/components/common/TopBar.tsx`
  - `src/features/agent/components/SessionPanel.tsx`
  - `src/features/agent/components/AgentChatPanel.tsx`
  - `src/features/agent/components/SessionList.tsx`
  - `src/features/agent/components/HistoryPanel.tsx`
  - `src/hooks/useGlobalShortcuts.ts`
  - `src/features/settings/components/SettingsPanel.tsx`
  - `src/stores/uiStore.ts`
  - `src-tauri/src/shortcuts.rs`
- Affected tests:
  - `tests/integration/agent-chat-staged-review.test.tsx`
  - `tests/integration/auth/account-menu.test.tsx`
  - `src/hooks/__tests__/useGlobalShortcuts.test.ts`
  - `tests/e2e/smoke/*`
- Affected traceability:
  - Epic 1
  - Story 4.1
  - Story 4.2
  - Story 4.3
  - Epic 41
