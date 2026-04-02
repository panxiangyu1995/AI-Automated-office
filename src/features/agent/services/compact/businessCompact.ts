import type { Message, DepartmentContext, ApprovalChainStatus, CompressionResult, BusinessCompactSummary } from '../../types/compact.types'

function getMessageText(msg: Message): string {
  const textParts = msg.parts?.filter((p): p is { type: 'text'; content: string } => p.type === 'text')
  return textParts?.map(p => p.content).join('\n') || ''
}

function generateSimpleSummary(messages: Message[]): Partial<BusinessCompactSummary> {
  const userMessages = messages.filter(m => m.role === 'user')
  return {
    primaryRequest: userMessages.length > 0 ? getMessageText(userMessages[userMessages.length - 1]) : '无',
    keyBusinessConcepts: [],
    documentsAndData: [],
    decisionsAndResolutions: [],
    problemSolving: [],
    allUserMessages: userMessages.map(getMessageText),
    pendingTasks: [],
    currentWork: '',
    optionalNextStep: '',
    departmentContext: { currentDepartment: 'management', currentDepartmentId: '', currentDepartmentName: '', relatedDepartments: [], permissions: [], activeWorkflows: [] },
    relatedDocuments: [],
    crossDepartmentDependencies: { pending: [], completed: [] },
    businessRulesApplied: { applied: [], custom: [] },
  }
}

export class BusinessFullCompactService {
  async execute(messages: Message[], options?: { departmentContext?: DepartmentContext; approvalChain?: ApprovalChainStatus }): Promise<CompressionResult> {
    const startTime = Date.now()
    const simpleSummary = generateSimpleSummary(messages)
    const summary: BusinessCompactSummary = {
      primaryRequest: simpleSummary.primaryRequest || '无',
      keyBusinessConcepts: simpleSummary.keyBusinessConcepts || [],
      documentsAndData: simpleSummary.documentsAndData || [],
      decisionsAndResolutions: simpleSummary.decisionsAndResolutions || [],
      problemSolving: simpleSummary.problemSolving || [],
      allUserMessages: simpleSummary.allUserMessages || [],
      pendingTasks: simpleSummary.pendingTasks || [],
      currentWork: simpleSummary.currentWork || '',
      optionalNextStep: simpleSummary.optionalNextStep || '',
      departmentContext: options?.departmentContext || simpleSummary.departmentContext || { currentDepartment: 'management', currentDepartmentId: '', currentDepartmentName: '', relatedDepartments: [], permissions: [], activeWorkflows: [] },
      approvalChainStatus: options?.approvalChain,
      relatedDocuments: simpleSummary.relatedDocuments || [],
      crossDepartmentDependencies: simpleSummary.crossDepartmentDependencies || { pending: [], completed: [] },
      businessRulesApplied: simpleSummary.businessRulesApplied || { applied: [], custom: [] },
      tokenCount: 0,
      createdAt: new Date(),
    }

    const keptMessages = messages.slice(-5)
    return {
      keptMessages,
      compressedMessages: messages.slice(0, -5),
      summary,
      preCompactTokenCount: messages.length * 100,
      postCompactTokenCount: keptMessages.length * 100 + summary.tokenCount,
      compressionRatio: 0.5,
      layer: 'business_full',
      duration: Date.now() - startTime,
    }
  }
}

export const businessCompactService = new BusinessFullCompactService()
export default businessCompactService
