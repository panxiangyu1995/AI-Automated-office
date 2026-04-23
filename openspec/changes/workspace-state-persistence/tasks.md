# 任务清单 - 工作场景即时恢复

## 实现类型
- **类型**: feature
- **优先级**: high
- **阶段**: Phase 1

## 任务列表

### Task 1: workbenchStore 持久化改造

- **描述**: 为 `src/stores/workbenchStore.ts` 添加 `persist` 中间件，持久化 tabs 和 activeTabId
- **FR 覆盖**: FR1560-FR1564
- **文件**:
  - `src/stores/workbenchStore.ts` (修改)
- **验收**:
  - [ ] 导入 `persist` 和 `createJSONStorage`
  - [ ] `persist` 配置 `name: 'app-workspace-tabs'`
  - [ ] `partialize` 只保留 tabs、activeTabId、maxTabs
  - [ ] tabs 持久化上限 10 个
  - [ ] 重启后 tabs 列表和活跃 Tab 正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 2: useChatStore 持久化改造

- **描述**: 为 `src/features/agent/hooks/useChatStore.ts` 添加 `persist` 中间件，持久化 sessions 和 activeSessionId
- **FR 覆盖**: FR1565-FR1569
- **文件**:
  - `src/features/agent/hooks/useChatStore.ts` (修改)
- **验收**:
  - [ ] 导入 `persist` 和 `createJSONStorage`
  - [ ] `persist` 配置 `name: 'app-workspace-chat'`
  - [ ] `partialize` 持久化 sessions 和 activeSessionId
  - [ ] sessions 持久化上限 20 条，每条最多 10 条消息
  - [ ] 流式中断状态（isStreaming、streamingMessageId 等）不持久化
  - [ ] 重启后 activeSessionId 正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 3: useHistoryStore 持久化改造

- **描述**: 为 `src/features/agent/hooks/useHistoryStore.ts` 添加 `persist` 中间件，持久化 filter 和 archivedSessions
- **FR 覆盖**: FR1569
- **文件**:
  - `src/features/agent/hooks/useHistoryStore.ts` (修改)
- **验收**:
  - [ ] 导入 `persist` 和 `createJSONStorage`
  - [ ] `persist` 配置 `name: 'app-workspace-history'`
  - [ ] `partialize` 持久化 filter 和 archivedSessions
  - [ ] 重启后 filter 状态正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 4: editorStore 持久化改造

- **描述**: 为 `src/stores/editorStore.ts` 添加 `persist` 中间件，持久化 activeDocument
- **FR 覆盖**: FR1562
- **文件**:
  - `src/stores/editorStore.ts` (修改)
- **验收**:
  - [ ] 导入 `persist` 和 `createJSONStorage`
  - [ ] `persist` 配置 `name: 'app-workspace-editor'`
  - [ ] `partialize` 持久化 activeDocument
  - [ ] 重启后 activeDocument 正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 5: uiStore 扩展持久化

- **描述**: 扩展 `src/stores/uiStore.ts` 的 PersistedUIState，添加 dynamicSidebarEntries、editorSidebarEntries、recentSidebarEntries、activityBarBadges
- **FR 覆盖**: FR1570-FR1573
- **文件**:
  - `src/stores/uiStore.ts` (修改)
- **验收**:
  - [ ] PersistedUIState 类型添加新字段
  - [ ] partialize 添加新字段的持久化
  - [ ] dynamicSidebarEntries 持久化上限 10 条
  - [ ] recentSidebarEntries 持久化上限 6 条
  - [ ] 重启后侧边栏状态正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 6: 统一恢复 Hook

- **描述**: 创建 `src/hooks/useWorkspaceStateRecovery.ts`，统一管理恢复时序和事件
- **FR 覆盖**: FR1575
- **文件**:
  - `src/hooks/useWorkspaceStateRecovery.ts` (新增)
- **验收**:
  - [ ] 创建 hook，包含 RecoveryPhase 状态管理
  - [ ] 支持 enabled 参数控制开关
  - [ ] 按依赖顺序执行恢复：ui → tabs → chat → editor → sidebar
  - [ ] 流式中断时 dispatch `chat:stream-interrupted` 事件
  - [ ] 提供 onRestoreComplete 回调
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 7: AppLayout 集成

- **描述**: 在 `src/components/common/AppLayout.tsx` 中集成恢复逻辑
- **FR 覆盖**: FR1575
- **文件**:
  - `src/components/common/AppLayout.tsx` (修改)
- **验收**:
  - [ ] 导入 useWorkspaceStateRecovery
  - [ ] 从 appStore 读取 restoreWorkspaceOnStartup 偏好
  - [ ] 调用 useWorkspaceStateRecovery hook
  - [ ] 重启后自动执行恢复逻辑
  - [ ] 浏览器测试：重启后标签页、会话、侧边栏状态正确恢复
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

### Task 8: "启动时恢复" 偏好开关

- **描述**: 在设置中提供"启动时恢复上次工作状态"开关
- **FR 覆盖**: FR1564
- **文件**:
  - `src/stores/appStore.ts` (修改) - 添加 restoreWorkspaceOnStartup 字段
  - `src/features/settings/components/` 相关设置面板 (修改)
- **验收**:
  - [ ] appStore 添加 restoreWorkspaceOnStartup（默认 true）
  - [ ] 设置面板中添加开关控件
  - [ ] 开关关闭时跳过恢复逻辑
  - [ ] `npm run lint` 无错误
  - [ ] `npm run build` 成功

## 测试要点

### 单元测试
- [ ] workbenchStore persist 配置正确
- [ ] useChatStore persist 配置正确（会话数量限制）
- [ ] useHistoryStore persist 配置正确
- [ ] editorStore persist 配置正确
- [ ] uiStore 扩展 persist 正确
- [ ] useWorkspaceStateRecovery 各 phase 状态转换正确

### 集成测试
- [ ] 标签页持久化：打开几个 Tab → 刷新页面 → Tab 列表恢复
- [ ] AI 会话持久化：创建会话 → 刷新页面 → 会话恢复
- [ ] 侧边栏持久化：展开资源 → 刷新页面 → 展开状态恢复
- [ ] 恢复开关：关闭开关 → 刷新页面 → 不恢复

### E2E 测试（Playwright）
- [ ] 重启后工作区状态恢复
- [ ] 流式中断提示展示
- [ ] 未保存标签页脏标记展示

## 实现顺序

1. Task 1-5: 各 Store 持久化改造（可并行）
2. Task 6: 统一恢复 Hook
3. Task 7: AppLayout 集成
4. Task 8: 偏好开关
