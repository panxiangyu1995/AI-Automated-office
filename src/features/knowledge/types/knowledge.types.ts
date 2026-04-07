/**
 * Knowledge 模块类型定义
 */

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  author: string
  createdAt: number
  updatedAt: number
}
