/**
 * PlanActModeConfig.tsx
 * Story 21.24 - LLM Provider Plan/Act 双配置模式
 * UI参考cline的设计风格
 */

import { useState } from 'react'
import { Bot, Eye, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

export type AgentMode = 'plan' | 'act'

export interface ModeProviderConfig {
  providerId: string
  modelId: string
  apiEndpoint?: string
  apiKey?: string
}

export interface PlanActConfig {
  planMode: ModeProviderConfig | null
  actMode: ModeProviderConfig
  currentMode: AgentMode
}

export interface ProviderInfo {
  id: string
  name: string
  type: string
  availableModels: string[]
}

// ============================================================================
// 常量

const AGENT_MODES: { value: AgentMode; label: string; description: string; icon: typeof Eye }[] = [
  {
    value: 'plan',
    label: 'Plan',
    description: 'Read-only tools only. Use for analysis and research.',
    icon: Eye,
  },
  {
    value: 'act',
    label: 'Act',
    description: 'All tools enabled. Use for execution.',
    icon: Rocket,
  },
]

// ============================================================================
// TabButton组件 - 参考cline样式

interface TabButtonProps {
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}

const TabButton = ({ children, isActive, onClick, disabled }: TabButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'none',
      border: 'none',
      borderBottom: `2px solid ${isActive ? 'var(--foreground)' : 'transparent'}`,
      color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
      padding: '8px 16px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '13px',
      marginBottom: '-1px',
      fontFamily: 'inherit',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {children}
  </button>
)

// ============================================================================
// Provider选择器组件

interface ProviderSelectProps {
  label: string
  value: string
  options: ProviderInfo[]
  onChange: (id: string) => void
}

const ProviderSelect = ({ label, value, options, onChange }: ProviderSelectProps) => (
  <div style={{ marginBottom: '12px' }}>
    <label
      style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 500,
        marginBottom: '4px',
        color: 'var(--muted-foreground)',
      }}
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid var(--border)',
        background: 'var(--input)',
        color: 'var(--foreground)',
        fontSize: '13px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
)

// ============================================================================
// Model选择器组件

interface ModelSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (id: string) => void
}

const ModelSelect = ({ label, value, options, onChange }: ModelSelectProps) => (
  <div style={{ marginBottom: '12px' }}>
    <label
      style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 500,
        marginBottom: '4px',
        color: 'var(--muted-foreground)',
      }}
    >
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid var(--border)',
        background: 'var(--input)',
        color: 'var(--foreground)',
        fontSize: '13px',
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
)

// ============================================================================
// 主组件

interface PlanActModeConfigProps {
  className?: string
  providers?: ProviderInfo[]
  initialPlanConfig?: ModeProviderConfig | null
  initialActConfig?: ModeProviderConfig
  onPlanConfigChange?: (config: ModeProviderConfig | null) => void
  onActConfigChange?: (config: ModeProviderConfig) => void
  onModeSwitch?: (mode: AgentMode) => void
}

export const PlanActModeConfig = ({
  className,
  providers = [],
  initialPlanConfig = null,
  initialActConfig,
  onPlanConfigChange,
  onActConfigChange,
  onModeSwitch,
}: PlanActModeConfigProps) => {
  const [currentMode, setCurrentMode] = useState<AgentMode>('act')
  const [planConfig, setPlanConfig] = useState<ModeProviderConfig | null>(initialPlanConfig)
  const [actConfig, setActConfig] = useState<ModeProviderConfig>(
    initialActConfig || (providers.length > 0 ? { providerId: providers[0].id, modelId: providers[0].availableModels[0] || '' } : { providerId: '', modelId: '' })
  )

  const selectedPlanProvider = providers.find((p) => p.id === planConfig?.providerId)
  const selectedActProvider = providers.find((p) => p.id === actConfig.providerId)

  const handleProviderChange = (mode: AgentMode) => (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    if (!provider) return

    if (mode === 'plan') {
      const newConfig = { providerId, modelId: provider.availableModels[0] || '' }
      setPlanConfig(newConfig)
      onPlanConfigChange?.(newConfig)
    } else {
      const newConfig = { ...actConfig, providerId, modelId: provider.availableModels[0] || '' }
      setActConfig(newConfig)
      onActConfigChange?.(newConfig)
    }
  }

  const handleModelChange = (mode: AgentMode) => (modelId: string) => {
    if (mode === 'plan') {
      if (planConfig) {
        const newConfig = { ...planConfig, modelId }
        setPlanConfig(newConfig)
        onPlanConfigChange?.(newConfig)
      }
    } else {
      const newConfig = { ...actConfig, modelId }
      setActConfig(newConfig)
      onActConfigChange?.(newConfig)
    }
  }

  const handleModeSwitch = (mode: AgentMode) => {
    setCurrentMode(mode)
    onModeSwitch?.(mode)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader style={{ paddingBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <CardTitle style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot style={{ width: '16px', height: '16px', color: 'var(--ao-infoForeground)' }} />
              Agent Mode
            </CardTitle>
            <CardDescription style={{ fontSize: '12px' }}>
              Configure different providers for Plan and Act modes
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentMode === 'plan' ? (
              <>
                <Eye style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                Plan
              </>
            ) : (
              <>
                <Rocket style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                Act
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent style={{ paddingTop: '16px' }}>
        {/* Tab buttons - 参考cline风格 */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          {AGENT_MODES.map((mode) => {
            const Icon = mode.icon
            return (
              <TabButton
                key={mode.value}
                isActive={currentMode === mode.value}
                onClick={() => handleModeSwitch(mode.value)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon style={{ width: '14px', height: '14px' }} />
                  {mode.label}
                </span>
              </TabButton>
            )
          })}
        </div>

        {/* Mode description */}
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
          {AGENT_MODES.find((m) => m.value === currentMode)?.description}
        </p>

        {/* Plan mode config */}
        {currentMode === 'plan' && (
          <div
            style={{
              padding: '16px',
              background: 'var(--accent)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            {planConfig ? (
              <>
                <ProviderSelect
                  label="Provider"
                  value={planConfig.providerId}
                  options={providers}
                  onChange={handleProviderChange('plan')}
                />
                <ModelSelect
                  label="Model"
                  value={planConfig.modelId}
                  options={selectedPlanProvider?.availableModels || []}
                  onChange={handleModelChange('plan')}
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Eye style={{ width: '24px', height: '24px', margin: '0 auto 8px', color: 'var(--muted-foreground)' }} />
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                  No Plan mode provider configured
                </p>
                <Button variant="outline" size="sm" onClick={() => setPlanConfig({ providerId: providers[0]?.id || '', modelId: providers[0]?.availableModels[0] || '' })}>
                  Configure Provider
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Act mode config */}
        {currentMode === 'act' && (
          <div
            style={{
              padding: '16px',
              background: 'var(--accent)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            <ProviderSelect
              label="Provider"
              value={actConfig.providerId}
              options={providers}
              onChange={handleProviderChange('act')}
            />
            <ModelSelect
              label="Model"
              value={actConfig.modelId}
              options={selectedActProvider?.availableModels || []}
              onChange={handleModelChange('act')}
            />
          </div>
        )}

        {/* Info note */}
        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '12px' }}>
          Plan mode restricts tools to read-only operations. Act mode enables all tools.
        </p>
      </CardContent>
    </Card>
  )
}

export default PlanActModeConfig
