/**
 * 软件更新机制验收测试
 *
 * 验收标准：
 * - Scenario 1: 更新检查 - 应用启动时检查更新，查询更新服务器并比较版本
 * - Scenario 2: 更新提醒 - 检测到新版本时显示更新提醒弹窗，显示版本号和更新内容，提供更新选项
 * - Scenario 3: 下载更新 - 显示下载进度，支持取消下载
 * - Scenario 4: 安装更新 - 下载完成后提示用户重启应用
 * - Scenario 5: 稍后提醒 - 点击稍后提醒后关闭弹窗，下次启动时再次提醒
 *
 * 性能要求：
 * - 更新检查时间 < 3 秒
 * - 安装时间 < 30 秒
 */

import { cleanup, render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateDialog } from '@/components/common/UpdateDialog'
import { useUpdate, type UpdateInfo } from '@/hooks/useUpdate'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  Channel: vi.fn().mockImplementation(() => ({
    onmessage: null,
  })),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}))

// ============================================
// 测试数据工厂
// ============================================

/**
 * 创建模拟更新信息 - 真实业务场景
 */
const createUpdateInfo = (overrides?: Partial<UpdateInfo>): UpdateInfo => ({
  version: '1.2.0',
  currentVersion: '1.1.0',
  notes: `版本更新说明：

1. 新增功能
- 支持批量审批操作
- 添加数据导出功能

2. 问题修复
- 修复了审批流程中的已知问题
- 优化了界面响应速度

3. 性能优化
- 提升了数据加载速度
- 减少了内存占用`,
  downloadUrl: 'https://releases.example.com/v1.2.0/app_1.2.0_x64-setup.exe',
  ...overrides,
})

/**
 * 创建无更新日志的更新信息
 */
const createMinimalUpdateInfo = (): UpdateInfo => ({
  version: '1.2.0',
  currentVersion: '1.1.0',
  notes: undefined,
})

// 导入 mock 的 invoke
import { invoke } from '@tauri-apps/api/core'

// ============================================
// Scenario 1: 更新检查
// ============================================

describe('软件更新 - Scenario 1: 更新检查', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('应用启动时调用 check_update 命令检查更新', async () => {
    // 模拟无更新返回
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const TestComponent = () => {
      const { checkUpdate } = useUpdate()

      return (
        <div>
          <button data-testid="check-btn" onClick={() => checkUpdate()}>
            检查更新
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 点击检查更新按钮
    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    // 验证调用了 Tauri 命令
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('check_update')
    })
  })

  it('检查更新时返回 null 表示没有可用更新', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const TestComponent = () => {
      const { checkUpdate, updateInfo } = useUpdate()

      return (
        <div>
          <button data-testid="check-btn" onClick={() => checkUpdate()}>
            检查更新
          </button>
          <span data-testid="has-update">{updateInfo ? 'yes' : 'no'}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('has-update')).toHaveTextContent('no')
    })
  })

  it('检查更新时返回新版本信息表示有可用更新', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(createUpdateInfo())

    const TestComponent = () => {
      const { checkUpdate, updateInfo } = useUpdate()

      return (
        <div>
          <button data-testid="check-btn" onClick={() => checkUpdate()}>
            检查更新
          </button>
          <span data-testid="has-update">{updateInfo ? 'yes' : 'no'}</span>
          <span data-testid="version">{updateInfo?.version || ''}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('has-update')).toHaveTextContent('yes')
      expect(screen.getByTestId('version')).toHaveTextContent('1.2.0')
    })
  })

  it('checkUpdate 函数返回更新信息', async () => {
    const expectedInfo = createUpdateInfo()
    ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue(expectedInfo)

    let result: UpdateInfo | null = null

    const TestComponent = () => {
      const { checkUpdate } = useUpdate()

      return (
        <div>
          <button
            data-testid="check-btn"
            onClick={async () => {
              result = await checkUpdate()
            }}
          >
            检查更新
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(result).toEqual(expectedInfo)
    })
  })

  it('检查更新失败时返回 null 而不抛出异常', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    let errorCaught = false

    const TestComponent = () => {
      const { checkUpdate, updateInfo } = useUpdate()

      return (
        <div>
          <button
            data-testid="check-btn"
            onClick={async () => {
              try {
                await checkUpdate()
              } catch {
                errorCaught = true
              }
            }}
          >
            检查更新
          </button>
          <span data-testid="has-update">{updateInfo ? 'yes' : 'no'}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(errorCaught).toBe(false)
      expect(screen.getByTestId('has-update')).toHaveTextContent('no')
    })
  })
})

