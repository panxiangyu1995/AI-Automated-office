# Proposal: Admin模块mock数据替换与UX增强

## 背景

第1轮已建立UX基础组件(LoadingSkeleton/EmptyState/ErrorBoundary/FormField)。
现在需要将admin模块中的mock数据替换为真实API调用，并应用UX组件。

## 目标

1. 创建admin模块的API Service层（使用已有useApi Hook）
2. 替换UserListPage/UserCreatePage/UserEditPage中的mockDepartments/mockRoles
3. 在加载状态中应用TableSkeleton/Cardskeleton
4. 在空列表时展示EmptyState
5. 用ErrorBoundary包裹页面

## 变更内容

- `src/features/admin/services/adminApi.ts` - Admin API Service（新增）
- `src/features/admin/pages/UserListPage.tsx` - 替换mock、添加Loading/Empty/Error状态
- `src/features/admin/pages/UserCreatePage.tsx` - 替换mock数据
- `src/features/admin/pages/UserEditPage.tsx` - 替换mock数据
- `src/features/admin/pages/OrganizationPage.tsx` - 添加Loading/Empty状态

## 预期效果

- admin模块不再依赖硬编码mock数据
- 页面加载时有骨架屏而非空白
- 数据为空时有友好空状态
- 错误时有ErrorBoundary优雅降级
