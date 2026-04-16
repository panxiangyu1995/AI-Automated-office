import { useState, useCallback } from 'react'
import {
  Search,
  Send,
  Loader2,
  FileText,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface RAGMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { docId: string; title: string; relevance: number }[]
  timestamp: Date
}

export function RAGQueryPanel() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<RAGMessage[]>([])
  const [isQuerying, setIsQuerying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || isQuerying) return

    const userMessage: RAGMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsQuerying(true)
    setError(null)

    try {
      // TODO: Replace with actual RAG API call
      // const result = await ragApi.query(query)
      const assistantMessage: RAGMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `基于知识库检索，以下是关于"${userMessage.content}"的回答：\n\n该功能正在开发中，请稍后使用真实的 RAG 检索增强生成服务。`,
        sources: [
          { docId: 'doc-1', title: '企业规章制度', relevance: 0.92 },
          { docId: 'doc-2', title: '财务管理办法', relevance: 0.85 },
        ],
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsQuerying(false)
    }
  }, [query, isQuerying])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">RAG 智能问答</h2>
        </div>
        <Badge variant="outline" className="text-xs">检索增强生成</Badge>
      </div>

      {error && (
        <div className="p-3 mx-4 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <EmptyState
              icon={BookOpen}
              variant="search"
              title="开始提问"
              description="输入问题，AI 将基于知识库内容进行检索和回答"
            />
            <div className="flex flex-wrap gap-2 mt-4 max-w-md">
              {['公司请假制度是什么？', '财务报销流程', '年假如何计算'].map(suggestion => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">参考来源:</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map(source => (
                          <Badge key={source.docId} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {source.title}
                            <span className="ml-1 text-muted-foreground">
                              {Math.round(source.relevance * 100)}%
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isQuerying && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在检索知识库...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入问题，按回车搜索..."
              className="pl-9"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              disabled={isQuerying}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!query.trim() || isQuerying}>
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
