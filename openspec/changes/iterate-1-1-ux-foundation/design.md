# Design: 前端UX基础组件体系建设

## 涉及文件

- `src/components/ui/loading-skeleton.tsx` - 骨架屏组件（新增）
- `src/components/ui/empty-state.tsx` - 空状态组件（新增）
- `src/components/ui/error-boundary.tsx` - 错误边界组件（新增）
- `src/components/ui/form-field.tsx` - 表单字段组件（新增，集成验证）
- `src/lib/validation.ts` - 表单验证工具（新增，zod schema helper）

## 技术设计

### 1. LoadingSkeleton

基于shadcn/ui的Skeleton组件，提供预设的骨架屏模式：

- PageSkeleton（整页骨架）
- CardSkeleton（卡片骨架）
- TableSkeleton（表格骨架）
- FormSkeleton（表单骨架）
- ChatSkeleton（对话骨架）

支持传入自定义行数、列数等参数。

### 2. EmptyState

统一的空状态展示：

- 图标（Lucide图标）
- 标题
- 描述文字
- 操作按钮（可选）
- 变体：default / search-empty / data-empty / error

### 3. ErrorBoundary

React错误边界组件：

- 捕获子组件渲染错误
- 展示友好的错误页面
- 提供"重试"按钮
- 开发环境展示错误详情

### 4. FormField

基于react-hook-form + zod的表单字段组件：

- 统一的标签、验证提示、错误显示
- 支持多种输入类型（text/textarea/select/number/switch）
- 自动与zod schema关联

### 5. validation工具

- zod schema常用规则快捷定义
- 表单错误消息中文本地化

## 样式规范

- 颜色：主色 #1E3A5F，状态色遵循UX规范
- 使用Tailwind CSS
- 使用Lucide React图标
- 遵循shadcn/ui组件设计令牌
