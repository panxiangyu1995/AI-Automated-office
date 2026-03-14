# Tasks: 可切换TopBar菜单栏

## 实施任务列表

### Task 1: 安装 Shadcn/ui 组件
- [x] 运行 `npx shadcn@latest add menubar` 安装 Menubar 组件
- [x] 运行 `npx shadcn@latest add tooltip` 安装 Tooltip 组件
- [x] 运行 `npx shadcn@latest add button` 安装 Button 组件（如果尚未安装）
- [x] 验证组件正确安装到 `src/components/ui/` 目录
- [x] 检查组件依赖是否正确安装

### Task 2: 创建 TopBar 组件
- [x] 创建 `src/components/layout/TopBar.tsx`
- [x] 实现 TopBar 主结构（header + 左侧应用标题菜单 + 右侧布局按钮）
- [x] 实现 File 菜单（New、Open、Save、Save As、Import、Export、Print、Exit）
- [x] 实现 Edit 菜单（Undo、Redo、Cut、Copy、Paste、Find、Replace、Select All）
- [x] 实现 View 菜单（Toggle Menu Bar、Activity Bar、Sidebar、AI Chat Panel、Full Screen、Zoom）
- [x] 实现 Agent 菜单（New Chat、Chat History、Model Settings、API Key Management）
- [x] 实现 Plugins 菜单（Plugin Market、Installed Plugins、Plugin Settings）
- [x] 实现 Tools 菜单（Data Sync、System Logs、Performance Monitor）
- [x] 实现 Help 菜单（Documentation、Keyboard Shortcuts、About）
- [x] 应用正确的样式（颜色、间距、高度）
- [x] 添加 Lucide React 图标到各菜单项

### Task 2.1: 创建布局控制按钮组件
- [x] 创建 `LayoutControlButtons` 子组件
- [x] 实现自定义布局按钮（LayoutTemplate 图标）
- [x] 实现切换左侧栏按钮（PanelLeft 图标，绑定 toggleSidebar）
- [x] 实现切换面板按钮（PanelBottom 图标，当前禁用状态）
- [x] 实现切换辅助侧栏按钮（PanelRight 图标，绑定 toggleChatPanel）
- [x] 添加 Tooltip 提示（使用 Shadcn/ui Tooltip 组件）
- [x] 实现按钮激活状态样式（面板显示时高亮）
- [x] 确保 TopBar 布局使用 flex justify-between 分隔左右内容

### Task 3: 更新状态管理
- [x] 在 `src/stores/uiStore.ts` 中添加 `topBarVisible` 状态
- [x] 添加 `toggleTopBar()` 方法
- [x] 配置 Zustand persist 中间件持久化 `topBarVisible`
- [x] 设置默认值为 `true`（首次启动显示菜单栏）

### Task 4: 更新 AppLayout 组件
- [x] 在 `src/components/layout/AppLayout.tsx` 中导入 TopBar 组件
- [x] 在布局顶部添加 TopBar 组件
- [x] 实现 Ctrl+Shift+M / Cmd+Shift+M 快捷键监听
- [x] 确保 TopBar 可以正确切换显示/隐藏
- [x] 验证布局在 TopBar 显示/隐藏时的正确性

### Task 5: 添加首次启动提示
- [x] 在 `src/App.tsx` 中添加首次启动提示逻辑
- [x] 使用 Shadcn/ui Alert 组件显示提示
- [x] 实现"知道了"按钮，设置 localStorage 标记
- [x] 提示内容包括快捷键说明
- [x] 样式符合 UX 规范

### Task 6: 菜单项功能实现
- [x] 实现 File → Exit：调用 Tauri 关闭窗口 API
- [x] 实现 View → Toggle Menu Bar：调用 toggleTopBar()
- [x] 为其他菜单项添加空处理函数（后续实现）
- [x] 添加菜单项点击的日志记录

### Task 7: 测试与验证
- [x] 验证 TopBar 默认显示
- [x] 验证 Ctrl+Shift+M 快捷键可以切换 TopBar
- [x] 验证刷新页面后 TopBar 状态保持
- [x] 验证首次启动显示提示
- [x] 验证所有菜单可以正确展开
- [x] 验证菜单项点击有响应
- [x] 验证样式符合 UX 规范
- [x] 验证响应式布局

### Task 8: 文档更新
- [x] 更新 CLAUDE.md 中的布局结构说明
- [x] 更新组件文档
- [x] 添加快捷键列表到帮助文档

## 验收标准

- [x] TopBar 默认显示在应用最顶部
- [x] 包含 File、Edit、View、Agent、Plugins、Tools、Help 七个菜单
- [x] 通过 Ctrl+Shift+M 可切换显示/隐藏
- [x] 隐藏状态被持久化到 localStorage
- [x] 所有菜单项的快捷键正确显示
- [x] 视觉设计符合 UX 规范的颜色系统
- [x] 使用 Shadcn/ui Menubar 组件实现
- [x] 菜单项使用 Lucide React 图标

## 覆盖的需求

| 编号 | 需求 |
|-----|------|
| FR8-1 | 应用顶部提供可切换的菜单栏（TopBar） |
| FR8-2 | 用户可以通过快捷键切换菜单栏的显示/隐藏状态 |
| FR8-3 | 系统会记住用户的菜单栏显示偏好 |
| FR8-4 | File 菜单提供文件操作功能 |
| FR8-5 | Edit 菜单提供编辑功能 |
| FR8-6 | View 菜单提供视图控制功能 |
| FR8-7 | Agent 菜单提供 AI 核心功能 |
| FR8-8 | Plugins 菜单提供插件管理功能 |
| FR8-9 | Tools 菜单提供开发者工具 |
| FR8-10 | Help 菜单提供帮助与关于 |
| FR8-11 | TopBar 右侧提供 4 个布局控制按钮，与 VSCode 对齐 |
| FR8-12 | 自定义布局按钮打开布局自定义对话框 |
| FR8-13 | 切换左侧栏按钮显示/隐藏左侧 Sidebar（快捷键 Ctrl+B） |
| FR8-14 | 切换面板按钮显示/隐藏底部面板（当前禁用，预留） |
| FR8-15 | 切换辅助侧栏按钮显示/隐藏右侧 AI Chat Panel（快捷键 Ctrl+Shift+I） |
