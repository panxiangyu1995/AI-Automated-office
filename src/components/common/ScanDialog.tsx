import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Scan, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, RefreshCw, Settings2, Monitor, FileType } from 'lucide-react'
import { DeviceSelector } from './DeviceSelector'
import { useHardware, type ScannerDevice, type PrinterDevice, type ScanOptions } from '../../hooks/useHardware'

interface ScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanComplete?: (data: number[]) => void
}

type ScanStep = 'select-device' | 'configure' | 'scanning' | 'complete' | 'error'

export function ScanDialog({ open, onOpenChange, onScanComplete }: ScanDialogProps) {
  const { scanDocument } = useHardware()

  const [step, setStep] = useState<ScanStep>('select-device')
  const [selectedDevice, setSelectedDevice] = useState<ScannerDevice | null>(null)
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    resolution: 300,
    colorMode: 'color',
    pageSize: 'a4',
  })
  const [scanData, setScanData] = useState<number[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const scanRequestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 重置状态
  useEffect(() => {
    if (!open) {
      setStep('select-device')
      setSelectedDevice(null)
      setScanData(null)
      setError(null)
      setScanOptions({
        resolution: 300,
        colorMode: 'color',
        pageSize: 'a4',
      })
    }
  }, [open])

  const handleDeviceSelect = useCallback((device: ScannerDevice | PrinterDevice) => {
    if ('manufacturer' in device) {
      setSelectedDevice(device)
      setStep('configure')
    }
  }, [])

  const handleStartScan = useCallback(async () => {
    if (!selectedDevice) return

    const requestId = ++scanRequestIdRef.current
    setStep('scanning')
    setError(null)

    try {
      const data = await scanDocument(selectedDevice.id, scanOptions)
      if (!isMountedRef.current || requestId !== scanRequestIdRef.current) {
        return
      }
      setScanData(data)
      setStep('complete')
    } catch (err) {
      if (!isMountedRef.current || requestId !== scanRequestIdRef.current) {
        return
      }
      setError(err instanceof Error ? err.message : '扫描失败')
      setStep('error')
    }
  }, [selectedDevice, scanDocument, scanOptions])

  const handleImportToChat = useCallback(() => {
    if (scanData && onScanComplete) {
      onScanComplete(scanData)
      onOpenChange(false)
    }
  }, [scanData, onScanComplete, onOpenChange])

  const isScanning = step === 'scanning'
  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isScanning) {
        return
      }
      onOpenChange(nextOpen)
    },
    [isScanning, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-[850px] p-0 gap-0 overflow-hidden bg-slate-50 transition-all duration-300"
        onEscapeKeyDown={(event) => {
          if (isScanning) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (isScanning) {
            event.preventDefault()
          }
        }}
      >
        
        {/* 顶部标题栏 */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">扫描文档</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                {step === 'select-device' && '选择扫描设备'}
                {step === 'configure' && '配置扫描参数'}
                {step === 'scanning' && '正在扫描文档'}
                {step === 'complete' && '扫描完成'}
                {step === 'error' && '扫描失败'}
              </DialogDescription>
            </div>
          </div>
          
          {/* 步骤指示器 */}
          <div className="flex items-center gap-2" role="list" aria-label="扫描步骤">
             {[
               { id: 'select-device', label: '选择设备' }, 
               { id: 'configure', label: '配置参数' }, 
               { id: 'scanning', label: '扫描' }
             ].map((s, i) => {
               const isCurrent = step === s.id;
               const isPast = ['select-device', 'configure', 'scanning', 'complete'].indexOf(step) > i;
               return (
                <div key={s.id} className="flex items-center gap-2" role="listitem">
                   <div className={`
                     px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
                     ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : isPast ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}
                   `} aria-current={isCurrent ? 'step' : undefined}>
                     {i + 1}. {s.label}
                   </div>
                   {i < 2 && <div className="w-4 h-px bg-slate-200" />}
                 </div>
               )
             })}
          </div>
        </div>

        <div className="flex h-[520px] relative">
          
          {/* 左侧配置面板 */}
          <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col z-0">
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* 步骤 1: 选择设备 */}
              {step === 'select-device' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">选择扫描仪</Label>
                    <p className="text-xs text-slate-500 mb-4">请从列表中选择一台可用的扫描仪</p>
                    <DeviceSelector
                      type="scanner"
                      onSelect={handleDeviceSelect}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 步骤 2: 配置扫描参数 */}
              {step === 'configure' && selectedDevice && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                  
                  {/* 已选设备卡片 */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                      <Scan className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">当前扫描仪</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{selectedDevice.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-100 text-indigo-600" onClick={() => setStep('select-device')}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* 分辨率设置 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      扫描分辨率 (DPI)
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[72, 150, 300, 600].map((res) => (
                        <button
                          key={res}
                          onClick={() => setScanOptions((prev) => ({ ...prev, resolution: res }))}
                          className={`
                            py-2 px-1 rounded-lg text-sm font-medium border transition-all
                            ${scanOptions.resolution === res 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}
                          `}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 颜色模式 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-slate-400" />
                      色彩模式
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'color', label: '彩色' },
                        { value: 'grayscale', label: '灰度' },
                        { value: 'blackwhite', label: '黑白' },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => setScanOptions((prev) => ({ ...prev, colorMode: mode.value }))}
                          className={`
                            py-2 px-1 rounded-lg text-sm font-medium border transition-all
                            ${scanOptions.colorMode === mode.value 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}
                          `}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 页面大小 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <FileType className="h-4 w-4 text-slate-400" />
                      页面大小
                    </Label>
                    <Select
                      value={scanOptions.pageSize}
                      onValueChange={(value) =>
                        setScanOptions((prev) => ({ ...prev, pageSize: value }))
                      }
                    >
                      <SelectTrigger className="h-10 border-slate-200 bg-white hover:border-indigo-300 transition-colors focus:ring-indigo-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="a5">A5</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 结果状态 */}
              {(step === 'complete' || step === 'error' || step === 'scanning') && (
                <div
                  className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in zoom-in-95 fade-in duration-300"
                  aria-live="polite"
                  aria-busy={isScanning}
                >
                  {step === 'scanning' && (
                    <>
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white rounded-full p-4 shadow-lg border border-indigo-50 flex items-center justify-center h-full w-full">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">正在扫描...</h3>
                        <p className="text-sm text-slate-500">请保持扫描仪盖板关闭</p>
                      </div>
                    </>
                  )}
                  {step === 'complete' && (
                    <>
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-sm">
                         <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">扫描完成</h3>
                        <p className="text-sm text-slate-500">已获取 {scanData?.length || 0} 字节数据</p>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200" onClick={handleImportToChat}>
                          导入到 AI 对话
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setStep('configure')}>
                          重新扫描
                        </Button>
                      </div>
                    </>
                  )}
                  {step === 'error' && (
                    <>
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm">
                         <AlertCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">扫描失败</h3>
                        <p className="text-xs text-red-500 bg-red-50 p-2 rounded max-w-[200px] mx-auto break-words">{error}</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setStep('configure')}>重试</Button>
                        <Button variant="outline" className="flex-1" onClick={() => setStep('select-device')}>更换设备</Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* 底部按钮栏 */}
            {step === 'configure' && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                 <Button variant="outline" className="flex-1 bg-white" onClick={() => setStep('select-device')}>
                   上一步
                 </Button>
                 <Button 
                   className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200" 
                   onClick={handleStartScan}
                 >
                   开始扫描
                 </Button>
              </div>
            )}
          </div>

          {/* 右侧预览面板 */}
          <div className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center relative p-8">
            <div className="absolute inset-0 bg-[radial-gradient(var(--ao-border)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>
            
            <div className="relative z-10 w-full max-w-[320px] aspect-[210/297] bg-white rounded shadow-2xl transition-all duration-500 flex flex-col items-center justify-center group overflow-hidden">
              {/* 扫描预览区域 */}
              <div className="absolute inset-0 bg-white rounded border border-slate-200/50 flex items-center justify-center">
                 {step === 'scanning' ? (
                   <div className="w-full h-1 bg-indigo-100 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(79,70,229,0.5)] z-20"></div>
                 ) : null}
                 
                 {scanData ? (
                   <div className="flex flex-col items-center gap-2 text-green-600">
                     <ImageIcon className="h-16 w-16" />
                     <span className="text-xs font-medium">扫描图像已就绪</span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-3 opacity-40">
                     <Scan className="h-16 w-16 text-slate-300" />
                     <p className="text-xs text-slate-400">等待扫描...</p>
                   </div>
                 )}
              </div>
              
              {/* 扫描动画条 */}
              {step === 'scanning' && (
                 <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-[scan_3s_linear_infinite]" />
              )}
            </div>
            
            <div className="mt-6 flex gap-4 text-xs text-slate-400 font-medium relative z-10">
              <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {scanOptions.resolution} DPI</span>
              <span className="flex items-center gap-1"><Settings2 className="h-3 w-3" /> {scanOptions.colorMode}</span>
              <span className="flex items-center gap-1"><FileType className="h-3 w-3" /> {scanOptions.pageSize.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
