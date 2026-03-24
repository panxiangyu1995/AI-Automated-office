import { useState, useMemo, useCallback } from 'react'
import {
  Code2,
  Layers,
  Tag,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Info,
  Variable,
  FileText,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type PromptLayer = 'L1' | 'L2' | 'L3'
export type PromptSource = 'identity' | 'persona' | 'runtime' | 'session' | 'user' | 'system'
export type PromptStatus = 'active' | 'draft' | 'archived' | 'error'
export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'enum'
export type ApplyStatus = 'idle' | 'validating' | 'applying' | 'success' | 'failed'

export interface PromptVariable {
  name: string
  type: VariableType
  description: string
  defaultValue?: string
  required: boolean
  enumValues?: string[]
}

export interface PromptSourceLabel {
  source: PromptSource
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

export interface PromptLayerContent {
  layer: PromptLayer
  name: string
  description: string
  sources: PromptSource[]
  content: string
  variables: PromptVariable[]
  lastModified: string
  version: number
}

export interface PromptAuditEntry {
  id: string
  timestamp: string
  actor: string
  action: 'create' | 'update' | 'apply' | 'rollback' | 'preview'
  layer: PromptLayer
  changes: {
    field: string
    before: string
    after: string
  }[]
  status: 'success' | 'failed' | 'pending'
  applyResult?: string
}

export interface PromptEditorState {
  layers: PromptLayerContent[]
  activeLayer: PromptLayer
  editedContent: string
  selectedVariables: PromptVariable[]
  applyStatus: ApplyStatus
  applyError?: string
  hasUnsavedChanges: boolean
  previewMode: boolean
}

export interface SystemPromptEditorProps {
  className?: string
}

// Source labels configuration
const SOURCE_LABELS: PromptSourceLabel[] = [
  {
    source: 'identity',
    label: '身份层',
    description: '来自 SOUL.md 和 AGENT.md',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    source: 'persona',
    label: '角色层',
    description: '来自 Persona 定义',
    icon: <Tag className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    source: 'runtime',
    label: '运行时层',
    description: '来自系统运行时配置',
    icon: <Code2 className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  {
    source: 'session',
    label: '会话层',
    description: '来自当前会话上下文',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  {
    source: 'user',
    label: '用户层',
    description: '来自用户自定义配置',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  },
  {
    source: 'system',
    label: '系统层',
    description: '来自系统默认配置',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
]

// Layer descriptions
const LAYER_INFO: Record<PromptLayer, { name: string; description: string }> = {
  L1: {
    name: 'L1 - 身份层',
    description: '核心身份定义，包含 Agent 的基本价值观、行为准则和核心约束',
  },
  L2: {
    name: 'L2 - 角色层',
    description: '角色特化定义，包含特定角色的技能、工具和任务上下文',
  },
  L3: {
    name: 'L3 - 运行时层',
    description: '运行时上下文，包含会话状态、记忆注入和动态工具绑定',
  },
}

// Mock data for demonstration
const createMockLayers = (): PromptLayerContent[] => [
  {
    layer: 'L1',
    name: '身份层',
    description: '核心身份定义',
    sources: ['identity', 'system'],
    content: `你是 AI-Automated-Office 系统的智能助手。

## 核心价值观
- 以用户为中心，提供高效、准确的协助
- 保持透明，解释推理过程
- 尊重隐私，保护用户数据安全

## 行为准则
1. 始终使用 UTF-8 编码
2. 遵循项目铁律文档（PRD、架构、UX、Epic）
3. 使用 Shadcn/ui 组件和 Lucide React 图标
4. 品牌色使用 #1E3A5F

{{agent_name}} - 你的身份标识
{{user_name}} - 当前用户名称`,
    variables: [
      { name: 'agent_name', type: 'string', description: 'Agent 名称', required: true },
      { name: 'user_name', type: 'string', description: '用户名称', required: false },
    ],
    lastModified: '2026-03-24T10:00:00Z',
    version: 5,
  },
  {
    layer: 'L2',
    name: '角色层',
    description: '角色特化定义',
    sources: ['persona', 'runtime'],
    content: `当前角色：{{current_role}}

## 可用工具
{{available_tools}}

## 部门模块
{{department_modules}}

## 权限范围
- 可访问部门：{{accessible_departments}}
- 数据权限：{{data_permissions}}`,
    variables: [
      { name: 'current_role', type: 'string', description: '当前角色', required: true },
      { name: 'available_tools', type: 'string', description: '可用工具列表', required: true },
      { name: 'department_modules', type: 'string', description: '部门模块列表', required: false },
      { name: 'accessible_departments', type: 'string', description: '可访问部门', required: true },
      { name: 'data_permissions', type: 'string', description: '数据权限级别', required: true },
    ],
    lastModified: '2026-03-24T09:30:00Z',
    version: 3,
  },
  {
    layer: 'L3',
    name: '运行时层',
    description: '运行时上下文',
    sources: ['session', 'runtime'],
    content: `## 会话信息
- 会话 ID：{{session_id}}
- 开始时间：{{session_start}}
- 当前任务：{{current_task}}

## 上下文记忆
{{context_memory}}

## 最近交互
{{recent_interactions}}

## 动态工具状态
{{tool_states}}`,
    variables: [
      { name: 'session_id', type: 'string', description: '会话唯一标识', required: true },
      { name: 'session_start', type: 'date', description: '会话开始时间', required: true },
      { name: 'current_task', type: 'string', description: '当前任务描述', required: false },
      { name: 'context_memory', type: 'string', description: '上下文记忆', required: false },
      { name: 'recent_interactions', type: 'string', description: '最近交互记录', required: false },
      { name: 'tool_states', type: 'string', description: '工具状态快照', required: false },
    ],
    lastModified: '2026-03-24T10:30:00Z',
    version: 12,
  },
]

const createMockAuditEntries = (): PromptAuditEntry[] => [
  {
    id: 'audit-001',
    timestamp: '2026-03-24T10:30:00Z',
    actor: 'admin@example.com',
    action: 'apply',
    layer: 'L3',
    changes: [{ field: 'content', before: '旧内容...', after: '新内容...' }],
    status: 'success',
    applyResult: '运行时已更新，版本从 11 升级到 12',
  },
  {
    id: 'audit-002',
    timestamp: '2026-03-24T09:30:00Z',
    actor: 'developer@example.com',
    action: 'update',
    layer: 'L2',
    changes: [{ field: 'variables', before: '4 个变量', after: '5 个变量' }],
    status: 'success',
  },
  {
    id: 'audit-003',
    timestamp: '2026-03-24T08:00:00Z',
    actor: 'admin@example.com',
    action: 'rollback',
    layer: 'L1',
    changes: [{ field: 'version', before: '6', after: '5' }],
    status: 'success',
    applyResult: '已回滚到版本 5',
  },
]

export function SystemPromptEditor({ className = '' }: SystemPromptEditorProps) {
  const [layers, setLayers] = useState<PromptLayerContent[]>(createMockLayers)
  const [activeLayer, setActiveLayer] = useState<PromptLayer>('L1')
  const [editedContent, setEditedContent] = useState('')
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [auditEntries] = useState<PromptAuditEntry[]>(createMockAuditEntries)
  const [showAuditDialog, setShowAuditDialog] = useState(false)
  const [expandedLayers, setExpandedLayers] = useState<Set<PromptLayer>>(new Set(['L1']))
  const [showFullPreview, setShowFullPreview] = useState(false)

  // Get source label by source type
  const getSourceLabel = useCallback((source: PromptSource): PromptSourceLabel => {
    return SOURCE_LABELS.find(s => s.source === source) || SOURCE_LABELS[5]
  }, [])

  // Extract variables from content
  const extractVariables = useCallback((content: string): string[] => {
    const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
    const matches: string[] = []
    let match
    while ((match = regex.exec(content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1])
      }
    }
    return matches
  }, [])

  // Handle content edit
  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value)
    setHasUnsavedChanges(true)
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    setApplyStatus('validating')
    
    // Simulate validation
    setTimeout(() => {
      setApplyStatus('applying')
      
      // Simulate apply
      setTimeout(() => {
        setLayers(prev => prev.map(l => 
          l.layer === activeLayer 
            ? { ...l, content: editedContent, version: l.version + 1, lastModified: new Date().toISOString() }
            : l
        ))
        setApplyStatus('success')
        setHasUnsavedChanges(false)
        
        setTimeout(() => setApplyStatus('idle'), 2000)
      }, 500)
    }, 300)
  }, [activeLayer, editedContent])

  // Handle rollback
  const handleRollback = useCallback((layer: PromptLayer, targetVersion: number) => {
    setApplyStatus('applying')
    
    // Simulate rollback
    setTimeout(() => {
      setLayers(prev => prev.map(l => 
        l.layer === layer 
          ? { ...l, version: targetVersion }
          : l
      ))
      setApplyStatus('success')
      setTimeout(() => setApplyStatus('idle'), 2000)
    }, 500)
  }, [])

  // Toggle layer expansion
  const toggleLayerExpansion = useCallback((layer: PromptLayer) => {
    setExpandedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) {
        next.delete(layer)
      } else {
        next.add(layer)
      }
      return next
    })
  }, [])

  // Get full prompt preview (all layers combined)
  const fullPromptPreview = useMemo(() => {
    return layers.map(l => 
      `# ${LAYER_INFO[l.layer].name}\n\n${l.content}`
    ).join('\n\n---\n\n')
  }, [layers])

  // Render source badges
  const renderSourceBadges = (sources: PromptSource[]) => {
    return (
      <div className="flex flex-wrap gap-1.5">
        {sources.map(source => {
          const label = getSourceLabel(source)
          return (
            <TooltipProvider key={source}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`${label.color} text-xs`}>
                    {label.icon}
                    <span className="ml-1">{label.label}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{label.label}</p>
                  <p className="text-xs text-muted-foreground">{label.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    )
  }

  // Render variable list
  const renderVariables = (variables: PromptVariable[]) => {
    if (variables.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Variable className="h-4 w-4" />
          <span>变量定义 ({variables.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {variables.map(v => (
            <div 
              key={v.name} 
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
            >
              <code className="text-primary font-mono">{'{{' + v.name + '}}'}</code>
              <span className="text-muted-foreground text-xs">{v.type}</span>
              {v.required && (
                <Badge variant="outline" className="text-xs h-5 px-1">必填</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">系统提示词编辑器</h2>
          <p className="text-muted-foreground">
            编辑和管理分层系统提示词，支持变量注入和治理溯源
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            完整预览
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuditDialog(true)}
          >
            <History className="h-4 w-4 mr-2" />
            审计日志
          </Button>
        </div>
      </div>

      {/* Layer Tabs */}
      <Tabs value={activeLayer} onValueChange={(v) => setActiveLayer(v as PromptLayer)}>
        <TabsList className="grid w-full grid-cols-3">
          {(['L1', 'L2', 'L3'] as PromptLayer[]).map(layer => (
            <TabsTrigger key={layer} value={layer} className="relative">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>{LAYER_INFO[layer].name}</span>
                <Badge variant="secondary" className="ml-1">
                  v{layers.find(l => l.layer === layer)?.version || 0}
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {(['L1', 'L2', 'L3'] as PromptLayer[]).map(layer => {
          const layerData = layers.find(l => l.layer === layer)
          if (!layerData) return null

          return (
            <TabsContent key={layer} value={layer} className="space-y-4">
              {/* Layer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      {LAYER_INFO[layer].name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>最后修改: {new Date(layerData.lastModified).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {LAYER_INFO[layer].description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Source Labels */}
                  <div>
                    <div className="text-sm font-medium mb-2">来源标签</div>
                    {renderSourceBadges(layerData.sources)}
                  </div>

                  {/* Variables */}
                  {renderVariables(layerData.variables)}

                  {/* Content Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt-content">提示词内容</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                        >
                          {previewMode ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              编辑模式
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              预览模式
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(
                            layer === activeLayer && editedContent 
                              ? editedContent 
                              : layerData.content
                          )}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          复制
                        </Button>
                      </div>
                    </div>
                    {previewMode ? (
                      <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/30">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {layer === activeLayer && editedContent 
                            ? editedContent 
                            : layerData.content}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <Textarea
                        id="prompt-content"
                        placeholder="输入提示词内容..."
                        className="min-h-[300px] font-mono text-sm"
                        value={layer === activeLayer && editedContent 
                          ? editedContent 
                          : layerData.content}
                        onChange={(e) => {
                          setActiveLayer(layer)
                          handleContentChange(e.target.value)
                        }}
                      />
                    )}
                    {/* Variable hints in editor */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">可用变量:</span>
                      {extractVariables(layer === activeLayer && editedContent 
                        ? editedContent 
                        : layerData.content
                      ).map(v => (
                        <code 
                          key={v} 
                          className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${v}}}`)
                          }}
                        >
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {hasUnsavedChanges && layer === activeLayer && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          未保存更改
                        </Badge>
                      )}
                      {applyStatus === 'success' && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          已应用
                        </Badge>
                      )}
                      {applyStatus === 'failed' && (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          应用失败
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(layer, layerData.version - 1)}
                        disabled={layerData.version <= 1}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        回滚
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || layer !== activeLayer || applyStatus === 'validating' || applyStatus === 'applying'}
                      >
                        {(applyStatus === 'validating' || applyStatus === 'applying') ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {applyStatus === 'validating' ? '验证中...' : '应用中...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            保存并应用
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Layer Composition View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            分层加载结构
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            查看各层的加载顺序和组合关系
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {layers.map((layer, index) => (
              <div key={layer.layer}>
                <div 
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleLayerExpansion(layer.layer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{LAYER_INFO[layer.layer].name}</div>
                      <div className="text-sm text-muted-foreground">
                        {layer.sources.map(s => getSourceLabel(s).label).join(' + ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{layer.version}</Badge>
                    <Badge variant="outline">{layer.variables.length} 变量</Badge>
                    {expandedLayers.has(layer.layer) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedLayers.has(layer.layer) && (
                  <div className="mt-2 ml-11 p-3 rounded-lg bg-muted/30 text-sm">
                    <div className="mb-2 text-muted-foreground">
                      {LAYER_INFO[layer.layer].description}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">来源:</div>
                      {layer.sources.map(source => {
                        const label = getSourceLabel(source)
                        return (
                          <div key={source} className="flex items-center gap-2 text-xs">
                            {label.icon}
                            <span>{label.label}</span>
                            <span className="text-muted-foreground">- {label.description}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Loading Flow Visualization */}
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <RefreshCw className="h-4 w-4" />
              <span>加载流程</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span className="mt-1 text-xs">L1 身份</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="mt-1 text-xs">L2 角色</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <span className="mt-1 text-xs">L3 运行时</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <span className="mt-1 text-xs">完整提示词</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>完整提示词预览</DialogTitle>
            <DialogDescription>
              所有层级的提示词组合后的完整内容
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-sm whitespace-pre-wrap font-mono p-4 bg-muted/30 rounded-lg">
              {fullPromptPreview}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(fullPromptPreview)}
            >
              <Copy className="h-4 w-4 mr-2" />
              复制全部
            </Button>
            <Button onClick={() => setShowFullPreview(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>审计日志</DialogTitle>
            <DialogDescription>
              提示词变更历史记录，支持治理溯源
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-3 p-1">
              {auditEntries.map(entry => (
                <div 
                  key={entry.id}
                  className="p-3 rounded-lg border text-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.status === 'success' ? 'default' : entry.status === 'failed' ? 'destructive' : 'secondary'}>
                        {entry.action === 'create' && '创建'}
                        {entry.action === 'update' && '更新'}
                        {entry.action === 'apply' && '应用'}
                        {entry.action === 'rollback' && '回滚'}
                        {entry.action === 'preview' && '预览'}
                      </Badge>
                      <Badge variant="outline">{entry.layer}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <span>操作者:</span>
                    <span className="font-medium text-foreground">{entry.actor}</span>
                  </div>
                  {entry.changes.length > 0 && (
                    <div className="space-y-1">
                      {entry.changes.map((change, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground w-16">{change.field}:</span>
                          <code className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-1 rounded line-through">
                            {change.before}
                          </code>
                          <span className="text-muted-foreground">→</span>
                          <code className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-1 rounded">
                            {change.after}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                  {entry.applyResult && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <Info className="h-3 w-3 inline mr-1" />
                      {entry.applyResult}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowAuditDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ArrowRight component for flow diagram
const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)
