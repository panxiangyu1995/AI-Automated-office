import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

interface LoginCredentials {
  username: string
  password: string
  rememberMe: boolean
}

interface LoginResponse {
  user: {
    id: string
    username: string
    name: string
    department: string
    role: string
  }
  token: string
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
  const { setUser, setToken } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await invoke<LoginResponse>('login', {
        request: {
          username: credentials.username,
          password: credentials.password,
          remember_me: credentials.rememberMe,
        }
      })
      setUser(response.user)
      setToken(response.token)
      navigate('/')
    } catch (err) {
      console.error("Login error:", err);
      setError(typeof err === 'string' ? err : '登录失败，请检查账号或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">登录</h1>
        <p className="text-muted-foreground">请输入您的账号和密码</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            id="username"
            type="text"
            placeholder="账号"
            required
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Input
            id="password"
            type="password"
            placeholder="密码"
            required
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-between">
          <Checkbox
            checked={credentials.rememberMe}
            onCheckedChange={(checked) => setCredentials({ ...credentials, rememberMe: checked })}
            label="记住我"
            disabled={loading}
          />
          <a href="#" className="text-sm font-medium text-primary hover:underline">
            忘记密码？
          </a>
        </div>
        {error && <p className="text-destructive text-sm font-medium">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          登录
        </Button>
      </form>
    </div>
  )
}
