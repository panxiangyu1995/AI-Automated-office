import type { Message, CompressibleType, MicroCompactResult } from '../../types/compact.types'
import { DEFAULT_CONFIG } from './constants'

export class MicroCompactService {
  execute(messages: Message[]): MicroCompactResult {
    const startTime = Date.now()
    const clearedItems: MicroCompactResult['clearedItems'] = []
    const keptItems: MicroCompactResult['keptItems'] = []
    const tokensFreed = 0

    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = a.createdAt || 0
      const bTime = b.createdAt || 0
      return aTime - bTime
    })

    const keepRecentCount = DEFAULT_CONFIG.keepRecentResults
    const recentMessages = sortedMessages.slice(-keepRecentCount)
    const olderMessages = sortedMessages.slice(0, -keepRecentCount)

    for (const msg of olderMessages) {
      keptItems.push({ messageId: msg.id, contentType: 'notification' as CompressibleType, retained: 'full' })
    }

    for (const msg of recentMessages) {
      keptItems.push({ messageId: msg.id, contentType: 'notification' as CompressibleType, retained: 'full' })
    }

    return { clearedItems, keptItems, tokensFreed, duration: Date.now() - startTime }
  }
}

export const microCompactService = new MicroCompactService()
export default microCompactService
