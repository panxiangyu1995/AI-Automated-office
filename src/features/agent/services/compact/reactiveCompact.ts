import type { Message } from '../../types/compact.types'
import { REACTIVE_COMPACT_CONFIG } from './constants'

export class ReactiveCompactService {
  execute(messages: Message[], _targetTokens: number): { deletedRounds: number[]; tokensFreed: number; remainingTokens: number } {
    const deletedRounds: number[] = []
    let tokensFreed = 0
    const keptMessages = messages.slice(-REACTIVE_COMPACT_CONFIG.keepRecentRounds)
    const remainingTokens = keptMessages.length * 100
    tokensFreed = messages.length * 100 - remainingTokens
    return { deletedRounds, tokensFreed, remainingTokens }
  }
}

export const reactiveCompactService = new ReactiveCompactService()
export default reactiveCompactService
