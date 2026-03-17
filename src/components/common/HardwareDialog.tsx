import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { RefreshCw, Printer, Scan, XCircle, Loader2 } from 'lucide-react'
import { useHardware, type ScannerDevice, type PrinterDevice } from '../../hooks/useHardware'

interface HardwareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HardwareDialog({ open, onOpenChange }: HardwareDialogProps) {
  const { listScanners, listPrinters } = useHardware()

  const [scanners, setScanners] = useState<ScannerDevice[]>([])
  const [printers, setPrinters] = useState<PrinterDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadDevices = useCallback(async (silent = false) => {
    const requestId = ++requestIdRef.current
    if (!silent) {
      setIsLoading(true)
    }
    setLoadError(null)
    try {
      const [scannerList, printerList] = await Promise.all([listScanners(), listPrinters()])
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }
      setScanners(scannerList)
      setPrinters(printerList)
    } catch (error) {
      console.error('Failed to load devices:', error)
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return
      }
      setLoadError('设备检测失败，请检查连接后重试')
    } finally {
      if (!silent && isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [listScanners, listPrinters])

  // 打开时加载设备
  useEffect(() => {
    if (open) {
      loadDevices()
    }
  }, [open, loadDevices])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadDevices(true)
    if (isMountedRef.current) {
      setIsRefreshing(false)
    }
  }, [loadDevices])

  const hasDevices = scanners.length > 0 || printers.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-lg font-bold text-slate-800">硬件设备管理</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                查看和管理已连接的扫描仪和打印机设备
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {!isLoading && loadError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
            >
              {loadError}
            </div>
          )}
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white rounded-full p-2 shadow-sm border border-slate-100">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600" aria-live="polite">
                正在检测硬件设备...
              </p>
            </div>
          )}

          {/* 没有设备 */}
          {!isLoading && !hasDevices && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
                <XCircle className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-700">未检测到任何设备</p>
                <p className="text-xs text-slate-500 max-w-[200px]">
                  请确保扫描仪或打印机已正确连接并开启电源
                </p>
              </div>
              <Button variant="outline" onClick={handleRefresh} className="mt-2">
                重新检测
              </Button>
            </div>
          )}

          {/* 设备列表 */}
          {!isLoading && hasDevices && (
            <div className="space-y-6">
              {/* 扫描仪列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">扫描仪</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{scanners.length}</span>
                  </div>
                </div>

                {scanners.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">未检测到扫描仪</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {scanners.map((device) => (
                      <div
                        key={device.id}
                        className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <Scan className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{device.name}</p>
                            <p className="text-xs text-slate-500">{device.manufacturer}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs font-medium text-green-700">就绪</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 打印机列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">打印机</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{printers.length}</span>
                  </div>
                </div>

                {printers.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">未检测到打印机</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {printers.map((device) => (
                      <div
                        key={device.id}
                        className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                            <Printer className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold text-slate-800">{device.name}</p>
                            {device.isDefault && (
                              <span className="inline-flex items-center justify-center rounded-full text-[10px] px-1.5 py-0 h-4 bg-slate-800 text-white">
                                默认设备
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                          {device.isDefault ? (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-xs font-medium text-green-700">在线</span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                              <span className="text-xs font-medium text-slate-600">就绪</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            提示：点击 TopBar 菜单中的"硬件"可快速执行操作
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
            )}
            {isRefreshing ? '刷新中...' : '刷新列表'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
