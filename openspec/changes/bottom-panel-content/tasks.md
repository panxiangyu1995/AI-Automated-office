# Tasks: bottom-panel-content

## 实现类型

- **类型**: new
- **优先级**: low
- **阶段**: Phase X - L4 Bottom Panel 内容
- **状态**: ✅ 已完成 (2026-04-10)

## 前置依赖

- `workbench-tab-system`（已完成）

## 任务列表

### Task 1: 创建面板类型定义

**描述**: 定义面板类型和基础组件

**文件**:
- `src/components/common/panel/types.ts`

**验收**:
- [x] 定义 PanelType 枚举
- [x] 定义 PanelProps 接口
- [x] 定义面板内容接口

**子任务**:
- [x] 1.1 定义 PanelType 枚举
- [x] 1.2 定义接口

### Task 2: 创建 PropertiesPanel

**描述**: 属性面板组件

**文件**:
- `src/components/common/panel/PropertiesPanel.tsx`

**验收**:
- [x] 显示属性列表
- [x] 支持折叠/展开
- [x] 支持复制属性值

**子任务**:
- [x] 2.1 创建组件结构
- [x] 2.2 实现属性渲染
- [x] 2.3 添加复制功能

### Task 3: 创建 DiagnosticsPanel

**描述**: 诊断面板组件

**文件**:
- `src/components/common/panel/DiagnosticsPanel.tsx`

**验收**:
- [x] 显示诊断项列表
- [x] 支持严重程度图标
- [x] 支持折叠/展开

**子任务**:
- [x] 3.1 创建组件结构
- [x] 3.2 实现诊断项渲染
- [x] 3.3 添加图标和颜色

### Task 4: 创建 PreviewPanel

**描述**: 预览面板组件

**文件**:
- `src/components/common/panel/PreviewPanel.tsx`

**验收**:
- [x] 显示图片预览
- [x] 显示 PDF 预览
- [x] 支持缩放

**子任务**:
- [x] 4.1 创建组件结构
- [x] 4.2 实现图片预览
- [x] 4.3 实现 PDF 预览
- [x] 4.4 添加缩放功能

### Task 5: 创建 AiSuggestionsPanel

**描述**: AI 建议面板组件

**文件**:
- `src/components/common/panel/AiSuggestionsPanel.tsx`

**验收**:
- [x] 显示建议列表
- [x] 支持采纳/忽略操作
- [x] 支持展开详情

**子任务**:
- [x] 5.1 创建组件结构
- [x] 5.2 实现建议渲染
- [x] 5.3 添加操作按钮

### Task 6: 创建 BottomPanel 内容管理器

**描述**: 整合所有面板内容到 BottomPanel

**文件**:
- `src/components/common/BottomPanel.tsx`

**验收**:
- [x] 面板类型切换
- [x] 动态渲染对应内容
- [x] 空状态处理

**子任务**:
- [x] 6.1 添加面板切换按钮
- [x] 6.2 实现动态渲染
- [x] 6.3 测试各种面板

### Task 7: 集成到 Tab 系统

**描述**: 将 BottomPanel 与 Tab 系统集成

**文件**:
- `src/stores/workbenchStore.ts`
- `src/components/common/WorkbenchTabs.tsx`

**验收**:
- [x] Tab 变化时更新面板内容（通过路由监听实现）
- [x] 面板状态与 Tab 关联

**子任务**:
- [x] 7.1 扩展 Tab 类型添加面板属性（已有 meta 字段）
- [x] 7.2 实现面板内容联动（通过路由监听）
- [x] 7.3 测试集成

## 测试要点

- [x] 单元测试: 各面板组件
- [x] 集成测试: BottomPanel 内容切换
- [x] E2E 测试: 面板与 Tab 联动
- [x] 浏览器测试: 面板渲染和交互

## 验收标准

1. [x] BottomPanel 可以切换显示不同类型的内容
2. [x] PropertiesPanel 显示属性信息
3. [x] DiagnosticsPanel 显示诊断信息
4. [x] PreviewPanel 显示预览内容
5. [x] 当前 Tab 变化时，面板内容相应更新
6. [x] 面板内容超出时支持滚动

## 实现文件清单

```
新建文件：
├── src/components/common/panel/types.ts              # 面板类型定义
├── src/components/common/panel/PropertiesPanel.tsx  # 属性面板
├── src/components/common/panel/DiagnosticsPanel.tsx # 诊断面板
├── src/components/common/panel/PreviewPanel.tsx    # 预览面板
├── src/components/common/panel/AiSuggestionsPanel.tsx # AI建议面板
├── src/components/common/panel/index.ts            # 面板组件导出

修改文件：
└── src/components/common/BottomPanel.tsx           # 整合所有面板内容
```
