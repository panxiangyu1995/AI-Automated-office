# Design: 用户登录功能

## 技术方案

### 前端实现

```typescript
// src/features/auth/components/LoginForm.tsx
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'

interface LoginCredentials {
  username: string
  password: string
  rememberMe: boolean
}

export function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await invoke('login', {
        username: credentials.username,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      })
      setUser(user)
      navigate('/')
    } catch (err) {
      setError('账号或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="账号"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="密码"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Checkbox
          checked={credentials.rememberMe}
          onCheckedChange={(checked) => setCredentials({ ...credentials, rememberMe: !!checked })}
          label="记住我"
        />
        <a href="#" className="text-sm text-blue-500 hover:underline">忘记密码？</a>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>
        登录
      </Button>
    </form>
  )
}
```

### 后端实现（Rust）

```rust
// src-tauri/src/commands/auth.rs
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::auth::{AuthService, User};

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
    remember_me: bool,
}

#[derive(Serialize)]
pub struct LoginResponse {
    user: User,
    token: String,
}

#[tauri::command]
pub async fn login(
    request: LoginRequest,
    auth_service: State<'_, AuthService>,
) -> Result<LoginResponse, String> {
    auth_service
        .login(&request.username, &request.password, request.remember_me)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn logout(auth_service: State<'_, AuthService>) -> Result<(), String> {
    auth_service.logout().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_current_user(
    auth_service: State<'_, AuthService>,
) -> Result<Option<User>, String> {
    auth_service.get_current_user().await.map_err(|e| e.to_string())
}
```

### 认证状态管理

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  name: string
  department: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
)
```

## 安全设计

1. **密码传输**: 使用 TLS 1.3 加密传输
2. **密码存储**: bcrypt 加密，强度因子 >= 12
3. **Token 管理**: JWT Token，有效期 30 分钟
4. **本地存储**: Token 使用系统安全存储（Keychain/Credential Manager）

## 性能考虑

1. 登录请求超时设置为 10 秒
2. 使用防抖避免重复提交
