/**
 * 审批中心页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { ApprovalList } from '../components/ApprovalList'
import { ApprovalFlowTimeline } from '../components/ApprovalFlowTimeline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ApprovalPage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          审批中心
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">审批列表</TabsTrigger>
            <TabsTrigger value="timeline">流程时间线</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="mt-4">
            <ApprovalList />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <ApprovalFlowTimeline history={[]} currentStep={0} totalSteps={0} status="pending" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
