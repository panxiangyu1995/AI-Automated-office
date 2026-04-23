# 设计文档 - 工作场景即时恢复

## 涉及文件

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/stores/workbenchStore.ts` | 添加 `persist` 中间件，持久化 tabs 和 activeTabId |
| `src/features/agent/hooks/useChatStore.ts` | 添加 `persist` 中间件，持久化 sessions 和 activeSessionId |
| `src/features/agent/hooks/useHistoryStore.ts` | 添加 `persist` 中间件，持久化 filter 和 archivedSessions |
| `src/stores/editorStore.ts` | 添加 `persist` 中间件，持久化 activeDocument |
| `src/stores/uiStore.ts` | 扩展 `PersistedUIState`，添加 dynamicSidebarEntries、editorSidebarEntries、recentSidebarEntries、activityBarBadges |
| `src/components/common/AppLayout.tsx` | 在 mount 时调用恢复逻辑 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/hooks/useWorkspaceStateRecovery.ts` | 统一恢复 hook，管理恢复时序和事件 |

## 技术方案详述

### 1. Store 持久化改造

#### workbenchStore.ts

```typescript
// 修改前
export const useWorkbenchStore = create<WorkbenchStore>()((set, get) => ({ ... }))

// 修改后
type PersistedState = Pick<WorkbenchState, 'tabs' | 'activeTabId' | 'maxTabs'>

export const useWorkbenchStore = create<WorkbenchStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'app-workspace-tabs',
      // 最多保留 10 个标签页
      partialize: (state) => ({
        tabs: state.tabs.slice(0, 10),
        activeTabId: state.activeTabId,
        maxTabs: state.maxTabs,
      }),
    }
  )
)
```

#### useChatStore.ts

```typescript
// 修改前
export const useChatStore = create<ChatStoreState>()(
  subscribeWithSelector((set, get) => ({ ... }))
)

// 修改后
// 注意：persist 和 subscribeWithSelector 可以组合使用
type PersistedState = Pick<ChatStoreState, 'sessions' | 'activeSessionId'>

export const useChatStore = create<ChatStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({ ... })),
    {
      name: 'app-workspace-chat',
      partialize: (state) => ({
        // 只保留会话元数据，不保留完整消息内容（避免存储过大）
        // 完整消息在流式结束后再考虑是否持久化
        sessions: Object.fromEntries(
          Object.entries(state.sessions)
            .slice(0, 20) // 最多 20 条
            .map(([id, session]) => [id, {
              id: session.id,
              title: session.title,
              messages: session.messages.slice(-10), // 每会话最多保留 10 条消息
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            }])
        ),
        activeSessionId: state.activeSessionId,
      }),
    }
  )
)
```

#### useHistoryStore.ts

```typescript
// 添加 persist
type PersistedState = Pick<HistoryStoreState, 'filter' | 'archivedSessions'>

export const useHistoryStore = create<HistoryStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({ ... })),
    {
      name: 'app-workspace-history',
      partialize: (state) => ({
        filter: state.filter,
        archivedSessions: state.archivedSessions,
      }),
    }
  )
)
```

#### editorStore.ts

```typescript
// 修改后
type PersistedState = Pick<EditorStoreState, 'activeDocument'>

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set) => ({
      activeDocument: null,
      setActiveDocument: (state) => set({ activeDocument: state }),
      clearActiveDocument: () => set({ activeDocument: null }),
    }),
    {
      name: 'app-workspace-editor',
      partialize: (state) => ({
        activeDocument: state.activeDocument,
      }),
    }
  )
)
```

#### uiStore.ts 扩展

```typescript
// PersistedUIState 扩展
type PersistedUIState = Pick<
  UIState,
  // 原有字段...
  | 'sidebarWidth'
  | 'sidebarCollapsed'
  // 新增字段
  | 'dynamicSidebarEntries'
  | 'editorSidebarEntries'
  | 'recentSidebarEntries'
  | 'activityBarBadges'
>

// partialize 扩展
partialize: (state) => ({
  // 原有...
  sidebarWidth: state.sidebarWidth,
  // 新增
  dynamicSidebarEntries: state.dynamicSidebarEntries,
  editorSidebarEntries: state.editorSidebarEntries,
  recentSidebarEntries: state.recentSidebarEntries,
  activityBarBadges: state.activityBarBadges,
})
```

### 2. 统一恢复 Hook

