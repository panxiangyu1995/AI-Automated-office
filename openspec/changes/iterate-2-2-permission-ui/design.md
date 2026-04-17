# 设计文档 - 权限管理UI组件

## 涉及文件

### 新增
- `src/features/permission/components/RoleList.tsx` - 角色列表
- `src/features/permission/components/PermissionConfig.tsx` - 权限配置

## 修改方案

### 1. RoleList组件

```typescript
export function RoleList() {
  // 角色列表
  // 支持CRUD
  // 支持权限关联展示
}
```

### 2. PermissionConfig组件

```typescript
export function PermissionConfig({ roleId }: { roleId: string }) {
  // 权限树形展示
  // 支持勾选配置
  // 保存权限设置
}
```
