/**
 * 知识库页面 - 核心部门（不可卸载）
 * 铁律来源: PRD 核心部门定义
 */
import { KnowledgeBaseManager } from '../components/KnowledgeBaseManager'
import { RAGQueryPanel } from '../components/RAGQueryPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function KnowledgePage() {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--ao-workbench.border)' }}>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ao-workbench.foreground)' }}>
          知识库
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="bases">
          <TabsList>
            <TabsTrigger value="bases">知识库管理</TabsTrigger>
            <TabsTrigger value="rag">RAG 问答</TabsTrigger>
          </TabsList>
          <TabsContent value="bases" className="mt-4">
            <KnowledgeBaseManager />
          </TabsContent>
          <TabsContent value="rag" className="mt-4">
            <RAGQueryPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
