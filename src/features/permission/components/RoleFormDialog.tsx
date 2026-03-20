/**
 * 角色创建/编辑对话框
 *
 * @component RoleFormDialog
 * @description 创建或编辑角色的对话框表单
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  PermissionLayer,
} from '../types/permission.types'
import { LAYER_CONFIG } from '../types/permission.types'

// 创建模式的 Props
interface CreateRoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateRoleRequest) => Promise<void>
  isLoading?: boolean
  mode: 'create'
  role?: never
}

// 编辑模式的 Props
interface EditRoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UpdateRoleRequest) => Promise<void>
  isLoading?: boolean
  mode: 'edit'
  role: Role
}

type RoleFormDialogProps = CreateRoleFormDialogProps | EditRoleFormDialogProps

interface FormData {
  name: string
  code: string
  layer: PermissionLayer
  description: string
}

export function RoleFormDialog(props: RoleFormDialogProps) {
  const { open, onOpenChange, onSubmit, isLoading, mode, role } = props

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      code: '',
      layer: 'base',
      description: '',
    },
  })

  // 编辑模式时填充表单
  useEffect(() => {
    if (mode === 'edit' && role) {
      reset({
        name: role.name,
        code: role.code,
        layer: role.layer,
        description: role.description || '',
      })
    } else if (mode === 'create') {
      reset({
        name: '',
        code: '',
        layer: 'base',
        description: '',
      })
    }
  }, [mode, role, reset])

  // 表单提交处理
  const handleFormSubmit = async (data: FormData) => {
    if (mode === 'create') {
      await onSubmit({
        name: data.name,
        code: data.code,
        layer: data.layer,
        description: data.description || undefined,
      } as CreateRoleRequest)
    } else {
      await onSubmit({
        name: data.name,
        description: data.description || undefined,
      } as UpdateRoleRequest)
    }
  }

  const layer = watch('layer')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新建角色' : '编辑角色'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '创建一个新的角色，并配置其权限层级'
              : '修改角色基本信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 角色名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              角色名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="请输入角色名称"
              {...register('name', {
                required: '请输入角色名称',
                minLength: { value: 2, message: '角色名称至少2个字符' },
                maxLength: { value: 50, message: '角色名称最多50个字符' },
              })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* 角色编码 */}
          <div className="space-y-2">
            <Label htmlFor="code">
              角色编码 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="请输入角色编码（字母、数字、下划线）"
              disabled={mode === 'edit'}
              {...register('code', {
                required: '请输入角色编码',
                pattern: {
                  value: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                  message: '编码必须以字母开头，只能包含字母、数字和下划线',
                },
              })}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code.message}</p>
            )}
            {mode === 'edit' && (
              <p className="text-xs text-gray-500">角色编码创建后不可修改</p>
            )}
          </div>

          {/* 权限层级 */}
          <div className="space-y-2">
            <Label htmlFor="layer">
              权限层级 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={layer}
              onValueChange={(value: PermissionLayer) => setValue('layer', value)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择权限层级" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAYER_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: config.bgColor }}
                      />
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-gray-500">权限层级创建后不可修改</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="请输入角色描述（可选）"
              rows={3}
              {...register('description', {
                maxLength: { value: 200, message: '描述最多200个字符' },
              })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RoleFormDialog