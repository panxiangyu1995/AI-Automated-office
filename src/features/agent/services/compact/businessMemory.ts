import type { Message, BusinessSessionMemory, DepartmentContext, ApprovalStatus } from '../../types/compact.types'
import { DEFAULT_CONFIG } from './constants'

function createDefaultDepartmentContext(): DepartmentContext {
  return {
    currentDepartment: 'management',
    currentDepartmentId: '',
    currentDepartmentName: '',
    relatedDepartments: [],
    permissions: [],
    activeWorkflows: [],
  }
}

function getMessageText(msg: Message): string {
  const textParts = msg.parts?.filter((p): p is { type: 'text'; content: string } => p.type === 'text')
  return textParts?.map(p => p.content).join('\n') || ''
}

function extractKeyEntities(messages: Message[]): BusinessSessionMemory['keyEntities'] {
  const entities = {
    documents: [] as Array<{ id: string; name: string; type: string; lastAccessed: Date }>,
    approvals: [] as Array<{ id: string; status: ApprovalStatus; deadline?: Date }>,
    employees: [] as Array<{ id: string; name: string; department: string }>,
  }
  const docPattern = /\b(doc|文档|文件|合同|报告):\s*(\w+)/gi
  const approvalPattern = /\b(审批|approve):\s*(\w+)/gi
  for (const msg of messages) {
    const text = getMessageText(msg)
    let match
    while ((match = docPattern.exec(text)) !== null) {
      entities.documents.push({ id: match[2], name: match[2], type: 'unknown', lastAccessed: new Date() })
    }
    while ((match = approvalPattern.exec(text)) !== null) {
      entities.approvals.push({ id: match[2], status: 'pending' })
    }
  }
  return entities
}

export class BusinessMemoryService {
  private memoryStore: Map<string, BusinessSessionMemory>

  constructor() {
    this.memoryStore = new Map()
  }

  extractMemory(sessionId: string, messages: Message[]): BusinessSessionMemory {
    const now = new Date()
    if (messages.length < DEFAULT_CONFIG.keepRecentMessages) {
      return {
        sessionId,
        departmentContext: createDefaultDepartmentContext(),
        keyEntities: { documents: [], approvals: [], employees: [] },
        conversationSummary: '',
        keyFacts: [],
        neverCompressEntities: [],
        lastUpdated: now,
      }
    }
    return {
      sessionId,
      departmentContext: createDefaultDepartmentContext(),
      keyEntities: extractKeyEntities(messages),
      conversationSummary: '对话总数: ' + messages.length + ' 条',
      keyFacts: [],
      neverCompressEntities: [],
      lastUpdated: now,
    }
  }

  getMemory(sessionId: string): BusinessSessionMemory | null {
    return this.memoryStore.get(sessionId) || null
  }

  compressWithMemory(sessionId: string, messages: Message[]): { keptMessages: Message[]; memory: BusinessSessionMemory } {
    const memory = this.getMemory(sessionId) || this.extractMemory(sessionId, messages)
    return { keptMessages: messages.slice(-DEFAULT_CONFIG.keepRecentMessages), memory }
  }
}

export const businessMemoryService = new BusinessMemoryService()
export default businessMemoryService
