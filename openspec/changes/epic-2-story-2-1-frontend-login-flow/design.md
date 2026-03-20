# Design: Frontend Login Flow Enhancement

## 现有架构

基于 `epic-1-story-11-user-login` 已实现的架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    已实现的架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UI Layer                                                   │
│  ├── LoginPage.tsx (左右分栏布局)                           │
│  │   └── LoginForm.tsx (登录/注册/忘记密码)                 │
│  │                                                          │
│  State Layer (Zustand)                                      │
│  └── authStore.ts                                           │
│      ├── user: User | null                                  │
│      ├── token: string | null                               │
│      ├── isAuthenticated: boolean                           │
│      └── actions: setUser, setToken, clearAuthSession       │
│                                                             │
│  Route Layer                                                │
│  ├── App.tsx (路由配置)                                     │
│  └── AuthGuard.tsx (路由守卫)                               │
│                                                             │
│  API Layer (内联在 LoginForm.tsx)                           │
│  ├── POST /api/v1/auth/login                                │
│  ├── POST /api/v1/auth/register                             │
│  └── POST /api/v1/auth/forgot-password                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 增强后架构

```
┌─────────────────────────────────────────────────────────────┐
│                    增强后的架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UI Layer                                                   │
│  ├── LoginPage.tsx (不变)                                   │
│  │   └── LoginForm.tsx (重构: 使用 useAuth + authApi)       │
│  │       └── LoginError.tsx (可选: 错误提示组件)            │
│                                                             │
│  Hook Layer (新增)                                          │
│  └── useAuth()                                              │
│      ├── login(request): Promise<void>                      │
│      ├── logout(): void                                     │
│      ├── refreshSession(): Promise<void>                    │
│      ├── hasPermission(permission): boolean                 │
│      └── hasRole(role): boolean                             │
│                                                             │
│  State Layer (Zustand, 扩展)                                │
│  └── authStore                                              │
│      ├── user: User | null                                  │
│      ├── accessToken: string | null (原 token)              │
│      ├── refreshToken: string | null (新增)                 │
│      ├── permissions: PermissionSummary | null (新增)       │
│      ├── isAuthenticated: boolean                           │
│      └── actions: setAuth, updateToken, clearAuth           │
│                                                             │
│  API Layer (新增模块化)                                     │
│  └── authApi                                                │
│      ├── login(request): Promise<LoginResponse>             │
│      ├── register(request): Promise<RegisterResponse>       │
│      ├── forgotPassword(username): Promise<void>            │
│      └── refreshToken(token): Promise<TokenPair>            │
│                                                             │
│  Types Layer (新增)                                         │
│  └── auth.types.ts                                          │
│      ├── LoginRequest, LoginResponse                        │
│      ├── RegisterRequest, RegisterResponse                  │
│      ├── User, PermissionSummary                            │
│      └── TokenPair                                          │
│                                                             │
│  Route Layer (不变)                                         │
│  ├── App.tsx                                                │
│  └── AuthGuard.tsx                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 新增模块设计

### auth.types.ts

```typescript
// src/features/auth/types/auth.types.ts

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  name: string;
  department: string;
  role: string;
}

/**
 * 权限摘要
 */
export interface PermissionSummary {
  roles: string[];
  permissions: string[];
  dataScopes: Record<string, string>;
}

/**
 * Token 对
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions?: PermissionSummary;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  department?: string;
}

/**
 * 注册响应
 */
export interface RegisterResponse {
  user: User;
}

/**
 * 认证错误
 */
export interface AuthError {
  code: string;
  message: string;
}
```

### authApi.ts

```typescript
// src/features/auth/api/authApi.ts
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth.types';

const REQUEST_TIMEOUT_MS = 10000;
const AUTH_API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

async function requestAuthApi<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    const result = (await response.json()) as ApiEnvelope<T>;
    
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || '请求失败');
    }
    
    return result.data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AUTH_API_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const authApi = {
  /**
   * 登录
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    return requestAuthApi<LoginResponse>('/api/v1/auth/login', {
      username: request.username,
      password: request.password,
      remember_me: request.rememberMe,
    });
  },

  /**
   * 注册
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return requestAuthApi<RegisterResponse>('/api/v1/auth/register', {
      username: request.username,
      password: request.password,
      name: request.name,
      department: request.department,
    });
  },

  /**
   * 忘记密码
   */
  async forgotPassword(username: string): Promise<{ accepted: boolean }> {
    return requestAuthApi('/api/v1/auth/forgot-password', { username });
  },

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return requestAuthApi<TokenPair>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
  },
};
```

### authStore.ts (扩展)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PermissionSummary } from '@/features/auth/types/auth.types';

interface AuthState {
  // 基础状态（已实现）
  user: User | null;
  isAuthenticated: boolean;
  
  // 扩展状态（新增）
  accessToken: string | null;
  refreshToken: string | null;
  permissions: PermissionSummary | null;
  
  // Actions（已实现）
  setUser: (user: User) => void;
  clearAuthSession: () => void;
  logout: () => void;
  
  // Actions（新增/修改）
  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    permissions?: PermissionSummary;
  }) => void;
  updateToken: (accessToken: string, refreshToken: string) => void;
  setToken: (token: string) => void; // 兼容旧代码
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      
      // 设置完整认证信息
      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          permissions: data.permissions ?? null,
          isAuthenticated: true,
        }),
      
      // 更新 Token
      updateToken: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),
      
      // 兼容旧代码
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ accessToken: token }),
      
      // 清除认证
      clearAuthSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          permissions: null,
          isAuthenticated: false,
        }),
      
      logout: () =>
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
      // 只持久化 refreshToken，不持久化 accessToken 和敏感信息
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### useAuth.ts

```typescript
// src/features/auth/hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';

