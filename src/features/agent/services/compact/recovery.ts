import type { RecoveryAction, RecoveryResult } from '../../types/compact.types'
import { AUTO_RECOVERY_RULES } from './constants'

interface RecoveryCacheItem {
  entityId: string
  entityType: string
  content: unknown
  retrievedAt: Date
  expiresAt: Date
}

export class RecoveryService {
  private cache: Map<string, RecoveryCacheItem>

  constructor() {
    this.cache = new Map()
  }

  detectAutoRecovery(userMessage: string): RecoveryAction[] {
    const actions: RecoveryAction[] = []
    for (const rule of AUTO_RECOVERY_RULES) {
      if (rule.pattern && rule.pattern.test(userMessage)) {
        actions.push(rule.action)
      }
    }
    return actions
  }

  async recover(_action: RecoveryAction, entityId: string): Promise<RecoveryResult> {
    return {
      entityId,
      entityType: 'unknown',
      content: null,
      retrievedAt: new Date(),
      source: 'message_history',
      success: true,
    }
  }

  formatRecoveryResult(result: RecoveryResult): string {
    if (!result.success) return '恢复失败: ' + (result.error || '未知错误')
    return '[已恢复] ' + result.entityType + ': ' + result.entityId
  }
}

export const recoveryService = new RecoveryService()
export default recoveryService
