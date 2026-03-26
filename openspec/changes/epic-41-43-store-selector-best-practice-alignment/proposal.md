# Proposal: Store Selector Best Practice Alignment

## Why

通过 Context7 对 React 与 Zustand 官方文档做最佳实践核对后，当前代码里最值得优先纠偏的一批问题，是壳层和会话相关组件大量通过整仓解构订阅 Zustand store。这样会让组件在无关字段变化时也跟着重渲染，持续放大 Workbench、Sidebar、TopBar、SessionPanel 等高频面板的刷新范围。

这类问题不会立刻改变用户看到的功能，但会让后续动态 UI、会话运行时和设置壳层继续建立在过宽订阅之上，不利于保持固定 UI / mixed UI / dynamic UI 的职责边界和后续扩展稳定性。

## What Changes

- 将 App 壳层、Workbench、Sidebar、TopBar、ActivityBar、BottomPanel、AI Chat Panel、AuthGuard、会话列表/历史/面板等表层组件改为 selector 订阅。
- 在必须同时读取多个字段时，改用 shallow composite selector，避免为对象选择结果引入无意义的重新渲染。
- 保持 Workbench 宿主、会话创建切换、账号菜单、侧边栏导航和 staged review 行为不变。
- 保留原有 Story 4.1-4.3、Epic 41、Epic 43 的追溯语义，但后续这一批性能与实现方式纠偏以本变更为准。

## Impact

- Affected code:
  - `src/App.tsx`
  - `src/components/common/AppLayout.tsx`
  - `src/components/common/Workbench.tsx`
  - `src/components/common/TopBar.tsx`
  - `src/components/common/ActivityBar.tsx`
  - `src/components/common/Sidebar.tsx`
  - `src/components/common/AiChatPanel.tsx`
  - `src/components/common/BottomPanel.tsx`
  - `src/components/common/AuthGuard.tsx`
  - `src/features/auth/hooks/useAuth.ts`
  - `src/features/agent/hooks/useChatStore.ts`
  - `src/features/agent/components/AgentChatPanel.tsx`
  - `src/features/agent/components/SessionPanel.tsx`
  - `src/features/agent/components/SessionList.tsx`
  - `src/features/agent/components/HistoryPanel.tsx`
- Affected traceability:
  - Epic 41
  - Epic 43
  - Story 4.1
  - Story 4.2
  - Story 4.3
