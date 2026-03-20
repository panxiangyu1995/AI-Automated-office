/**
 * 上级选择器组件
 *
 * @module ManagerPicker
 * @description 用于选择用户上级的搜索选择组件
 */

import { useState, useEffect, useCallback } from 'react'
import { Search, X, User, Building } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserSummary, DeptSummary } from '../types/user.types'

interface ManagerPickerProps {
  /** 当前选中的上级 ID */
  value?: string | null
  /** 当前选中的上级信息 */
  managerInfo?: UserSummary | null
  /** 当前用户 ID（用于排除自己） */
  currentUserId: string
  /** 选择回调 */
  onChange: (managerId: string | null, manager?: UserSummary) => void
  /** 搜索函数 */
  onSearch: (query: string) => Promise<UserSummary[]>
  /** 是否禁用 */
  disabled?: boolean
  /** 占位符 */
  placeholder?: string
}

export function ManagerPicker({
  value,
  managerInfo,
  currentUserId,
  onChange,
  onSearch,
  disabled = false,
  placeholder = '搜索并选择上级',
}: ManagerPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserSummary | null>(
    managerInfo || null
  )

  // 同步外部传入的 managerInfo
  useEffect(() => {
    if (managerInfo) {
      setSelectedManager(managerInfo)
    } else if (!value) {
      setSelectedManager(null)
    }
  }, [managerInfo, value])

  // 防抖搜索
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await onSearch(query)
      // 排除当前用户
      setSearchResults(results.filter((r) => r.id !== currentUserId))
    } catch (error) {
      console.error('Search manager failed:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [onSearch, currentUserId])

  // 搜索输入变化处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        performSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, performSearch])

  // 选择上级
  const handleSelect = (manager: UserSummary) => {
    setSelectedManager(manager)
    onChange(manager.id, manager)
    setIsOpen(false)
    setSearchQuery('')
  }

  // 清除选择
  const handleClear = () => {
    setSelectedManager(null)
    onChange(null)
    setSearchQuery('')
  }

  // 渲染部门信息
  const renderDepartment = (dept?: DeptSummary) => {
    if (!dept) return null
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Building className="h-3 w-3" />
        {dept.name}
      </span>
    )
  }

  return (
    <div className="relative">
      {/* 已选择的上级显示 */}
      {selectedManager ? (
        <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {selectedManager.real_name}
              </span>
              <div className="flex items-center gap-2">
                {selectedManager.employee_code && (
                  <span className="text-xs text-muted-foreground">
                    {selectedManager.employee_code}
                  </span>
                )}
                {renderDepartment(selectedManager.department)}
              </div>
            </div>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        // 搜索输入框
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9"
          />
        </div>
      )}

      {/* 搜索结果下拉列表 */}
      {isOpen && !selectedManager && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="py-1">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent'
                  )}
                  onClick={() => handleSelect(user)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.real_name}</span>
                    <div className="flex items-center gap-2">
                      {user.employee_code && (
                        <span className="text-xs text-muted-foreground">
                          {user.employee_code}
                        </span>
                      )}
                      {renderDepartment(user.department)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              未找到匹配的用户
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              输入姓名或工号搜索
            </div>
          )}
        </div>
      )}
    </div>
  )
}
