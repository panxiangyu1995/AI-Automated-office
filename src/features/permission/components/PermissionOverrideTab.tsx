/**
 * 权限覆盖配置 Tab 组件
 *
 * @module PermissionOverrideTab
 * @description 用于配置用户级权限覆盖的组件
 */

import { useMemo, useCallback } from 'react'
import { Check, X, Minus, Shield, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useFineGrainedStore } from '../stores/fineGrainedStore'
import type { OverrideType, ResourceDefinition } from '../types/fine-grained.types'

interface PermissionOverrideTabProps {
  resources: ResourceDefinition[]
}

export function PermissionOverrideTab({ resources }: PermissionOverrideTabProps) {
  const {
    selectedResource,
    setSelectedResource,
    rolePermissions,
    currentOverrides,
    pendingOverrides,
    toggleOverride,
  } = useFineGrainedStore()

  // 获取当前选中资源的权限列表
  const currentResource = useMemo(() => {
    return resources.find((r) => r.code === selectedResource)
  }, [resources, selectedResource])

  // 获取权限列表（从 rolePermissions 中获取当前资源的权限）
  const permissions = useMemo(() => {
    if (!currentResource) return []
    return currentResource.permissions.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      actionName: p.action_name,
    }))
  }, [currentResource])

  // 获取权限状态
  const getPermissionStatus = useCallback(
    (permissionId: string) => {
      const rolePerm = rolePermissions[permissionId]
      const currentOverride = currentOverrides[permissionId]
      const pendingOverride = pendingOverrides[permissionId]

      // 待处理的变更
      const effectiveOverride = pendingOverride !== undefined ? pendingOverride : currentOverride

      // 计算最终权限
      let finalHas = false
      if (effectiveOverride !== undefined && effectiveOverride !== null) {
        finalHas = effectiveOverride === 'grant'
      } else if (rolePerm) {
        finalHas = rolePerm.has
      }

      return {
        roleHas: rolePerm?.has ?? false,
        roleSource: rolePerm?.source ?? '',
        currentOverride,
        pendingOverride,
        effectiveOverride,
        finalHas,
      }
    },
    [rolePermissions, currentOverrides, pendingOverrides]
  )

  // 处理覆盖类型变更
  const handleOverrideChange = useCallback(
    (permissionId: string, value: string) => {
      const overrideType: OverrideType | null = value === 'none' ? null : (value as OverrideType)
      toggleOverride(permissionId, overrideType)
    },
    [toggleOverride]
  )

  return (
    <div className="flex flex-col h-full">
      {/* 资源选择 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <label className="block text-sm font-medium text-slate-700 mb-2">选择资源</label>
        <Select value={selectedResource ?? ''} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="请选择要配置的资源" />
          </SelectTrigger>
          <SelectContent>
            {resources.map((resource) => (
              <SelectItem key={resource.code} value={resource.code}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>{resource.name}</span>
                  <span className="text-xs text-slate-400">({resource.module_name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 权限列表 */}
      <ScrollArea className="flex-1">
        {selectedResource && permissions.length > 0 ? (
          <div className="p-4">
            {/* 说明信息 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">权限覆盖说明</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>- <strong>授权</strong>：为用户添加该权限，不受角色限制</li>
                    <li>- <strong>剥夺</strong>：移除用户的该权限，即使角色拥有此权限</li>
                    <li>- <strong>清除</strong>：移除覆盖配置，恢复为角色权限</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 权限表格 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 bg-slate-100 text-sm font-medium text-slate-700">
                <div className="px-4 py-3 border-b border-slate-200">权限项</div>
                <div className="px-4 py-3 border-b border-slate-200 text-center">角色权限</div>
                <div className="px-4 py-3 border-b border-slate-200 text-center">用户覆盖</div>
                <div className="px-4 py-3 border-b border-slate-200 text-center">最终权限</div>
              </div>

              <div className="divide-y divide-slate-200">
                {permissions.map((permission) => {
                  const status = getPermissionStatus(permission.id)
                  const hasChange = status.pendingOverride !== undefined

                  return (
                    <div
                      key={permission.id}
                      className={cn(
                        'grid grid-cols-4 items-center',
                        hasChange && 'bg-amber-50'
                      )}
                    >
                      {/* 权限名称 */}
                      <div className="px-4 py-3">
                        <div className="font-medium text-slate-900">{permission.name}</div>
                        <div className="text-xs text-slate-500">{permission.code}</div>
                      </div>

                      {/* 角色权限 */}
                      <div className="px-4 py-3 flex justify-center">
                        <div className="flex flex-col items-center gap-1">
                          {status.roleHas ? (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              <Check className="w-3 h-3 mr-1" />
                              有权限
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500">
                              <X className="w-3 h-3 mr-1" />
                              无权限
                            </Badge>
                          )}
                          {status.roleSource && (
                            <span className="text-xs text-slate-400">{status.roleSource}</span>
                          )}
                        </div>
                      </div>

                      {/* 用户覆盖 */}
                      <div className="px-4 py-3 flex justify-center">
                        <Select
                          value={status.effectiveOverride ?? 'none'}
                          onValueChange={(value) => handleOverrideChange(permission.id, value)}
                        >
                          <SelectTrigger
                            className={cn(
                              'w-28',
                              status.effectiveOverride === 'grant' &&
                                'border-green-500 bg-green-50',
                              status.effectiveOverride === 'deny' && 'border-red-500 bg-red-50',
                              status.effectiveOverride === undefined &&
                                'border-slate-200'
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <div className="flex items-center gap-2">
                                <Minus className="w-3 h-3 text-slate-400" />
                                <span>清除</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="grant">
                              <div className="flex items-center gap-2">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>授权</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="deny">
                              <div className="flex items-center gap-2">
                                <X className="w-3 h-3 text-red-500" />
                                <span>剥夺</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 最终权限 */}
                      <div className="px-4 py-3 flex justify-center">
                        {status.finalHas ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            有权限
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="w-3 h-3 mr-1" />
                            无权限
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : selectedResource ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Shield className="w-12 h-12 mb-2 text-slate-300" />
            <p>该资源没有可配置的权限项</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Shield className="w-12 h-12 mb-2 text-slate-300" />
            <p>请先选择要配置的资源</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default PermissionOverrideTab
