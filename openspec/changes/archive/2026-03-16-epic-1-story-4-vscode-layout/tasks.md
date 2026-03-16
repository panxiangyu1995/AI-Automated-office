# Tasks: 类VSCode四栏布局

## 任务列表

### 任务 1: 创建布局组件结构
- [x] **描述**: 创建 AppLayout 根组件
- **文件**: `src/components/common/AppLayout.tsx`
- **验收**: 组件结构正确

### 任务 2: 实现活动栏组件
- [x] **描述**: 创建 ActivityBar 组件
- **文件**: `src/components/common/ActivityBar.tsx`
- **验收**: 活动栏正常显示

### 任务 3: 实现侧边栏组件
- [x] **描述**: 创建 Sidebar 组件，支持折叠
- **文件**: `src/components/common/Sidebar.tsx`
- **验收**: 侧边栏可折叠

### 任务 4: 实现工作区组件
- [x] **描述**: 创建 Workbench 组件
- **文件**: `src/components/common/Workbench.tsx`
- **验收**: 工作区正常显示

### 任务 5: 实现 AI 对话面板组件
- [x] **描述**: 创建 AiChatPanel 组件，支持折叠
- **文件**: `src/components/common/AiChatPanel.tsx`
- **验收**: AI 面板可折叠

### 任务 6: 实现状态栏组件
- [x] **描述**: 创建 StatusBar 组件
- **文件**: `src/components/common/StatusBar.tsx`
- **验收**: 状态栏显示

### 任务 7: 实现面板拖拽调整
- [x] **描述**: 创建 ResizablePanel 组件
- **文件**: `src/components/common/ResizablePanel.tsx`
- **验收**: 面板可拖拽调整大小

### 任务 8: 创建布局状态管理
- [x] **描述**: 创建 UI 状态 store
- **文件**: `src/stores/uiStore.ts`
- **验收**: 布局状态可管理

### 任务 9: 实现布局持久化
- [x] **描述**: 使用 Zustand persist 中间件
- **文件**: `src/stores/uiStore.ts`
- **验收**: 布局配置保存到本地

### 任务 10: 集成到应用
- [x] **描述**: 在 App.tsx 中使用 AppLayout
- **文件**: `src/App.tsx`
- **验收**: 布局正常显示

## 执行顺序

1. 任务 1（创建布局结构）
2. 任务 2 → 任务 3 → 任务 4 → 任务 5 → 任务 6（各面板组件）
3. 任务 7（拖拽功能）
4. 任务 8 → 任务 9（状态管理）
5. 任务 10（集成）

## 测试要点

- [x] 四栏布局正常显示
- [x] 侧边栏可折叠/展开
- [x] AI 面板可折叠/展开
- [x] 面板可拖拽调整大小
- [x] 布局状态持久化
- [ ] 响应式适配
- [ ] 折叠/展开动画流畅
