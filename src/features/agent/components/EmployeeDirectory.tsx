/**
 * Employee Directory - Story 11.1
 * 员工通讯录 - 可搜索的员工目录，用于 Agent 协作
 *
 * 功能：
 * - 可搜索的员工目录 UI
 * - 在权限范围内显示目录条目
 * - 为聊天和 Agent 协作准备参与者选择
 *
 * 铁律合规：
 * - FR90, FR91
 * - NFR16
 * - ADR-037
 * - UX-01, UX-02
 */

import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Search,
  Users,
  Building2,
  Mail,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Types
export type EmployeeStatus = 'online' | 'offline' | 'busy' | 'away'

export interface Employee {
  id: string
  name: string
  avatar?: string
  department: string
  position: string
  email: string
  phone?: string
  status: EmployeeStatus
  isCurrentUser?: boolean
}

export interface Department {
  id: string
  name: string
  employeeCount: number
  employees: Employee[]
  expanded?: boolean
}

export interface DirectoryStats {
  totalEmployees: number
  onlineCount: number
  departmentsCount: number
  selectedCount: number
}

export interface EmployeeDirectoryProps {
  mode?: 'view' | 'select'
  selectedEmployees?: string[]
  onEmployeesSelected?: (employeeIds: string[]) => void
  maxSelection?: number
  showOnlyDepartment?: boolean
}

// ==================== API Hooks ====================

import { useEffect } from 'react'
import { listEmployees, getDepartmentTree } from '@/features/hr/api/hrApi'
import type { EmployeeListItem, DepartmentTreeNode } from '@/features/hr/types/hr.types'

// Convert API Employee to UI Employee
function convertToEmployee(item: EmployeeListItem): Employee {
  return {
    id: item.id,
    name: item.name,
    avatar: undefined,
    department: item.departmentName || '',
    position: item.positionName || '',
    email: item.email,
    phone: undefined,
    status: item.status === 'active' ? 'online' : 'offline',
    isCurrentUser: false,
  }
}

// Convert API Department to UI Department
function convertToDepartment(node: DepartmentTreeNode, employees: Employee[]): Department {
  return {
    id: node.department.id,
    name: node.department.name,
    employeeCount: node.employeeCount,
    employees: employees.filter((e) => e.department === node.department.name),
    expanded: true,
  }
}

// Hook to fetch employees from API
function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true)
        const result = await listEmployees({ page: 1, pageSize: 100 })
        const items = result.items.map(convertToEmployee)
        setEmployees(items)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        setError('获取员工列表失败')
        // Fallback to mock data on error
        setEmployees(MOCK_EMPLOYEES)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  return { employees, loading, error }
}

// Hook to fetch department tree
function useDepartments(employees: Employee[]) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDepartments() {
      try {
        setLoading(true)
        const tree = await getDepartmentTree()
        const depts = tree.map((node) => convertToDepartment(node, employees))
        setDepartments(depts)
      } catch (err) {
        console.error('Failed to fetch departments:', err)
        // Fallback: group employees by department
        const deptMap = new Map<string, Employee[]>()
        employees.forEach((emp) => {
          const existing = deptMap.get(emp.department) || []
          deptMap.set(emp.department, [...existing, emp])
        })
        const depts = Array.from(deptMap.entries()).map(([name, emps], index) => ({
          id: `dept-${index}`,
          name,
          employeeCount: emps.length,
          employees: emps,
          expanded: true,
        }))
        setDepartments(depts)
      } finally {
        setLoading(false)
      }
    }
    if (employees.length > 0) {
      fetchDepartments()
    }
  }, [employees])

  return { departments, loading }
}

// ==================== Mock Data ====================

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: '张小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    department: '技术部',
    position: '前端开发工程师',
    email: 'xiaoming.zhang@company.com',
    phone: '138****1234',
    status: 'online',
  },
  {
    id: 'emp-2',
    name: '李婷婷',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    department: '技术部',
    position: '后端开发工程师',
    email: 'tingting.li@company.com',
    phone: '139****5678',
    status: 'busy',
  },
  {
    id: 'emp-3',
    name: '王建国',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    department: '产品部',
    position: '产品经理',
    email: 'jianguo.wang@company.com',
    phone: '137****9012',
    status: 'online',
  },
  {
    id: 'emp-4',
    name: '刘芳',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liu',
    department: '设计部',
    position: 'UI设计师',
    email: 'fang.liu@company.com',
    phone: '136****3456',
    status: 'away',
  },
  {
    id: 'emp-5',
    name: '陈志强',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen',
    department: '市场部',
    position: '市场总监',
    email: 'zhiqiang.chen@company.com',
    phone: '135****7890',
    status: 'offline',
  },
  {
    id: 'emp-6',
    name: '赵敏',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhao',
    department: '人事部',
    position: '人事专员',
    email: 'min.zhao@company.com',
    phone: '134****2345',
    status: 'online',
  },
  {
    id: 'emp-7',
    name: '孙伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sun',
    department: '财务部',
    position: '财务经理',
    email: 'wei.sun@company.com',
    phone: '133****6789',
    status: 'online',
  },
  {
    id: 'emp-8',
    name: '周莉',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhou',
    department: '销售部',
    position: '销售代表',
    email: 'li.zhou@company.com',
    phone: '132****0123',
    status: 'busy',
  },
  {
    id: 'current-user',
    name: '当前用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
    department: '技术部',
    position: '开发工程师',
    email: 'me@company.com',
    phone: '131****4567',
    status: 'online',
    isCurrentUser: true,
  },
]

// Calculate stats
function calculateStats(employees: Employee[], selectedIds: string[]): DirectoryStats {
  return {
    totalEmployees: employees.length,
    onlineCount: employees.filter((e) => e.status === 'online' || e.status === 'busy').length,
    departmentsCount: new Set(employees.map((e) => e.department)).size,
    selectedCount: selectedIds.length,
  }
}

// Status badge color
function getStatusColor(status: EmployeeStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-red-500'
    case 'away':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

// Status text
function getStatusText(status: EmployeeStatus): string {
  switch (status) {
    case 'online':
      return '在线'
    case 'busy':
      return '忙碌'
    case 'away':
      return '离开'
    case 'offline':
      return '离线'
    default:
      return '未知'
  }
}

/**
 * Employee Directory Component
 */
export function EmployeeDirectory({
  mode = 'view',
  selectedEmployees = [],
  onEmployeesSelected,
  maxSelection = 10,
  showOnlyDepartment = false,
}: EmployeeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string[]>(selectedEmployees)
  const [showOnlyMyDepartment, setShowOnlyMyDepartment] = useState(showOnlyDepartment)
  const [showSelectDialog, setShowSelectDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('department')

  // Fetch employees and departments from API
  const { employees } = useEmployees()
  const { departments: apiDepartments } = useDepartments(employees)

  // Use API departments if available, otherwise fallback to mock grouping
  const allDepartments = useMemo(() => {
    if (apiDepartments.length > 0) {
      return apiDepartments
    }
    // Fallback: group by department
    const deptMap = new Map<string, Employee[]>()
    employees.forEach((emp) => {
      const existing = deptMap.get(emp.department) || []
      deptMap.set(emp.department, [...existing, emp])
    })
    return Array.from(deptMap.entries()).map(([name, emps], index) => ({
      id: `dept-${index}`,
      name,
      employeeCount: emps.length,
      employees: emps,
      expanded: true,
    }))
  }, [apiDepartments, employees])

  // Filter employees based on search and department filter
  const filteredEmployees = useMemo(() => {
    let result = employees.length > 0 ? employees : MOCK_EMPLOYEES

    // Filter by current user's department if enabled
    if (showOnlyMyDepartment) {
      const currentUser = result.find((e) => e.isCurrentUser)
      if (currentUser) {
        result = result.filter((e) => e.department === currentUser.department || e.isCurrentUser)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query) ||
          e.position.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query)
      )
    }

    return result
  }, [employees, searchQuery, showOnlyMyDepartment])

  // Filter departments based on filtered employees
  const filteredDepartments = useMemo(() => {
    if (allDepartments.length > 0) {
      // Filter departments based on filtered employees
      return allDepartments
        .map((dept) => ({
          ...dept,
          employees: filteredEmployees.filter((e) => e.department === dept.name),
          employeeCount: filteredEmployees.filter((e) => e.department === dept.name).length,
        }))
        .filter((dept) => dept.employeeCount > 0)
    }
    return []
  }, [allDepartments, filteredEmployees])

  // Stats
  const stats = useMemo(
    () => calculateStats(filteredEmployees, selected),
    [filteredEmployees, selected]
  )

  // Toggle department expanded
  const toggleDepartment = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) {
        next.delete(deptId)
      } else {
        next.add(deptId)
      }
      return next
    })
  }

  // Toggle employee selection
  const toggleEmployee = (empId: string) => {
    if (mode !== 'select') return

    setSelected((prev) => {
      if (prev.includes(empId)) {
        return prev.filter((id) => id !== empId)
      }
      if (maxSelection && prev.length >= maxSelection) {
        return prev
      }
      return [...prev, empId]
    })
  }

  // Handle confirm selection
  const handleConfirm = () => {
    onEmployeesSelected?.(selected)
    setShowSelectDialog(false)
  }

  // Handle remove from selected
  const removeSelected = (empId: string) => {
    setSelected((prev) => prev.filter((id) => id !== empId))
  }

  // Get selected employees details
  const selectedEmployeesList = useMemo(
    () => filteredEmployees.filter((e) => selected.includes(e.id)),
    [filteredEmployees, selected]
  )

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            员工通讯录
          </h2>
          {mode === 'select' && (
            <Button onClick={() => setShowSelectDialog(true)} size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              选择参与者
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-800">{stats.totalEmployees}</div>
            <div className="text-xs text-slate-500">总人数</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{stats.onlineCount}</div>
            <div className="text-xs text-slate-500">在线</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-slate-600">{stats.departmentsCount}</div>
            <div className="text-xs text-slate-500">部门数</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索姓名、部门、职位..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <Switch
            id="dept-filter"
            checked={showOnlyMyDepartment}
            onCheckedChange={setShowOnlyMyDepartment}
          />
          <Label htmlFor="dept-filter" className="text-sm text-slate-600 cursor-pointer">
            只看本部门
          </Label>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-white px-4">
          <TabsTrigger value="department">按部门</TabsTrigger>
          <TabsTrigger value="list">列表</TabsTrigger>
        </TabsList>

        {/* Department View */}
        <TabsContent value="department" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="bg-white rounded-lg border border-slate-200">
                  {/* Department Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => toggleDepartment(dept.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedDepts.has(dept.id) ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-800">{dept.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {dept.employeeCount}
                      </Badge>
                    </div>
                  </div>

                  {/* Employees */}
                  {expandedDepts.has(dept.id) && (
                    <div className="border-t border-slate-100">
                      {dept.employees.map((emp) => (
                        <div
                          key={emp.id}
                          className={`flex items-center justify-between p-3 pl-10 hover:bg-slate-50 ${
                            selected.includes(emp.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={emp.avatar} />
                                <AvatarFallback>{emp.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
                                  emp.status
                                )}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800 truncate">
                                  {emp.name}
                                </span>
                                {emp.isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">
                                    我
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{emp.position}</div>
                            </div>
                          </div>
                          {mode === 'select' && (
                            <Button
                              variant={selected.includes(emp.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleEmployee(emp.id)
                              }}
                              disabled={
                                !selected.includes(emp.id) &&
                                maxSelection !== undefined &&
                                selected.length >= maxSelection
                              }
                            >
                              {selected.includes(emp.id) ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  已选
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  选择
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {filteredDepartments.length === 0 && (
                <EmptyState
                  variant={searchQuery ? 'search' : 'data'}
                  title={searchQuery ? '未找到匹配的员工' : '暂无员工数据'}
                  description={searchQuery ? '尝试其他搜索条件' : '尚未添加员工信息'}
                  className="py-8"
                />
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>职位</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>联系方式</TableHead>
                  {mode === 'select' && <TableHead>操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{emp.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{emp.name}</span>
                        {emp.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            我
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(emp.status)} text-white border-0`}
                      >
                        {getStatusText(emp.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="h-3 w-3" />
                        {emp.email}
                      </div>
                    </TableCell>
                    {mode === 'select' && (
                      <TableCell>
                        <Button
                          variant={selected.includes(emp.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleEmployee(emp.id)}
                          disabled={
                            !selected.includes(emp.id) &&
                            maxSelection !== undefined &&
                            selected.length >= maxSelection
                          }
                        >
                          {selected.includes(emp.id) ? '已选' : '选择'}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Selection Dialog */}
      <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择参与者</DialogTitle>
            <DialogDescription>
              已选择 {selected.length} 人{maxSelection && ` (最多 ${maxSelection} 人)`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selected.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>请选择参与者</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedEmployeesList.map((emp) => (
                  <Badge
                    key={emp.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={emp.avatar} />
                      <AvatarFallback>{emp.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {emp.name}
                    <button
                      onClick={() => removeSelected(emp.id)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectDialog(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
