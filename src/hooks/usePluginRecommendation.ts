/**
 * usePluginRecommendation Hook
 * 
 * Provides plugin capability matching and recommendation for AI chat.
 * Hooks into user input to suggest relevant plugins.
 */

import { useEffect, useState, useRef } from 'react'
import { PluginCapabilitiesRegistry, registerBuiltinCapabilities, type PluginCapabilityDescriptor } from '@/lib/pluginCapabilities'

interface PluginRecommendation {
  plugin: PluginCapabilityDescriptor
  matchedKeywords: string[]
  score: number
}

interface UsePluginRecommendationOptions {
  /** Minimum score threshold for recommendations (0-100) */
  threshold?: number
  /** Maximum number of recommendations to show */
  maxRecommendations?: number
  /** Auto-register built-in capabilities on mount */
  registerBuiltin?: boolean
}

interface UsePluginRecommendationReturn {
  /** Match user input against plugin capabilities */
  match: (input: string) => PluginRecommendation[]
  /** Current recommendations based on last match */
  recommendations: PluginRecommendation[]
  /** Check if there are any recommendations available */
  hasRecommendations: boolean
  /** Dismiss a recommendation */
  dismiss: (pluginId: string) => void
  /** Clear all recommendations */
  clear: () => void
}

export function usePluginRecommendation(
  options: UsePluginRecommendationOptions = {}
): UsePluginRecommendationReturn {
  const {
    threshold = 5,
    maxRecommendations = 3,
    registerBuiltin = true,
  } = options

  const [recommendations, setRecommendations] = useState<PluginRecommendation[]>([])
  const lastInputRef = useRef('')

  // Register built-in capabilities once
  useEffect(() => {
    if (registerBuiltin) {
      registerBuiltinCapabilities()
    }
  }, [registerBuiltin])

  const match = (input: string): PluginRecommendation[] => {
    lastInputRef.current = input
    
    if (!input.trim()) {
      return []
    }

    const lowerInput = input.toLowerCase()
    const words = lowerInput.split(/\s+/)

    const allCapabilities = PluginCapabilitiesRegistry.getAll()
    
    const results = allCapabilities
      .map(cap => {
        let score = 0
        const matchedKeywords: string[] = []

        // Exact keyword match
        for (const kw of cap.keywords) {
          if (lowerInput.includes(kw.toLowerCase())) {
            score += 10
            matchedKeywords.push(kw)
          }
        }

        // Partial word match
        for (const word of words) {
          if (!word || word.length < 2) continue
          for (const kw of cap.keywords) {
            if (kw.toLowerCase().includes(word) && !matchedKeywords.includes(kw)) {
              score += 3
              matchedKeywords.push(kw)
            }
          }
          if (cap.pluginName.toLowerCase().includes(word)) {
            score += 2
          }
        }

        return { plugin: cap, score, matchedKeywords }
      })
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)

    setRecommendations(results)
    return results
  }

  const dismiss = (pluginId: string) => {
    PluginCapabilitiesRegistry.dismiss(pluginId)
    setRecommendations(prev => prev.filter(r => r.plugin.pluginId !== pluginId))
  }

  const clear = () => {
    setRecommendations([])
  }

  return {
    match,
    recommendations,
    hasRecommendations: recommendations.length > 0,
    dismiss,
    clear,
  }
}
