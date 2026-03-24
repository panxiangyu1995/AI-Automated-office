import { useState, useCallback } from 'react'
import {
  Plus,
  FileText,
  CheckCircle2,
  Trash2,
  Save,
  X,
  HelpCircle,
  GripVertical,
  Zap,
  Shield,
  Clock,
  Layers,
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
import { Separator } from '@/components/ui/separator'

// Types
export type RuleCategory = 'identity' | 'behavior' | 'safety' | 'output' | 'tool' | 'memory'
export type RulePriority = 'critical' | 'high' | 'medium' | 'low'
export type ConditionOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'exists'
export type ConditionType = 'intent' | 'entity' | 'context' | 'tool' | 'user' | 'time'
export type LogicalOperator = 'and' | 'or'

export interface RuleCondition {
  id: string
  type: ConditionType
  field: string
  operator: ConditionOperator
  value: string
  description?: string
}

export interface RuleConditionGroup {
  id: string
  operator: LogicalOperator
  conditions: RuleCondition[]
  groups?: RuleConditionGroup[]
}

export interface CustomRule {
  id: string
  name: string
  description: string
  category: RuleCategory
  priority: RulePriority
  content: string
  conditions: RuleConditionGroup | null
  tags: string[]
  appliesTo: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CustomRuleAdditionProps {
  className?: string
}

// Category options
const CATEGORY_OPTIONS: { value: RuleCategory; label: string; description: string }[] = [
  { value: 'identity', label: '身份规则', description: '定义 AI 的身份和角色' },
  { value: 'behavior', label: '行为规则', description: '控制 AI 的行为模式' },
  { value: 'safety', label: '安全规则', description: '确保操作安全性' },
  { value: 'output', label: '输出规则', description: '控制输出格式和内容' },
  { value: 'tool', label: '工具规则', description: '工具调用和执行规则' },
  { value: 'memory', label: '记忆规则', description: '记忆存储和检索规则' },
]

// Priority options
const PRIORITY_OPTIONS: { value: RulePriority; label: string; color: string }[] = [
  { value: 'critical', label: '关键', color: 'bg-red-500 text-white' },
  { value: 'high', label: '高', color: 'bg-orange-500 text-white' },
  { value: 'medium', label: '中', color: 'bg-yellow-500 text-white' },
  { value: 'low', label: '低', color: 'bg-gray-500 text-white' },
]

// Condition type options
const CONDITION_TYPE_OPTIONS: { value: ConditionType; label: string; icon: React.ReactNode }[] = [
  { value: 'intent', label: '意图', icon: <Zap className="h-3 w-3" /> },
  { value: 'entity', label: '实体', icon: <FileText className="h-3 w-3" /> },
  { value: 'context', label: '上下文', icon: <Layers className="h-3 w-3" /> },
  { value: 'tool', label: '工具', icon: <Shield className="h-3 w-3" /> },
  { value: 'user', label: '用户', icon: <HelpCircle className="h-3 w-3" /> },
  { value: 'time', label: '时间', icon: <Clock className="h-3 w-3" /> },
]

// Operator options
const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: '等于' },
  { value: 'contains', label: '包含' },
  { value: 'startsWith', label: '开头为' },
  { value: 'endsWith', label: '结尾为' },
  { value: 'matches', label: '匹配正则' },
  { value: 'exists', label: '存在' },
]

// Create empty condition
const createEmptyCondition = (): RuleCondition => ({
  id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: 'intent',
  field: '',
  operator: 'equals',
  value: '',
})

// Create empty condition group
const createEmptyConditionGroup = (): RuleConditionGroup => ({
  id: `group-${Date.now()}`,
  operator: 'and',
  conditions: [createEmptyCondition()],
})

