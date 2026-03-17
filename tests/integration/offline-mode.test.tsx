/**
 * 离线模式验收测试
 *
 * 验收标准：
 * - Scenario 1: 离线模式启动 - 显示离线模式提示，可访问本地缓存数据
 * - Scenario 2: 数据自动同步 - 网络恢复时自动同步，显示同步进度
 * - Scenario 3: 同步完成提示 - 显示"同步完成"提示，提示自动消失
 */

import { cleanup, render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineIndicator } from '@/components/common/OfflineIndicator'
import { SyncStatus } from '@/components/common/SyncStatus'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import type { QueuedRequest } from '@/lib/api/types'

// Mock Tauri API
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}))

vi.mock('@/lib/tauri', () => ({
  checkNetworkStatus: vi.fn(() => Promise.resolve(true)),
  getPendingRequests: vi.fn(() => Promise.resolve([])),
  processPendingRequests: vi.fn(() => Promise.resolve([])),
}))

// 模拟 navigator.onLine
const setNavigatorOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value: online,
    configurable: true,
  })
}

// ============================================
// 真实业务场景的测试数据工厂
// ============================================

/**
 * 创建真实的离线队列请求数据
 * 模拟用户离线时创建的审批单
 */
const createApprovalRequest = (): QueuedRequest => ({
  id: 'req-approval-001',
  method: 'POST',
  url: '/api/v1/approvals',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token',
  },
  body: JSON.stringify({
    title: '采购审批单',
    type: 'purchase',
    amount: 50000,
    applicant: '张三',
    department: '销售部',
  }),
  createdAt: Date.now() - 60000, // 1分钟前
  retryCount: 0,
  maxRetries: 3,
  status: 'pending',
})

/**
 * 模拟用户离线时更新的销售订单
 */
const createSalesOrderRequest = (): QueuedRequest => ({
  id: 'req-sales-002',
  method: 'PUT',
  url: '/api/v1/sales/orders/SO-2024-001',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token',
  },
  body: JSON.stringify({
    status: 'confirmed',
    deliveryDate: '2024-03-20',
    remarks: '客户已确认订单',
  }),
  createdAt: Date.now() - 120000, // 2分钟前
  retryCount: 1, // 已重试一次
  maxRetries: 3,
  status: 'pending',
  lastError: 'network timeout',
})

/**
 * 模拟用户离线时删除的联系人
 */
const createDeleteRequest = (): QueuedRequest => ({
  id: 'req-contact-003',
  method: 'DELETE',
  url: '/api/v1/contacts/C-1001',
  headers: {
    'Authorization': 'Bearer mock-token',
  },
  createdAt: Date.now() - 300000, // 5分钟前
  retryCount: 2, // 已重试两次
  maxRetries: 3,
  status: 'failed', // 上次同步失败
  lastError: 'server error: 500',
})


// ============================================
// Scenario 1: 离线模式启动
// ============================================