```typescript
// src/hooks/useWorkspaceStateRecovery.ts

import { useEffect, useState } from 'react'
import { useWorkbenchStore } from '../stores/workbenchStore'
import { useChatStore } from '../features/agent/hooks/useChatStore'
import { useHistoryStore } from '../features/agent/hooks/useHistoryStore'
import { useEditorStore } from '../stores/editorStore'
import { useUIStore } from '../stores/uiStore'

export type RecoveryPhase =
  | 'idle'
  | 'restoring-ui'
  | 'restoring-tabs'
  | 'restoring-chat'
  | 'restoring-editor'
  | 'restoring-sidebar'
  | 'completed'
  | 'error'

export interface WorkspaceStateRecoveryOptions {
  enabled?: boolean // 来自用户偏好，默认 true
  onPhaseChange?: (phase: RecoveryPhase) => void
  onRestoreComplete?: () => void
  onRestoreError?: (error: Error) => void
}

export function useWorkspaceStateRecovery(options: WorkspaceStateRecoveryOptions = {}) {
  const { enabled = true, onPhaseChange, onRestoreComplete, onRestoreError } = options
  const [phase, setPhase] = useState<RecoveryPhase>('idle')
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setPhase('completed')
      return
    }

    const doRecovery = async () => {
      try {
        // Phase 1: 等待 UI 布局恢复（由 uiStore persist 自动完成）
        setPhase('restoring-ui')
        onPhaseChange?.('restoring-ui')

        // Phase 2: 恢复标签页（由 workbenchStore persist 自动完成）
        setPhase('restoring-tabs')
        onPhaseChange?.('restoring-tabs')

        // Phase 3: 恢复 AI 会话
        setPhase('restoring-chat')
        onPhaseChange?.('restoring-chat')
        const chatState = useChatStore.getState()
        if (chatState.activeSessionId && chatState.sessions[chatState.activeSessionId]) {
          // 检查是否有流式中断的会话
          const session = chatState.sessions[chatState.activeSessionId]
          const hasIncompleteMessage = session.messages.some(m => m.status === 'pending')
          if (hasIncompleteMessage) {
            // 触发流式中断提示事件
            window.dispatchEvent(new CustomEvent('chat:stream-interrupted', {
              detail: { sessionId: chatState.activeSessionId }
            }))
          }
        }

        // Phase 4: 恢复编辑器状态
        setPhase('restoring-editor')
        onPhaseChange?.('restoring-editor')

        // Phase 5: 恢复侧边栏状态
        setPhase('restoring-sidebar')
        onPhaseChange?.('restoring-sidebar')

        setPhase('completed')
        onRestoreComplete?.()
      } catch (error) {
        setPhase('error')
        onRestoreError?.(error as Error)
      } finally {
        setIsRecovering(false)
      }
    }

    doRecovery()
  }, [enabled])

  return {
    phase,
    isRecovering,
    isCompleted: phase === 'completed',
    hasError: phase === 'error',
  }
}
```

### 3. AppLayout 集成

```typescript
// src/components/common/AppLayout.tsx

import { useWorkspaceStateRecovery } from '../../hooks/useWorkspaceStateRecovery'
import { useAppStore } from '../../stores/appStore'

export function AppLayout() {
  // ... existing code ...

  // 新增：工作场景恢复
  const restoreEnabled = useAppStore((state) => state.restoreWorkspaceOnStartup ?? true)
  const { isRecovering, phase } = useWorkspaceStateRecovery({
    enabled: restoreEnabled,
  })

  // ... existing code ...
}
```

### 4. 流式中断处理

在 `SessionPanel` 或相关组件中监听中断事件：

```typescript
// 在 AI 会话面板组件中
useEffect(() => {
  const handleStreamInterrupted = (e: CustomEvent<{ sessionId: string }>) => {
    // 展示提示对话框
    // "会话在流式输出中中断，是否继续？"
    setShowResumeDialog(true)
  }

  window.addEventListener('chat:stream-interrupted', handleStreamInterrupted as EventListener)
  return () => window.removeEventListener('chat:stream-interrupted', handleStreamInterrupted as EventListener)
}, [])
```

### 5. 存储上限控制

所有 persist 配置均设置上限：

| Store | 持久化字段 | 上限 |
|-------|-----------|------|
| workbenchStore | tabs | 10 个 |
| useChatStore | sessions | 20 条，每条最多 10 条消息 |
| useHistoryStore | archivedSessions | 无限制（已有归档逻辑） |
| editorStore | activeDocument | 1 条 |
| uiStore | dynamicSidebarEntries | 10 条 |
| uiStore | recentSidebarEntries | 6 条（已有） |

### 6. localStorage key 分配

| Key | Store | 内容 |
|-----|-------|------|
| `ui-layout` | uiStore | 布局、主题等 UI 状态 |
| `app-storage` | appStore | 主题、侧边栏折叠状态 |
| `workspace-storage` | workspaceStore | 工作区、项目 |
| `layout-preset-storage` | layoutPresetStore | 布局预设 |
| `app-workspace-tabs` | workbenchStore | 标签页列表 |
| `app-workspace-chat` | useChatStore | AI 会话 |
| `app-workspace-history` | useHistoryStore | 历史过滤 |
| `app-workspace-editor` | editorStore | 编辑器状态 |

## 组件交互时序

```
AppLayout mount
    │
    ├── uiStore persist 自动恢复（localStorage → state）
    │
    ├── useWorkspaceStateRecovery()
    │   ├── Phase: restoring-ui   → uiStore 状态已就绪
    │   ├── Phase: restoring-tabs → workbenchStore persist 自动恢复
    │   ├── Phase: restoring-chat → useChatStore persist 自动恢复
    │   │                        └── 检查流式中断 → dispatch chat:stream-interrupted
    │   ├── Phase: restoring-editor → editorStore persist 自动恢复
    │   └── Phase: restoring-sidebar → uiStore persist 自动恢复
    │
    └── render complete
```
