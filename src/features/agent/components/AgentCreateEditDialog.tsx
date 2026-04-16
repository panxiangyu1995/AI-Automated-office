/**
 * AgentCreateEditDialog - 创建/编辑 Agent 对话框
 *
 * Story: Subagent Registry UI - Create/Edit Dialogs
 *
 * 功能：
 * - 模板选择网格
 * - 表单字段（名称、描述、角色）
 * - 技能/工具/权限输入
 * - 表单验证
 * - 连接后端 API
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  AgentTemplateSelector,
  AgentTemplate,
  TEMPLATE_CONFIG,
  type AgentTemplateInfo,
} from './AgentTemplateSelector'

// ==================== Types ========================

export interface AgentFormData {
  id?: string
  name: string
  mode: 'primary' | 'subagent'
  description: string
  role: string
  skills: string[]
  tools: string[]
  permissions: Record<string, string>
  enabled: boolean
}

interface AgentCreateEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AgentFormData) => void
  initialData?: AgentFormData | null
  isEdit?: boolean
  className?: string
}

// ==================== Default Form Data ====================

const defaultFormData: AgentFormData = {
  name: '',
  mode: 'primary',
  description: '',
  role: '',
  skills: [],
  tools: [],
  permissions: {},
  enabled: true,
}

// ==================== Permission Input ========================

interface PermissionInputProps {
  permissions: Record<string, string>
  onChange: (permissions: Record<string, string>) => void
}

function PermissionInputs({ permissions, onChange }: PermissionInputProps) {
  const [newOp, setNewOp] = useState('')
  const [newAction, setNewAction] = useState<'allow' | 'ask' | 'deny'>('ask')

  const handleAdd = () => {
    if (newOp.trim()) {
      onChange({ ...permissions, [newOp.trim()]: newAction })
      setNewOp('')
    }
  }

  const handleRemove = (op: string) => {
    const newPerms = { ...permissions }
    delete newPerms[op]
    onChange(newPerms)
  }

  const handleUpdate = (op: string, action: string) => {
    onChange({ ...permissions, [op]: action })
  }

  const operations = ['department', 'approval', 'document', 'employee', 'finance', 'warehouse']

  return (
    <div className="space-y-3">
      {/* Existing permissions */}
      {Object.entries(permissions).length > 0 && (
        <div className="space-y-2">
          {Object.entries(permissions).map(([op, action]) => (
            <div key={op} className="flex items-center gap-2">
              <Badge variant="outline" className="w-24 justify-center">
                {op}
              </Badge>
              <select
                value={action}
                onChange={e => handleUpdate(op, e.target.value)}
                className="flex-1 h-8 px-2 text-sm border rounded-md"
              >
                <option value="allow">allow</option>
                <option value="ask">ask</option>
                <option value="deny">deny</option>
              </select>
              <button
                onClick={() => handleRemove(op)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new permission */}
      <div className="flex items-center gap-2">
        <select
          value={newOp || 'department'}
          onChange={e => setNewOp(e.target.value)}
          className="flex-1 h-8 px-2 text-sm border rounded-md"
        >
          <option value="" disabled>
            选择操作
          </option>
          {operations.map(op => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
          {!operations.includes(newOp) && newOp && (
            <option value={newOp}>{newOp}</option>
          )}
        </select>
        <select
          value={newAction}
          onChange={e => setNewAction(e.target.value as 'allow' | 'ask' | 'deny')}
          className="w-24 h-8 px-2 text-sm border rounded-md"
        >
          <option value="allow">allow</option>
          <option value="ask">ask</option>
          <option value="deny">deny</option>
        </select>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}

// ==================== Main Dialog Component ========================

export function AgentCreateEditDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEdit = false,
  className,
}: AgentCreateEditDialogProps) {
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData)
        setSelectedTemplate(null)
      } else {
        setFormData(defaultFormData)
        setSelectedTemplate(null)
      }
      setErrors({})
    }
  }, [open, initialData])

  const handleTemplateChange = (template: AgentTemplate) => {
    setSelectedTemplate(template)
    const templateInfo: AgentTemplateInfo = TEMPLATE_CONFIG[template]

    // Auto-fill form with template suggestions (only for new agents)
    if (!isEdit) {
      setFormData(prev => ({
        ...prev,
        mode: templateInfo.mode,
        role: templateInfo.defaultRole,
        skills: [...templateInfo.suggestedSkills],
        tools: [...templateInfo.suggestedTools],
        permissions: { ...templateInfo.suggestedPermissions },
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = '名称只能包含字母、数字、下划线和连字符'
    }

    if (!formData.description.trim()) {
      newErrors.description = '描述不能为空'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl max-h-[90vh] overflow-y-auto', className)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 Agent' : '新建 Agent'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改 Agent 配置' : '选择一个模板开始创建新的 Agent'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection - Only for new agents */}
          {!isEdit && (
            <div>
              <Label className="text-sm font-medium">选择模板</Label>
              <AgentTemplateSelector
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="mt-2"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="required">
                  名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., my-agent"
                  className={cn(errors.name && 'border-red-500')}
                  disabled={isEdit}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="mode">模式</Label>
                <select
                  id="mode"
                  value={formData.mode}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      mode: e.target.value as 'primary' | 'subagent',
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="primary">主 Agent (Primary)</option>
                  <option value="subagent">子 Agent (Subagent)</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="required">
                描述
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="简短描述 Agent 的用途"
                className={cn(errors.description && 'border-red-500')}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">角色定义</Label>
              <Textarea
                id="role"
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="定义 Agent 的角色和行为..."
                rows={3}
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <Label>技能</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        skills: prev.skills.filter((_, i) => i !== index),
                      }))
                    }
                    className="ml-1 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="添加技能..."
                className="w-32 h-7 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = (e.target as HTMLInputElement).value.trim()
                    if (value) {
                      setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, value],
                      }))
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Tools */}
          <div>
            <Label>工具</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tools.map((tool, index) => (
                <Badge key={index} variant="outline" className="gap-1">
                  {tool}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        tools: prev.tools.filter((_, i) => i !== index),
                      }))
                    }
                    className="ml-1 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="添加工具..."
                className="w-32 h-7 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = (e.target as HTMLInputElement).value.trim()
                    if (value) {
                      setFormData(prev => ({
                        ...prev,
                        tools: [...prev.tools, value],
                      }))
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <Label>权限规则</Label>
            <PermissionInputs
              permissions={formData.permissions}
              onChange={permissions =>
                setFormData(prev => ({ ...prev, permissions }))
              }
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={enabled =>
                setFormData(prev => ({ ...prev, enabled }))
              }
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              启用此 Agent
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">{isEdit ? '保存' : '创建'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