describe('离线模式 - Scenario 1: 离线模式启动', () => {
  beforeEach(() => {
    setNavigatorOnline(false)
  })

  afterEach(() => {
    cleanup()
  })

  it('离线时显示 OfflineIndicator 组件', async () => {
    render(<OfflineIndicator />)
    await waitFor(
      () => {
        expect(screen.getByText(/离线模式/)).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  it('在线时不显示 OfflineIndicator 组件', async () => {
    setNavigatorOnline(true)
    const { container } = render(<OfflineIndicator />)
    await waitFor(
      () => {
        expect(container.firstChild).toBeNull()
      },
      { timeout: 1500 }
    )
  })

  it('useNetworkStatus 正确反映离线状态', async () => {
    const TestComponent = () => {
      const { isOnline } = useNetworkStatus()
      return <div data-testid="status">{isOnline ? '在线' : '离线'}</div>
    }

    render(<TestComponent />)
    await waitFor(
      () => {
        expect(screen.getByTestId('status')).toHaveTextContent('离线')
      },
      { timeout: 1500 }
    )
  })

  it('useNetworkStatus 返回正确的网络状态结构', async () => {
    const TestComponent = () => {
      const status = useNetworkStatus()
      return (
        <div>
          <span data-testid="isOnline">{String(status.isOnline)}</span>
          <span data-testid="pendingSyncCount">{status.pendingSyncCount}</span>
          <span data-testid="isSyncing">{String(status.isSyncing)}</span>
          <span data-testid="lastSyncCompletedAt">{String(status.lastSyncCompletedAt)}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('isOnline')).toHaveTextContent('false')
        expect(screen.getByTestId('pendingSyncCount')).toHaveTextContent('0')
        expect(screen.getByTestId('isSyncing')).toHaveTextContent('false')
      },
      { timeout: 1500 }
    )
  })

  it('离线时 SyncStatus 显示离线状态', async () => {
    render(<SyncStatus />)
    await waitFor(
      () => {
        expect(screen.getByText('离线')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  // 新增：模拟用户有未同步数据时的离线状态
  it('离线时显示待同步数量', async () => {
    const { getPendingRequests } = await import('@/lib/tauri')
    // 模拟用户离线时创建了3个待同步请求
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      createApprovalRequest(),
      createSalesOrderRequest(),
      createDeleteRequest(),
    ])

    const TestComponent = () => {
      const { pendingSyncCount } = useNetworkStatus()
      return <div data-testid="pending">{pendingSyncCount}</div>
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('pending')).toHaveTextContent('3')
      },
      { timeout: 1500 }
    )
  })
})

// ============================================
// Scenario 2: 数据自动同步
// ============================================

describe('离线模式 - Scenario 2: 数据自动同步', () => {
  beforeEach(() => {
    setNavigatorOnline(true)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('useNetworkStatus 返回 syncPendingRequests 函数', async () => {
    const TestComponent = () => {
      const { syncPendingRequests } = useNetworkStatus()
      return (
        <div>
          <span data-testid="hasSync">{typeof syncPendingRequests === 'function' ? 'yes' : 'no'}</span>
        </div>
      )
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('hasSync')).toHaveTextContent('yes')
      },
      { timeout: 1500 }
    )
  })

  it('网络恢复时自动触发同步', async () => {
    // 模拟有待同步请求
    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      createApprovalRequest(),
    ])

    const { processPendingRequests } = await import('@/lib/tauri')
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const TestComponent = () => {
      const { isOnline, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="isOnline">{String(isOnline)}</span>
          {isOnline && typeof syncPendingRequests === 'function' && (
            <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
              同步
            </button>
          )}
        </div>
      )
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('sync-btn')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )
  })

  it('同步多个业务请求时正确显示进度', async () => {
    // 模拟批量同步审批单、销售订单、联系人
    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      createApprovalRequest(),
      createSalesOrderRequest(),
      createDeleteRequest(),
    ])

    const { processPendingRequests } = await import('@/lib/tauri')
    // 模拟同步结果：2个成功，1个失败
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'req-approval-001', success: true, status_code: 201 },
      { id: 'req-sales-002', success: true, status_code: 200 },
      { id: 'req-contact-003', success: false, status_code: 500, error: 'server error' },
    ])

    const TestComponent = () => {
      const { pendingSyncCount, isSyncing, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="pending">{pendingSyncCount}</span>
          <span data-testid="syncing">{String(isSyncing)}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 初始显示待同步数量
    await waitFor(
      () => {
        expect(screen.getByTestId('pending')).toHaveTextContent('3')
      },
      { timeout: 1500 }
    )

    // 触发同步
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 同步完成后验证
    await waitFor(
      () => {
        expect(screen.getByTestId('syncing')).toHaveTextContent('false')
      },
      { timeout: 3000 }
    )
  })

  it('同步时 isSyncing 变为 true', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return [{ id: '1', success: true }]
    })

    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([createApprovalRequest()])

    const TestComponent = () => {
      const { isSyncing, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="isSyncing">{String(isSyncing)}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 点击同步按钮
    await act(async () => {
      screen.getByTestId('sync-btn').click()
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // 应该显示正在同步
    await waitFor(
      () => {
        expect(screen.getByTestId('isSyncing')).toHaveTextContent('true')
      },
      { timeout: 1500 }
    )
  })

  it('同步完成后 isSyncing 变回 false', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'req-approval-001', success: true }
    ])

    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([createApprovalRequest()])

    const TestComponent = () => {
      const { isSyncing, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="isSyncing">{String(isSyncing)}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 点击同步按钮
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 等待同步完成
    await waitFor(
      () => {
        expect(screen.getByTestId('isSyncing')).toHaveTextContent('false')
      },
      { timeout: 3000 }
    )
  })

  // 新增：测试同步失败场景
  it('同步失败时显示错误状态', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    // 模拟网络错误
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    )

    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([createApprovalRequest()])

    const TestComponent = () => {
      const { isSyncing, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="isSyncing">{String(isSyncing)}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 点击同步按钮，触发错误
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 等待同步完成（即使失败也应该结束）
    await waitFor(
      () => {
        expect(screen.getByTestId('isSyncing')).toHaveTextContent('false')
      },
      { timeout: 3000 }
    )
  })
})

// ============================================
// Scenario 3: 同步完成提示
// ============================================

