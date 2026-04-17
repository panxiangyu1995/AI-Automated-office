# 规格文档 - 权限管理UI组件

## RoleList组件

```typescript
interface RoleListProps {
  onRoleSelect?: (role: Role) => void;
}

function RoleList({ onRoleSelect }: RoleListProps)
```

## PermissionConfig组件

```typescript
interface PermissionConfigProps {
  roleId: string;
  permissions: Permission[];
  onSave?: (permissions: string[]) => void;
}

function PermissionConfig({ roleId, permissions, onSave }: PermissionConfigProps)
```
