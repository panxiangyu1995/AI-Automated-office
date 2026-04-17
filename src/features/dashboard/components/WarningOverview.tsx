import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

interface Warning {
  id: string
  title: string
  description: string
  warningType: string
}

interface WarningOverviewProps {
  warnings: Warning[]
}

export function WarningOverview({ warnings }: WarningOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          预警信息
          {warnings.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{warnings.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warnings.length === 0 ? (
          <EmptyState variant="default" title="暂无预警" description="系统运行正常" />
        ) : (
          <div className="space-y-2">
            {warnings.map((w) => (
              <div key={w.id} className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.description}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{w.warningType}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
