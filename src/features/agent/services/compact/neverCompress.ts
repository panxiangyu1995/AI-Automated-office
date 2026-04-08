import type {
  CompressibleType,
} from '../../types/compact.types'
import { COMPRESSIBLE_TYPES } from './constants'

const DOCUMENT_REFERENCE_PATTERN = /\b(doc|文档|文件|合同|报告|方案)\s*[#：:]\s*(\w+)/gi
const APPROVAL_REFERENCE_PATTERN = /\b(审批|approve)\s*[#：:]\s*(\w+)/gi

export function detectUserExplicitReferences(text: string): string[] {
  const references: string[] = []
  let match
  while ((match = DOCUMENT_REFERENCE_PATTERN.exec(text)) !== null) {
    references.push('doc:' + match[2])
  }
  while ((match = APPROVAL_REFERENCE_PATTERN.exec(text)) !== null) {
    references.push('approval:' + match[2])
  }
  return references
}

const APPROVAL_KEYWORDS = ['待审批', '待批准', '待审核', '审批中', '提交审批', 'approve', 'pending approval']
export function containsApprovalContent(text: string): boolean {
  const lowerText = text.toLowerCase()
  return APPROVAL_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

const FORM_DRAFT_KEYWORDS = ['草稿', 'draft', '未提交', '编辑中', '修改中']
export function containsFormDraft(text: string): boolean {
  const lowerText = text.toLowerCase()
  return FORM_DRAFT_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()))
}

export function containsNeverCompressContent(message: { role: string; parts?: Array<{ type: string; content?: string }> }): boolean {
  const text = message.role === 'user' ? (message.parts?.find(p => p.type === 'text')?.content || '') : ''
  return /\b(待审批|审批中|pending approval|草稿|draft|未提交|进行中|处理中|in progress)\b/.test(text)
}

export function canCompressContentType(contentType: CompressibleType, createdAt: Date): { canCompress: boolean; reason: string; keepSummary: boolean } {
  const rule = COMPRESSIBLE_TYPES[contentType]
  if (!rule) return { canCompress: false, reason: '未知类型: ' + contentType, keepSummary: false }
  const now = new Date()
  const ageMs = now.getTime() - createdAt.getTime()
  let thresholdMs: number
  switch (rule.compressAfter) {
    case '30_minutes': thresholdMs = 30 * 60 * 1000; break
    case '1_hour': thresholdMs = 60 * 60 * 1000; break
    case '24_hours': thresholdMs = 24 * 60 * 60 * 1000; break
    default: thresholdMs = 30 * 60 * 1000
  }
  const canCompress = ageMs >= thresholdMs
  return { canCompress, reason: canCompress ? '超过 ' + rule.compressAfter : '未超过 ' + rule.compressAfter, keepSummary: rule.keepSummary }
}

export function generateCompressionSummary(_originalContent: string, contentType: CompressibleType): string {
  return '[' + contentType + ' 内容已压缩]'
}

export const neverCompressService = {
  detectUserExplicitReferences,
  containsApprovalContent,
  containsFormDraft,
  containsNeverCompressContent,
  canCompressContentType,
  generateCompressionSummary,
}

export default neverCompressService
