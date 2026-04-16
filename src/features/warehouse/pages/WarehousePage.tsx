/**
 * 仓库管理页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { LocationListPage } from './LocationListPage'
import { MovementListPage } from './MovementListPage'
import { WarningListPage } from './WarningListPage'
import { LogisticsTrackingPage } from './LogisticsTrackingPage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function WarehousePage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          仓库管理
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="locations">
          <TabsList>
            <TabsTrigger value="locations">库位管理</TabsTrigger>
            <TabsTrigger value="movements">出入库</TabsTrigger>
            <TabsTrigger value="warnings">预警</TabsTrigger>
            <TabsTrigger value="logistics">物流追踪</TabsTrigger>
          </TabsList>
          <TabsContent value="locations" className="mt-4">
            <LocationListPage />
          </TabsContent>
          <TabsContent value="movements" className="mt-4">
            <MovementListPage />
          </TabsContent>
          <TabsContent value="warnings" className="mt-4">
            <WarningListPage />
          </TabsContent>
          <TabsContent value="logistics" className="mt-4">
            <LogisticsTrackingPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
