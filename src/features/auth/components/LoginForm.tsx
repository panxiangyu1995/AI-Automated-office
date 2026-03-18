import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, User, Lock } from 'lucide-react'

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

interface RegisterFormData {
  username: string
  password: string
  name: string
  department: string
}

interface RegisterResponse {
  user: {
    id: string
    username: string
    name: string
    department: string
    role: string
  }
}

interface ForgotPasswordResponse {
  accepted: boolean
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
}

const REQUEST_TIMEOUT_MS = 10000
const AUTH_API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const requestAuthApi = async <T,>(path: string, payload: Record<string, unknown>) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const result = (await response.json()) as ApiEnvelope<T>
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || '请求失败')
    }
    return result
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AUTH_API_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

const resolveAuthErrorMessage = (err: unknown, mode: 'login' | 'register') => {
  if (err instanceof Error && err.message === 'AUTH_API_TIMEOUT') {
    return '认证服务响应超时，请稍后重试'
  }
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  return mode === 'login' ? '登录失败，请检查账号或密码' : '注册失败，请检查输入信息'
}

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false,
  })
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: '',
    password: '',
    name: '',
    department: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const response = await requestAuthApi<LoginResponse>('/api/v1/auth/login', {
          username: credentials.username,
          password: credentials.password,
          remember_me: credentials.rememberMe,
        })
        if (!response.data) {
          throw new Error('登录失败，请检查账号或密码')
        }
        setUser(response.data.user)
        setToken(response.data.token)
        navigate('/')
      } else {
        const response = await requestAuthApi<RegisterResponse>('/api/v1/auth/register', {
          username: registerData.username,
          password: registerData.password,
          name: registerData.name,
          department: registerData.department || undefined,
        })
        if (!response.data) {
          throw new Error('注册失败，请检查输入信息')
        }
        setMode('login')
        setCredentials({
          username: response.data.user.username,
          password: '',
          rememberMe: true,
        })
        setMessage('注册成功，请使用新账号登录')
      }
    } catch (err) {
      setError(resolveAuthErrorMessage(err, mode))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setMessage('')
    const username = credentials.username.trim()
    if (!username) {
      setError('请先输入用户名后再进行忘记密码操作')
      return
    }
    setForgotPasswordLoading(true)
    try {
      const response = await requestAuthApi<ForgotPasswordResponse>('/api/v1/auth/forgot-password', {
        username,
      })
      setMessage(response.message || '若账号存在，重置指引将发送至对应账号')
    } catch (err) {
      setError(resolveAuthErrorMessage(err, 'login'))
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-[32px] font-bold text-[#111827]">{mode === 'login' ? '欢迎回来' : '创建账号'}</h1>
        <p className="font-sans text-base text-[#6B7280]">
          {mode === 'login' ? '请输入您的账号信息以登录系统' : '填写以下信息以创建新账号'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={mode === 'login' ? 'username' : 'register-username'} className="font-sans text-sm font-medium text-[#374151]">
            用户名
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center justify-center">
              <User className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <input
              id={mode === 'login' ? 'username' : 'register-username'}
              type="text"
              placeholder="请输入用户名"
              required
              value={mode === 'login' ? credentials.username : registerData.username}
              onChange={(e) =>
                mode === 'login'
                  ? setCredentials({ ...credentials, username: e.target.value })
                  : setRegisterData({ ...registerData, username: e.target.value })
              }
              disabled={loading}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 font-sans text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-sans text-sm font-medium text-[#374151]">
              姓名
            </label>
            <input
              id="name"
              type="text"
              placeholder="请输入姓名"
              required
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              disabled={loading}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 font-sans text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor={mode === 'login' ? 'password' : 'register-password'} className="font-sans text-sm font-medium text-[#374151]">
            密码
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center justify-center">
              <Lock className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <input
              id={mode === 'login' ? 'password' : 'register-password'}
              type="password"
              placeholder="请输入密码"
              required
              value={mode === 'login' ? credentials.password : registerData.password}
              onChange={(e) =>
                mode === 'login'
                  ? setCredentials({ ...credentials, password: e.target.value })
                  : setRegisterData({ ...registerData, password: e.target.value })
              }
              disabled={loading}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 font-sans text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="department" className="font-sans text-sm font-medium text-[#374151]">
              部门
            </label>
            <input
              id="department"
              type="text"
              placeholder="选填，例如：销售部"
              value={registerData.department}
              onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
              disabled={loading}
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 font-sans text-base text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between">
            <Checkbox
              id="remember"
              checked={credentials.rememberMe}
              onCheckedChange={(checked) => setCredentials({ ...credentials, rememberMe: checked === true })}
              disabled={loading}
              label="记住我"
              className="rounded-md border-[#D1D5DB] text-[#4F46E5] focus:ring-[#4F46E5]"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || forgotPasswordLoading}
              className="font-sans text-sm font-medium text-[#4F46E5] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {forgotPasswordLoading ? '提交中...' : '忘记密码？'}
            </button>
          </div>
        )}

        {message && <p className="font-sans text-sm font-medium text-emerald-600">{message}</p>}
        {error && <p className="font-sans text-sm font-medium text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#4338CA] font-sans text-base font-bold text-white shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {mode === 'login' ? '立即登录' : '立即注册'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-1">
        <span className="font-sans text-sm text-[#6B7280]">
          {mode === 'login' ? '还没有账号？' : '已经有账号？'}
        </span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
          }}
          className="font-sans text-sm font-medium text-[#4F46E5] hover:underline"
        >
          {mode === 'login' ? '立即注册' : '返回登录'}
        </button>
      </div>
    </div>
  )
}
