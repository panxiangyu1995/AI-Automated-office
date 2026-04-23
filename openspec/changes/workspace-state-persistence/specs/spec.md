# 规格说明书 - 工作场景即时恢复

## 概述

本规格定义 AI-Automated-office 工作场景即时恢复功能的实现细节，确保软件退出后重新打开时能无缝恢复用户的工作上下文。

## FR 覆盖

| FR | 描述 | 实现方案 |
|----|------|----------|
| FR1560 | 恢复上次打开的标签页列表 | workbenchStore persist |
| FR1561 | 恢复上次活跃的标签页 | workbenchStore persist |
| FR1562 | 保留各标签页的路由键、参数、脏标记状态 | workbenchStore persist tabs 完整持久化 |
| FR1563 | 未保存标签页展示脏标记并提示 | 依赖 UI 组件逻辑 |
| FR1564 | "启动时恢复"开关 | appStore + 设置面板 |
| FR1565 | 恢复上次活跃的 AI 对话会话 | useChatStore persist |
| FR1566 | 保留会话列表中最近 20 条会话元数据 | useChatStore persist partialize |
| FR1567 | 恢复 AI 面板展开/折叠状态及宽度 | uiStore persist (已有) |
| FR1568 | 流式中断会话提示 | useWorkspaceStateRecovery |
| FR1569 | 敏感内容可配置不持久化 | partialize 可扩展 |
| FR1570 | 恢复侧边栏动态资源列表 | uiStore persist 扩展 |
| FR1571 | 恢复编辑器文件树 | uiStore persist 扩展 |
| FR1572 | 恢复最近 6 条资源 | uiStore persist 已有 |
| FR1573 | 保留活动栏徽章计数 | uiStore persist 扩展 |
| FR1574 | 独立存储 key | 各 store 使用独立 key |
| FR1575 | AppLayout mount 时统一恢复 | useWorkspaceStateRecovery |

## 接口规范

### Store API

#### workbenchStore

```typescript
// 新增持久化配置
interface WorkbenchStorePersisted {
  tabs: WorkbenchTab[]       // 最多 10 个
  activeTabId: string | null
  maxTabs: number
}
```

#### useChatStore

```typescript
// 新增持久化配置
interface ChatStorePersisted {
  sessions: Record<string, ChatSession>  // 最多 20 条，每条最多 10 条消息
  activeSessionId: string | null
}

// 不持久化字段
type ExcludedFromPersist = 'isStreaming' | 'streamingMessageId' | 'streamingPartId' | 'streamingContent' | 'toolCallStates'
```

#### editorStore

```typescript
// 新增持久化配置
interface EditorStorePersisted {
  activeDocument: ActiveEditorDocumentState | null
}
```

### Hook API

#### useWorkspaceStateRecovery

```typescript
interface WorkspaceStateRecoveryOptions {
  enabled?: boolean           // 默认 true
  onPhaseChange?: (phase: RecoveryPhase) => void
  onRestoreComplete?: () => void
  onRestoreError?: (error: Error) => void
}

type RecoveryPhase =
  | 'idle'
  | 'restoring-ui'
  | 'restoring-tabs'
  | 'restoring-chat'
  | 'restoring-editor'
  | 'restoring-sidebar'
  | 'completed'
  | 'error'

// 返回值
interface UseWorkspaceStateRecoveryReturn {
  phase: RecoveryPhase
  isRecovering: boolean
  isCompleted: boolean
  hasError: boolean
}
```

### 事件 API

```typescript
// 流式中断事件
interface ChatStreamInterruptedEvent {
  sessionId: string
}

// 事件名: 'chat:stream-interrupted'
// 触发时机: 恢复时发现会话有 status='pending' 的消息
```

## 数据模型

### localStorage Key 映射

| Key | 存储内容 | 大小估计 |
|-----|---------|---------|
| `ui-layout` | 布局、主题等 UI 状态 | ~5KB |
| `app-storage` | 用户偏好设置 | ~1KB |
| `workspace-storage` | 工作区/项目 | ~1KB |
| `layout-preset-storage` | 布局预设 | ~5KB |
| `app-workspace-tabs` | 标签页列表 | ~10KB |
| `app-workspace-chat` | AI 会话 | ~100-200KB |
| `app-workspace-history` | 历史过滤 | ~1KB |
| `app-workspace-editor` | 编辑器状态 | ~1KB |

### 存储限制

| 资源 | 限制 | 说明 |
|------|------|------|
| tabs | 10 个 | 超出时保留最近的 10 个 |
| sessions | 20 条 | 超出时保留最近的 20 条 |
| messages | 10 条/会话 | 每会话最多保留 10 条消息 |
| recentSidebarEntries | 6 条 | 已有逻辑 |
| dynamicSidebarEntries | 10 条 | 新增限制 |

## 边界条件

### 标签页恢复

- 如果恢复的 tab.routeKey 对应的路由不存在：显示为通用 Tab，仍保留 title
- 如果恢复的 tab.params 不匹配当前路由参数：忽略 params
- 如果 tabs 为空：正常渲染，不显示任何 Tab

### AI 会话恢复

- 如果恢复的 sessionId 对应的会话不存在：activeSessionId 置为 null
- 如果会话有 pending 状态的消息：触发流式中断事件
- 如果 sessions 为空：创建默认会话

### 存储溢出

- 如果 localStorage 接近 5MB 限制：清理最旧的会话数据
- 异常捕获：任何存储错误不应导致应用崩溃

## 安全约束

- 会话消息内容存储在 localStorage，不加密
- 敏感内容（如密码、表单敏感字段）不应通过 AI 对话持久化
- 可配置排除敏感关键词

## 性能约束

- 恢复逻辑应在 100ms 内完成
- 恢复操作不阻塞 UI 渲染
- 使用 RAF 批量更新避免性能问题
