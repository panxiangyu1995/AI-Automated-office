# Specification: 可切换TopBar菜单栏

## 概述

本文档定义了可切换 TopBar 菜单栏的详细技术规范。TopBar 是应用顶部的菜单栏组件，提供传统的桌面应用菜单体验，同时支持通过快捷键切换显示/隐藏。

## 功能需求

### FR8-1: 应用顶部提供可切换的菜单栏

**描述：** 应用顶部必须提供一个包含 File、Edit、View、Agent、Plugins、Tools、Help 七个主菜单的 TopBar。

**验收标准：**
- TopBar 位于应用布局的最顶部
- TopBar 高度为 32px (h-8)
- TopBar 包含应用标题和七个主菜单
- TopBar 背景色为 #1E3A5F（品牌主色）

### FR8-2: 快捷键切换显示/隐藏

**描述：** 用户可以通过 Ctrl+Shift+M（Windows/Linux）或 Cmd+Shift+M（macOS）快捷键切换 TopBar 的显示/隐藏状态。

**验收标准：**
- 快捷键监听器在 App 组件中注册
- 快捷键事件被正确处理，不会触发浏览器默认行为
- TopBar 切换时有流畅的动画效果
- 切换状态即时生效，无需刷新页面

### FR8-3: 状态持久化

**描述：** 系统会记住用户的 TopBar 显示偏好，下次启动时恢复。

**验收标准：**
- TopBar 显示状态保存在 localStorage 中
- 页面刷新后状态保持
- 应用重启后状态恢复
- 默认状态为显示（true）

### FR8-4: File 菜单

**描述：** File 菜单提供文件操作功能。

**菜单项：**
| 菜单项 | 快捷键 | 功能 |
|-------|-------|------|
| New | ⌘N | 新建文档/会话 |
| Open... | ⌘O | 打开文件 |
| --- | --- | --- |
| Save | ⌘S | 保存当前内容 |
| Save As... | - | 另存为新文件 |
| --- | --- | --- |
| Import... | - | 导入文件 |
| Export... | - | 导出文件 |
| --- | --- | --- |
| Print... | - | 打印当前内容 |
| --- | --- | --- |
| Exit | - | 退出应用 |

**验收标准：**
- 所有菜单项正确显示
- 快捷键正确显示在右侧
- 分隔线正确放置
- Exit 选项使用警示样式（destructive）

### FR8-5: Edit 菜单

**描述：** Edit 菜单提供编辑功能。

**菜单项：**
| 菜单项 | 快捷键 | 功能 |
|-------|-------|------|
| Undo | ⌘Z | 撤销操作 |
| Redo | ⌘⇧Z | 重做操作 |
| --- | --- | --- |
| Cut | ⌘X | 剪切选中内容 |
| Copy | ⌘C | 复制选中内容 |
| Paste | ⌘V | 粘贴剪贴板内容 |
| --- | --- | --- |
| Find... | ⌘F | 查找内容 |
| Replace... | ⌘H | 查找并替换 |
| --- | --- | --- |
| Select All | ⌘A | 全选内容 |

### FR8-6: View 菜单

**描述：** View 菜单提供视图控制功能。

**菜单项：**
| 菜单项 | 快捷键 | 功能 |
|-------|-------|------|
| Toggle Menu Bar | ⌘⇧M | 切换菜单栏显示/隐藏 |
| --- | --- | --- |
| Activity Bar | - | 切换活动栏 |
| Sidebar | - | 切换侧边栏 |
| AI Chat Panel | - | 切换 AI 对话面板 |
| --- | --- | --- |
| Full Screen | F11 | 全屏模式 |
| --- | --- | --- |
| Zoom In | ⌘+ | 放大界面 |
| Zoom Out | ⌘- | 缩小界面 |
| Reset Zoom | ⌘0 | 重置缩放 |

**验收标准：**
- Toggle Menu Bar 菜单项正确调用 toggleTopBar()
- 快捷键正确显示
- 菜单项有对应的图标

### FR8-7: Agent 菜单

**描述：** Agent 菜单提供 AI 核心功能。

**菜单项：**
| 菜单项 | 功能 |
|-------|------|
| New Chat | 创建新的 AI 对话 |
| Chat History... | 查看历史对话记录 |
| --- | --- |
| Model Settings... | 配置 AI 模型设置 |
| API Key Management... | 管理 API 密钥 |