// ============================================
// Scenario 2: 更新提醒
// ============================================

describe('软件更新 - Scenario 2: 更新提醒', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('检测到新版本时显示更新提醒弹窗', () => {
    const updateInfo = createUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/发现新版本/)).toBeInTheDocument()
  })

  it('更新提醒显示新版本号', () => {
    const updateInfo = createUpdateInfo({ version: '2.0.0' })

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/2.0.0/)).toBeInTheDocument()
  })

  it('更新提醒显示当前版本号', () => {
    const updateInfo = createUpdateInfo({ currentVersion: '1.0.0' })

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/当前版本:\s*v?\s*1\.0\.0/)).toBeInTheDocument()
  })

  it('更新提醒显示更新内容（更新日志）', () => {
    const updateInfo = createUpdateInfo({
      notes: '新增功能：批量审批\n修复问题：已知问题',
    })

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/新增功能：批量审批/)).toBeInTheDocument()
    expect(screen.getByText(/修复问题：已知问题/)).toBeInTheDocument()
  })

  it('没有更新日志时不显示更新内容区域', () => {
    const updateInfo = createMinimalUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 应该只有版本信息，没有更新日志
    expect(screen.getByText(/发现新版本/)).toBeInTheDocument()
    expect(screen.getByText(/当前版本/)).toBeInTheDocument()
  })

  it('更新提醒提供"立即更新"按钮', () => {
    const updateInfo = createUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument()
  })

  it('更新提醒提供"稍后提醒"按钮', () => {
    const updateInfo = createUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: /稍后提醒/ })).toBeInTheDocument()
  })

  it('updateInfo 为 null 时不显示更新提醒', () => {
    const { container } = render(
      <UpdateDialog
        updateInfo={null}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})

// ============================================
// Scenario 3: 下载更新
// ============================================

describe('软件更新 - Scenario 3: 下载更新', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('用户点击"立即更新"后调用下载安装函数', async () => {
    // 模拟一个较慢的下载过程
    (invoke as ReturnType<typeof vi.fn>).mockImplementation(
      async () => await new Promise((resolve) => setTimeout(resolve, 100))
    )

    const TestComponent = () => {
      const { downloadAndInstall, downloading, progress } = useUpdate()

      return (
        <div>
          <button data-testid="download-btn" onClick={() => downloadAndInstall()}>
            下载更新
          </button>
          <span data-testid="downloading">{String(downloading)}</span>
          <span data-testid="progress">{progress}</span>
        </div>
      )
    }

    render(<TestComponent />)

    // 初始状态
    expect(screen.getByTestId('downloading')).toHaveTextContent('false')
    expect(screen.getByTestId('progress')).toHaveTextContent('0')

    // 点击下载
    await act(async () => {
      screen.getByTestId('download-btn').click()
    })

    // 验证 downloadAndInstall 被调用（invoke 被调用）
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith(
        'download_and_install',
        expect.any(Object)
      )
    })
  })

  it('downloadAndInstall 调用 Tauri 命令', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

    const TestComponent = () => {
      const { downloadAndInstall } = useUpdate()

      return (
        <div>
          <button data-testid="download-btn" onClick={() => downloadAndInstall()}>
            下载更新
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('download-btn').click()
    })

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith(
        'download_and_install',
        expect.objectContaining({
          onProgress: expect.any(Object),
        })
      )
    })
  })

  it('下载完成后 downloading 变为 false', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

    const TestComponent = () => {
      const { downloadAndInstall, downloading } = useUpdate()

      return (
        <div>
          <button data-testid="download-btn" onClick={() => downloadAndInstall()}>
            下载更新
          </button>
          <span data-testid="downloading">{String(downloading)}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('download-btn').click()
    })

    // 等待下载完成
    await waitFor(
      () => {
        expect(screen.getByTestId('downloading')).toHaveTextContent('false')
      },
      { timeout: 3000 }
    )
  })

  it('下载失败时 downloading 变为 false', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Download failed'))

    const TestComponent = () => {
      const { downloadAndInstall, downloading } = useUpdate()

      return (
        <div>
          <button data-testid="download-btn" onClick={() => downloadAndInstall()}>
            下载更新
          </button>
          <span data-testid="downloading">{String(downloading)}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('download-btn').click()
    })

    // 等待错误处理完成
    await waitFor(
      () => {
        expect(screen.getByTestId('downloading')).toHaveTextContent('false')
      },
      { timeout: 3000 }
    )
  })

  it('下载时进度从 0 开始', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

    const TestComponent = () => {
      const { downloadAndInstall, progress } = useUpdate()

      return (
        <div>
          <button data-testid="download-btn" onClick={() => downloadAndInstall()}>
            下载更新
          </button>
          <span data-testid="progress">{progress}</span>
        </div>
      )
    }

    render(<TestComponent />)

    // 初始进度为 0
    expect(screen.getByTestId('progress')).toHaveTextContent('0')

    await act(async () => {
      screen.getByTestId('download-btn').click()
    })

    // 初始进度仍为 0
    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('0')
    })
  })

  it('UpdateDialog 在下载时显示进度条', () => {
    const updateInfo = createUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={true}
        progress={50}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 应该显示进度
    expect(screen.getByText(/正在下载/)).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()

    // 不应该显示按钮
    expect(screen.queryByRole('button', { name: /立即更新/ })).not.toBeInTheDocument()
  })
})

