import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发现新版本 {updateInfo.version}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-slate-600">
          当前版本：{updateInfo.currentVersion}
        </div>
        {updateInfo.notes && (
          <div className="whitespace-pre-wrap text-sm text-slate-600">
            {updateInfo.notes}
          </div>
        )}
        {downloading ? (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-slate-500">正在下载... {progress}%</div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onDismiss}>
              稍后提醒
            </Button>
            <Button onClick={onDownload}>立即更新</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