export function useAuth() {
  const {
    setAuth,
    clearAuthSession,
    isAuthenticated,
    user,
    permissions,
    accessToken,
    refreshToken,
    updateToken,
  } = useAuthStore();
  const navigate = useNavigate();

  /**
   * 登录
   */
  const login = async (request: LoginRequest) => {
    const response = await authApi.login(request);
    
    setAuth({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      permissions: response.permissions,
    });
  };

  /**
   * 注册
   */
  const register = async (request: RegisterRequest) => {
    return authApi.register(request);
  };

  /**
   * 登出
   */
  const logout = () => {
    clearAuthSession();
    navigate('/login');
  };

  /**
   * 刷新会话
   */
  const refreshSession = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const tokens = await authApi.refreshToken(refreshToken);
    updateToken(tokens.accessToken, tokens.refreshToken);
  };

  /**
   * 检查是否拥有权限
   */
  const hasPermission = (permission: string): boolean => {
    return permissions?.permissions.includes(permission) ?? false;
  };

  /**
   * 检查是否拥有角色
   */
  const hasRole = (role: string): boolean => {
    return permissions?.roles.includes(role) ?? false;
  };

  /**
   * 检查是否有任意权限
   */
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((p) => hasPermission(p));
  };

  /**
   * 检查是否有所有权限
   */
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((p) => hasPermission(p));
  };

  return {
    // 状态
    isAuthenticated,
    user,
    permissions,
    accessToken,
    
    // 方法
    login,
    register,
    logout,
    refreshSession,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

### LoginError.tsx (可选)

```tsx
// src/features/auth/components/LoginError.tsx
import { AlertCircle, Lock, UserX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuthError } from '../types/auth.types';

interface LoginErrorProps {
  error: AuthError | string;
}

export function LoginError({ error }: LoginErrorProps) {
  const errorCode = typeof error === 'string' ? 'UNKNOWN' : error.code;
  const errorMessage = typeof error === 'string' ? error : error.message;

  const getErrorConfig = (code: string) => {
    switch (code) {
      case 'AUTH_001':
        return {
          icon: UserX,
          message: '用户名或密码错误，请重新输入',
        };
      case 'AUTH_002':
        return {
          icon: Lock,
          message: '账户已被锁定，请稍后重试',
        };
      case 'AUTH_003':
        return {
          icon: UserX,
          message: '账户已禁用，请联系管理员',
        };
      default:
        return {
          icon: AlertCircle,
          message: errorMessage || '登录失败，请稍后重试',
        };
    }
  };

  const config = getErrorConfig(errorCode);
  const Icon = config.icon;

  return (
    <Alert variant="destructive" className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertDescription>{config.message}</AlertDescription>
    </Alert>
  );
}
```

## 与现有代码的集成

### LoginForm.tsx 重构

重构 LoginForm 使用模块化 API 和 useAuth Hook：

```tsx
// 关键变更点
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';

// 替换内联 API 调用
const { login, register } = useAuth();

// 登录
const response = await login({
  username: credentials.username,
  password: credentials.password,
  rememberMe: credentials.rememberMe,
});

// 注册
await register({
  username: registerData.username,
  password: registerData.password,
  name: registerData.name,
  department: registerData.department,
});
```

## 样式设计

遵循 UX 设计规范（已在 epic-1-story-11-user-login 实现）：
- 主色：#4F46E5（靛蓝色）
- 品牌色渐变：from-[#4F46E5] to-[#4338CA]
- 背景色：#F9FAFB（浅灰）
- 输入框：圆角边框，带图标
- 按钮：渐变背景，阴影效果

## 安全考虑

1. **Token 存储**
   - AccessToken 存储在内存中（不持久化）
   - RefreshToken 可持久化存储（用于自动刷新）
   - 不存储敏感信息（密码等）

2. **权限检查**
   - 前端权限检查仅用于 UI 展示控制
   - 后端必须进行真实的权限校验

3. **Token 刷新**
   - 在 AccessToken 即将过期时自动刷新
   - 刷新失败时提示用户重新登录

## 测试策略

### 单元测试
- authStore 状态管理
- useAuth Hook 方法
- authApi 请求封装
- hasPermission / hasRole 逻辑

### 集成测试
- 登录流程
- Token 刷新流程
- 权限检查流程

### E2E 测试
- 完整登录流程
- 权限控制页面访问
