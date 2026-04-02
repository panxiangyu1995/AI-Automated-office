import type { TriggerType, CompressionLayer, TriggerState, BusinessCompressionConfig } from '../../types/compact.types'
import { DEFAULT_CONFIG } from './constants'

export class CompactTriggerService {
  private config: BusinessCompressionConfig
  private state: TriggerState

  constructor() {
    this.config = DEFAULT_CONFIG
    this.state = {
      lastTriggerTime: new Map(),
      triggerCount: new Map(),
      pendingTriggers: [],
      suppressUntil: null,
    }
  }

  shouldTrigger(currentTokenCount: number): { shouldTrigger: boolean; triggerType?: TriggerType; strategy?: CompressionLayer } {
    if (this.state.pendingTriggers.includes('manual')) {
      return { shouldTrigger: true, triggerType: 'manual', strategy: 'business_full' }
    }
    if (currentTokenCount >= this.config.autoCompactBufferTokens) {
      return {
        shouldTrigger: true,
        triggerType: 'token_threshold',
        strategy: currentTokenCount >= this.config.fullCompactThreshold ? 'business_full' : 'micro',
      }
    }
    return { shouldTrigger: false }
  }

  recordTrigger(type: TriggerType): void {
    this.state.lastTriggerTime.set(type, new Date())
    this.state.pendingTriggers = this.state.pendingTriggers.filter((t: TriggerType) => t !== type)
  }

  requestManualTrigger(): void {
    if (!this.state.pendingTriggers.includes('manual')) {
      this.state.pendingTriggers.push('manual')
    }
  }
}

export const compactTriggerService = new CompactTriggerService()
export default compactTriggerService
