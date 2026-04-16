import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authApi, resolveAuthErrorMessage } from '@/features/auth/api/authApi'
import type { LoginRequest, RegisterRequest } from '@/features/auth/types/auth.types'
import { Loader2, Lock, User } from 'lucide-react'

interface LoginCredentials {
  username: string
  password: string
  rememberMe: boolean
}

interface RegisterFormData {
  username: string
  password: string
  name: string
  department: string
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
  const { login: authLogin, register: authRegister } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const loginRequest: LoginRequest = {
          username: credentials.username,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
        }

        await authLogin(loginRequest)
        navigate('/')
      } else {
        const registerRequest: RegisterRequest = {
          username: registerData.username,
          password: registerData.password,
          name: registerData.name,
          department: registerData.department || undefined,
        }
        const response = await authRegister(registerRequest)

        setMode('login')
        setCredentials({
          username: response.user.username,
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
      const response = await authApi.forgotPassword(username)
      setMessage(response.accepted ? '若账号存在，重置指引将发送至对应账号' : '请求已受理')
    } catch (err) {
      setError(resolveAuthErrorMessage(err, 'login'))
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-[32px] font-bold text-[var(--ao-workbench.foreground)]">{mode === 'login' ? '欢迎回来' : '创建账号'}</h1>
        <p className="font-sans text-base text-[var(--ao-workbench.secondaryForeground)]">
          {mode === 'login' ? '请输入您的账号信息以登录系统' : '填写以下信息以创建新账号'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={mode === 'login' ? 'username' : 'register-username'} className="font-sans text-sm font-medium text-[var(--ao-foreground)]">
            用户名
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center justify-center">
              <User className="h-5 w-5 text-[var(--ao-workbench.secondaryForeground)]" />
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
              className="h-[52px] w-full rounded-xl border border-[var(--ao-border)] bg-[var(--ao-workbench.background)] pl-12 pr-4 font-sans text-base text-[var(--ao-workbench.foreground)] placeholder:text-[var(--ao-workbench.secondaryForeground)] focus:border-[var(--ao-button.background)] focus:outline-none focus:ring-1 focus:ring-[var(--ao-button.background)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-sans text-sm font-medium text-[var(--ao-foreground)]">
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
              className="h-[52px] w-full rounded-xl border border-[var(--ao-border)] bg-[var(--ao-workbench.background)] px-4 font-sans text-base text-[var(--ao-workbench.foreground)] placeholder:text-[var(--ao-workbench.secondaryForeground)] focus:border-[var(--ao-button.background)] focus:outline-none focus:ring-1 focus:ring-[var(--ao-button.background)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor={mode === 'login' ? 'password' : 'register-password'} className="font-sans text-sm font-medium text-[var(--ao-foreground)]">
            密码
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 flex items-center justify-center">
              <Lock className="h-5 w-5 text-[var(--ao-workbench.secondaryForeground)]" />
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
              className="h-[52px] w-full rounded-xl border border-[var(--ao-border)] bg-[var(--ao-workbench.background)] pl-12 pr-4 font-sans text-base text-[var(--ao-workbench.foreground)] placeholder:text-[var(--ao-workbench.secondaryForeground)] focus:border-[var(--ao-button.background)] focus:outline-none focus:ring-1 focus:ring-[var(--ao-button.background)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="department" className="font-sans text-sm font-medium text-[var(--ao-foreground)]">
              部门
            </label>
            <input
              id="department"
              type="text"
              placeholder="选填，例如：销售部"
              value={registerData.department}
              onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
              disabled={loading}
              className="h-[52px] w-full rounded-xl border border-[var(--ao-border)] bg-[var(--ao-workbench.background)] px-4 font-sans text-base text-[var(--ao-workbench.foreground)] placeholder:text-[var(--ao-workbench.secondaryForeground)] focus:border-[var(--ao-button.background)] focus:outline-none focus:ring-1 focus:ring-[var(--ao-button.background)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={credentials.rememberMe}
                onCheckedChange={(checked) => setCredentials({ ...credentials, rememberMe: checked === true })}
                disabled={loading}
                className="rounded-md border-[var(--ao-border)] text-[var(--ao-button.background)] focus:ring-[var(--ao-button.background)]"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                记住我
              </label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || forgotPasswordLoading}
              className="font-sans text-sm font-medium text-[var(--ao-button.background)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
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
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--ao-button.background)] to-[var(--ao-button.background)] font-sans text-base font-bold text-white shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {mode === 'login' ? '立即登录' : '立即注册'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-1">
        <span className="font-sans text-sm text-[var(--ao-workbench.secondaryForeground)]">
          {mode === 'login' ? '还没有账号？' : '已经有账号？'}
        </span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
          }}
          className="font-sans text-sm font-medium text-[var(--ao-button.background)] hover:underline"
        >
          {mode === 'login' ? '立即注册' : '返回登录'}
        </button>
      </div>
    </div>
  )
}
