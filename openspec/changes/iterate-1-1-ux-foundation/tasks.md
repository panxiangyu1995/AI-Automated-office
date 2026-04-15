# Tasks: 前端UX基础组件体系建设

## Task 1: 安装依赖

- 安装 react-hook-form 和 @hookform/resolvers 和 zod（如未安装）
- 验证 package.json 中依赖存在

## Task 2: 创建LoadingSkeleton组件

- 文件: `src/components/ui/loading-skeleton.tsx`
- 创建 PageSkeleton、CardSkeleton、TableSkeleton、FormSkeleton、ChatSkeleton 预设组件
- 基于 shadcn/ui 的 Skeleton 组件封装
- 验收: 可导入使用，TypeScript编译通过

## Task 3: 创建EmptyState组件

- 文件: `src/components/ui/empty-state.tsx`
- 支持图标、标题、描述、操作按钮
- 支持 default / search / data / error 变体
- 验收: 可导入使用，各变体渲染正确

## Task 4: 创建ErrorBoundary组件

- 文件: `src/components/ui/error-boundary.tsx`
- React错误边界，捕获子组件错误
- 友好错误页面 + 重试按钮
- 开发环境显示错误详情
- 验收: 故意抛错时展示错误界面而非白屏

## Task 5: 创建FormField组件和validation工具

- 文件: `src/components/ui/form-field.tsx`
- 文件: `src/lib/validation.ts`
- 基于react-hook-form + zod的表单字段组件
- zod schema快捷定义工具
- 验收: 导入使用正常，TypeScript编译通过

## Task 6: 验证构建

- 运行 npm run build 确认零错误
- 运行 npm run lint 确认无lint错误
