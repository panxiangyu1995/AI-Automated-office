/**
 * ResultCorrection - 结果编辑与纠偏组件
 * Story 5.5 - 结果编辑与纠偏
 *
 * 允许用户纠正 Agent 输出并将纠正转化为可复用指导
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构，复用 message model 和 memory pipeline
 * - Brand Color: #1E3A5F
 */

import { useState, useCallback } from 'react'
import {
  CheckCircle,
  Edit3,
  Save,
  X,
  MessageSquare,
  Lightbulb,
  History,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ToolResultPart } from '../../message/runtime/messageModel'
import type { ToolDescriptor } from '../tools/toolDescriptor'

// ==================== Constants ====================

const BRAND_COLOR = '#1E3A5F'

/**
 * 纠偏类型
 */
export type CorrectionType =
  | 'accuracy'      // 准确性纠正
  | 'format'        // 格式纠正
  | 'completeness'  // 完整性纠正
  | 'relevance'     // 相关性纠正
  | 'style'         // 风格纠正
  | 'other'         // 其他

/**
 * 纠偏严重程度
 */
export type CorrectionSeverity = 'minor' | 'major' | 'critical'

/**
 * 纠偏原因配置
 */
const CORRECTION_TYPE_CONFIG: Record<CorrectionType, {
  label: string
  description: string
  color: string
}> = {
  accuracy: {
    label: '准确性',
    description: '结果包含错误的事实或数据',
    color: 'text-red-500',
  },
  format: {
    label: '格式',
    description: '结果格式不符合要求',
    color: 'text-orange-500',
  },
  completeness: {
    label: '完整性',
    description: '结果缺少必要的信息',
    color: 'text-yellow-500',
  },
  relevance: {
    label: '相关性',
    description: '结果与请求不相关',
    color: 'text-purple-500',
  },
  style: {
    label: '风格',
    description: '结果的风格或语调不合适',
    color: 'text-blue-500',
  },
  other: {
    label: '其他',
    description: '其他类型的纠偏',
    color: 'text-gray-500',
  },
}

const SEVERITY_CONFIG: Record<CorrectionSeverity, {
  label: string
  description: string
  color: string
}> = {
  minor: {
    label: '轻微',
    description: '小问题，不影响整体',
    color: 'text-green-500',
  },
  major: {
    label: '重要',
    description: '重要问题，需要纠正',
    color: 'text-orange-500',
  },
  critical: {
    label: '严重',
    description: '严重问题，必须纠正',
    color: 'text-red-500',
  },
}

// ==================== Types ====================

/**
 * 纠偏记录
 */
export interface CorrectionRecord {
  id: string
  timestamp: number
  toolCallId: string
  toolName: string
  originalResult: unknown
  correctedResult: unknown
  type: CorrectionType
  severity: CorrectionSeverity
  rationale: string
  guidance?: string
  appliedToMemory: boolean
  appliedToPrompt: boolean
}

/**
 * 纠偏规则
 */
export interface CorrectionRule {
  id: string
  name: string
  description: string
  type: CorrectionType
  pattern?: string
  guidance: string
  createdAt: number
  updatedAt: number
  usageCount: number
  enabled: boolean
}

export interface ResultCorrectionProps {
  /** 工具结果 */
  result: ToolResultPart
  /** 工具描述符 */
  descriptor?: ToolDescriptor
  /** 现有纠偏记录 */
  corrections?: CorrectionRecord[]
  /** 纠偏规则 */
  rules?: CorrectionRule[]
  /** 是否默认展开编辑模式 */
  defaultEditing?: boolean
  /** 是否显示历史记录 */
  showHistory?: boolean
  /** 提交纠偏回调 */
  onSubmitCorrection?: (correction: Omit<CorrectionRecord, 'id' | 'timestamp'>) => void
  /** 应用规则回调 */
  onApplyRule?: (ruleId: string) => void
  /** 创建规则回调 */
  onCreateRule?: (rule: Omit<CorrectionRule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void
  /** 取消回调 */
  onCancel?: () => void
}

export interface InlineResultEditorProps {
  /** 原始结果 */
  originalResult: unknown
  /** 保存回调 */
  onSave: (correctedResult: unknown) => void
  /** 取消回调 */
  onCancel: () => void
  /** 结果类型 */
  resultType?: string
}

export interface CorrectionRationaleDialogProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 原始结果 */
  originalResult: unknown
  /** 纠正后结果 */
  correctedResult: unknown
  /** 提交回调 */
  onSubmit: (rationale: {
    type: CorrectionType
    severity: CorrectionSeverity
    rationale: string
    guidance?: string
    saveAsRule: boolean
    ruleName?: string
  }) => void
}

// ==================== Helper Functions ====================

function formatResult(result: unknown): string {
  if (result === null) return 'null'
  if (result === undefined) return 'undefined'
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ==================== Sub Components ====================

interface InlineEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  language?: string
}

