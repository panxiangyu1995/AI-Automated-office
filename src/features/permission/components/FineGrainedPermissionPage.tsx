/**
 * 细粒度权限配置页面
 *
 * @module FineGrainedPermissionPage
 * @description 细粒度权限配置主页面，包含用户选择和三种配置 Tab
 */

import { useEffect, useCallback, useState } from 'react'
import { ArrowLeft, Save, RotateCcw, AlertTriangle, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFineGrainedStore } from '../stores/fineGrainedStore'
import { UserSelector } from './UserSelector'
import { PermissionOverrideTab } from './PermissionOverrideTab'
import { DataScopeTab } from './DataScopeTab'
import { FieldPermissionTab } from './FieldPermissionTab'
import type { UserPermissionSummary } from '../types/fine-grained.types'

export function FineGrainedPermissionPage() {
  const navigate = useNavigate()
  const {
    selectedUserId,
    userSummary,
    resources,
    departmentTree,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    error,
    selectUser,
    fetchResources,
    fetchDepartmentTree,
    saveChanges,
    resetChanges,
    reset,
  } = useFineGrainedStore()

  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  // 初始化数据
  useEffect(() => {
    void fetchResources()
    void fetchDepartmentTree()
    return () => {
      reset()
    }
  }, [fetchResources, fetchDepartmentTree, reset])

  // 处理用户选择
  const handleUserSelect = useCallback(
    (user: UserPermissionSummary) => {
      if (hasUnsavedChanges && selectedUserId !== user.id) {
        // 有未保存的变更，显示确认对话框
        setShowUnsavedDialog(true)
        return
      }
      void selectUser(user.id)
    },
    [hasUnsavedChanges, selectedUserId, selectUser]
  )

  // 处理返回
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
      return
    }
    navigate('/admin/permissions')
  }, [hasUnsavedChanges, navigate])

  // 处理保存
  const handleSave = useCallback(async () => {
    setShowConfirmDialog(true)
  }, [])

  // 确认保存
  const handleConfirmSave = useCallback(async () => {
    try {
      await saveChanges()
      setShowConfirmDialog(false)
    } catch (err) {
      console.error('保存失败:', err)
    }
  }, [saveChanges])

  // 处理重置
  const handleReset = useCallback(() => {
    resetChanges()
  }, [resetChanges])

  // 处理放弃变更
  const handleDiscardChanges = useCallback(() => {
    resetChanges()
    setShowUnsavedDialog(false)
  }, [resetChanges])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-slate-900">细粒度权限配置</h1>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              有未保存的变更
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                保存变更
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 用户选择区域 */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <label className="block text-sm font-medium text-slate-700 mb-2">选择用户</label>
        <UserSelector
          selectedUser={userSummary}
          onSelect={handleUserSelect}
          disabled={isLoading}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-6 py-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : selectedUserId ? (
          <Tabs defaultValue="override" className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b border-slate-200">
              <TabsList>
                <TabsTrigger value="override">权限覆盖配置</TabsTrigger>
                <TabsTrigger value="datascope">数据范围配置</TabsTrigger>
                <TabsTrigger value="field">字段权限配置</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="override" className="flex-1 mt-0 overflow-hidden">
              <PermissionOverrideTab resources={resources} />
            </TabsContent>

            <TabsContent value="datascope" className="flex-1 mt-0 overflow-hidden">
              <DataScopeTab resources={resources} departmentTree={departmentTree} />
            </TabsContent>

            <TabsContent value="field" className="flex-1 mt-0 overflow-hidden">
              <FieldPermissionTab resources={resources} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Shield className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-400">请先选择要配置的用户</p>
            <p className="text-sm text-slate-400 mt-2">在上方搜索框中输入用户姓名或工号</p>
          </div>
        )}
      </div>

      {/* 保存确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认保存变更</DialogTitle>
            <DialogDescription>
              您即将保存细粒度权限配置的变更，此操作将影响用户的实际权限。请确认变更内容无误后再保存。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '确认保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 未保存变更对话框 */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>有未保存的变更</DialogTitle>
            <DialogDescription>
              您有未保存的变更，离开此页面将丢失这些变更。是否保存后再离开？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDiscardChanges}>
              放弃变更
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUnsavedDialog(false)}
            >
              继续编辑
            </Button>
            <Button
              onClick={async () => {
                await saveChanges()
                setShowUnsavedDialog(false)
              }}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存并离开'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FineGrainedPermissionPage
