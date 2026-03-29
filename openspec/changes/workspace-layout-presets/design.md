# Design: workspace-layout-presets

## Context

当前 UI 状态持久化仅覆盖基础布局参数（`uiStore.ts`）：
- `sidebarWidth`, `sidebarCollapsed`
- `chatPanelWidth`, `chatPanelCollapsed`
- `bottomPanelHeight`, `bottomPanelCollapsed`
- `topBarVisible`

PRD 要求的"按工作区恢复状态"（FR1005-1）和"布局预设"（FR1005-2）尚未实现。

**约束：**
- 依赖 Phase 1 的 workspaceStore
- 需向后兼容现有布局状态
- 预设切换不应丢失用户未保存的工作内容

## Goals / Non-Goals

**Goals:**
- 定义 LayoutPreset 数据模型
- 实现预设 CRUD 和切换
- 实现状态保存与恢复机制
- 提供 4 种内置预设

**Non-Goals:**
- 不实现预设分享/导入导出
- 不实现预设版本管理
- 不实现跨设备预设同步

## Decisions

### Decision 1: LayoutPreset 数据结构

**选择：**
```typescript
interface LayoutPreset {
  id: string
  name: string
  icon: string
  isBuiltIn: boolean
  workspaceId?: string  // null for global presets
  config: {
    sidebar: { width: number, collapsed: boolean }
    chatPanel: { width: number, collapsed: boolean }
    bottomPanel: { height: number, collapsed: boolean }
    topBar: { visible: boolean }
    openTabs: string[]  // 打开的标签页
    activeTab: string   // 当前标签页
    filters: Record<string, any>  // 筛选条件
    aiPanel: { open: boolean, sessionId?: string }
  }
  createdAt: Date
  updatedAt: Date
}
```

**替代方案考虑：**
- 仅持久化"当前状态"：无法命名和保存多个预设
- 云端存储预设：增加复杂度

**理由：**
- 灵活支持用户自定义预设和内置预设
- 与现有布局参数结构兼容

### Decision 2: 状态保存触发时机

**选择：**
- 自动保存：用户操作后 2 秒防抖保存
- 手动保存：用户点击"保存当前布局"时保存到当前预设

**替代方案考虑：**
- 仅手动保存：可能丢失用户操作
- 实时保存：性能开销大，可能冲突

**理由：**
- 平衡数据安全与性能
- 符合"防抖持久化"现有模式

### Decision 3: 内置预设

| 预设名称 | 描述 | 配置 |
|---------|------|------|
| 专注模式 | 隐藏所有面板，仅留工作区 | sidebar: hidden, chat: hidden, bottom: hidden |
| 审批模式 | 侧边栏 + 工作区 + AI对话 | sidebar: visible, chat: visible, bottom: hidden |
| 起草模式 | 全功能布局 | 全显示 |
| 审计模式 | 工作区 + 底部面板（历史） | sidebar: collapsed, chat: hidden, bottom: visible |

### Decision 4: 工作区状态隔离

**选择：**
- 每个工作区独立保存自己的布局状态
- 预设分为"全局预设"和"工作区预设"

**理由：**
- 不同工作区场景不同，需要独立配置
- 管理员可配置工作区默认预设

## Risks / Trade-offs

[Risk] 预设切换可能中断用户操作
→ [Mitigation] 切换前检查未保存状态，提供确认

[Risk] 大量预设时管理复杂
→ [Mitigation] 限制每个工作区最多 10 个自定义预设

[Risk] 状态恢复可能失败
→ [Mitigation] 失败时回退到默认布局，记录错误日志

## Open Questions

1. 是否支持预设命名/描述编辑？
2. 是否支持预设复制（基于现有创建新预设）？
3. 内置预设是否允许用户修改？
