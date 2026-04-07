/**
 * TenantSettings 租户设置组件
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, CheckCircle2 } from 'lucide-react'

export function TenantSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            租户信息
          </CardTitle>
          <CardDescription>当前租户的基本信息和配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">租户名称</div>
              <div className="font-medium">示例企业</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">租户编号</div>
              <div className="font-medium">tenant-001</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">套餐</div>
              <Badge className="bg-blue-500">企业版</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">用户数上限</div>
              <div className="font-medium">100 人</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            已启用模块
          </CardTitle>
          <CardDescription>当前租户已启用的业务模块</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['人力资源', '财务', '销售', '仓储', '审批'].map((m) => (
              <Badge key={m} variant="outline">{m}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
