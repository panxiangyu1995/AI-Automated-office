# Spec: Admin模块mock数据替换与UX增强

## 接口定义

### adminApi Service

```typescript
export const adminApi = {
  getDepartments: () => Promise<ApiResponse<Department[]>>
  getPositions: () => Promise<ApiResponse<Position[]>>
  getRoles: () => Promise<ApiResponse<Role[]>>
  getUsers: (params?: PaginationParams) => Promise<PaginatedResponse<User>>
  getUser: (id: string) => Promise<ApiResponse<User>>
  createUser: (data: CreateUserDTO) => Promise<ApiResponse<User>>
  updateUser: (id: string, data: UpdateUserDTO) => Promise<ApiResponse<User>>
  updateStatus: (id: string, status: UserStatus) => Promise<ApiResponse<void>>
}
```

### UX状态要求

- **Loading**: 使用 TableSkeleton/CardSkeleton/FormSkeleton
- **Empty**: 使用 EmptyState variant="data" + action按钮
- **Error**: 使用 ErrorBoundary 包裹 + 内联error提示

## 验收标准

1. TypeScript编译零错误
2. npm run build 成功
3. UserListPage无mock数据
4. UserCreatePage无mock数据
5. 加载状态显示骨架屏
6. 空数据显示EmptyState
7. 不影响现有其他页面
