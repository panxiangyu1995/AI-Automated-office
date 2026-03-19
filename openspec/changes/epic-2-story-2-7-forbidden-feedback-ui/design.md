## Context

- **Change:** `epic-2-story-2-7-forbidden-feedback-ui`
- **Story:** Story 2.7 - 权限拒绝反馈 UI
- **Capability:** `forbidden-feedback-ui`
- **需求映射:** FR(FR29, FR31, FR32), NFR(NFR16), ARCH(ADR-001), UX(UX-02, UX-04)

本设计文档定义前端权限拒绝反馈的详细设计，包括组件结构、交互流程和状态管理。

## Goals / Non-Goals

**Goals:**
- 实现统一的 403 页面和无权限空状态
- 实现权限守卫组件支持按钮级权限控制
- 实现 403 响应全局处理
- 实现权限申请入口

**Non-Goals:**
- 不涉及权限网关实现（由 E2-S2.7-01 处理）
- 不涉及权限计算逻辑（由 E2-S2.5-01 和 E2-S2.6-01 处理）

## Architecture Design

### 组件架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端权限反馈组件架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  src/components/permission/                                     │
│  ├── ForbiddenPage.tsx          # 403 专用页面                  │
│  ├── NoPermissionEmpty.tsx      # 无权限空状态                  │
│  ├── PermissionGuard.tsx        # 权限守卫组件                  │
│  ├── ForbiddenModal.tsx         # 权限拒绝弹窗                  │
│  └── ApplyPermissionModal.tsx   # 申请权限弹窗                  │
│                                                                 │
│  src/hooks/permission/                                          │
│  ├── usePermission.ts           # 权限检查 Hook                 │
│  ├── useForbiddenHandler.ts     # 403 处理 Hook                 │
│  └── useApplyPermission.ts      # 申请权限 Hook                 │
│                                                                 │
│  src/stores/                                                    │
│  └── permissionStore.ts         # 权限状态 Store                │
│                                                                 │
│  src/lib/                                                       │
│  └── axios-interceptor.ts       # 403 响应拦截器                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 交互流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    403 响应处理流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户操作（如点击按钮）                                          │
│       │                                                         │
│       ▼                                                         │
│  发起 API 请求                                                  │
│       │                                                         │
│       ▼                                                         │
│  服务端返回 403 响应                                            │
│       │                                                         │
│       ▼                                                         │
│  Axios 拦截器捕获                                               │
│       │                                                         │
│       ├──► 检查是否为 403 状态码                                │
│       │                                                         │
│       └──► 解析响应体                                           │
│            {                                                    │
│              code: "PERMISSION_DENIED",                         │
│              message: "...",                                    │
│              resource: "...",                                   │
│              required_permission: "...",                        │
│              apply_entry: "..."                                 │
│            }                                                    │
│            │                                                    │
│            ▼                                                    │
│       调用 permissionStore.showForbidden()                      │
│            │                                                    │
│            ▼                                                    │
│       显示 ForbiddenModal                                       │
│            │                                                    │
│            ├──► 用户点击"申请权限"                              │
│            │         │                                          │
│            │         ▼                                          │
│            │    打开 ApplyPermissionModal                       │
│            │         │                                          │
│            │         ▼                                          │
│            │    填写申请原因                                    │
│            │         │                                          │
│            │         ▼                                          │
│            │    提交申请                                        │
│            │                                                    │
│            └──► 用户点击"返回"                                  │
│                      │                                          │
│                      ▼                                          │
│                 返回上一页或首页                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### ForbiddenPage 组件

```tsx
// src/components/permission/ForbiddenPage.tsx
interface ForbiddenPageProps {
  resource?: string;
  requiredPermission?: string;
  message?: string;
  onApply?: () => void;
  onBack?: () => void;
}

const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  resource,
  requiredPermission,
  message,
  onApply,
  onBack,
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <ShieldX className="h-24 w-24 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground mb-2">访问被拒绝</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {message || "您没有权限访问此页面，请联系管理员申请相应权限。"}
        </p>
        
        {resource && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <div className="text-sm text-muted-foreground mb-1">资源</div>
            <div className="font-mono text-sm">{resource}</div>
            {requiredPermission && (
              <>
                <div className="text-sm text-muted-foreground mt-2 mb-1">所需权限</div>
                <div className="font-mono text-sm">{requiredPermission}</div>
              </>
            )}
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack || (() => window.history.back())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上一页
          </Button>
          {onApply && (
            <Button onClick={onApply}>
              <Key className="mr-2 h-4 w-4" />
              申请权限
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### NoPermissionEmpty 组件

```tsx
// src/components/permission/NoPermissionEmpty.tsx
interface NoPermissionEmptyProps {
  title?: string;
  description?: string;
  onApply?: () => void;
}

const NoPermissionEmpty: React.FC<NoPermissionEmptyProps> = ({
  title = "暂无权限",
  description = "您没有权限查看此内容",
  onApply,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Lock className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-center mb-4">{description}</p>
      {onApply && (
        <Button variant="outline" onClick={onApply}>
          申请查看权限
        </Button>
      )}
    </div>
  );
};
```

### PermissionGuard 组件

```tsx
// src/components/permission/PermissionGuard.tsx
type PermissionGuardMode = 'hidden' | 'disabled' | 'empty';

