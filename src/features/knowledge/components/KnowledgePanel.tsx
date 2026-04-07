/**
 * 知识库面板组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export function KnowledgePanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">知识库</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            企业知识库
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">知识库模块正在开发中，支持文档管理、分类检索、RAG智能问答。</p>
        </CardContent>
      </Card>
    </div>
  )
}
