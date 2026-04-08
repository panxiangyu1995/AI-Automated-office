/**
 * Search Providers
 * 
 * Individual search providers for different resource types.
 * Each provider implements the SearchProvider interface.
 */

import { FolderOpen, FileText, FileCode, BookOpen, Users, LucideIcon } from 'lucide-react'
import {
  SearchProvider,
  SearchResult,
  SearchableResourceType,
  SearchProviderOptions,
  MAX_RESULTS_PER_PROVIDER,
} from './types'

/**
 * Calculate fuzzy match score
 */
function fuzzyMatch(query: string, text: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  if (lowerText === lowerQuery) return 100
  if (lowerText.startsWith(lowerQuery)) return 80
  if (lowerText.includes(lowerQuery)) return 60
  
  // Simple fuzzy matching - check character overlap
  let matches = 0
  let queryIndex = 0
  for (const char of lowerText) {
    if (queryIndex < lowerQuery.length && char === lowerQuery[queryIndex]) {
      matches++
      queryIndex++
    }
  }
  
  if (queryIndex === lowerQuery.length) {
    return 40 * (matches / lowerQuery.length)
  }
  
  return 0
}

/**
 * Project Search Provider
 */
class ProjectSearchProviderImpl implements SearchProvider {
  readonly type: SearchableResourceType = 'project'
  readonly displayName = '项目'
  
  private projects: Map<string, SearchResult> = new Map()
  
  async search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]> {
    if (!query.trim()) return []
    
    const limit = options?.limit ?? MAX_RESULTS_PER_PROVIDER
    const results: Array<SearchResult & { matchScore: number }> = []
    
    for (const [_id, project] of this.projects) {
      const titleScore = fuzzyMatch(query, project.title)
      const subtitleScore = fuzzyMatch(query, project.subtitle)
      const maxScore = Math.max(titleScore, subtitleScore)
      
      if (maxScore > 0) {
        results.push({
          ...project,
          score: maxScore,
          matchScore: maxScore,
        })
      }
    }
    
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore: _, ...result }) => result)
  }
  
  supports(type: SearchableResourceType): boolean {
    return type === 'project'
  }
  
  async getRecent(limit = 5): Promise<SearchResult[]> {
    const sorted = Array.from(this.projects.values())
      .filter(p => p.lastAccessedAt)
      .sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() ?? 0
        const bTime = b.lastAccessedAt?.getTime() ?? 0
        return bTime - aTime
      })
      .slice(0, limit)
    
    return sorted
  }
  
  // Methods to manage projects
  addProject(project: SearchResult): void {
    if (project.type === 'project') {
      this.projects.set(project.id, project)
    }
  }
  
  removeProject(id: string): void {
    this.projects.delete(id)
  }
  
  clear(): void {
    this.projects.clear()
  }
}

/**
 * Document Search Provider
 */
class DocumentSearchProviderImpl implements SearchProvider {
  readonly type: SearchableResourceType = 'document'
  readonly displayName = '文档'
  
  private documents: Map<string, SearchResult> = new Map()
  
  async search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]> {
    if (!query.trim()) return []
    
    const limit = options?.limit ?? MAX_RESULTS_PER_PROVIDER
    const results: Array<SearchResult & { matchScore: number }> = []
    
    for (const [_id, doc] of this.documents) {
      const titleScore = fuzzyMatch(query, doc.title)
      const subtitleScore = fuzzyMatch(query, doc.subtitle)
      const maxScore = Math.max(titleScore, subtitleScore)
      
      if (maxScore > 0) {
        results.push({
          ...doc,
          score: maxScore,
          matchScore: maxScore,
        })
      }
    }
    
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore: _, ...result }) => result)
  }
  
  supports(type: SearchableResourceType): boolean {
    return type === 'document'
  }
  
  async getRecent(limit = 5): Promise<SearchResult[]> {
    return Array.from(this.documents.values())
      .filter(d => d.lastAccessedAt)
      .sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() ?? 0
        const bTime = b.lastAccessedAt?.getTime() ?? 0
        return bTime - aTime
      })
      .slice(0, limit)
  }
  
  addDocument(doc: SearchResult): void {
    if (doc.type === 'document') {
      this.documents.set(doc.id, doc)
    }
  }
  
  removeDocument(id: string): void {
    this.documents.delete(id)
  }
  
  clear(): void {
    this.documents.clear()
  }
}

/**
 * Template Search Provider
 */
class TemplateSearchProviderImpl implements SearchProvider {
  readonly type: SearchableResourceType = 'template'
  readonly displayName = '模板'
  
  private templates: Map<string, SearchResult> = new Map()
  
