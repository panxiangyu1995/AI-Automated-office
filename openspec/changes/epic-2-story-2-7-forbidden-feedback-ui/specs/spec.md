## ADDED Requirements

### Requirement: Story 2.7 UI - 权限拒绝反馈界面能力基线
系统 SHALL 实现前端权限拒绝反馈界面，满足 FR(FR29, FR31, FR32) 和 UX(UX-02, UX-04) 的要求。

#### Scenario: 能力基线建立
- **WHEN** 用户访问无权限的资源或操作时
- **THEN** 系统 MUST 提供友好的权限拒绝反馈界面

### Requirement: Story 2.7 UI-1 - 创建 403 页面和无权限空状态
系统 MUST 实现 Create 403 page and no-permission empty state 功能，提供统一的权限拒绝展示。

#### Scenario: Story 2.7 UI-1 验证通过
- **WHEN** 用户无权限访问某页面时
- **THEN** 系统 SHALL 显示 403 页面并展示拒绝原因

### Requirement: Story 2.7 UI-2 - 添加权限守卫组件
系统 MUST 实现 Add permission guard components 功能，支持按钮级权限控制。

#### Scenario: Story 2.7 UI-2 验证通过
- **WHEN** 用户无权限执行某操作时
- **THEN** 系统 SHALL 根据配置隐藏/禁用/显示空状态

### Requirement: Story 2.7 UI-3 - 显示拒绝原因和所需权限
系统 MUST 实现 Show denial reason and required permission 功能，清晰展示权限信息。

#### Scenario: Story 2.7 UI-3 验证通过
- **WHEN** 权限被拒绝时
- **THEN** 系统 SHALL 显示被拒绝的资源标识和所需权限

### Requirement: Story 2.7 UI-4 - 添加申请权限入口
系统 MUST 实现 Add apply-for-permission entry placeholder 功能，提供权限申请入口。

#### Scenario: Story 2.7 UI-4 验证通过
- **WHEN** 用户点击申请权限时
- **THEN** 系统 SHALL 显示权限申请弹窗并支持提交申请

---

## Component Specification

### ForbiddenPage

**路由:** `/forbidden`

**Props:**
```typescript
interface ForbiddenPageProps {
  resource?: string;           // 被拒绝的资源标识
  requiredPermission?: string; // 所需权限编码
  message?: string;            // 自定义提示消息
  onApply?: () => void;        // 申请权限回调
  onBack?: () => void;         // 返回回调
}
```

**UI 结构:**
```
┌──────────────────────────────────────────────────────────────┐
│                        [ShieldX Icon]                         │
│                      访问被拒绝                                │
│           您没有权限访问此页面，请联系管理员申请相应权限       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 资源                                                    │ │
│  │ hr.employee                                            │ │
│  │ 所需权限                                                │ │
│  │ hr_employee_write                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│              [返回上一页]  [申请权限]                         │
└──────────────────────────────────────────────────────────────┘
```

### NoPermissionEmpty

**Props:**
```typescript
interface NoPermissionEmptyProps {
  title?: string;       // 标题，默认 "暂无权限"
  description?: string; // 描述，默认 "您没有权限查看此内容"
  onApply?: () => void; // 申请权限回调
}
```

**UI 结构:**
```
┌──────────────────────────────────────────────────────────────┐
│                        [Lock Icon]                            │
│                        暂无权限                                │
│              您没有权限查看此内容                              │
│                     [申请查看权限]                             │
└──────────────────────────────────────────────────────────────┘
```

### PermissionGuard

**Props:**
```typescript
type PermissionGuardMode = 'hidden' | 'disabled' | 'empty';

interface PermissionGuardProps {
  permission: string | string[];     // 所需权限（支持多个权限 OR 关系）
  mode?: PermissionGuardMode;        // 守卫模式，默认 'hidden'
  emptyComponent?: React.ReactNode;  // empty 模式的自定义组件
  disabledReason?: string;           // disabled 模式的提示原因
  children: React.ReactNode;         // 需要保护的子组件
}
```

