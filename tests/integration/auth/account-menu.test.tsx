import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TopBar } from '@/components/common/TopBar'
import { useAuthStore } from '@/stores/authStore'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    close: vi.fn(),
  })),
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}))

vi.mock('@/components/common/ScanDialog', () => ({
  ScanDialog: () => null,
}))

vi.mock('@/components/common/PrintDialog', () => ({
  PrintDialog: () => null,
}))

vi.mock('@/components/common/HardwareDialog', () => ({
  HardwareDialog: () => null,
}))

describe('TopBar 账号菜单', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  })

  it('已登录用户可以打开账号菜单并查看账户信息', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-1',
        username: 'admin',
        name: '管理员',
        department: '管理层',
        role: 'super_admin',
      },
      token: 'token-1',
      isAuthenticated: true,
    })

    render(<TopBar visible={true} onToggle={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('账号菜单'))

    expect(screen.getByText('用户名：admin')).toBeInTheDocument()
    expect(screen.getByText('姓名：管理员')).toBeInTheDocument()
    expect(screen.getByText('部门：管理层')).toBeInTheDocument()
    expect(screen.getByText('角色：super_admin')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '切换账号' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '退出登录' })).toBeInTheDocument()
  })

  it('账户字段缺失时显示占位文案', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-2',
        username: '',
        name: '',
        department: '',
        role: '',
      },
      token: 'token-2',
      isAuthenticated: true,
    })

    render(<TopBar visible={true} onToggle={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('账号菜单'))

    expect(screen.getByText('用户名：未设置用户名')).toBeInTheDocument()
    expect(screen.getByText('姓名：未设置姓名')).toBeInTheDocument()
    expect(screen.getByText('部门：未设置部门')).toBeInTheDocument()
    expect(screen.getByText('角色：未设置角色')).toBeInTheDocument()
  })

  it('切换账号会清理会话并跳转登录页', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-3',
        username: 'operator',
        name: '操作员',
        department: '销售部',
        role: 'staff',
      },
      token: 'token-3',
      isAuthenticated: true,
    })

    render(<TopBar visible={true} onToggle={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('账号菜单'))
    await userEvent.click(screen.getByRole('menuitem', { name: '切换账号' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('退出登录会清理会话并跳转登录页', async () => {
    useAuthStore.setState({
      user: {
        id: 'u-4',
        username: 'finance',
        name: '财务',
        department: '财务部',
        role: 'manager',
      },
      token: 'token-4',
      isAuthenticated: true,
    })

    render(<TopBar visible={true} onToggle={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('账号菜单'))
    await userEvent.click(screen.getByRole('menuitem', { name: '退出登录' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('未登录点击账号入口会直接跳转登录页', async () => {
    render(<TopBar visible={true} onToggle={vi.fn()} />)

    await userEvent.click(screen.getByLabelText('登录账号'))

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    expect(screen.queryByLabelText('账号菜单')).not.toBeInTheDocument()
  })
})
