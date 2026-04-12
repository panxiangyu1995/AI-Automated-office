/**
 * PluginRecommendationCard Component
 * 
 * Inline recommendation card shown in AI chat when a plugin capability is matched.
 * Supports install, try, and dismiss actions.
 */

import { Sparkles, X, ArrowRight, Plug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PluginCapabilitiesRegistry, type PluginCapabilityDescriptor, type PluginAction } from '@/lib/pluginCapabilities'
import { CommandRegistry } from '@/lib/commandRegistry'

interface PluginRecommendationCardProps {
  plugin: PluginCapabilityDescriptor
  matchedKeywords?: string[]
  onDismiss?: () => void
  className?: string
}

export function PluginRecommendationCard({
  plugin,
  matchedKeywords,
  onDismiss,
  className,
}: PluginRecommendationCardProps) {
  const Icon = plugin.icon || Plug

  const handleTry = async (action?: PluginAction) => {
    // Execute the command if available
    if (action?.commandId) {
      await CommandRegistry.execute(action.commandId)
    } else if (plugin.actions[0]?.commandId) {
      await CommandRegistry.execute(plugin.actions[0].commandId)
    }
    onDismiss?.()
  }

  const handleDismiss = () => {
    PluginCapabilitiesRegistry.dismiss(plugin.pluginId)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 my-2',
        'bg-slate-50 border-slate-200',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-800">
                {plugin.pluginName}
              </h4>
              {matchedKeywords && matchedKeywords.length > 0 && (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {plugin.description}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          title="不再提示"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Matched keywords highlight */}
      {matchedKeywords && matchedKeywords.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs text-slate-500">匹配关键词:</span>
          <div className="flex flex-wrap gap-1">
            {matchedKeywords.map((kw, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => handleTry(plugin.actions[0])}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'text-xs font-medium text-white',
            'transition-colors'
          )}
          style={{ backgroundColor: '#1E3A5F' }}
        >
          试试
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {plugin.actions.length > 1 && (
          <div className="flex items-center gap-1">
            {plugin.actions.slice(1, 3).map((action, i) => (
              <button
                key={i}
                onClick={() => handleTry(action)}
                className="px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {action.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export type { PluginAction } from '@/lib/pluginCapabilities'
