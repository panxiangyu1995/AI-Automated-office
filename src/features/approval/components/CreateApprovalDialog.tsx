import { useState, useEffect, useCallback } from 'react'
import {
  Send,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { approvalApi } from '../api/approvalApi'
import type { FlowListItem, CreateRecordRequest } from '../types/approval.types'

interface CreateApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicantId: string
  applicantName: string
  onSubmit?: (recordId: string) => void
}

export function CreateApprovalDialog({
  open,
  onOpenChange,
  applicantId,
  applicantName,
  onSubmit,
}: CreateApprovalDialogProps) {
  const [flows, setFlows] = useState<FlowListItem[]>([])
  const [selectedFlowId, setSelectedFlowId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingFlows, setIsLoadingFlows] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlows = useCallback(async () => {
    setIsLoadingFlows(true)
    try {
      const result = await approvalApi.listFlows()
      setFlows(result.filter(f => f.status === 'active'))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoadingFlows(false)
    }
  }, [])

  useEffect(() => {
    if (open) void fetchFlows()
  }, [open, fetchFlows])

  const resetForm = () => {
    setSelectedFlowId('')
    setTitle('')
    setDescription('')
    setAmount('')
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedFlowId) {
      setError('请选择审批流程')
      return
    }
    if (!title.trim()) {
      setError('请输入审批标题')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const request: CreateRecordRequest = {
        flowId: selectedFlowId,
        applicantId,
        applicantName,
        formData: {
          title: title.trim(),
          description: description.trim(),
          ...(amount ? { amount: parseFloat(amount) } : {}),
        },
      }
      const record = await approvalApi.createRecord(request)
      onSubmit?.(record.id)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建审批</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>审批流程</Label>
            {isLoadingFlows ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            ) : flows.length === 0 ? (
              <EmptyState variant="data" title="暂无可用流程" description="请先创建审批流程" />
            ) : (
              <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择审批流程" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name} ({flow.stepCount}步审批)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>审批标题</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入审批标题"
            />
          </div>

          <div className="space-y-2">
            <Label>说明</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入审批说明"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>金额（可选）</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入金额"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-1" />
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedFlowId}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            提交审批
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