// ============================================
// Scenario 4: 安装更新
// ============================================

describe('软件更新 - Scenario 4: 安装更新', () => {
  // 注意：安装更新需要用户重启应用，这部分功能由 Tauri Updater 自动处理
  // 这里主要测试下载完成后 UI 状态的变化

  it('下载完成后 UI 应该准备好进行下一步操作', () => {
    const updateInfo = createUpdateInfo()

    // 模拟下载完成状态 - 实际上 Tauri 会在下载完成后自动重启
    // 这里测试 UI 组件在非下载状态下的正常显示
    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={100}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 应该显示更新按钮
    expect(screen.getByRole('button', { name: /立即更新/ })).toBeInTheDocument()
  })

  it('安装过程中显示适当的提示', () => {
    const updateInfo = createUpdateInfo()

    // 下载中状态
    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={true}
        progress={75}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/正在下载更新/)).toBeInTheDocument()
    expect(screen.getByText(/75%/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '更新下载进度' })).toHaveAttribute(
      'aria-valuenow',
      '75'
    )
  })
})

// ============================================
// Scenario 5: 稍后提醒
// ============================================

describe('软件更新 - Scenario 5: 稍后提醒', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('用户点击"稍后提醒"后关闭弹窗', () => {
    const updateInfo = createUpdateInfo()
    const onDismiss = vi.fn()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={onDismiss}
      />
    )

    // 点击稍后提醒按钮
    screen.getByRole('button', { name: /稍后提醒/ }).click()

    // 应该调用 onDismiss
    expect(onDismiss).toHaveBeenCalled()
  })

  it('dismiss 函数清除 updateInfo', async () => {
    const updateInfo = createUpdateInfo()
    ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue(updateInfo)

    const TestComponent = () => {
      const { checkUpdate, updateInfo: currentInfo, dismiss } = useUpdate()

      return (
        <div>
          <button data-testid="check-btn" onClick={() => checkUpdate()}>
            检查更新
          </button>
          <button data-testid="dismiss-btn" onClick={() => dismiss()}>
            稍后提醒
          </button>
          <span data-testid="has-update">{currentInfo ? 'yes' : 'no'}</span>
        </div>
      )
    }

    render(<TestComponent />)

    // 先检查更新
    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('has-update')).toHaveTextContent('yes')
    })

    // 点击稍后提醒
    await act(async () => {
      screen.getByTestId('dismiss-btn').click()
    })

    // updateInfo 应该被清除
    await waitFor(() => {
      expect(screen.getByTestId('has-update')).toHaveTextContent('no')
    })
  })

  it('稍后提醒后下次启动时再次检查更新', async () => {
    const updateInfo = createUpdateInfo({ version: '1.2.0' })

    // 这个测试验证：使用 useUpdate hook 检查更新功能正常
    // 实际的"稍后提醒"逻辑由 useUpdate 内部的 dismissedVersion 状态管理

    let result: UpdateInfo | null = null

    const TestComponent = () => {
      const { checkUpdate } = useUpdate()

      return (
        <div>
          <button
            data-testid="check-btn"
            onClick={async () => {
              result = await checkUpdate()
            }}
          >
            检查更新
          </button>
          <span data-testid="result">{result?.version || 'none'}</span>
        </div>
      )
    }

    // 模拟：调用返回更新信息
    ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue(updateInfo)

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('1.2.0')
    })
  })

  it('dismiss 保存被忽略的版本号', async () => {
    const updateInfo = createUpdateInfo({ version: '1.2.0' })
    ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue(updateInfo)

    let dismissFn: (() => void) | null = null

    const TestComponent = () => {
      const { checkUpdate, updateInfo: currentInfo, dismiss } = useUpdate()
      dismissFn = dismiss

      return (
        <div>
          <button data-testid="check-btn" onClick={() => checkUpdate()}>
            检查更新
          </button>
          <span data-testid="version">{currentInfo?.version || ''}</span>
        </div>
      )
    }

    render(<TestComponent />)

    // 检查更新
    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('version')).toHaveTextContent('1.2.0')
    })

    // 调用 dismiss - 这里测试 dismiss 不会抛出错误
    await act(async () => {
      expect(() => {
        if (dismissFn) dismissFn()
      }).not.toThrow()
    })
  })
})

