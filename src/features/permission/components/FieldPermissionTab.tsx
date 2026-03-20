/**
 * 字段权限配置 Tab 组件
 *
 * @module FieldPermissionTab
 * @description 用于配置字段级权限的组件
 */

import { useMemo, useCallback, useState } from 'react'
import { Eye, EyeOff, Lock, Asterisk, Columns, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useFineGrainedStore } from '../stores/fineGrainedStore'
import type {
  FieldRestriction,
  FieldRestrictionMode,
  MaskRuleType,
  ResourceDefinition,
} from '../types/fine-grained.types'

interface FieldPermissionTabProps {
  resources: ResourceDefinition[]
}

const MODE_OPTIONS: { value: FieldRestrictionMode; label: string; icon: React.ReactNode }[] = [
  { value: 'visible', label: '可见', icon: <Eye className="w-4 h-4" /> },
  { value: 'hidden', label: '隐藏', icon: <EyeOff className="w-4 h-4" /> },
  { value: 'readonly', label: '只读', icon: <Lock className="w-4 h-4" /> },
  { value: 'masked', label: '脱敏', icon: <Asterisk className="w-4 h-4" /> },
]

const MASK_RULE_OPTIONS: { value: MaskRuleType; label: string; example: string }[] = [
  { value: 'phone', label: '手机号', example: '138****1234' },
  { value: 'email', label: '邮箱', example: 't***@example.com' },
  { value: 'idcard', label: '身份证', example: '110***********1234' },
  { value: 'bankcard', label: '银行卡', example: '6222 **** **** 1234' },
]

