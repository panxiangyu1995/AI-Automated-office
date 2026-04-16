/**
 * 员工列表组件
 * Task 147 - HR人事部门模块实现
 */

import { useEffect, useState } from 'react'
import { Search, Plus, RefreshCw, Mail, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHrStore } from '../stores/hrStore'
import type { EmployeeStatus } from '../types/hr.types'

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  probation: 'bg-yellow-500',
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: '正式',
  inactive: '离职',
  probation: '试用期',
}

interface EmployeeListProps {
  onSelectEmployee?: (id: string) => void
  onAddEmployee?: () => void
}

export function EmployeeList({ onSelectEmployee, onAddEmployee }: EmployeeListProps) {
  const {
    employees,
    employeeTotal,
    employeePage,
    employeePageSize,
    isLoadingEmployees,
    fetchEmployees,
  } = useHrStore()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<EmployeeStatus | undefined>(undefined)

  useEffect(() => {
    fetchEmployees({ keyword: keyword || undefined, status })
  }, [fetchEmployees, keyword, status])

  const handleSearch = () => {
    fetchEmployees({ keyword: keyword || undefined, status })
  }

  const totalPages = Math.ceil(employeeTotal / employeePageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">员工列表</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmployees({ keyword: keyword || undefined, status })}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingEmployees ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          {onAddEmployee && (
            <Button size="sm" onClick={onAddEmployee}>
              <Plus className="h-4 w-4 mr-1" />
              添加员工
            </Button>
          )}
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、工号、邮箱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(v) => setStatus(v === 'all' ? undefined : (v as EmployeeStatus))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">正式</SelectItem>
            <SelectItem value="probation">试用期</SelectItem>
            <SelectItem value="inactive">离职</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 员工表格 */}
      {isLoadingEmployees ? (
        <TableSkeleton rows={6} cols={7} />
      ) : employees.length === 0 ? (
        <EmptyState
          title="暂无员工数据"
          description={keyword || status ? '尝试调整筛选条件' : '添加员工后将在此处显示'}
          icon={Users}
          action={onAddEmployee ? { label: '添加员工', onClick: onAddEmployee } : undefined}
        />
      ) : (
        <>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">工号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>岗位</TableHead>
                  <TableHead>入职日期</TableHead>
                  <TableHead className="w-[80px]">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectEmployee?.(emp.id)}
                  >
                    <TableCell className="font-mono text-sm">{emp.employeeCode}</TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {emp.email}
                      </div>
                    </TableCell>
                    <TableCell>{emp.departmentName || '-'}</TableCell>
                    <TableCell>{emp.positionName || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(emp.hireDate * 1000).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[emp.status]} text-white border-0 text-xs`}
                      >
                        {STATUS_LABELS[emp.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {employeeTotal} 条记录，第 {employeePage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={employeePage <= 1}
                  onClick={() =>
                    fetchEmployees({
                      keyword: keyword || undefined,
                      status,
                      page: employeePage - 1,
                    })
                  }
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={employeePage >= totalPages}
                  onClick={() =>
                    fetchEmployees({
                      keyword: keyword || undefined,
                      status,
                      page: employeePage + 1,
                    })
                  }
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