export function CustomRuleAddition({ className = '' }: CustomRuleAdditionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedRules, setSavedRules] = useState<CustomRule[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'behavior' as RuleCategory,
    priority: 'medium' as RulePriority,
    content: '',
    tags: '',
    appliesTo: '',
    hasConditions: false,
  })
  
  const [conditionGroup, setConditionGroup] = useState<RuleConditionGroup | null>(null)

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      category: 'behavior',
      priority: 'medium',
      content: '',
      tags: '',
      appliesTo: '',
      hasConditions: false,
    })
    setConditionGroup(null)
  }, [])

  // Open dialog
  const handleOpen = useCallback(() => {
    resetForm()
    setIsOpen(true)
  }, [resetForm])

  // Handle form change
  const handleFormChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Add condition
  const handleAddCondition = useCallback(() => {
    if (!conditionGroup) {
      setConditionGroup(createEmptyConditionGroup())
    } else {
      setConditionGroup({
        ...conditionGroup,
        conditions: [...conditionGroup.conditions, createEmptyCondition()],
      })
    }
  }, [conditionGroup])

  // Remove condition
  const handleRemoveCondition = useCallback((conditionId: string) => {
    if (!conditionGroup) return
    setConditionGroup({
      ...conditionGroup,
      conditions: conditionGroup.conditions.filter(c => c.id !== conditionId),
    })
  }, [conditionGroup])

  // Update condition
  const handleUpdateCondition = useCallback((conditionId: string, field: keyof RuleCondition, value: string) => {
    if (!conditionGroup) return
    setConditionGroup({
      ...conditionGroup,
      conditions: conditionGroup.conditions.map(c =>
        c.id === conditionId ? { ...c, [field]: value } : c
      ),
    })
  }, [conditionGroup])

  // Toggle logical operator
  const handleToggleOperator = useCallback(() => {
    if (!conditionGroup) return
    setConditionGroup({
      ...conditionGroup,
      operator: conditionGroup.operator === 'and' ? 'or' : 'and',
    })
  }, [conditionGroup])

  // Validate form
  const isFormValid = formData.name.trim() !== '' && formData.content.trim() !== ''

  // Save rule
  const handleSave = useCallback(() => {
    if (!isFormValid) return
    
    setIsSaving(true)
    
    setTimeout(() => {
      const newRule: CustomRule = {
        id: `rule-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        content: formData.content,
        conditions: formData.hasConditions ? conditionGroup : null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        appliesTo: formData.appliesTo.split(',').map(t => t.trim()).filter(Boolean),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
      }
      
      setSavedRules(prev => [...prev, newRule])
      setIsSaving(false)
      setIsOpen(false)
      resetForm()
    }, 500)
  }, [formData, conditionGroup, isFormValid, resetForm])

  // Delete saved rule
  const handleDeleteRule = useCallback((ruleId: string) => {
    setSavedRules(prev => prev.filter(r => r.id !== ruleId))
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">自定义规则添加</h2>
          <p className="text-muted-foreground">
            创建用户和管理员自定义的 Agent 规则
          </p>
        </div>
        <Button onClick={handleOpen}>
          <Plus className="h-4 w-4 mr-2" />
          添加规则
        </Button>
      </div>

      {/* Saved Rules */}
      {savedRules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">已创建的规则</h3>
          {savedRules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge className={PRIORITY_OPTIONS.find(p => p.value === rule.priority)?.color}>
                        {PRIORITY_OPTIONS.find(p => p.value === rule.priority)?.label}
                      </Badge>
                      <Badge variant="outline">
                        {CATEGORY_OPTIONS.find(c => c.value === rule.category)?.label}
                      </Badge>
                      {rule.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          活跃
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>创建自定义规则</DialogTitle>
            <DialogDescription>
              定义规则名称、描述、条件和行为内容
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">规则名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="输入规则名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">规则类别</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => handleFormChange('category', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">规则描述</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="简要描述规则的作用"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">优先级</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => handleFormChange('priority', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">标签 (逗号分隔)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleFormChange('tags', e.target.value)}
                      placeholder="标签1, 标签2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appliesTo">适用范围 (逗号分隔)</Label>
                  <Input
                    id="appliesTo"
                    value={formData.appliesTo}
                    onChange={(e) => handleFormChange('appliesTo', e.target.value)}
                    placeholder="intent, tool, memory"
                  />
                </div>
              </div>

              <Separator />

              {/* Rule Content */}
              <div className="space-y-2">
                <Label htmlFor="content">规则内容 *</Label>
                <Textarea
                  id="content"
                  className="min-h-[150px] font-mono text-sm"
                  value={formData.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  placeholder="输入规则的具体内容，例如：在执行敏感操作前必须获得用户明确确认..."
                />
              </div>

              <Separator />

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>触发条件</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">定义规则生效的条件，例如：用户意图包含"删除"时触发</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hasConditions" className="text-sm">启用条件</Label>
                    <input
                      type="checkbox"
                      id="hasConditions"
                      checked={formData.hasConditions}
                      onChange={(e) => handleFormChange('hasConditions', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                </div>

                {formData.hasConditions && (
                  <div className="space-y-3">
                    {/* Logical Operator */}
                    {conditionGroup && conditionGroup.conditions.length > 1 && (
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleOperator}
                          className="min-w-[60px]"
                        >
                          {conditionGroup.operator === 'and' ? '并且' : '或者'}
                        </Button>
                      </div>
                    )}

                    {/* Conditions List */}
                    {(conditionGroup?.conditions || []).map((condition, index) => (
                      <div key={condition.id} className="flex items-start gap-2">
                        <div className="flex items-center pt-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground ml-1">{index + 1}.</span>
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <Select
                            value={condition.type}
                            onValueChange={(v) => handleUpdateCondition(condition.id, 'type', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="类型" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITION_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-1">
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="字段"
                            value={condition.field}
                            onChange={(e) => handleUpdateCondition(condition.id, 'field', e.target.value)}
                          />
                          <Select
                            value={condition.operator}
                            onValueChange={(v) => handleUpdateCondition(condition.id, 'operator', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="操作符" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Input
                              placeholder="值"
                              value={condition.value}
                              onChange={(e) => handleUpdateCondition(condition.id, 'value', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveCondition(condition.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Condition Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleAddCondition}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加条件
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid || isSaving}>
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-pulse" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存规则
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