**使用示例:**
```tsx
// 隐藏模式（默认）
<PermissionGuard permission="hr_employee_write">
  <Button>编辑员工</Button>
</PermissionGuard>

// 禁用模式
<PermissionGuard permission="hr_employee_delete" mode="disabled" disabledReason="需要删除权限">
  <Button>删除员工</Button>
</PermissionGuard>

// 空状态模式
<PermissionGuard permission="hr_employee_read" mode="empty">
  <EmployeeTable />
</PermissionGuard>

// 多权限（OR 关系）
<PermissionGuard permission={["hr_employee_write", "hr_employee_admin"]}>
  <Button>高级操作</Button>
</PermissionGuard>
```

### ForbiddenModal

**Props:**
```typescript
interface ForbiddenModalProps {
  open: boolean;      // 是否打开
  onClose: () => void; // 关闭回调
  data: {
    resource: string;           // 资源标识
    requiredPermission: string; // 所需权限
    message: string;            // 错误消息
    applyEntry: string;         // 申请入口 URL
    traceId: string;            // 追踪 ID
  };
}
```

**UI 结构:**
```
┌──────────────────────────────────────────────────────────────┐
│  [ShieldX] 操作被拒绝                                    [X] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  当前账号无权限执行该操作                                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 资源：hr.employee                                      │ │
│  │ 所需权限：hr_employee_write                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                              [返回]  [申请权限]              │
└──────────────────────────────────────────────────────────────┘
```

### ApplyPermissionModal

**Props:**
```typescript
interface ApplyPermissionModalProps {
  open: boolean;                    // 是否打开
  onClose: () => void;              // 关闭回调
  resource: string;                 // 资源标识
  requiredPermission: string;       // 所需权限
}
```

**UI 结构:**
```
┌──────────────────────────────────────────────────────────────┐
│  申请权限                                                [X] │
│  请填写申请原因，我们将尽快处理您的申请。                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  申请权限                                                    │
│  hr_employee_write                                          │
│                                                              │
│  申请原因                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 请说明为什么需要此权限...                              │ │
│  │                                                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                              [取消]  [提交申请]              │
└──────────────────────────────────────────────────────────────┘
```

---

## Hooks Specification

### usePermission

```typescript
interface UsePermissionReturn {
  permissions: Set<string>;      // 当前用户权限集合
  isLoading: boolean;            // 是否正在加载
  hasPermission: (permission: string | string[]) => boolean; // 检查权限
  refresh: () => Promise<void>;  // 刷新权限
}

function usePermission(): UsePermissionReturn;
```

### useForbiddenHandler

```typescript
interface UseForbiddenHandlerReturn {
  showForbidden: (data: ForbiddenData) => void; // 显示 403 弹窗
  hideForbidden: () => void;                    // 隐藏 403 弹窗
  forbiddenModal: {
    open: boolean;
    data: ForbiddenData | null;
  };
}

function useForbiddenHandler(): UseForbiddenHandlerReturn;
```

### useApplyPermission

```typescript
interface ApplyPermissionParams {
  resource: string;
  permission: string;
  reason: string;
}

function useApplyPermission(): {
  mutate: (params: ApplyPermissionParams, options?: MutationOptions) => void;
  isPending: boolean;
};
```

---

## Axios Interceptor Specification

### 403 Response Interceptor

```typescript
// src/lib/axios-interceptor.ts
export function setupForbiddenInterceptor(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ForbiddenResponse>) => {
      if (error.response?.status === 403) {
        const data = error.response.data;
        
        // 调用权限 Store 显示弹窗
        usePermissionStore.getState().showForbidden({
          resource: data.resource,
          requiredPermission: data.required_permission,
          message: data.message,
          applyEntry: data.apply_entry,
          traceId: data.trace_id,
        });
        
        // 返回一个 reject，避免后续处理
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
}
```

---

## Error Handling

### 场景处理

| 场景 | 处理方式 |
|------|---------|
| 路由级无权限 | 重定向到 /forbidden 页面 |
| API 返回 403 | 弹出 ForbiddenModal |
| 按钮级无权限 | 根据 mode 隐藏/禁用/显示空状态 |
| 申请提交失败 | Toast 错误提示 |
| 申请提交成功 | Toast 成功提示，关闭弹窗 |