interface PermissionGuardProps {
  permission: string | string[];
  mode?: PermissionGuardMode;
  emptyComponent?: React.ReactNode;
  disabledReason?: string;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  mode = 'hidden',
  emptyComponent,
  disabledReason,
  children,
}) => {
  const { hasPermission } = usePermission();
  const hasAccess = hasPermission(permission);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  switch (mode) {
    case 'hidden':
      return null;
      
    case 'disabled':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="pointer-events-none opacity-50">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {disabledReason || "您没有权限执行此操作"}
          </TooltipContent>
        </Tooltip>
      );
      
    case 'empty':
      return emptyComponent || <NoPermissionEmpty />;
      
    default:
      return null;
  }
};
```

### ForbiddenModal 组件

```tsx
// src/components/permission/ForbiddenModal.tsx
interface ForbiddenModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    resource: string;
    requiredPermission: string;
    message: string;
    applyEntry: string;
    traceId: string;
  };
}

const ForbiddenModal: React.FC<ForbiddenModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-destructive" />
              操作被拒绝
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">{data.message}</p>
            
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">资源：</span>
                <span className="font-mono text-sm ml-1">{data.resource}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">所需权限：</span>
                <span className="font-mono text-sm ml-1">{data.requiredPermission}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose}>
              返回
            </Button>
            <Button onClick={() => setShowApplyModal(true)}>
              申请权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ApplyPermissionModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        resource={data.resource}
        requiredPermission={data.requiredPermission}
      />
    </>
  );
};
```

### ApplyPermissionModal 组件

```tsx
// src/components/permission/ApplyPermissionModal.tsx
interface ApplyPermissionModalProps {
  open: boolean;
  onClose: () => void;
  resource: string;
  requiredPermission: string;
}

const ApplyPermissionModal: React.FC<ApplyPermissionModalProps> = ({
  open,
  onClose,
  resource,
  requiredPermission,
}) => {
  const [reason, setReason] = useState('');
  const { mutate: apply, isPending } = useApplyPermission();
  
  const handleSubmit = () => {
    apply({
      resource,
      permission: requiredPermission,
      reason,
    }, {
      onSuccess: () => {
        toast.success("申请已提交，请等待审批");
        onClose();
      },
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申请权限</DialogTitle>
          <DialogDescription>
            请填写申请原因，我们将尽快处理您的申请。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">申请权限</div>
            <div className="font-mono text-sm">{requiredPermission}</div>
          </div>
          
          <div>
            <Label htmlFor="reason">申请原因</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请说明为什么需要此权限..."
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || isPending}>
            {isPending ? "提交中..." : "提交申请"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## State Management

### Permission Store

```typescript
// src/stores/permissionStore.ts
interface PermissionState {
  // 当前用户权限缓存
  permissions: Set<string>;
  
  // 403 弹窗状态
  forbiddenModal: {
    open: boolean;
    data: ForbiddenData | null;
  };
  
  // 已显示过的 403 提示（防重复弹出）
  shownForbiddenResources: Set<string>;
  
  // Actions
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permission: string | string[]) => boolean;
  showForbidden: (data: ForbiddenData) => void;
  hideForbidden: () => void;
}

interface ForbiddenData {
  resource: string;
  requiredPermission: string;
  message: string;
  applyEntry: string;
  traceId: string;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: new Set(),
  forbiddenModal: {
    open: false,
    data: null,
  },
  shownForbiddenResources: new Set(),
  
  setPermissions: (permissions) => set({
    permissions: new Set(permissions)
  }),
  
  hasPermission: (permission) => {
    const { permissions } = get();
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.has(p));
    }
    return permissions.has(permission);
  },
  
  showForbidden: (data) => {
    const { shownForbiddenResources } = get();
    
    // 同一资源短时间内不重复弹出
    if (shownForbiddenResources.has(data.resource)) {
      return;
    }
    
    set({
      forbiddenModal: { open: true, data },
      shownForbiddenResources: new Set([...shownForbiddenResources, data.resource]),
    });
    
    // 5分钟后清除记录，允许再次弹出
    setTimeout(() => {
      const { shownForbiddenResources } = get();
      const newSet = new Set(shownForbiddenResources);
      newSet.delete(data.resource);
      set({ shownForbiddenResources: newSet });
    }, 5 * 60 * 1000);
  },
  
  hideForbidden: () => set({
    forbiddenModal: { open: false, data: null }
  }),
}));
```

## Decisions

1. **403 弹窗防重复弹出**
   - Rationale: 避免 API 重试时频繁弹窗影响体验。
   - 同一资源 5 分钟内只弹出一次。

2. **权限守卫支持三种模式**
   - Rationale: 不同场景需要不同的展示方式。
   - hidden（隐藏）/ disabled（禁用）/ empty（空状态）。

3. **申请权限需要填写原因**
   - Rationale: 便于管理员审批决策。
   - 原因为必填项。

4. **使用 Zustand 管理权限状态**
   - Rationale: 权限状态需要全局共享，Zustand 轻量且易用。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 403 弹窗频繁 | 资源级防重复机制 |
| 权限缓存失效 | 登录时刷新、定时同步 |
| 申请流程中断 | 简化流程、自动填充 |

## Migration Plan

1. 实现权限状态 Store
2. 实现 usePermission Hook
3. 实现 403 响应拦截器
4. 实现 ForbiddenPage 403 页面
5. 实现 NoPermissionEmpty 空状态
6. 实现 PermissionGuard 守卫组件
7. 实现 ForbiddenModal 弹窗
8. 实现 ApplyPermissionModal 申请弹窗
9. 进行 UI/UX 测试

## Open Questions

1. 是否需要"不再提示"选项？
2. 权限申请是否需要展示审批流程？
3. 是否需要展示权限有效期？