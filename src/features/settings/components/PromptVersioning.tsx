import { useState, useMemo, useCallback } from 'react'
import {
  History,
  RotateCcw,
  GitBranch,
  Clock,
  User,
  FileText,
  Plus,
  Minus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Database,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Eye,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Types
export type VersionAction = 'create' | 'update' | 'apply' | 'rollback' | 'delete'
export type KnowledgeSource = 'session' | 'feedback' | 'manual' | 'auto'
export type WritebackStatus = 'enabled' | 'disabled' | 'paused'

export interface PromptDiff {
  additions: number
  deletions: number
  changes: number
  diffText: string
}

export interface PromptVersion {
  id: string
  version: number
  content: string
  createdAt: string
  createdBy: string
  action: VersionAction
  description: string
  diff?: PromptDiff
  isActive: boolean
  isRollbackTarget: boolean
}

export interface KnowledgeEntry {
  id: string
  source: KnowledgeSource
  content: string
  timestamp: string
  sessionId: string
  applied: boolean
}

export interface WritebackConfig {
  status: WritebackStatus
  autoApply: boolean
  minConfidence: number
  requireApproval: boolean
  targetKnowledgeBase: string
}

export interface PromptVersioningState {
  versions: PromptVersion[]
  knowledgeEntries: KnowledgeEntry[]
  writebackConfig: WritebackConfig
  selectedVersion: PromptVersion | null
  compareVersion: PromptVersion | null
  isLoading: boolean
}

export interface PromptVersioningProps {
  className?: string
}

// Mock data
const createMockVersions = (): PromptVersion[] => [
  {
    id: 'ver-001',
    version: 5,
    content: '你是 AI-Automated-Office 系统的智能助手。\n\n## 核心价值观\n- 以用户为中心\n- 保持透明可控\n- 尊重隐私安全\n\n## 当前身份\n{{agent_name}}',
    createdAt: '2026-03-24T14:30:00Z',
    createdBy: 'admin@example.com',
    action: 'update',
    description: '更新核心价值观描述',
    diff: { additions: 3, deletions: 1, changes: 4, diffText: '' },
    isActive: true,
    isRollbackTarget: false,
  },
  {
    id: 'ver-002',
    version: 4,
    content: '你是 AI-Automated-Office 系统的智能助手。\n\n## 核心价值观\n- 以用户为中心\n- 保持透明\n\n## 当前身份\n{{agent_name}}',
    createdAt: '2026-03-20T10:00:00Z',
    createdBy: 'user@example.com',
    action: 'update',
    description: '简化核心价值观',
    diff: { additions: 2, deletions: 5, changes: 7, diffText: '' },
    isActive: false,
    isRollbackTarget: true,
  },
  {
    id: 'ver-003',
    version: 3,
    content: '你是 AI-Automated-Office 系统的智能助手。\n\n## 身份定义\n你是一个专业的企业AI助手。\n\n## 核心价值观\n- 以用户为中心\n- 保持透明\n- 尊重隐私',
    createdAt: '2026-03-15T09:00:00Z',
    createdBy: 'admin@example.com',
    action: 'update',
    description: '重构身份定义部分',
    diff: { additions: 5, deletions: 3, changes: 8, diffText: '' },
    isActive: false,
    isRollbackTarget: true,
  },
  {
    id: 'ver-004',
    version: 2,
    content: '你是 AI-Automated-Office 系统的智能助手。\n\n请帮助用户完成日常工作任务。',
    createdAt: '2026-02-01T00:00:00Z',
    createdBy: 'system',
    action: 'create',
    description: '初始版本',
    isActive: false,
    isRollbackTarget: true,
  },
  {
    id: 'ver-005',
    version: 1,
    content: '你是一个AI助手。',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    action: 'create',
    description: '系统默认模板',
    isActive: false,
    isRollbackTarget: false,
  },
]

const createMockKnowledgeEntries = (): KnowledgeEntry[] => [
  {
    id: 'kb-001',
    source: 'session',
    content: '用户偏好使用简体中文进行对话，避免过于正式的表达方式',
    timestamp: '2026-03-24T14:00:00Z',
    sessionId: 'session-123',
    applied: true,
  },
  {
    id: 'kb-002',
    source: 'feedback',
    content: '用户反馈需要更详细的解释，建议添加示例说明',
    timestamp: '2026-03-23T16:00:00Z',
    sessionId: 'session-456',
    applied: false,
  },
  {
    id: 'kb-003',
    source: 'auto',
    content: '用户经常在上午9-11点进行工作任务咨询',
    timestamp: '2026-03-22T10:30:00Z',
    sessionId: 'session-789',
    applied: true,
  },
]

export function PromptVersioning({ className = '' }: PromptVersioningProps) {
  const [versions, setVersions] = useState<PromptVersion[]>(createMockVersions)
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>(createMockKnowledgeEntries)
  const [writebackConfig, setWritebackConfig] = useState<WritebackConfig>({
    status: 'enabled',
    autoApply: true,
    minConfidence: 0.8,
    requireApproval: false,
    targetKnowledgeBase: 'default',
  })
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [compareVersion, setCompareVersion] = useState<PromptVersion | null>(null)
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false)
  const [versionToRollback, setVersionToRollback] = useState<PromptVersion | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [diffDialogOpen, setDiffDialogOpen] = useState(false)

  // Stats
  const stats = useMemo(() => ({
    totalVersions: versions.length,
    activeVersion: versions.find(v => v.isActive)?.version || 0,
    knowledgeCount: knowledgeEntries.length,
    appliedKnowledge: knowledgeEntries.filter(k => k.applied).length,
  }), [versions, knowledgeEntries])

  // Get action badge
  const getActionBadge = (action: VersionAction) => {
    const config: Record<VersionAction, { label: string; className: string }> = {
      create: { label: '创建', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      update: { label: '更新', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      apply: { label: '应用', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      rollback: { label: '回滚', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      delete: { label: '删除', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    }
    const { label, className } = config[action]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  // Get source badge
  const getSourceBadge = (source: KnowledgeSource) => {
    const config: Record<KnowledgeSource, { label: string; icon: React.ReactNode; className: string }> = {
      session: { label: '会话', icon: <Clock className="h-3 w-3" />, className: 'bg-blue-100 text-blue-800' },
      feedback: { label: '反馈', icon: <User className="h-3 w-3" />, className: 'bg-yellow-100 text-yellow-800' },
      manual: { label: '手动', icon: <FileText className="h-3 w-3" />, className: 'bg-gray-100 text-gray-800' },
      auto: { label: '自动', icon: <Brain className="h-3 w-3" />, className: 'bg-purple-100 text-purple-800' },
    }
    const { label, icon, className } = config[source]
    return (
      <Badge variant="outline" className={className}>
        {icon}
        <span className="ml-1">{label}</span>
      </Badge>
    )
  }

  // Handle rollback
  const handleRollback = useCallback(() => {
    if (!versionToRollback) return
    setIsRollingBack(true)
    
    setTimeout(() => {
      setVersions(prev => prev.map(v => ({
        ...v,
        isActive: v.id === versionToRollback.id,
        isRollbackTarget: v.version < versionToRollback.version && v.id !== versionToRollback.id,
      })))
      
      // Add rollback record
      const newVersion: PromptVersion = {
        id: `ver-${Date.now()}`,
        version: stats.totalVersions + 1,
        content: versionToRollback.content,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
        action: 'rollback',
        description: `回滚到版本 ${versionToRollback.version}`,
        isActive: true,
        isRollbackTarget: false,
      }
      setVersions(prev => [newVersion, ...prev])
      
      setIsRollingBack(false)
      setRollbackConfirmOpen(false)
      setVersionToRollback(null)
    }, 800)
  }, [versionToRollback, stats.totalVersions])

  // Handle toggle writeback
  const handleToggleWriteback = useCallback(() => {
    setWritebackConfig(prev => ({
      ...prev,
      status: prev.status === 'enabled' ? 'disabled' : 'enabled',
    }))
  }, [])

  // Handle apply knowledge
  const handleApplyKnowledge = useCallback((entry: KnowledgeEntry) => {
    setKnowledgeEntries(prev => prev.map(k => 
      k.id === entry.id ? { ...k, applied: !k.applied } : k
    ))
  }, [])

  // View diff
  const handleViewDiff = useCallback((version: PromptVersion) => {
    setSelectedVersion(version)
    const currentIndex = versions.findIndex(v => v.id === version.id)
    if (currentIndex < versions.length - 1) {
      setCompareVersion(versions[currentIndex + 1])
    }
    setDiffDialogOpen(true)
  }, [versions])

  // Export version
  const handleExport = useCallback((version: PromptVersion) => {
    const data = {
      version: version.version,
      content: version.content,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-v${version.version}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">提示词版本管理</h2>
          <p className="text-muted-foreground">
            版本历史、回滚与会话知识积累写回控制
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalVersions}</div>
                <div className="text-xs text-muted-foreground">总版本数</div>
              </div>
              <GitBranch className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">v{stats.activeVersion}</div>
                <div className="text-xs text-muted-foreground">当前版本</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.knowledgeCount}</div>
                <div className="text-xs text-muted-foreground">知识条目</div>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.appliedKnowledge}</div>
                <div className="text-xs text-muted-foreground">已应用知识</div>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Version History */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  版本历史
                </h3>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        version.isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            v{version.version}
                          </span>
                          {getActionBadge(version.action)}
                          {version.isActive && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              当前
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleViewDiff(version)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>查看差异</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleExport(version)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>导出</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {!version.isActive && version.isRollbackTarget && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-orange-600 hover:text-orange-700"
                                    onClick={() => {
                                      setVersionToRollback(version)
                                      setRollbackConfirmOpen(true)
                                    }}
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>回滚到此版本</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{version.createdBy}</span>
                        </div>
                        {version.diff && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-green-600">
                              <Plus className="h-3 w-3" />
                              {version.diff.additions}
                            </span>
                            <span className="flex items-center gap-0.5 text-red-600">
                              <Minus className="h-3 w-3" />
                              {version.diff.deletions}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge & Writeback */}
        <div className="space-y-4">
          {/* Writeback Control */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  知识积累写回
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleWriteback}
                  className={writebackConfig.status === 'enabled' ? 'text-green-600' : 'text-gray-400'}
                >
                  {writebackConfig.status === 'enabled' ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                  <span className="ml-1">
                    {writebackConfig.status === 'enabled' ? '已启用' : '已禁用'}
                  </span>
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">自动应用</span>
                  <Badge variant={writebackConfig.autoApply ? 'default' : 'secondary'}>
                    {writebackConfig.autoApply ? '开启' : '关闭'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">最低置信度</span>
                  <span className="font-mono">{(writebackConfig.minConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">需要审批</span>
                  <Badge variant={writebackConfig.requireApproval ? 'default' : 'secondary'}>
                    {writebackConfig.requireApproval ? '是' : '否'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">目标知识库</span>
                  <span className="font-mono text-xs">{writebackConfig.targetKnowledgeBase}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Entries */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  知识条目
                </h3>
                <Badge variant="secondary">{knowledgeEntries.length} 条</Badge>
              </div>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {knowledgeEntries.map(entry => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        entry.applied 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {getSourceBadge(entry.source)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyKnowledge(entry)}
                          className={entry.applied ? 'text-green-600' : 'text-gray-400'}
                        >
                          {entry.applied ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              已应用
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-1" />
                              应用
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm mb-2">{entry.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="mx-1">·</span>
                        <span>会话 {entry.sessionId.slice(-6)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackConfirmOpen} onOpenChange={setRollbackConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认回滚</DialogTitle>
            <DialogDescription>
              确定要回滚到版本 {versionToRollback?.version} 吗？当前版本将被标记为历史版本。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">注意</p>
                <p>回滚操作会创建一个新的版本记录，原版本仍可查看和恢复。</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRollbackConfirmOpen(false)
              setVersionToRollback(null)
            }}>
              取消
            </Button>
            <Button onClick={handleRollback} disabled={isRollingBack}>
              {isRollingBack ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  回滚中...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  确认回滚
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff Dialog */}
      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>版本对比</DialogTitle>
            <DialogDescription>
              {selectedVersion && compareVersion ? (
                <>
                  对比版本 v{compareVersion.version} → v{selectedVersion.version}
                </>
              ) : (
                '版本详情'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">
                  v{compareVersion?.version || 'N/A'} (前一版本)
                </Badge>
              </div>
              <ScrollArea className="h-[400px] rounded border bg-muted p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {compareVersion?.content || '无内容'}
                </pre>
              </ScrollArea>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default">
                  v{selectedVersion?.version} (当前版本)
                </Badge>
                {selectedVersion?.diff && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 text-green-600">
                      <Plus className="h-3 w-3" />
                      {selectedVersion.diff.additions}
                    </span>
                    <span className="flex items-center gap-0.5 text-red-600">
                      <Minus className="h-3 w-3" />
                      {selectedVersion.diff.deletions}
                    </span>
                  </div>
                )}
              </div>
              <ScrollArea className="h-[400px] rounded border bg-muted p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedVersion?.content || '无内容'}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