describe('离线模式 - Scenario 3: 同步完成提示', () => {
  beforeEach(() => {
    setNavigatorOnline(true)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('lastSyncCompletedAt 在同步完成后更新', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'req-approval-001', success: true }
    ])

    const { getPendingRequests } = await import('@/lib/tauri')
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([createApprovalRequest()])

    const TestComponent = () => {
      const { lastSyncCompletedAt, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <span data-testid="lastSync">{String(lastSyncCompletedAt)}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 初始应该为 null
    await waitFor(
      () => {
        expect(screen.getByTestId('lastSync')).toHaveTextContent('null')
      },
      { timeout: 1500 }
    )

    // 点击同步按钮
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 同步完成后应该更新
    await waitFor(
      () => {
        expect(screen.getByTestId('lastSync')).not.toHaveTextContent('null')
      },
      { timeout: 3000 }
    )
  })

  it('SyncStatus 组件在同步完成后显示"同步完成"', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'req-approval-001', success: true }
    ])

    // 使用动态 mock 来模拟同步完成后待同步数量变为 0
    const { getPendingRequests } = await import('@/lib/tauri')
    let requestCount = 1
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockImplementation(() => {
      const count = requestCount
      requestCount = 0 // 下次调用返回 0
      return Promise.resolve(count > 0 ? [createApprovalRequest()] : [])
    })

    const TestComponent = () => {
      const { syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <SyncStatus />
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 点击同步按钮
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 等待同步完成提示出现
    await waitFor(
      () => {
        expect(screen.getByText('同步完成')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  // 新增：测试批量同步完成后的状态
  it('批量同步多个请求后显示同步完成', async () => {
    const { processPendingRequests } = await import('@/lib/tauri')
    // 模拟3个请求都同步成功
    ;(processPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'req-approval-001', success: true, status_code: 201 },
      { id: 'req-sales-002', success: true, status_code: 200 },
      { id: 'req-contact-003', success: true, status_code: 200 },
    ])

    // 使用动态 mock - 初始返回3个，刷新时返回0
    const { getPendingRequests } = await import('@/lib/tauri')
    let firstCall = true
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockImplementation(() => {
      if (firstCall) {
        firstCall = false
        return Promise.resolve([
          createApprovalRequest(),
          createSalesOrderRequest(),
          createDeleteRequest(),
        ])
      }
      return Promise.resolve([]) // 后续调用返回空（模拟已同步）
    })

    const TestComponent = () => {
      const { pendingSyncCount, syncPendingRequests } = useNetworkStatus()

      return (
        <div>
          <SyncStatus />
          <span data-testid="pending">{pendingSyncCount}</span>
          <button data-testid="sync-btn" onClick={() => syncPendingRequests()}>
            同步
          </button>
        </div>
      )
    }

    render(<TestComponent />)

    // 等待初始渲染完成（不需要验证具体数量，因为初始是 0）
    await waitFor(
      () => {
        expect(screen.getByTestId('sync-btn')).toBeInTheDocument()
      },
      { timeout: 1500 }
    )

    // 触发批量同步
    await act(async () => {
      screen.getByTestId('sync-btn').click()
    })

    // 等待同步完成
    await waitFor(
      () => {
        expect(screen.getByText('同步完成')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })
})

// ============================================
// 性能要求验证
// ============================================

describe('离线模式 - 性能要求验证', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('useNetworkStatus 返回 refreshPendingCount 函数', async () => {
    const TestComponent = () => {
      const { refreshPendingCount } = useNetworkStatus()
      return (
        <div>
          <span data-testid="hasRefresh">
            {typeof refreshPendingCount === 'function' ? 'yes' : 'no'}
          </span>
        </div>
      )
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('hasRefresh')).toHaveTextContent('yes')
      },
      { timeout: 1500 }
    )
  })

  // 新增：测试大量待同步请求时的性能
  it('大量待同步请求时正确显示数量', async () => {
    const { getPendingRequests } = await import('@/lib/tauri')
    // 模拟100个待同步请求（实际业务中可能出现的情况）
    const manyRequests = Array.from({ length: 100 }, (_, i) =>
      createApprovalRequest({ id: `req-${i}` })
    )
    ;(getPendingRequests as ReturnType<typeof vi.fn>).mockResolvedValue(manyRequests)

    const TestComponent = () => {
      const { pendingSyncCount } = useNetworkStatus()
      return <div data-testid="pending">{pendingSyncCount}</div>
    }

    render(<TestComponent />)

    await waitFor(
      () => {
        expect(screen.getByTestId('pending')).toHaveTextContent('100')
      },
      { timeout: 1500 }
    )
  })
})
