import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HardwareDialog } from '@/components/common/HardwareDialog'
import { PrintDialog } from '@/components/common/PrintDialog'
import { ScanDialog } from '@/components/common/ScanDialog'
import { UpdateDialog } from '@/components/common/UpdateDialog'
import { useHardware } from '@/hooks/useHardware'

vi.mock('@/hooks/useHardware', () => ({
  useHardware: vi.fn(),
}))

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const createScannerDevices = () => [
  { id: 'scanner-canon-lide400', name: 'Canon LiDE 400', manufacturer: 'Canon' },
  { id: 'scanner-epson-v39ii', name: 'Epson V39 II', manufacturer: 'Epson' },
]

const createPrinterDevices = () => [
  { id: 'printer-hp-m404dn', name: 'HP LaserJet Pro M404dn', isDefault: true },
  { id: 'printer-brother-2260d', name: 'Brother HL-2260D', isDefault: false },
]

describe('Dialog P0/P1 优化回归测试', () => {
  const mockedUseHardware = vi.mocked(useHardware)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('HardwareDialog 在并发刷新时仅保留最新请求结果', async () => {
    const firstScanners = createDeferred<ReturnType<typeof createScannerDevices>>()
    const firstPrinters = createDeferred<ReturnType<typeof createPrinterDevices>>()
    const secondScanners = createDeferred<ReturnType<typeof createScannerDevices>>()
    const secondPrinters = createDeferred<ReturnType<typeof createPrinterDevices>>()

    const listScanners = vi
      .fn()
      .mockImplementationOnce(() => firstScanners.promise)
      .mockImplementationOnce(() => secondScanners.promise)
    const listPrinters = vi
      .fn()
      .mockImplementationOnce(() => firstPrinters.promise)
      .mockImplementationOnce(() => secondPrinters.promise)

    mockedUseHardware.mockReturnValue({
      listScanners,
      listPrinters,
      scanDocument: vi.fn(),
      printDocument: vi.fn(),
      printPreview: vi.fn(),
    })

    render(<HardwareDialog open={true} onOpenChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /刷新列表/i }))

    firstScanners.resolve([{ id: 'old-scanner', name: 'Old Scanner', manufacturer: 'Legacy' }])
    firstPrinters.resolve([{ id: 'old-printer', name: 'Old Printer', isDefault: false }])
    secondScanners.resolve([{ id: 'new-scanner', name: 'Canon LiDE 400', manufacturer: 'Canon' }])
    secondPrinters.resolve([{ id: 'new-printer', name: 'HP LaserJet Pro M404dn', isDefault: true }])

    await waitFor(() => {
      expect(screen.getByText('Canon LiDE 400')).toBeInTheDocument()
      expect(screen.getByText('HP LaserJet Pro M404dn')).toBeInTheDocument()
      expect(screen.queryByText('Old Scanner')).not.toBeInTheDocument()
      expect(screen.queryByText('Old Printer')).not.toBeInTheDocument()
    })
  })

  it('HardwareDialog 设备加载失败时展示可访问错误提示', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedUseHardware.mockReturnValue({
      listScanners: vi.fn().mockRejectedValue(new Error('驱动异常')),
      listPrinters: vi.fn().mockRejectedValue(new Error('驱动异常')),
      scanDocument: vi.fn(),
      printDocument: vi.fn(),
      printPreview: vi.fn(),
    })

    render(<HardwareDialog open={true} onOpenChange={vi.fn()} />)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('设备检测失败，请检查连接后重试')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })
    errorSpy.mockRestore()
  })

  it('PrintDialog 打印中禁止关闭并在完成后允许完成操作', async () => {
    const printTask = createDeferred<void>()
    const onOpenChange = vi.fn()

    mockedUseHardware.mockReturnValue({
      listScanners: vi.fn(),
      listPrinters: vi.fn().mockResolvedValue(createPrinterDevices()),
      scanDocument: vi.fn(),
      printPreview: vi.fn().mockResolvedValue([1, 2, 3]),
      printDocument: vi.fn().mockImplementation(() => printTask.promise),
    })

    render(<PrintDialog open={true} onOpenChange={onOpenChange} documentContent={[7, 8, 9]} />)

    await userEvent.click(await screen.findByText('HP LaserJet Pro M404dn'))
    await userEvent.click(screen.getByRole('button', { name: '开始打印' }))

    expect(screen.getByText('正在发送任务')).toBeInTheDocument()
    expect(screen.getByLabelText('打印步骤')).toBeInTheDocument()
    expect(screen.getByText('正在发送任务').closest('div[aria-busy="true"]')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    await act(async () => {
      printTask.resolve()
      await printTask.promise
    })

    await userEvent.click(await screen.findByRole('button', { name: '完成' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('PrintDialog 预览加载中禁用开始打印按钮', async () => {
    const previewTask = createDeferred<number[]>()

    mockedUseHardware.mockReturnValue({
      listScanners: vi.fn(),
      listPrinters: vi.fn().mockResolvedValue(createPrinterDevices()),
      scanDocument: vi.fn(),
      printDocument: vi.fn().mockResolvedValue(undefined),
      printPreview: vi.fn().mockImplementation(() => previewTask.promise),
    })

    render(<PrintDialog open={true} onOpenChange={vi.fn()} documentContent={[10, 20, 30]} />)

    await userEvent.click(await screen.findByText('HP LaserJet Pro M404dn'))
    await userEvent.click(screen.getByRole('button', { name: '加载打印预览' }))

    expect(screen.getByRole('button', { name: '开始打印' })).toBeDisabled()

    await act(async () => {
      previewTask.resolve([10, 20, 30])
      await previewTask.promise
    })
  })

  it('ScanDialog 扫描中禁止关闭并具备步骤语义', async () => {
    const scanTask = createDeferred<number[]>()
    const onOpenChange = vi.fn()

    mockedUseHardware.mockReturnValue({
      listScanners: vi.fn().mockResolvedValue(createScannerDevices()),
      listPrinters: vi.fn(),
      scanDocument: vi.fn().mockImplementation(() => scanTask.promise),
      printDocument: vi.fn(),
      printPreview: vi.fn(),
    })

    render(<ScanDialog open={true} onOpenChange={onOpenChange} />)

    await userEvent.click(await screen.findByText('Canon LiDE 400'))
    await userEvent.click(screen.getByRole('button', { name: '开始扫描' }))

    expect(screen.getByLabelText('扫描步骤')).toBeInTheDocument()
    expect(screen.getByText('正在扫描...').closest('div[aria-busy="true"]')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    await act(async () => {
      scanTask.resolve([101, 102, 103])
      await scanTask.promise
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '扫描完成' })).toBeInTheDocument()
    })
  })

  it('UpdateDialog 下载中阻止关闭并暴露标准进度可访问属性', async () => {
    const onDismiss = vi.fn()
    render(
      <UpdateDialog
        updateInfo={{
          version: '2.3.0',
          currentVersion: '2.2.1',
          notes: '提升扫描稳定性并修复打印队列阻塞',
        }}
        downloading={true}
        progress={68}
        onDownload={vi.fn()}
        onDismiss={onDismiss}
      />
    )

    const progressBar = screen.getByRole('progressbar', { name: '更新下载进度' })
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    expect(progressBar).toHaveAttribute('aria-valuenow', '68')

    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