**验收标准：**
- 菜单项使用 Bot 图标
- 每个菜单项有对应的功能入口

### FR8-8: Plugins 菜单

**描述：** Plugins 菜单提供插件管理功能。

**菜单项：**
| 菜单项 | 功能 |
|-------|------|
| Plugin Market... | 打开插件市场 |
| Installed Plugins... | 查看已安装插件 |
| Plugin Settings... | 配置插件设置 |

**验收标准：**
- 菜单项使用 Puzzle 图标
- 每个菜单项有对应的功能入口

### FR8-9: Tools 菜单

**描述：** Tools 菜单提供开发者工具。

**菜单项：**
| 菜单项 | 功能 |
|-------|------|
| Data Sync | 触发数据同步 |
| System Logs... | 查看系统日志 |
| Performance Monitor... | 打开性能监控 |

**验收标准：**
- 菜单项使用 Wrench 图标
- 每个菜单项有对应的功能入口

### FR8-10: Help 菜单

**描述：** Help 菜单提供帮助与关于信息。

**菜单项：**
| 菜单项 | 功能 |
|-------|------|
| Documentation | 打开外部文档链接 |
| Keyboard Shortcuts... | 显示快捷键列表 |
| --- | --- |
| About... | 显示关于对话框 |

**验收标准：**
- 菜单项使用 HelpCircle 图标
- Documentation 菜单项应打开外部文档 URL

## 技术规范

### 组件结构

```
TopBar
├── App Title (🏠 AI-Automated-office)
└── Menubar
    ├── FileMenu
    ├── EditMenu
    ├── ViewMenu
    ├── AgentMenu
    ├── PluginsMenu
    ├── ToolsMenu
    └── HelpMenu
```

### 状态管理

**Zustand Store:**
```typescript
interface UIState {
  topBarVisible: boolean
  toggleTopBar: () => void
}
```

**持久化配置:**
- localStorage key: `ui-layout`
- 持久化字段: `topBarVisible`
- 默认值: `true`

### 样式规范

| 属性 | 值 | 说明 |
|------|---|------|
| 高度 | 32px | h-8 |
| 背景色 | #1E3A5F | 品牌主色 |
| 边框色 | #152A45 | 深色分隔 |
| 文字色 | #FFFFFF | 白色 |
| 悬停色 | #2A4A73 | 较亮的品牌色 |
| 内边距 | 8px | px-2 |
| 用户选择 | none | select-none |

### 快捷键规范

| 快捷键 | 功能 | 目标 |
|-------|------|------|
| Ctrl+Shift+M | 切换菜单栏 | View Menu |
| ⌘+⇧+M | 切换菜单栏（macOS） | View Menu |

### 图标规范

所有菜单相关图标使用 Lucide React：
- FileText: File 菜单项
- Edit3: Edit 菜单（可选）
- Eye: View 菜单项
- Bot: Agent 菜单项
- Puzzle: Plugins 菜单项
- Wrench: Tools 菜单项
- HelpCircle: Help 菜单项

## 依赖关系

### 前置依赖
- Story 1.4: VSCode 四栏布局（提供 AppLayout 基础结构）

### 后续依赖
- 各菜单项对应的功能模块

## 非功能需求

### 性能
- TopBar 切换响应时间 < 100ms
- 菜单展开动画流畅（60fps）

### 可访问性
- 菜单项支持键盘导航
- 快捷键正确显示
- 高对比度模式兼容

### 兼容性
- Windows/Linux: Ctrl+Shift+M
- macOS: Cmd+Shift+M

---

## 右侧布局控制按钮规范

### FR8-11: TopBar 右侧布局控制按钮

**描述：** TopBar 右侧提供 4 个布局控制按钮，与 VSCode 对齐。

**验收标准：**
- 按钮位于 TopBar 右侧，使用 flex justify-between 布局
- 按钮尺寸为 24x24px（h-6 w-6）
- 按钮间距为 4px（gap-1）
- 所有按钮有 Tooltip 提示

### 组件结构

