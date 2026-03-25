import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { SettingsPanel } from '@/features/settings/components/SettingsPanel'

describe('Settings panel phase 3 governance experience', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the governance home as the default entry', () => {
    render(<SettingsPanel />)

    expect(screen.getByRole('heading', { name: '设置中心' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开工作台与个人偏好' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开系统、更新与诊断' })).toBeInTheDocument()
  })

  it('switches to a governance domain and exposes grouped sub-sections', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.click(screen.getByRole('button', { name: '切换到工作台与个人偏好' }))

    expect(screen.getByRole('heading', { name: '工作台与个人偏好' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '打开通用' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: '打开快捷键' }).length).toBeGreaterThan(0)
    expect(screen.getByText('治理说明')).toBeInTheDocument()
    expect(screen.getByText('保存状态')).toBeInTheDocument()
    expect(screen.getAllByText('低风险').length).toBeGreaterThan(0)
    expect(screen.getByText('显示顶部菜单栏')).toBeInTheDocument()
  })

  it('shows global search results and opens the matched section', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.click(screen.getByRole('button', { name: '切换到工作台与个人偏好' }))
    await user.type(screen.getByPlaceholderText('搜索设置项、能力或治理域'), '快捷键')

    expect(screen.getAllByRole('heading', { name: '全局搜索结果' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('快捷键').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '打开设置' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '打开设置' }))

    expect(screen.getByRole('heading', { name: '工作台与个人偏好' })).toBeInTheDocument()
    expect(screen.getAllByText('快捷键').length).toBeGreaterThan(0)
    expect(await screen.findByRole('button', { name: '保存并生效' })).toBeInTheDocument()
    expect(screen.getAllByText('手动保存').length).toBeGreaterThan(0)
  })

  it('shows dirty status for manual-save sections before persisting changes', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.click(screen.getByRole('button', { name: '切换到工作台与个人偏好' }))
    await user.click(screen.getAllByRole('button', { name: '打开快捷键' })[0])

    const input = screen.getByDisplayValue('Ctrl+Shift+A')
    await user.clear(input)
    await user.type(input, 'Ctrl+Alt+A')

    expect(screen.getByText('有未保存更改')).toBeInTheDocument()
    expect(screen.getByText('当前快捷键草稿尚未保存，请确认后手动提交。')).toBeInTheDocument()
  })

  it('surfaces favorites and recent visits on the governance home', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.click(screen.getByRole('button', { name: '切换到工作台与个人偏好' }))
    await user.click(screen.getAllByRole('button', { name: '打开快捷键' })[0])
    await user.click(screen.getByRole('button', { name: '收藏快捷键' }))
    await user.click(screen.getByRole('button', { name: '切换到设置中心' }))

    expect((await screen.findAllByText('收藏项')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('最近访问').length).toBeGreaterThan(0)
    expect(screen.getAllByText('快捷键').length).toBeGreaterThan(0)
  })

  it('supports global search results and can jump to the unified audit entry', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.type(screen.getByPlaceholderText('搜索设置项、能力或治理域'), '执行审计')

    expect(screen.getAllByRole('heading', { name: '全局搜索结果' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('执行审计').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '打开设置' }))

    expect(screen.getByRole('heading', { name: '安全、权限与审计' })).toBeInTheDocument()
    expect(screen.getByText('审计与可追溯')).toBeInTheDocument()
  })

  it('opens the audit page through the unified audit shortcut from a section shell', async () => {
    const user = userEvent.setup()

    render(<SettingsPanel />)

    await user.click(screen.getByRole('button', { name: '切换到工作台与个人偏好' }))
    await user.click(screen.getByRole('button', { name: '打开统一审计入口' }))

    expect(screen.getByRole('heading', { name: '安全、权限与审计' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '执行审计' })).toBeInTheDocument()
  })
})
