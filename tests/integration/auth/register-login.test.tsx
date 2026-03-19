import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/stores/authStore'

const navigateMock = vi.fn()
const fetchMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/lib/tauri', () => ({
  saveSessionMetadata: vi.fn().mockResolvedValue(undefined),
  getSessionMetadata: vi.fn().mockResolvedValue(null),
  clearSessionCache: vi.fn().mockResolvedValue(undefined),
  hasSessionCache: vi.fn().mockResolvedValue(false),
}))

describe('注册与登录流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.clear()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: null,
      isAuthenticated: false,
      isRestoring: false,
    })
  })

  it('可以在登录和注册模式之间切换', async () => {
    render(<LoginForm />)

    expect(screen.getByRole('heading', { name: '欢迎回来' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '立即注册' }))
    expect(screen.getByRole('heading', { name: '创建账号' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '返回登录' }))
    expect(screen.getByRole('heading', { name: '欢迎回来' })).toBeInTheDocument()
  })

  it('注册成功后回到登录模式并提示成功', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: 'user-1',
            username: 'qa_register_user',
            name: '验收用户',
            department: '测试部',
            role: 'user',
          },
        },
      }),
    })

    render(<LoginForm />)

    await userEvent.click(screen.getByRole('button', { name: '立即注册' }))
    await userEvent.type(screen.getByLabelText('用户名'), 'qa_register_user')
    await userEvent.type(screen.getByLabelText('姓名'), '验收用户')
    await userEvent.type(screen.getByLabelText('密码'), 'QaPass123')
    await userEvent.type(screen.getByLabelText('部门'), '测试部')
    await userEvent.click(screen.getByRole('button', { name: '立即注册' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      const [url] = fetchMock.mock.calls[0] as [string]
      expect(url).toContain('/api/v1/auth/register')
    })

    expect(screen.getByText('注册成功，请使用新账号登录')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '欢迎回来' })).toBeInTheDocument()
    expect(screen.getByLabelText('用户名')).toHaveValue('qa_register_user')
  })

  it('登录成功后写入双 token 与权限并跳转首页', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: 'admin-id',
            username: 'admin',
            name: 'Admin User',
            department: 'IT',
            role: 'admin',
          },
          accessToken: 'access-token-abc',
          refreshToken: 'refresh-token-abc',
          expiresIn: 3600,
          permissions: {
            roles: ['admin'],
            permissions: ['user.read', 'user.manage'],
            dataScopes: { user: 'all' },
          },
        },
      }),
    })

    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('用户名'), 'admin')
    await userEvent.type(screen.getByLabelText('密码'), 'admin')
    await userEvent.click(screen.getByRole('button', { name: '立即登录' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      const [url] = fetchMock.mock.calls[0] as [string]
      expect(url).toContain('/api/v1/auth/login')
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().accessToken).toBe('access-token-abc')
    expect(useAuthStore.getState().refreshToken).toBe('refresh-token-abc')
    expect(useAuthStore.getState().permissions?.roles).toContain('admin')
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('注册失败时显示后端错误信息', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({
        success: false,
        code: 'ERR_USERNAME_EXISTS',
        message: '用户名已存在',
      }),
    })

    render(<LoginForm />)

    await userEvent.click(screen.getByRole('button', { name: '立即注册' }))
    await userEvent.type(screen.getByLabelText('用户名'), 'existing_user')
    await userEvent.type(screen.getByLabelText('姓名'), '重复用户')
    await userEvent.type(screen.getByLabelText('密码'), 'QaPass123')
    await userEvent.click(screen.getByRole('button', { name: '立即注册' }))

    await waitFor(() => {
      expect(screen.getByText('用户名已存在')).toBeInTheDocument()
    })
  })

  it('忘记密码会调用云端接口并显示提示', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        success: true,
        data: {
          accepted: true,
        },
      }),
    })

    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('用户名'), 'admin')
    await userEvent.click(screen.getByRole('button', { name: '忘记密码？' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      const [url] = fetchMock.mock.calls[0] as [string]
      expect(url).toContain('/api/v1/auth/forgot-password')
    })

    expect(screen.getByText('若账号存在，重置指引将发送至对应账号')).toBeInTheDocument()
  })
})
