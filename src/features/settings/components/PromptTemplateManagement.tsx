import { useState, useMemo, useCallback } from 'react'
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Star,
  StarOff,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Tag,
  Layers,
  Shield,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
export type TemplateType = 'system' | 'department' | 'agent' | 'task' | 'custom'
export type TemplateScope = 'global' | 'department' | 'agent' | 'task'
export type TemplateStatus = 'active' | 'draft' | 'archived' | 'deprecated'
export type AssignmentTarget = 'agent' | 'department'
export type ExportFormat = 'json' | 'yaml' | 'markdown'

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array'
  description: string
  defaultValue?: string
  required: boolean
  enumValues?: string[]
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  type: TemplateType
  scope: TemplateScope
  status: TemplateStatus
  content: string
  variables: TemplateVariable[]
  tags: string[]
  version: number
  createdAt: string
  updatedAt: string
  createdBy: string
  isDefault: boolean
  assignments: TemplateAssignment[]
  usageCount: number
}

export interface TemplateAssignment {
  id: string
  templateId: string
  targetType: AssignmentTarget
  targetId: string
  targetName: string
  assignedAt: string
  assignedBy: string
  isActive: boolean
}

export interface TemplateCategory {
  id: TemplateType
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

export interface TemplateStats {
  total: number
  active: number
  draft: number
  archived: number
  defaultCount: number
  usageTotal: number
}

export interface TemplateManagementState {
  templates: PromptTemplate[]
  searchQuery: string
  filterType: TemplateType | 'all'
  filterScope: TemplateScope | 'all'
  filterStatus: TemplateStatus | 'all'
  selectedTemplate: PromptTemplate | null
  editDialogOpen: boolean
  assignDialogOpen: boolean
  importDialogOpen: boolean
  isLoading: boolean
}

export interface PromptTemplateManagementProps {
  className?: string
}

// Category configuration
const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'system',
    name: '系统模板',
    description: '系统内置模板，不可删除',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    id: 'department',
    name: '部门模板',
    description: '部门级模板，适用于特定部门',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    id: 'agent',
    name: 'Agent模板',
    description: 'Agent级模板，适用于特定Agent',
    icon: <Tag className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  {
    id: 'task',
    name: '任务模板',
    description: '任务级模板，适用于特定任务类型',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  {
    id: 'custom',
    name: '自定义模板',
    description: '用户自定义模板',
    icon: <Edit className="h-4 w-4" />,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  },
]

// Scope configuration
const SCOPE_CONFIG: Record<TemplateScope, { name: string; description: string }> = {
  global: { name: '全局', description: '适用于所有范围' },
  department: { name: '部门', description: '仅适用于特定部门' },
  agent: { name: 'Agent', description: '仅适用于特定Agent' },
  task: { name: '任务', description: '仅适用于特定任务类型' },
}

// Mock data
const createMockTemplates = (): PromptTemplate[] => [
  {
    id: 'tpl-001',
    name: '默认系统提示词',
    description: 'AI助手默认系统提示词模板，包含核心身份定义和行为准则',
    type: 'system',
    scope: 'global',
    status: 'active',
    content: `你是 AI-Automated-Office 系统的智能助手。

## 核心价值观
- 以用户为中心
- 保持透明可控
- 尊重隐私安全

{{agent_name}} - 你的身份标识
{{user_name}} - 当前用户名称`,
    variables: [
      { name: 'agent_name', type: 'string', description: 'Agent名称', required: true },
      { name: 'user_name', type: 'string', description: '用户名称', required: false },
    ],
    tags: ['系统', '核心', '默认'],
    version: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    createdBy: 'system',
    isDefault: true,
    assignments: [
      { id: 'asg-001', templateId: 'tpl-001', targetType: 'agent', targetId: 'agent-default', targetName: '默认Agent', assignedAt: '2026-01-01T00:00:00Z', assignedBy: 'system', isActive: true },
    ],
    usageCount: 1500,
  },
  {
    id: 'tpl-002',
    name: '人事部门专用模板',
    description: '人事部AI助手的专用提示词模板，包含HR相关知识和工具',
    type: 'department',
    scope: 'department',
    status: 'active',
    content: `你是人事部门的AI助手。

## 专业领域
- 员工入职/离职管理
- 薪资核算
- 绩效考核
- 培训发展

{{department_name}} - 当前部门
{{employee_count}} - 员工总数`,
    variables: [
      { name: 'department_name', type: 'string', description: '部门名称', required: true },
      { name: 'employee_count', type: 'number', description: '员工数量', required: false },
    ],
    tags: ['人事', 'HR', '部门'],
    version: 2,
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-18T14:30:00Z',
    createdBy: 'admin@example.com',
    isDefault: false,
    assignments: [
      { id: 'asg-002', templateId: 'tpl-002', targetType: 'department', targetId: 'dept-hr', targetName: '人事部', assignedAt: '2026-02-15T08:00:00Z', assignedBy: 'admin@example.com', isActive: true },
    ],
    usageCount: 320,
  },
  {
    id: 'tpl-003',
    name: '销售助手模板',
    description: '销售部AI助手专用模板，支持销售流程和客户管理',
    type: 'agent',
    scope: 'agent',
    status: 'active',
    content: `你是销售部门的AI助手。

## 核心能力
- 客户关系管理
- 销售机会跟踪
- 合同起草
- 数据分析

{{sales_target}} - 销售目标
{{pipeline_stage}} - 销售阶段`,
    variables: [
      { name: 'sales_target', type: 'string', description: '销售目标', required: false },
      { name: 'pipeline_stage', type: 'enum', description: '销售阶段', required: false, enumValues: ['线索', '机会', '报价', '谈判', '成交'] },
    ],
    tags: ['销售', 'CRM', '客户'],
    version: 1,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
    createdBy: 'sales@example.com',
    isDefault: false,
    assignments: [
      { id: 'asg-003', templateId: 'tpl-003', targetType: 'agent', targetId: 'agent-sales', targetName: '销售助手', assignedAt: '2026-03-01T09:00:00Z', assignedBy: 'sales@example.com', isActive: true },
    ],
    usageCount: 180,
  },
  {
    id: 'tpl-004',
    name: '财务报表生成模板',
    description: '财务报表生成任务的专用模板',
    type: 'task',
    scope: 'task',
    status: 'draft',
    content: `你需要生成财务报表。

## 报表类型
{{report_type}}

## 时间范围
{{date_range}}

## 输出格式
{{output_format}}`,
    variables: [
      { name: 'report_type', type: 'enum', description: '报表类型', required: true, enumValues: ['资产负债表', '利润表', '现金流量表'] },
      { name: 'date_range', type: 'string', description: '时间范围', required: true },
      { name: 'output_format', type: 'enum', description: '输出格式', required: false, enumValues: ['PDF', 'Excel', 'HTML'] },
    ],
    tags: ['财务', '报表', '生成'],
    version: 1,
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    createdBy: 'finance@example.com',
    isDefault: false,
    assignments: [],
    usageCount: 0,
  },
]

export function PromptTemplateManagement({ className = '' }: PromptTemplateManagementProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(createMockTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<TemplateType | 'all'>('all')
  const [filterScope, setFilterScope] = useState<TemplateScope | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<PromptTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [importContent, setImportContent] = useState('')

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: 'custom' as TemplateType,
    scope: 'global' as TemplateScope,
    content: '',
    tags: '',
  })

