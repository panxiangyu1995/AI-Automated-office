# Tasks: Admin模块mock数据替换与UX增强

## Task 1: 创建admin API Service

- 文件: `src/features/admin/services/adminApi.ts`
- 定义 adminApi 对象，包含所有admin相关API方法
- 使用已有的 apiClient 和 ApiResponse 类型
- 验收: 文件创建成功，TypeScript编译通过

## Task 2: 改造UserListPage

- 文件: `src/features/admin/pages/UserListPage.tsx`
- 移除 mockDepartments 硬编码
- 添加 useApi 调用获取部门列表
- 添加 loading 时 TableSkeleton 展示
- 添加空数据时 EmptyState 展示
- 用 ErrorBoundary 包裹
- 验收: 页面加载显示骨架屏，无数据显示空状态，无mock数据

## Task 3: 改造UserCreatePage和UserEditPage

- 文件: `src/features/admin/pages/UserCreatePage.tsx`, `UserEditPage.tsx`
- 移除 mockDepartments/mockRoles 硬编码
- 添加 useApi 获取部门和角色列表
- 加载时显示 FormSkeleton
- 验收: 无mock数据，加载时有骨架屏

## Task 4: 改造OrganizationPage

- 文件: `src/features/admin/pages/OrganizationPage.tsx`
- 添加loading/empty/error状态处理
- 验收: 页面有完整的UX状态

## Task 5: 验证构建

- 运行 npm run build 确认零错误