```
TopBar
├── Left Section
│   ├── App Title (🏠 AI-Automated-office)
│   └── Menubar (File, Edit, View, Agent, Plugins, Tools, Help)
└── Right Section
    └── LayoutControlButtons
        ├── 自定义布局 (LayoutTemplate)
        ├── 切换左侧栏 (PanelLeft)
        ├── 切换面板 (PanelBottom) - 禁用
        └── 切换辅助侧栏 (PanelRight)
```

### 按钮规范

| 按钮 | 图标 | 功能 | 快捷键 | 状态 |
|:-----|:-----|:-----|:-------|:-----|
| **自定义布局** | `LayoutTemplate` | 打开布局自定义对话框 | - | 启用 |
| **切换左侧栏** | `PanelLeft` | 显示/隐藏 Sidebar | `Ctrl+B` | 启用，状态同步 |
| **切换面板** | `PanelBottom` | 显示/隐藏底部面板 | `Ctrl+J` | 禁用（预留） |
| **切换辅助侧栏** | `PanelRight` | 显示/隐藏 AI Chat Panel | `Ctrl+Shift+I` | 启用，状态同步 |

### 按钮样式规范

| 状态 | 样式 |
|:-----|:-----|
| **默认** | `h-6 w-6 text-white hover:bg-[#2A4A73]` |
| **激活（面板显示）** | `bg-[#3A5A83]` |
| **禁用** | `text-white/40 cursor-not-allowed disabled` |
| **按钮容器** | `flex items-center gap-1` |

### FR8-12: 自定义布局按钮

**描述：** 点击自定义布局按钮打开布局自定义对话框。

**功能：**
- 打开对话框让用户自定义面板布局
- 对话框内容在后续 Story 中实现
- 当前可以点击但功能为空或显示"即将推出"提示

### FR8-13: 切换左侧栏按钮

**描述：** 点击切换左侧栏按钮显示/隐藏 Sidebar。

**功能：**
- 调用 `useUIStore` 的 `toggleSidebar()` 方法
- 按钮激活状态与 `sidebarCollapsed` 状态反向同步
- 面板显示时按钮高亮（`bg-[#3A5A83]`）
- Tooltip 显示"切换左侧栏 (Ctrl+B)"

**快捷键：** `Ctrl+B`（Windows/Linux）或 `⌘+B`（macOS）

### FR8-14: 切换面板按钮

**描述：** 切换底部面板按钮，当前禁用，预留未来扩展。

**功能：**
- 按钮处于禁用状态（`disabled`）
- 样式为半透明（`text-white/40`）
- Tooltip 显示"切换面板 (暂未实现)"
- 预留快捷键 `Ctrl+J`

**未来扩展：** 实现底部面板（类似 VSCode 的终端、调试、输出等面板）

### FR8-15: 切换辅助侧栏按钮

**描述：** 点击切换辅助侧栏按钮显示/隐藏右侧 AI Chat Panel。

**功能：**
- 调用 `useUIStore` 的 `toggleChatPanel()` 方法
- 按钮激活状态与 `chatPanelCollapsed` 状态反向同步
- 面板显示时按钮高亮（`bg-[#3A5A83]`）
- Tooltip 显示"切换辅助侧栏 (Ctrl+Shift+I)"

**快捷键：** `Ctrl+Shift+I`（Windows/Linux）或 `⌘+⇧+I`（macOS）

### 技术实现

**新增 Shadcn/ui 组件：**
- `tooltip`: 用于按钮提示

**新增 Lucide React 图标：**
- `LayoutTemplate`: 自定义布局
- `PanelLeft`: 左侧栏
- `PanelBottom`: 底部面板
- `PanelRight`: 右侧辅助栏

**TopBar 组件更新：**
```typescript
interface TopBarProps {
  visible: boolean
  onToggle: () => void
  onOpenLayoutDialog?: () => void  // 新增：打开布局对话框回调
}
```

### 布局控制按钮快捷键

| 快捷键 | 功能 | Windows/Linux | macOS |
|-------|------|---------------|-------|
| 切换左侧栏 | 显示/隐藏 Sidebar | `Ctrl+B` | `⌘+B` |
| 切换面板 | 显示/隐藏底部面板 | `Ctrl+J` | `⌘+J` |
| 切换辅助侧栏 | 显示/隐藏 AI Panel | `Ctrl+Shift+I` | `⌘+⇧+I` |