  // Assign form state
  const [assignForm, setAssignForm] = useState({
    targetType: 'agent' as AssignmentTarget,
    targetId: '',
    setAsDefault: false,
  })

  // Stats
  const stats = useMemo<TemplateStats>(() => ({
    total: templates.length,
    active: templates.filter(t => t.status === 'active').length,
    draft: templates.filter(t => t.status === 'draft').length,
    archived: templates.filter(t => t.status === 'archived').length,
    defaultCount: templates.filter(t => t.isDefault).length,
    usageTotal: templates.reduce((sum, t) => sum + t.usageCount, 0),
  }), [templates])

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesType = filterType === 'all' || template.type === filterType
      const matchesScope = filterScope === 'all' || template.scope === filterScope
      const matchesStatus = filterStatus === 'all' || template.status === filterStatus

      return matchesSearch && matchesType && matchesScope && matchesStatus
    })
  }, [templates, searchQuery, filterType, filterScope, filterStatus])

  // Get category info
  const getCategory = useCallback((type: TemplateType): TemplateCategory => {
    return TEMPLATE_CATEGORIES.find(c => c.id === type) || TEMPLATE_CATEGORIES[4]
  }, [])

  // Handle create new template
  const handleCreate = useCallback(() => {
    setSelectedTemplate(null)
    setEditForm({
      name: '',
      description: '',
      type: 'custom',
      scope: 'global',
      content: '',
      tags: '',
    })
    setEditDialogOpen(true)
  }, [])

  // Handle edit template
  const handleEdit = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      description: template.description,
      type: template.type,
      scope: template.scope,
      content: template.content,
      tags: template.tags.join(', '),
    })
    setEditDialogOpen(true)
  }, [])

  // Handle save template
  const handleSave = useCallback(() => {
    setIsSaving(true)
    
    setTimeout(() => {
      if (selectedTemplate) {
        // Update existing
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplate.id
            ? {
                ...t,
                name: editForm.name,
                description: editForm.description,
                type: editForm.type,
                scope: editForm.scope,
                content: editForm.content,
                tags: editForm.tags.split(',').map(s => s.trim()).filter(Boolean),
                updatedAt: new Date().toISOString(),
                version: t.version + 1,
              }
            : t
        ))
      } else {
        // Create new
        const newTemplate: PromptTemplate = {
          id: `tpl-${Date.now()}`,
          name: editForm.name,
          description: editForm.description,
          type: editForm.type,
          scope: editForm.scope,
          status: 'draft',
          content: editForm.content,
          variables: [],
          tags: editForm.tags.split(',').map(s => s.trim()).filter(Boolean),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'current-user',
          isDefault: false,
          assignments: [],
          usageCount: 0,
        }
        setTemplates(prev => [...prev, newTemplate])
      }
      
      setIsSaving(false)
      setEditDialogOpen(false)
    }, 500)
  }, [selectedTemplate, editForm])

  // Handle duplicate
  const handleDuplicate = useCallback((template: PromptTemplate) => {
    const duplicated: PromptTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (副本)`,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      isDefault: false,
      assignments: [],
      usageCount: 0,
    }
    setTemplates(prev => [...prev, duplicated])
  }, [])

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!templateToDelete) return
    
    if (templateToDelete.type === 'system') {
      // Cannot delete system templates
      return
    }
    
    setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
    setDeleteConfirmOpen(false)
    setTemplateToDelete(null)
  }, [templateToDelete])

  // Handle set default
  const handleSetDefault = useCallback((template: PromptTemplate) => {
    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefault: t.id === template.id ? !t.isDefault : (t.scope === template.scope ? false : t.isDefault),
    })))
  }, [])

  // Handle assign
  const handleAssign = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template)
    setAssignForm({
      targetType: 'agent',
      targetId: '',
      setAsDefault: false,
    })
    setAssignDialogOpen(true)
  }, [])

  // Handle save assignment
  const handleSaveAssignment = useCallback(() => {
    if (!selectedTemplate || !assignForm.targetId) return
    
    const newAssignment: TemplateAssignment = {
      id: `asg-${Date.now()}`,
      templateId: selectedTemplate.id,
      targetType: assignForm.targetType,
      targetId: assignForm.targetId,
      targetName: assignForm.targetType === 'agent' ? '新Agent' : '新部门',
      assignedAt: new Date().toISOString(),
      assignedBy: 'current-user',
      isActive: true,
    }
    
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id
        ? {
            ...t,
            assignments: [...t.assignments, newAssignment],
            isDefault: assignForm.setAsDefault || t.isDefault,
          }
        : t
    ))
    
    setAssignDialogOpen(false)
  }, [selectedTemplate, assignForm])

  // Handle export
  const handleExport = useCallback((template: PromptTemplate) => {
    const exportData = JSON.stringify(template, null, 2)
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Handle import
  const handleImport = useCallback(() => {
    try {
      const imported = JSON.parse(importContent) as PromptTemplate
      const newTemplate: PromptTemplate = {
        ...imported,
        id: `tpl-${Date.now()}`,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
        isDefault: false,
        assignments: [],
        usageCount: 0,
      }
      setTemplates(prev => [...prev, newTemplate])
      setImportDialogOpen(false)
      setImportContent('')
    } catch {
      // Handle parse error
    }
  }, [importContent])

  // Render status badge
  const renderStatusBadge = (status: TemplateStatus) => {
    const config: Record<TemplateStatus, { label: string; className: string }> = {
      active: { label: '活跃', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      draft: { label: '草稿', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      archived: { label: '已归档', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      deprecated: { label: '已弃用', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">提示词模板管理</h2>
          <p className="text-muted-foreground">
            管理内置和自定义提示词模板，支持CRUD操作和默认分配
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建模板
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总模板数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">活跃</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-xs text-muted-foreground">草稿</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <div className="text-xs text-muted-foreground">已归档</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{stats.defaultCount}</div>
            <div className="text-xs text-muted-foreground">默认模板</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.usageTotal}</div>
            <div className="text-xs text-muted-foreground">总使用次数</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索模板名称、描述或标签..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as TemplateType | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterScope} onValueChange={(v) => setFilterScope(v as TemplateScope | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部范围</SelectItem>
                {Object.entries(SCOPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TemplateStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
                <SelectItem value="deprecated">已弃用</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery('')
              setFilterType('all')
              setFilterScope('all')
              setFilterStatus('all')
            }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template List */}
      <div className="space-y-3">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">没有找到匹配的模板</p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => {
            const category = getCategory(template.type)
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={category.color}>
                          {category.icon}
                          <span className="ml-1">{category.name}</span>
                        </Badge>
                        {renderStatusBadge(template.status)}
                        {template.isDefault && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                            默认
                          </Badge>
                        )}
                        <Badge variant="outline">v{template.version}</Badge>
                      </div>
                      <h3 className="font-medium truncate">{template.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          <span>{SCOPE_CONFIG[template.scope].name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{template.usageCount} 次使用</span>
                        </div>
                        {template.assignments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span>{template.assignments.length} 个分配</span>
                          </div>
                        )}
                      </div>
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefault(template)}
                              disabled={template.type === 'system'}
                            >
                              {template.isDefault ? (
                                <StarOff className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {template.isDefault ? '取消默认' : '设为默认'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            复制
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAssign(template)}>
                            <Tag className="h-4 w-4 mr-2" />
                            分配
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(template)}>
                            <Download className="h-4 w-4 mr-2" />
                            导出
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {template.type !== 'system' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setTemplateToDelete(template)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? '编辑模板' : '新建模板'}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? '修改现有模板内容' : '创建新的提示词模板'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">模板名称</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入模板名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">模板类型</Label>
                  <Select 
                    value={editForm.type} 
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, type: v as TemplateType }))}
                    disabled={selectedTemplate?.type === 'system'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.filter(c => c.id !== 'system' || selectedTemplate?.type === 'system').map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入模板描述"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scope">适用范围</Label>
                  <Select 
                    value={editForm.scope} 
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, scope: v as TemplateScope }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCOPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">标签 (逗号分隔)</Label>
                  <Input
                    id="tags"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="标签1, 标签2, 标签3"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">模板内容</Label>
                <Textarea
                  id="content"
                  className="min-h-[300px] font-mono text-sm"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="输入提示词模板内容，支持 {{variable}} 格式的变量"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editForm.name}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配模板</DialogTitle>
            <DialogDescription>
              将模板分配给Agent或部门
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分配目标类型</Label>
              <Select 
                value={assignForm.targetType} 
                onValueChange={(v) => setAssignForm(prev => ({ ...prev, targetType: v as AssignmentTarget }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="department">部门</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>选择{assignForm.targetType === 'agent' ? 'Agent' : '部门'}</Label>
              <Select 
                value={assignForm.targetId} 
                onValueChange={(v) => setAssignForm(prev => ({ ...prev, targetId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`选择${assignForm.targetType === 'agent' ? 'Agent' : '部门'}`} />
                </SelectTrigger>
                <SelectContent>
                  {assignForm.targetType === 'agent' ? (
                    <>
                      <SelectItem value="agent-default">默认Agent</SelectItem>
                      <SelectItem value="agent-sales">销售助手</SelectItem>
                      <SelectItem value="agent-hr">人事助手</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="dept-hr">人事部</SelectItem>
                      <SelectItem value="dept-sales">销售部</SelectItem>
                      <SelectItem value="dept-finance">财务部</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="setAsDefault"
                checked={assignForm.setAsDefault}
                onChange={(e) => setAssignForm(prev => ({ ...prev, setAsDefault: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="setAsDefault" className="text-sm">
                同时设为该范围的默认模板
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveAssignment} disabled={!assignForm.targetId}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入模板</DialogTitle>
            <DialogDescription>
              从JSON文件导入提示词模板
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>模板内容 (JSON)</Label>
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                placeholder="粘贴JSON格式的模板内容..."
                onChange={(e) => {
                  setImportContent(e.target.value)
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除模板 "{templateToDelete?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteConfirmOpen(false)
              setTemplateToDelete(null)
            }}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
