# Design: workbench-tab-system

## 上下文

根据 UX 设计规范，系统采用 L1–L4 四级导航体系：

```
┌─────────────────────────────────────────────────────────────────┐
│  L1 - ActivityBar（活动栏）                                     │
│  └─ 左侧图标选项栏，切换活动域                                  │
├─────────────────────────────────────────────────────────────────┤
│  L2 - Sidebar（侧边栏）                                        │
│  └─ 随 L1 活动域动态变化                                       │
├─────────────────────────────────────────────────────────────────┤
│  L3 - Workbench（工作区）                                       │
│  │                                                              │
│  │  ┌─ Tab1 ─┬─ Tab2 ─┬─ Tab3 ─┐  ← 多标签页切换            │
│  │  ├──────────────────────────────────────────────┤            │
│  │  │                                              │             │
│  │  │   主内容渲染区                               │            │
│  │  └──────────────────────────────────────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  L4 - Bottom Panel（底部面板）                                 │
│  └─ 日志/诊断/属性详情/预览                                     │
└─────────────────────────────────────────────────────────────────┘
```

**约束：**

- L3 由 Tab（多标签页）和内容区（Workbench Content）共同构成
- Tab 仅管理 UI 状态，不涉及路由逻辑
- 内容渲染复用现有 WorkbenchHostRenderer

## 目标 / 非目标

**目标：**

- 实现 Tab 数据结构和状态管理
- 实现 TabBar 容器组件
- 实现单个 Tab 组件
- 实现 Tab 生命周期管理

**非目标：**

- 不实现 Tab 与路由的集成
- 不实现 Tab 快捷键
- 不实现 Tab 内容渲染

## 决策

### Decision 1: Tab 数据结构

**选择：**

```typescript
interface WorkbenchTab {
  id: string              // 唯一标识 (UUID)
  title: string          // Tab 标题
  type: TabType          // 类型: 'file' | 'report' | 'detail' | 'form' | 'custom'
  icon?: LucideIcon      // Tab 图标
  closable: boolean      // 是否可关闭（默认 true）
  dirty: boolean         // 是否有未保存更改
  routeKey?: string      // 关联的路由键
  meta?: Record<string, unknown>  // 额外元数据
  createdAt: number       // 创建时间戳
}

type TabType = 'file' | 'report' | 'detail' | 'form' | 'custom'

interface WorkbenchState {
  tabs: WorkbenchTab[]           // 当前打开的 Tab 列表
  activeTabId: string | null     // 当前激活的 Tab ID
  maxTabs: number               // 最大 Tab 数量（默认 10）
}
```

**替代方案考虑：**

- 仅使用 route 作为 tab id：无法支持同一路由的多个 tab
- 硬编码 tab 类型：灵活性差

**理由：**

- UUID 支持同一路由的多个 tab
- 支持任意类型的 tab 内容
- meta 可扩展

### Decision 2: 状态管理

**选择：**

- 使用独立的 `workbenchStore.ts`
- 不复用 `uiStore.ts`，职责分离

**理由：**

- workbenchStore 专注于 tab 管理
- uiStore 专注于布局和面板状态
- 避免 store 过于臃肿

### Decision 3: Tab 关闭行为

**选择：**

- 关闭当前 tab 后，自动激活相邻的 tab
- 如果关闭的是最后一个 tab，激活前一个
- 如果没有其他 tab，显示空工作区

**理由：**

- 符合 VSCode 行为
- 减少用户操作成本

### Decision 4: 未保存提示

**选择：**

- dirty 为 true 时，Tab 标题显示圆点指示器
- 关闭 dirty tab 时弹出确认对话框

**理由：**

- 视觉提示明确
- 防止意外丢失数据

## 风险 / 权衡

[Risk] 大量 Tab 导致内存占用增加
→ [Mitigation] 设置 maxTabs 限制，超出时提示用户关闭旧 tab

[Risk] Tab 状态丢失（刷新页面）
→ [Mitigation] 可选择性持久化 Tab 状态到 localStorage

## 组件设计

### TabBar 组件结构

```
TabBar
├── TabList (横向滚动容器)
│   ├── Tab (x N)
│   │   ├── TabIcon
│   │   ├── TabTitle
│   │   └── TabCloseButton
│   └── TabOverflowButtons (左右滚动箭头)
└── TabActions (右侧操作按钮，如新建)
```

### Tab 组件 Props

```typescript
interface TabProps {
  tab: WorkbenchTab
  isActive: boolean
  onClick: () => void
  onClose: () => void
}
```

## 样式规范

根据 UX 设计规范：

| 元素 | 颜色值 |
|------|--------|
| Tab 背景（未激活） | transparent |
| Tab 背景（激活） | #21262D |
| Tab 文字（未激活） | #8B949E |
| Tab 文字（激活） | #FFFFFF |
| Tab 边框（激活） | 底部 2px #238636 |
| Hover 背景 | rgba(255,255,255,0.05) |
| 关闭按钮 Hover | #F85149 |

## 快捷键规范

（由 `workbench-tab-shortcuts` 处理）

## 开放问题

1. Tab 状态是否需要持久化到 localStorage？
2. 是否支持 Tab 锁定（不可关闭）？
3. Tab 最大数量是否可配置？
