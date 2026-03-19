# Design: Frontend Login Flow

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                  │
│  LoginPage.tsx                                              │
│  ├── LoginForm.tsx                                          │
│  │   ├── Username Input                                     │
│  │   ├── Password Input                                     │
│  │   └── Submit Button                                      │
│  └── LoginError.tsx                                         │
├─────────────────────────────────────────────────────────────┤
│                    Hook Layer                                │
│  useAuth()                                                  │
│  ├── login()                                                │
│  ├── logout()                                               │
│  └── refreshSession()                                       │
├─────────────────────────────────────────────────────────────┤
│                    State Layer (Zustand)                     │
│  authStore                                                  │
│  ├── user: User | null                                      │
│  ├── token: string | null                                   │
│  ├── permissions: PermissionSummary | null                  │
│  ├── isAuthenticated: boolean                               │
│  └── actions: setUser, clearAuth, updateToken               │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                                 │
│  authApi                                                    │
│  ├── login(request): Promise<LoginResponse>                 │
│  └── refreshToken(token): Promise<TokenPair>                │
└─────────────────────────────────────────────────────────────┘
```

### 组件设计

#### LoginPage

```tsx
// src/features/auth/components/LoginPage.tsx
import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { LoginError } from './LoginError';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [error, setError] = useState<AuthError | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (username: string, password: string) => {
    try {
      setError(null);
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setError(err as AuthError);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-primary">AI-Automated-office</h1>
        </div>
        
        {error && <LoginError error={error} />}
        
        <LoginForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
```

#### LoginForm

```tsx
// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (username.length < 3) {
      newErrors.username = '用户名至少 3 个字符';
    }
    if (password.length < 8) {
      newErrors.password = '密码至少 8 个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSubmit(username, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          type="text"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            登录中...
          </>
        ) : (
          '登录'
        )}
      </Button>
    </form>
  );
}
```

#### LoginError

```tsx
// src/features/auth/components/LoginError.tsx
import { AlertCircle, Lock, UserX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthError {
  code: string;
  message: string;
}

export function LoginError({ error }: { error: AuthError }) {
  const getErrorConfig = (code: string) => {
    switch (code) {
      case 'AUTH_001':
        return {
          icon: UserX,
          message: '用户名或密码错误，请重新输入',
          variant: 'destructive' as const,
        };
      case 'AUTH_002':
        return {
          icon: Lock,
          message: '账户已被锁定，请稍后重试',
          variant: 'destructive' as const,
        };
      case 'AUTH_003':
        return {
          icon: UserX,
          message: '账户已禁用，请联系管理员',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: AlertCircle,
          message: error.message || '登录失败，请稍后重试',
          variant: 'destructive' as const,
        };
    }
  };

  const config = getErrorConfig(error.code);
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertDescription>{config.message}</AlertDescription>
    </Alert>
  );
}
```

### 状态管理设计

#### authStore (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  departmentId: string;
  positionId: string;
  status: string;
}

interface PermissionSummary {
  roles: string[];
  permissions: string[];
  dataScopes: Record<string, string>;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: PermissionSummary | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    permissions: PermissionSummary;
  }) => void;
  updateToken: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      isAuthenticated: false,
      
      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          permissions: data.permissions,
          isAuthenticated: true,
        }),
        
      updateToken: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),
        
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      // 只持久化 refreshToken，不持久化 accessToken
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

#### useAuth Hook

```typescript
// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user, permissions } = useAuthStore();
  const navigate = useNavigate();

  const login = async (request: LoginRequest) => {
    const response = await authApi.login(request);
    
    setAuth({
      user: response.user,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      permissions: response.permissions,
    });
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  const hasPermission = (permission: string): boolean => {
    return permissions?.permissions.includes(permission) ?? false;
  };

  const hasRole = (role: string): boolean => {
    return permissions?.roles.includes(role) ?? false;
  };

  return {
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated,
    user,
    permissions,
  };
}
```

### 路由守卫设计

```tsx
// src/components/common/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    // 保存当前路径，登录后重定向
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### API 封装设计

```typescript
// src/features/auth/api/authApi.ts
import { apiClient } from '@/lib/api';

export interface LoginRequest {
  username: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    real_name: string;
    department_id: string;
    position_id: string;
    status: string;
  };
  tenant: {
    id: string;
    name: string;
  };
  permissions: {
    roles: string[];
    permissions: string[];
    data_scopes: Record<string, string>;
  };
}

export const authApi = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', request);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<TokenPair> => {
    const response = await apiClient.post<TokenPair>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
```

## 样式设计

遵循 UX 设计规范：
- 主色：#1E3A5F（深蓝色）
- 背景色：#F8FAFC（浅灰）
- 输入框：白色背景，圆角边框
- 按钮：主色背景，白色文字
- 错误提示：红色（#EF4444）背景

## 安全考虑

1. **Token 存储**
   - Access Token 存储在内存中
   - Refresh Token 可持久化存储
   - 不存储敏感信息

2. **表单安全**
   - 密码输入框类型为 password
   - 不在 URL 中传递密码
   - 表单提交使用 HTTPS

3. **错误处理**
   - 不泄露服务器内部错误
   - 统一的错误提示格式

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  LoginPage    │────→│   AuthStore   │     │  Tauri/Rust   │
│   (本模块)    │     │  (状态管理)   │←────│ (本地缓存)    │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     
        │                     │                     
        ▼                     ▼                     
┌───────────────┐     ┌───────────────┐             
│   Cloud API   │     │   Main App    │             
│  (登录接口)   │     │  (主界面)     │             
└───────────────┘     └───────────────┘             
```