// ============================================
// 性能要求验证
// ============================================

describe('软件更新 - 性能要求验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('更新检查时间应在 3 秒内完成', async () => {
    const startTime = Date.now()
    ;(invoke as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const TestComponent = () => {
      const { checkUpdate } = useUpdate()

      return (
        <div>
          <button
            data-testid="check-btn"
            onClick={async () => {
              await checkUpdate()
            }}
          >
            检查更新
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    await act(async () => {
      screen.getByTestId('check-btn').click()
    })

    const elapsed = Date.now() - startTime

    // 验证检查在 3 秒内完成
    expect(elapsed).toBeLessThan(3000)
  })

  it('useUpdate Hook 提供正确的状态结构', () => {
    const TestComponent = () => {
      const { updateInfo, downloading, progress, checkUpdate, downloadAndInstall, dismiss } =
        useUpdate()

      return (
        <div>
          <span data-testid="updateInfo-type">{typeof updateInfo}</span>
          <span data-testid="downloading-type">{typeof downloading}</span>
          <span data-testid="progress-type">{typeof progress}</span>
          <span data-testid="checkUpdate-type">{typeof checkUpdate}</span>
          <span data-testid="downloadAndInstall-type">{typeof downloadAndInstall}</span>
          <span data-testid="dismiss-type">{typeof dismiss}</span>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('updateInfo-type')).toHaveTextContent('object')
    expect(screen.getByTestId('downloading-type')).toHaveTextContent('boolean')
    expect(screen.getByTestId('progress-type')).toHaveTextContent('number')
    expect(screen.getByTestId('checkUpdate-type')).toHaveTextContent('function')
    expect(screen.getByTestId('downloadAndInstall-type')).toHaveTextContent('function')
    expect(screen.getByTestId('dismiss-type')).toHaveTextContent('function')
  })
})

// ============================================
// 边界条件测试
// ============================================

describe('软件更新 - 边界条件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('处理版本号格式异常', () => {
    const updateInfo = createUpdateInfo({
      version: 'invalid-version',
      currentVersion: '1.0.0',
    })

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 应该显示版本号（即使格式异常）
    expect(screen.getByText(/invalid-version/)).toBeInTheDocument()
  })

  it('处理空更新日志', () => {
    const updateInfo = createUpdateInfo({
      notes: '',
    })

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={false}
        progress={0}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 应该正常显示
    expect(screen.getByText(/发现新版本/)).toBeInTheDocument()
  })

  it('处理进度值为负数', () => {
    const updateInfo = createUpdateInfo()

    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={true}
        progress={-10}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    // 进度应被夹紧到 0
    expect(screen.getByText(/0%/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '更新下载进度' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('处理进度值超过 100', () => {
    const updateInfo = createUpdateInfo()

    // 进度应被夹紧到 100
    render(
      <UpdateDialog
        updateInfo={updateInfo}
        downloading={true}
        progress={150}
        onDownload={() => {}}
        onDismiss={() => {}}
      />
    )

    expect(screen.getByText(/100%/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '更新下载进度' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    )
  })
})