function InlineEditor({ value, onChange, onSave, onCancel }: InlineEditorProps): React.ReactNode {
  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] font-mono text-sm"
        placeholder="编辑结果..."
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          取消
        </Button>
        <Button size="sm" onClick={onSave} style={{ backgroundColor: BRAND_COLOR }}>
          <Save className="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>
    </div>
  )
}

interface CorrectionHistoryProps {
  corrections: CorrectionRecord[]
  onViewCorrection?: (correction: CorrectionRecord) => void
}

function CorrectionHistory({ corrections, onViewCorrection }: CorrectionHistoryProps): React.ReactNode {
  if (corrections.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-4">
        暂无纠偏记录
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {corrections.map((correction) => {
        const typeConfig = CORRECTION_TYPE_CONFIG[correction.type]
        const severityConfig = SEVERITY_CONFIG[correction.severity]
        
        return (
          <div
            key={correction.id}
            className="p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
            onClick={() => onViewCorrection?.(correction)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className={severityConfig.color}>
                  {severityConfig.label}
                </Badge>
              </div>
              <span className="text-xs text-slate-400">
                {formatTimestamp(correction.timestamp)}
              </span>
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">
              {correction.rationale}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {correction.appliedToMemory ? (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  已写入记忆
                </Badge>
              ) : null}
              {correction.appliedToPrompt ? (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  已加入提示
                </Badge>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface RuleSuggestionProps {
  rules: CorrectionRule[]
  onApplyRule: (ruleId: string) => void
}

function RuleSuggestion({ rules, onApplyRule }: RuleSuggestionProps): React.ReactNode {
  const enabledRules = rules.filter(r => r.enabled)
  
  if (enabledRules.length === 0) {
    return null
  }

  return (
    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
      <div className="flex items-center gap-1.5 text-sm text-blue-700 mb-2">
        <Lightbulb className="h-4 w-4" />
        <span className="font-medium">相关纠偏规则</span>
      </div>
      <div className="space-y-1.5">
        {enabledRules.slice(0, 3).map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-2 rounded bg-white"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-700">{rule.name}</div>
              <div className="text-xs text-slate-500">{rule.description}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApplyRule(rule.id)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              应用
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== Main Components ====================

/**
 * 内联结果编辑器
 */
export function InlineResultEditor({
  originalResult,
  onSave,
  onCancel,
}: InlineResultEditorProps): React.ReactNode {
  const [editedValue, setEditedValue] = useState(formatResult(originalResult))

  const handleSave = useCallback(() => {
    try {
      // 尝试解析为 JSON，如果失败则作为字符串
      let parsedValue: unknown
      try {
        parsedValue = JSON.parse(editedValue)
      } catch {
        parsedValue = editedValue
      }
      onSave(parsedValue)
    } catch {
      // ignore
    }
  }, [editedValue, onSave])

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Edit3 className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span>编辑结果</span>
        </div>
        <Badge variant="outline" className="text-xs">
          原始结果
        </Badge>
      </div>
      <InlineEditor
        value={editedValue}
        onChange={setEditedValue}
        onSave={handleSave}
        onCancel={onCancel}
      />
    </div>
  )
}

/**
 * 纠偏原因对话框
 */
export function CorrectionRationaleDialog({
  open,
  onOpenChange,
  originalResult,
  correctedResult,
  onSubmit,
}: CorrectionRationaleDialogProps): React.ReactNode {
  const [type, setType] = useState<CorrectionType>('accuracy')
  const [severity, setSeverity] = useState<CorrectionSeverity>('minor')
  const [rationale, setRationale] = useState('')
  const [guidance, setGuidance] = useState('')
  const [saveAsRule, setSaveAsRule] = useState(false)
  const [ruleName, setRuleName] = useState('')

  const handleSubmit = useCallback(() => {
    if (!rationale.trim()) return

    onSubmit({
      type,
      severity,
      rationale: rationale.trim(),
      guidance: guidance.trim() || undefined,
      saveAsRule,
      ruleName: saveAsRule ? ruleName.trim() : undefined,
    })

    // 重置状态
    setType('accuracy')
    setSeverity('minor')
    setRationale('')
    setGuidance('')
    setSaveAsRule(false)
    setRuleName('')
  }, [type, severity, rationale, guidance, saveAsRule, ruleName, onSubmit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: BRAND_COLOR }} />
            描述纠偏原因
          </DialogTitle>
          <DialogDescription>
            请描述为什么要纠正这个结果，这将帮助 AI 在未来提供更好的结果
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 原始与纠正后结果对比 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">原始结果</div>
              <ScrollArea className="h-[100px] rounded border bg-slate-50 p-2">
                <pre className="text-xs">
                  <code>{formatResult(originalResult)}</code>
                </pre>
              </ScrollArea>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">纠正后结果</div>
              <ScrollArea className="h-[100px] rounded border bg-green-50 p-2">
                <pre className="text-xs">
                  <code>{formatResult(correctedResult)}</code>
                </pre>
              </ScrollArea>
            </div>
          </div>

          {/* 纠偏类型 */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">纠偏类型</div>
            <Select value={type} onValueChange={(v) => setType(v as CorrectionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CORRECTION_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.label}</span>
                      <span className="text-xs text-slate-400">- {config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 严重程度 */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">严重程度</div>
            <Select value={severity} onValueChange={(v) => setSeverity(v as CorrectionSeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.label}</span>
                      <span className="text-xs text-slate-400">- {config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 纠偏原因 */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">
              纠偏原因 <span className="text-red-500">*</span>
            </div>
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="请描述为什么要纠正这个结果..."
              className="min-h-[80px]"
            />
          </div>

          {/* 指导建议 */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">
              指导建议（可选）
            </div>
            <Textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="给 AI 的具体指导建议，例如：生成代码时应该使用 TypeScript 而不是 JavaScript..."
              className="min-h-[60px]"
            />
          </div>

          {/* 保存为规则 */}
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="saveAsRule"
                checked={saveAsRule}
                onChange={(e) => setSaveAsRule(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="saveAsRule" className="text-sm font-medium text-slate-700 cursor-pointer">
                保存为可复用纠偏规则
              </label>
            </div>
            {saveAsRule ? (
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="规则名称，例如：代码生成使用 TypeScript"
                className="mt-2"
              />
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!rationale.trim()}
            style={{ backgroundColor: BRAND_COLOR }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            提交纠偏
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 结果纠偏组件
 */
export function ResultCorrection({
  result,
  descriptor,
  corrections = [],
  rules = [],
  defaultEditing = false,
  showHistory = true,
  onSubmitCorrection,
  onApplyRule,
  onCreateRule,
}: ResultCorrectionProps): React.ReactNode {
  const [isEditing, setIsEditing] = useState(defaultEditing)
  const [editedResult, setEditedResult] = useState<unknown | null>(null)
  const [showRationaleDialog, setShowRationaleDialog] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // 保存编辑后的结果
  const handleSaveEdit = useCallback((correctedResult: unknown) => {
    setEditedResult(correctedResult)
    setIsEditing(false)
    setShowRationaleDialog(true)
  }, [])

  // 提交纠偏
  const handleSubmitRationale = useCallback(
    (rationale: {
      type: CorrectionType
      severity: CorrectionSeverity
      rationale: string
      guidance?: string
      saveAsRule: boolean
      ruleName?: string
    }) => {
      if (!editedResult) return

      const correction: Omit<CorrectionRecord, 'id' | 'timestamp'> = {
        toolCallId: result.toolCallId,
        toolName: result.toolName,
        originalResult: result.result,
        correctedResult: editedResult,
        type: rationale.type,
        severity: rationale.severity,
        rationale: rationale.rationale,
        guidance: rationale.guidance,
        appliedToMemory: true,
        appliedToPrompt: true,
      }

      onSubmitCorrection?.(correction)

      // 如果需要保存为规则
      if (rationale.saveAsRule && rationale.ruleName) {
        onCreateRule?.({
          name: rationale.ruleName,
          description: rationale.rationale,
          type: rationale.type,
          guidance: rationale.guidance || rationale.rationale,
          enabled: true,
        })
      }

      setShowRationaleDialog(false)
      setEditedResult(null)
    },
    [editedResult, result, onSubmitCorrection, onCreateRule]
  )

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditedResult(null)
  }, [])

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderLeftWidth: '3px', borderLeftColor: BRAND_COLOR }}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4" style={{ color: BRAND_COLOR }} />
          <span className="font-medium text-slate-700">结果纠偏</span>
          {corrections.length > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {corrections.length} 条记录
            </Badge>
          ) : null}
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            编辑
          </Button>
        ) : null}
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-4">
        {/* 规则建议 */}
        {rules.length > 0 && !isEditing ? (
          <RuleSuggestion rules={rules} onApplyRule={onApplyRule || (() => {})} />
        ) : null}

        {/* 编辑区域 */}
        {isEditing ? (
          <InlineResultEditor
            originalResult={result.result}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="text-sm font-medium text-slate-700 mb-2">当前结果</div>
            <ScrollArea className="max-h-[150px]">
              <pre className="text-xs">
                <code>{formatResult(result.result)}</code>
              </pre>
            </ScrollArea>
          </div>
        )}

        {/* 纠偏历史 */}
        {showHistory && corrections.length > 0 ? (
          <Collapsible open={historyExpanded} onOpenChange={setHistoryExpanded}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 w-full">
                <History className="h-4 w-4" />
                <span>纠偏历史</span>
                {historyExpanded ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3">
                <CorrectionHistory corrections={corrections} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {/* 工具描述 */}
        {descriptor ? (
          <div className="text-xs text-slate-500 pt-2 border-t">
            工具: {descriptor.name} - {descriptor.description}
          </div>
        ) : null}
      </div>

      {/* 纠偏原因对话框 */}
      <CorrectionRationaleDialog
        open={showRationaleDialog}
        onOpenChange={setShowRationaleDialog}
        originalResult={result.result}
        correctedResult={editedResult}
        onSubmit={handleSubmitRationale}
      />
    </div>
  )
}

export default ResultCorrection
