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
import { Switch } from '../ui/switch'
import { Printer, Loader2, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import { DeviceSelector } from './DeviceSelector'
import { useHardware, type PrinterDevice, type PrintOptions, type ScannerDevice } from '../../hooks/useHardware'

interface PrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 要打印的文档内容（字节数组），可选 */
  documentContent?: number[]
}

type PrintStep = 'select-device' | 'configure' | 'printing' | 'complete' | 'error'

export function PrintDialog({ open, onOpenChange, documentContent }: PrintDialogProps) {
  const { printDocument, printPreview } = useHardware()

  const [step, setStep] = useState<PrintStep>('select-device')
  const [selectedDevice, setSelectedDevice] = useState<PrinterDevice | null>(null)
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    copies: 1,
    duplex: false,
  })
  const [previewData, setPreviewData] = useState<number[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const isMountedRef = useRef(true)
  const previewRequestIdRef = useRef(0)
  const printRequestIdRef = useRef(0)

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
      setPreviewData(null)
      setError(null)
      setPrintOptions({
        copies: 1,
        duplex: false,
      })
    }
  }, [open])

  const handleDeviceSelect = useCallback((device: ScannerDevice | PrinterDevice) => {
    if ('isDefault' in device) {
      setSelectedDevice(device)
      setStep('configure')
    }
  }, [])

  const handleLoadPreview = useCallback(async () => {
    if (!documentContent) return

    const requestId = ++previewRequestIdRef.current
    setIsLoadingPreview(true)
    try {
      const preview = await printPreview(documentContent)
      if (!isMountedRef.current || requestId !== previewRequestIdRef.current) {
        return
      }
      setPreviewData(preview)
      setError(null)
    } catch (err) {
      console.error('Failed to load preview:', err)
      if (!isMountedRef.current || requestId !== previewRequestIdRef.current) {
        return
      }
      setError('预览加载失败，请重试')
    } finally {
      if (isMountedRef.current && requestId === previewRequestIdRef.current) {
        setIsLoadingPreview(false)
      }
    }
  }, [documentContent, printPreview])

  const handleStartPrint = useCallback(async () => {
    if (!selectedDevice) return

    const requestId = ++printRequestIdRef.current
    setStep('printing')
    setError(null)

    try {
      // 如果没有传入文档内容，使用预览数据
      const content = documentContent || previewData || []
      await printDocument(selectedDevice.id, content, printOptions)
      if (!isMountedRef.current || requestId !== printRequestIdRef.current) {
        return
      }
      setStep('complete')
    } catch (err) {
      if (!isMountedRef.current || requestId !== printRequestIdRef.current) {
        return
      }
      setError(err instanceof Error ? err.message : '打印失败')
      setStep('error')
    }
  }, [selectedDevice, documentContent, previewData, printOptions, printDocument])

  const hasContent = documentContent && documentContent.length > 0
  const isPrinting = step === 'printing'

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isPrinting) {
        return
      }
      onOpenChange(nextOpen)
    },
    [isPrinting, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-[850px] p-0 gap-0 overflow-hidden bg-slate-50 transition-all duration-300"
        onEscapeKeyDown={(event) => {
          if (isPrinting) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (isPrinting) {
            event.preventDefault()
          }
        }}
      >
        
        {/* 顶部标题栏 */}
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-blue-200 shadow-lg">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">打印文档</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                {step === 'select-device' && '选择打印设备'}
                {step === 'configure' && '配置打印参数'}
                {step === 'printing' && '正在处理打印任务'}
                {step === 'complete' && '打印任务已完成'}
                {step === 'error' && '打印任务失败'}
              </DialogDescription>
            </div>
          </div>
          
          {/* 步骤指示器 */}
          <div className="flex items-center gap-2" role="list" aria-label="打印步骤">
             {[
               { id: 'select-device', label: '选择设备' }, 
               { id: 'configure', label: '配置参数' }, 
               { id: 'printing', label: '打印' }
             ].map((s, i) => {
               const isCurrent = step === s.id;
               const isPast = ['select-device', 'configure', 'printing', 'complete'].indexOf(step) > i;
               return (
                <div key={s.id} className="flex items-center gap-2" role="listitem">
                   <div className={`
                     px-3 py-1 rounded-full text-xs font-medium transition-all duration-300
                     ${isCurrent ? 'bg-blue-600 text-white shadow-md' : isPast ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}
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
                    <Label className="text-sm font-semibold text-slate-700">选择打印机</Label>
                    <p className="text-xs text-slate-500 mb-4">请从列表中选择一台可用的打印机</p>
                    <DeviceSelector
                      type="printer"
                      onSelect={handleDeviceSelect}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                  {!hasContent && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        当前没有选择文档。请先在 AI 对话中生成或选择要打印的文档，然后再次尝试。
                      </p>
                    </div>
                  )}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 步骤 2: 配置打印参数 */}
              {step === 'configure' && selectedDevice && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                  
                  {/* 已选设备卡片 */}
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">当前打印机</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{selectedDevice.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 text-blue-600" onClick={() => setStep('select-device')}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* 份数设置 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">打印份数</Label>
                    <div className="flex items-center gap-3">
                      <Select
                        value={String(printOptions.copies)}
                        onValueChange={(value) =>
                          setPrintOptions((prev) => ({ ...prev, copies: parseInt(value, 10) }))
                        }
                      >
                        <SelectTrigger className="h-10 border-slate-200 bg-white hover:border-blue-300 transition-colors focus:ring-blue-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 10, 20, 50].map(num => (
                            <SelectItem key={num} value={String(num)}>{num} 份</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 双面打印开关 */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                    <Label htmlFor="duplex" className="flex flex-col space-y-1 cursor-pointer">
                      <span className="font-semibold text-slate-700">双面打印</span>
                      <span className="font-normal text-xs text-slate-500">
                        节省纸张，长边翻转
                      </span>
                    </Label>
                    <Switch
                      id="duplex"
                      checked={printOptions.duplex}
                      onCheckedChange={(checked) =>
                        setPrintOptions((prev) => ({ ...prev, duplex: checked }))
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {/* 预览按钮 */}
                  {hasContent && !previewData && !isLoadingPreview && (
                     <Button 
                       variant="outline" 
                       className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                       onClick={handleLoadPreview}
                     >
                       <FileText className="h-4 w-4 mr-2" />
                       加载打印预览
                     </Button>
                  )}
                </div>
              )}

              {/* 结果状态 */}
              {(step === 'complete' || step === 'error' || step === 'printing') && (
                <div
                  className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in zoom-in-95 fade-in duration-300"
                  aria-live="polite"
                  aria-busy={isPrinting}
                >
                  {step === 'printing' && (
                    <>
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white rounded-full p-4 shadow-lg border border-blue-50 flex items-center justify-center h-full w-full">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">正在发送任务</h3>
                        <p className="text-sm text-slate-500">请留意打印机状态...</p>
                      </div>
                    </>
                  )}
                  {step === 'complete' && (
                    <>
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-sm">
                         <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">任务已发送</h3>
                        <p className="text-sm text-slate-500">文档已成功加入打印队列</p>
                      </div>
                      <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => onOpenChange(false)}>
                        完成
                      </Button>
                    </>
                  )}
                  {step === 'error' && (
                    <>
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm">
                         <AlertCircle className="h-10 w-10 text-red-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-800">打印失败</h3>
                        <p className="text-xs text-red-500 bg-red-50 p-2 rounded max-w-[200px] mx-auto break-words">{error}</p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setStep('configure')}>重试</Button>
                        <Button variant="outline" className="flex-1" onClick={() => setStep('select-device')}>更换打印机</Button>
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
                   className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200" 
                   onClick={handleStartPrint}
                   disabled={!hasContent && !previewData || isLoadingPreview}
                 >
                   开始打印
                 </Button>
              </div>
            )}
          </div>

          {/* 右侧预览面板 */}
          <div className="flex-1 bg-slate-100/50 flex flex-col items-center justify-center relative p-8">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>
            
            <div className="relative z-10 w-full max-w-[320px] aspect-[210/297] bg-white rounded shadow-2xl transition-all duration-500 flex flex-col items-center justify-center group">
              {/* 纸张纹理 */}
              <div className="absolute inset-0 bg-white rounded border border-slate-200/50"></div>
              
              {/* 内容 */}
              <div className="relative z-10 text-center p-6 space-y-4">
                {isLoadingPreview ? (
                   <div className="flex flex-col items-center gap-3">
                     <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                     <p className="text-xs text-slate-400">生成预览中...</p>
                   </div>
                ) : previewData ? (
                   <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-500">
                     <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 mb-2">
                       <FileText className="h-8 w-8" />
                     </div>
                     <h3 className="text-sm font-bold text-slate-700">预览就绪</h3>
                     <p className="text-xs text-slate-400 max-w-[150px]">
                       {previewData.length} 字节<br/>
                       {printOptions.copies} 份 • {printOptions.duplex ? '双面' : '单面'}
                     </p>
                   </div>
                ) : (
                   <div className="flex flex-col items-center gap-3 opacity-50 group-hover:opacity-80 transition-opacity">
                     <Printer className="h-12 w-12 text-slate-300" />
                     <p className="text-xs text-slate-400">配置参数后加载预览</p>
                   </div>
                )}
              </div>

              {/* 装饰性页角 */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-slate-100 to-white shadow-sm rounded-bl-xl pointer-events-none"></div>
            </div>
            
            <p className="mt-6 text-xs text-slate-400 font-medium relative z-10">
              A4 打印预览 (仅供参考)
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