  async search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]> {
    if (!query.trim()) return []
    
    const limit = options?.limit ?? MAX_RESULTS_PER_PROVIDER
    const results: Array<SearchResult & { matchScore: number }> = []
    
    for (const [_id, template] of this.templates) {
      const titleScore = fuzzyMatch(query, template.title)
      const subtitleScore = fuzzyMatch(query, template.subtitle)
      const maxScore = Math.max(titleScore, subtitleScore)
      
      if (maxScore > 0) {
        results.push({
          ...template,
          score: maxScore,
          matchScore: maxScore,
        })
      }
    }
    
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore: _, ...result }) => result)
  }
  
  supports(type: SearchableResourceType): boolean {
    return type === 'template'
  }
  
  async getRecent(limit = 5): Promise<SearchResult[]> {
    return Array.from(this.templates.values())
      .filter(t => t.lastAccessedAt)
      .sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() ?? 0
        const bTime = b.lastAccessedAt?.getTime() ?? 0
        return bTime - aTime
      })
      .slice(0, limit)
  }
  
  addTemplate(template: SearchResult): void {
    if (template.type === 'template') {
      this.templates.set(template.id, template)
    }
  }
  
  removeTemplate(id: string): void {
    this.templates.delete(id)
  }
  
  clear(): void {
    this.templates.clear()
  }
}

/**
 * Knowledge Search Provider
 */
class KnowledgeSearchProviderImpl implements SearchProvider {
  readonly type: SearchableResourceType = 'knowledge'
  readonly displayName = '知识'
  
  private knowledgeItems: Map<string, SearchResult> = new Map()
  
  async search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]> {
    if (!query.trim()) return []
    
    const limit = options?.limit ?? MAX_RESULTS_PER_PROVIDER
    const results: Array<SearchResult & { matchScore: number }> = []
    
    for (const [_id, item] of this.knowledgeItems) {
      const titleScore = fuzzyMatch(query, item.title)
      const subtitleScore = fuzzyMatch(query, item.subtitle)
      const maxScore = Math.max(titleScore, subtitleScore)
      
      if (maxScore > 0) {
        results.push({
          ...item,
          score: maxScore,
          matchScore: maxScore,
        })
      }
    }
    
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore: _, ...result }) => result)
  }
  
  supports(type: SearchableResourceType): boolean {
    return type === 'knowledge'
  }
  
  async getRecent(limit = 5): Promise<SearchResult[]> {
    return Array.from(this.knowledgeItems.values())
      .filter(k => k.lastAccessedAt)
      .sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() ?? 0
        const bTime = b.lastAccessedAt?.getTime() ?? 0
        return bTime - aTime
      })
      .slice(0, limit)
  }
  
  addKnowledge(item: SearchResult): void {
    if (item.type === 'knowledge') {
      this.knowledgeItems.set(item.id, item)
    }
  }
  
  removeKnowledge(id: string): void {
    this.knowledgeItems.delete(id)
  }
  
  clear(): void {
    this.knowledgeItems.clear()
  }
}

/**
 * User Search Provider
 */
class UserSearchProviderImpl implements SearchProvider {
  readonly type: SearchableResourceType = 'user'
  readonly displayName = '用户'
  
  private users: Map<string, SearchResult> = new Map()
  
  async search(query: string, options?: SearchProviderOptions): Promise<SearchResult[]> {
    if (!query.trim()) return []
    
    const limit = options?.limit ?? MAX_RESULTS_PER_PROVIDER
    const results: Array<SearchResult & { matchScore: number }> = []
    
    for (const [_id, user] of this.users) {
      const titleScore = fuzzyMatch(query, user.title)
      const subtitleScore = fuzzyMatch(query, user.subtitle)
      const maxScore = Math.max(titleScore, subtitleScore)
      
      if (maxScore > 0) {
        results.push({
          ...user,
          score: maxScore,
          matchScore: maxScore,
        })
      }
    }
    
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore: _, ...result }) => result)
  }
  
  supports(type: SearchableResourceType): boolean {
    return type === 'user'
  }
  
  async getRecent(limit = 5): Promise<SearchResult[]> {
    return Array.from(this.users.values())
      .filter(u => u.lastAccessedAt)
      .sort((a, b) => {
        const aTime = a.lastAccessedAt?.getTime() ?? 0
        const bTime = b.lastAccessedAt?.getTime() ?? 0
        return bTime - aTime
      })
      .slice(0, limit)
  }
  
  addUser(user: SearchResult): void {
    if (user.type === 'user') {
      this.users.set(user.id, user)
    }
  }
  
  removeUser(id: string): void {
    this.users.delete(id)
  }
  
  clear(): void {
    this.users.clear()
  }
}

// Singleton instances
export const projectSearchProvider = new ProjectSearchProviderImpl()
export const documentSearchProvider = new DocumentSearchProviderImpl()
export const templateSearchProvider = new TemplateSearchProviderImpl()
export const knowledgeSearchProvider = new KnowledgeSearchProviderImpl()
export const userSearchProvider = new UserSearchProviderImpl()

// All providers
export const allProviders: SearchProvider[] = [
  projectSearchProvider,
  documentSearchProvider,
  templateSearchProvider,
  knowledgeSearchProvider,
  userSearchProvider,
]

// Icon mapping for resource types
export const resourceTypeIcons: Record<SearchableResourceType, LucideIcon> = {
  project: FolderOpen,
  document: FileText,
  template: FileCode,
  knowledge: BookOpen,
  user: Users,
}