export function FieldPermissionTab({ resources }: FieldPermissionTabProps) {
  const {
    selectedResource,
    setSelectedResource,
    currentFieldRestrictions,
    pendingFieldRestrictions,
    updateFieldRestriction,
    batchUpdateFieldRestrictions,
  } = useFineGrainedStore()

  // 选中的字段（用于批量操作）
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)

  // 获取当前选中资源的字段列表
  const currentResource = useMemo(() => {
    return resources.find((r) => r.code === selectedResource)
  }, [resources, selectedResource])

  // 获取当前资源的字段权限
  const fieldRestrictions = useMemo(() => {
    if (!selectedResource) return {}
    const current = currentFieldRestrictions[selectedResource] ?? {}
    const pending = pendingFieldRestrictions[selectedResource] ?? {}
    return { ...current, ...pending }
  }, [selectedResource, currentFieldRestrictions, pendingFieldRestrictions])

  // 获取字段限制状态
  const getFieldRestriction = useCallback(
    (fieldName: string): FieldRestriction => {
      return fieldRestrictions[fieldName] ?? { mode: 'visible' }
    },
    [fieldRestrictions]
  )

  // 处理字段权限变更
  const handleRestrictionChange = useCallback(
    (fieldName: string, mode: FieldRestrictionMode, maskRule?: MaskRuleType) => {
      if (!selectedResource) return
      updateFieldRestriction(selectedResource, fieldName, {
        mode,
        mask_rule: mode === 'masked' ? maskRule : undefined,
      })
    },
    [selectedResource, updateFieldRestriction]
  )

  // 处理字段选择
  const handleFieldSelect = useCallback((fieldName: string, checked: boolean) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(fieldName)
      } else {
        next.delete(fieldName)
      }
      return next
    })
  }, [])

  // 全选/取消全选
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!currentResource) return
      if (checked) {
        setSelectedFields(new Set(currentResource.fields.map((f) => f.name)))
      } else {
        setSelectedFields(new Set())
      }
    },
    [currentResource]
  )

  // 批量更新字段权限
  const handleBatchUpdate = useCallback(
    (mode: FieldRestrictionMode, maskRule?: MaskRuleType) => {
      if (!selectedResource || selectedFields.size === 0) return
      const restriction: FieldRestriction = {
        mode,
        mask_rule: mode === 'masked' ? maskRule : undefined,
      }
      batchUpdateFieldRestrictions(selectedResource, Array.from(selectedFields), restriction)
      setIsBatchDialogOpen(false)
      setSelectedFields(new Set())
    },
    [selectedResource, selectedFields, batchUpdateFieldRestrictions]
  )

  // 资源变更时清空选择
  const handleResourceChange = useCallback(
    (resourceCode: string) => {
      setSelectedResource(resourceCode)
      setSelectedFields(new Set())
    },
    [setSelectedResource]
  )

  // 是否全选
  const isAllSelected = useMemo(() => {
    if (!currentResource || currentResource.fields.length === 0) return false
    return currentResource.fields.every((f) => selectedFields.has(f.name))
  }, [currentResource, selectedFields])

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
                  <Columns className="w-4 h-4 text-slate-400" />
                  <span>{resource.name}</span>
                  <span className="text-xs text-slate-400">({resource.module_name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 字段列表 */}
      <ScrollArea className="flex-1">
        {selectedResource && currentResource && currentResource.fields.length > 0 ? (
          <div className="p-4">
            {/* 批量操作工具栏 */}
            <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
                  全选 ({selectedFields.size}/{currentResource.fields.length})
                </label>
              </div>

              {selectedFields.size > 0 && (
                <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4 mr-1" />
                      批量设置
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>批量设置字段权限</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-slate-600 mb-4">
                        已选择 {selectedFields.size} 个字段
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {MODE_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleBatchUpdate(option.value)}
                          >
                            {option.icon}
                            <span className="ml-2">{option.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* 字段表格 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 bg-slate-100 text-sm font-medium text-slate-700">
                <div className="px-4 py-3 border-b border-slate-200 w-10"></div>
                <div className="px-4 py-3 border-b border-slate-200">字段名</div>
                <div className="px-4 py-3 border-b border-slate-200">显示名称</div>
                <div className="px-4 py-3 border-b border-slate-200">权限设置</div>
                <div className="px-4 py-3 border-b border-slate-200">脱敏规则</div>
              </div>

              <div className="divide-y divide-slate-200">
                {currentResource.fields.map((field) => {
                  const restriction = getFieldRestriction(field.name)
                  const isSelected = selectedFields.has(field.name)
                  const hasChange =
                    pendingFieldRestrictions[selectedResource]?.[field.name] !== undefined

                  return (
                    <div
                      key={field.name}
                      className={cn(
                        'grid grid-cols-5 items-center',
                        hasChange && 'bg-amber-50',
                        isSelected && 'bg-blue-50'
                      )}
                    >
                      {/* 选择框 */}
                      <div className="px-4 py-3 w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleFieldSelect(field.name, checked as boolean)
                          }
                        />
                      </div>

                      {/* 字段名 */}
                      <div className="px-4 py-3">
                        <code className="text-sm font-mono text-slate-700">{field.name}</code>
                      </div>

                      {/* 显示名称 */}
                      <div className="px-4 py-3 text-slate-900">{field.label}</div>

                      {/* 权限设置 */}
                      <div className="px-4 py-3">
                        <Select
                          value={restriction.mode}
                          onValueChange={(value) =>
                            handleRestrictionChange(
                              field.name,
                              value as FieldRestrictionMode,
                              restriction.mask_rule
                            )
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              'w-28',
                              restriction.mode === 'hidden' && 'border-red-500 bg-red-50',
                              restriction.mode === 'readonly' && 'border-yellow-500 bg-yellow-50',
                              restriction.mode === 'masked' && 'border-purple-500 bg-purple-50'
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  {option.icon}
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 脱敏规则 */}
                      <div className="px-4 py-3">
                        {restriction.mode === 'masked' ? (
                          <Select
                            value={restriction.mask_rule ?? 'phone'}
                            onValueChange={(value) =>
                              handleRestrictionChange(
                                field.name,
                                'masked',
                                value as MaskRuleType
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MASK_RULE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div>{option.label}</div>
                                    <div className="text-xs text-slate-400">{option.example}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 权限模式说明 */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">权限模式说明</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span>可见：字段正常显示</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  <span>隐藏：字段不显示</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  <span>只读：字段可见但不可编辑</span>
                </div>
                <div className="flex items-center gap-2">
                  <Asterisk className="w-4 h-4 text-purple-500" />
                  <span>脱敏：字段值部分隐藏</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedResource ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Columns className="w-12 h-12 mb-2 text-slate-300" />
            <p>该资源没有可配置的字段</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Columns className="w-12 h-12 mb-2 text-slate-300" />
            <p>请先选择要配置的资源</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default FieldPermissionTab
