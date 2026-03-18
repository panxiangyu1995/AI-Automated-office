# Design: 用户登录功能

## UI 设计

### 界面原型
本功能实施参考以下 UI 原型设计：
- **原型文件**: `I:\AI-Automated-office\_bmad-output\UI-PEN\login_prototype.pen`
- **预览图**: `I:\AI-Automated-office\_bmad-output\UI-PEN\login_screen_final.png`

### 设计说明
- **布局**: 采用左右分栏布局。左侧为品牌展示区（包含 Logo、Slogan），右侧为登录表单区。
- **Logo**: 使用应用图标 (`src-tauri/icons/128x128.png`)。
- **交互**: 输入框带有图标辅助，按钮使用品牌色渐变，支持"记住我"和"忘记密码"功能。

## 技术方案

### 前端实现

```typescript
// src/features/auth/components/LoginForm.tsx
import { useState } from 'react'
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
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          remember_me: credentials.rememberMe,
        }),
      })
      const result = await response.json()
      setUser(result.data.user)
      setToken(result.data.token)
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

### 后端实现（Go/cloud-server）

```go
// cloud-server/internal/handler/auth.go
type AuthHandler struct {
    SQLDB *sql.DB
    JWT   config.JWTConfig
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "请求参数错误", nil)
        return
    }
    // 查询 users 表、校验 bcrypt、签发 JWT
}

func (h *AuthHandler) Register(c *gin.Context) {
    // 校验账号唯一性并写入 users 表
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
    // 受理忘记密码请求，返回统一受理结果
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
2. **密码存储**: Go 云端使用 bcrypt 加密存储
3. **Token 管理**: JWT Token，由云端签发
4. **接口安全**: 忘记密码接口返回统一文案避免账号枚举

## 性能考虑

1. 登录请求超时设置为 10 秒
2. 使用防抖避免重复提交
