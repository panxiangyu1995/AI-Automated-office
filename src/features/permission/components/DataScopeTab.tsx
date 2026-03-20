/**
 * 数据范围配置 Tab 组件
 *
 * @module DataScopeTab
 * @description 用于配置用户数据访问范围的组件
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Database,
  Building2,
  Users,
  User,
  Settings2,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFineGrainedStore } from '../stores/fineGrainedStore'
import type {
  DataScope,
  DataScopeType,
  ResourceDefinition,
  DepartmentTreeNode,
  CustomRuleCondition,
  RuleOperator,
  CustomRuleLogic,
  CustomRule,
} from '../types/fine-grained.types'

interface DataScopeTabProps {
  resources: ResourceDefinition[]
  departmentTree: DepartmentTreeNode[]
}

const SCOPE_TYPE_OPTIONS: { value: DataScopeType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'all',
    label: '全部数据',
    icon: <Database className="w-4 h-4" />,
    description: '可访问该资源的所有数据',
  },
  {
    value: 'department',
    label: '仅本部门',
    icon: <Building2 className="w-4 h-4" />,
    description: '仅可访问本部门的数据',
  },
  {
    value: 'department_tree',
    label: '本部门及下级',
    icon: <Users className="w-4 h-4" />,
    description: '可访问本部门及下级部门的数据',
  },
  {
    value: 'self',
    label: '仅本人数据',
    icon: <User className="w-4 h-4" />,
    description: '仅可访问自己创建的数据',
  },
  {
    value: 'custom',
    label: '自定义规则',
    icon: <Settings2 className="w-4 h-4" />,
    description: '使用自定义规则定义数据范围',
  },
]

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: 'eq', label: '等于' },
  { value: 'ne', label: '不等于' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
  { value: 'in', label: '包含于' },
  { value: 'not_in', label: '不包含于' },
  { value: 'contains', label: '包含' },
]

// 部门树节点组件
function DepartmentTreeNodeItem({
  node,
  selectedIds,
  onToggle,
  level = 0,
}: {
  node: DepartmentTreeNode
  selectedIds: string[]
  onToggle: (id: string) => void
  level?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedIds.includes(node.id)

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-slate-100',
          isSelected && 'bg-blue-50'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(node.id)}
          className="rounded border-slate-300"
        />
        <span className="text-sm">{node.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <DepartmentTreeNodeItem
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 自定义规则编辑器组件
function CustomRuleEditor({
  rule,
  onChange,
}: {
  rule: CustomRule | null
  onChange: (rule: CustomRule) => void
}) {
  const conditions = rule?.conditions ?? []
  const logic = rule?.logic ?? 'and'

  const handleAddCondition = () => {
    const newCondition: CustomRuleCondition = {
      field: '',
      operator: 'eq',
      value: '',
    }
    onChange({
      conditions: [...conditions, newCondition],
      logic,
    })
  }

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    if (newConditions.length === 0) {
      // 如果没有条件了，保持至少一个空条件
      onChange({
        conditions: [{ field: '', operator: 'eq', value: '' }],
        logic,
      })
    } else {
      onChange({
        conditions: newConditions,
        logic,
      })
    }
  }

  const handleUpdateCondition = (index: number, updates: Partial<CustomRuleCondition>) => {
    const newConditions = conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    )
    onChange({
      conditions: newConditions,
      logic,
    })
  }

  const handleLogicChange = (newLogic: CustomRuleLogic) => {
    onChange({
      conditions,
      logic: newLogic,
    })
  }

  return (
    <div className="space-y-3">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-16">条件 {index + 1}:</span>
          <Input
            placeholder="字段名"
            value={condition.field}
            onChange={(e) => handleUpdateCondition(index, { field: e.target.value })}
            className="w-32"
          />
          <Select
            value={condition.operator}
            onValueChange={(value) =>
              handleUpdateCondition(index, { operator: value as RuleOperator })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="值"
            value={Array.isArray(condition.value) ? condition.value.join(',') : condition.value}
            onChange={(e) =>
              handleUpdateCondition(index, {
                value: e.target.value.includes(',')
                  ? e.target.value.split(',')
                  : e.target.value,
              })
            }
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveCondition(index)}
            disabled={conditions.length <= 1}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
          <Plus className="w-4 h-4 mr-1" />
          添加条件
        </Button>

        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-slate-500">逻辑关系:</span>
          <RadioGroup
            value={logic}
            onValueChange={(value) => handleLogicChange(value as CustomRuleLogic)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="and" id="logic-and" />
              <Label htmlFor="logic-and" className="text-sm">
                且(AND)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="or" id="logic-or" />
              <Label htmlFor="logic-or" className="text-sm">
                或(OR)
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}

export function DataScopeTab({ resources, departmentTree }: DataScopeTabProps) {
  const {
    selectedResource,
    setSelectedResource,
    currentDataScopes,
    pendingDataScopes,
    updateDataScope,
  } = useFineGrainedStore()

  // 获取当前资源的有效数据范围
  const currentScope = useMemo((): DataScope => {
    if (!selectedResource) {
      return { type: 'all', rule: null }
    }
    return pendingDataScopes[selectedResource] ?? currentDataScopes[selectedResource] ?? { type: 'all', rule: null }
  }, [selectedResource, currentDataScopes, pendingDataScopes])

  // 选中的部门 ID 列表
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(
    currentScope.department_ids ?? []
  )

  // 处理范围类型变更
  const handleScopeTypeChange = useCallback(
    (type: DataScopeType) => {
      if (!selectedResource) return

      const newScope: DataScope = {
        type,
        rule: type === 'custom' ? { conditions: [{ field: '', operator: 'eq', value: '' }], logic: 'and' } : null,
        department_ids: type === 'department' || type === 'department_tree' ? selectedDepartmentIds : undefined,
      }
      updateDataScope(selectedResource, newScope)
    },
    [selectedResource, selectedDepartmentIds, updateDataScope]
  )

  // 处理自定义规则变更
  const handleRuleChange = useCallback(
    (rule: CustomRule) => {
      if (!selectedResource) return
      updateDataScope(selectedResource, { ...currentScope, rule })
    },
    [selectedResource, currentScope, updateDataScope]
  )

  // 处理部门选择变更
  const handleDepartmentToggle = useCallback(
    (deptId: string) => {
      const newIds = selectedDepartmentIds.includes(deptId)
        ? selectedDepartmentIds.filter((id) => id !== deptId)
        : [...selectedDepartmentIds, deptId]
      setSelectedDepartmentIds(newIds)

      if (selectedResource && (currentScope.type === 'department' || currentScope.type === 'department_tree')) {
        updateDataScope(selectedResource, {
          ...currentScope,
          department_ids: newIds,
        })
      }
    },
    [selectedDepartmentIds, selectedResource, currentScope, updateDataScope]
  )

  // 资源变更时重置部门选择
  const handleResourceChange = useCallback(
    (resourceCode: string) => {
      setSelectedResource(resourceCode)
      const scope = currentDataScopes[resourceCode]
      setSelectedDepartmentIds(scope?.department_ids ?? [])
    },
    [setSelectedResource, currentDataScopes]
  )

  return (
    <div className="flex flex-col h-full">
      {/* 资源选择 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <label className="block text-sm font-medium text-slate-700 mb-2">选择资源</label>
        <Select value={selectedResource ?? ''} onValueChange={handleResourceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择要配置的资源" />
          </SelectTrigger>
          <SelectContent>
            {resources.map((resource) => (
              <SelectItem key={resource.code} value={resource.code}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>{resource.name}</span>
                  <span className="text-xs text-slate-400">({resource.module_name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 范围配置 */}
      <ScrollArea className="flex-1">
        {selectedResource ? (
          <div className="p-4 space-y-6">
            {/* 范围类型选择 */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">数据范围类型</Label>
              <RadioGroup
                value={currentScope.type}
                onValueChange={(value) => handleScopeTypeChange(value as DataScopeType)}
                className="space-y-3"
              >
                {SCOPE_TYPE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      currentScope.type === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => handleScopeTypeChange(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={`scope-${option.value}`} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <Label htmlFor={`scope-${option.value}`} className="font-medium cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 部门选择器（当选择仅本部门或本部门及下级时显示） */}
            {(currentScope.type === 'department' || currentScope.type === 'department_tree') &&
              departmentTree.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">选择部门</Label>
                  <div className="border border-slate-200 rounded-lg max-h-60 overflow-auto p-2">
                    {departmentTree.map((node) => (
                      <DepartmentTreeNodeItem
                        key={node.id}
                        node={node}
                        selectedIds={selectedDepartmentIds}
                        onToggle={handleDepartmentToggle}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    已选择 {selectedDepartmentIds.length} 个部门
                  </p>
                </div>
              )}

            {/* 自定义规则编辑器（当选择自定义时显示） */}
            {currentScope.type === 'custom' && (
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">自定义规则</Label>
                <div className="border border-slate-200 rounded-lg p-4">
                  <CustomRuleEditor
                    rule={currentScope.rule ?? { conditions: [{ field: '', operator: 'eq', value: '' }], logic: 'and' }}
                    onChange={handleRuleChange}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Database className="w-12 h-12 mb-2 text-slate-300" />
            <p>请先选择要配置的资源</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default DataScopeTab
