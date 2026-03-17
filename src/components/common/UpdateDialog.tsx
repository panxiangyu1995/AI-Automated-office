import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Download, Sparkles, AlertCircle } from 'lucide-react'
import type { UpdateInfo } from '../../hooks/useUpdate'

interface UpdateDialogProps {
  updateInfo: UpdateInfo | null
  downloading: boolean
  progress: number
  onDownload: () => void
  onDismiss: () => void
}

/**
 * 软件更新提醒弹窗
 */
export function UpdateDialog({
  updateInfo,
  downloading,
  progress,
  onDownload,
  onDismiss,
}: UpdateDialogProps) {
  if (!updateInfo) {
    return null
  }

  return (
    <Dialog open={!!updateInfo} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white border-none shadow-2xl">
        {/* Header Background */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 h-32 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative z-10 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
            <Sparkles className="h-10 w-10 text-yellow-300" />
          </div>
        </div>

        <div className="p-8 pt-6">
          <DialogHeader className="mb-6 space-y-3 text-center">
            <DialogTitle className="text-2xl font-bold text-slate-800">
              发现新版本
            </DialogTitle>
            <div className="flex flex-col items-center gap-1">
               <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-bold border border-blue-100">
                 v{updateInfo.version}
               </span>
               <p className="text-xs text-slate-400 mt-1">当前版本: v{updateInfo.currentVersion}</p>
            </div>
            <DialogDescription className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl text-left border border-slate-100 max-h-[150px] overflow-y-auto">
              {updateInfo.notes ? (
                <div className="whitespace-pre-wrap leading-relaxed">{updateInfo.notes}</div>
              ) : (
                <span className="italic text-slate-400">本次更新包含多项性能优化和问题修复。</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {downloading ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-blue-600">正在下载更新...</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] w-full h-full transform -skew-x-12 origin-left"></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center">请保持网络连接，下载完成后将自动安装</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onDismiss} 
                className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                稍后提醒
              </Button>
              <Button 
                onClick={onDownload} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
              >
                <Download className="h-4 w-4 mr-2" />
                立即更新
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
