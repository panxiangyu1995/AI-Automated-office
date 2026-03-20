/**
 * 用户选择器组件
 *
 * @module UserSelector
 * @description 用于搜索和选择用户的组件
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, User, ChevronDown, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { userApi } from '@/features/admin/api/userApi'
import type { UserListItem } from '@/features/admin/types/user.types'
import type { UserPermissionSummary } from '../types/fine-grained.types'

interface UserSelectorProps {
  selectedUser: UserPermissionSummary | null
  onSelect: (user: UserPermissionSummary) => void
  onClear?: () => void
  disabled?: boolean
}

export function UserSelector({
  selectedUser,
  onSelect,
  onClear,
  disabled = false,
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 搜索用户
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const response = await userApi.listUsers({
        name: query,
        page_size: 10,
      })
      setUsers(response.items)
    } catch (error) {
      console.error('搜索用户失败:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        void searchUsers(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 处理用户选择
  const handleSelect = useCallback(
    (user: UserListItem) => {
      const summary: UserPermissionSummary = {
        id: user.id,
        name: user.real_name,
        employee_code: user.employee_code,
        department: user.departments[0]?.name ?? '',
        roles: user.roles.map((r) => r.id),
        role_names: user.roles.map((r) => r.name),
      }
      onSelect(summary)
      setIsOpen(false)
      setSearchQuery('')
    },
    [onSelect]
  )

  // 处理清除
  const handleClear = useCallback(() => {
    setSearchQuery('')
    setUsers([])
    onClear?.()
  }, [onClear])

  // 处理输入聚焦
  const handleFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true)
    }
  }, [disabled])

  // 处理输入变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      if (!isOpen) {
        setIsOpen(true)
      }
    },
    [isOpen]
  )

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      } else if (e.key === 'Enter' && users.length > 0) {
        handleSelect(users[0])
      }
    },
    [users, handleSelect]
  )

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {selectedUser ? (
        // 已选择用户显示
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">{selectedUser.name}</div>
            <div className="text-sm text-slate-500 truncate">
              {selectedUser.department} | {selectedUser.employee_code}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedUser.role_names.slice(0, 2).map((roleName, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {roleName}
              </Badge>
            ))}
            {selectedUser.role_names.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{selectedUser.role_names.length - 2}
              </Badge>
            )}
          </div>
          {!disabled && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        // 搜索输入框
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="搜索用户姓名或工号..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="pl-10 pr-10"
            />
            <ChevronDown
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform cursor-pointer',
                isOpen && 'rotate-180'
              )}
              onClick={() => !disabled && setIsOpen(!isOpen)}
            />
          </div>

          {/* 下拉列表 */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchQuery && users.length === 0 ? (
                <div className="py-8 text-center text-slate-500">未找到匹配的用户</div>
              ) : searchQuery && users.length > 0 ? (
                <ul className="py-1">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleSelect(user)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{user.real_name}</div>
                        <div className="text-sm text-slate-500 truncate">
                          {user.departments[0]?.name ?? '未分配部门'} | {user.employee_code}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {user.roles.slice(0, 2).map((role) => (
                          <Badge key={role.id} variant="secondary" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                        {user.roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-slate-500">输入关键词搜索用户</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserSelector
