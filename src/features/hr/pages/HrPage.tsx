/**
 * 人事管理页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { EmployeeList } from '../components/EmployeeList'
import { DepartmentTree } from '../components/DepartmentTree'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HrPage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          人事管理
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">员工列表</TabsTrigger>
            <TabsTrigger value="departments">部门架构</TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="mt-4">
            <EmployeeList />
          </TabsContent>
          <TabsContent value="departments" className="mt-4">
            <DepartmentTree />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
