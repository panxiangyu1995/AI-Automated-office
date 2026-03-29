/**
 * YoloModeConfig.tsx
 * Story 21.25 - 路由模式与YOLO Mode
 * UI参考cline的设计风格
 */

import { useState, useEffect } from 'react'
import { Zap, Clock, Shield, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

export type RoutingMode = 'manual' | 'auto' | 'hybrid' | 'yolo'

export type YoloTtlType = 'once' | 'one_hour' | 'today' | 'custom'

export interface YoloTtlConfig {
  type: YoloTtlType
  customSeconds?: number
}

export interface RoutingModeConfig {
  mode: RoutingMode
  yoloEnabled: boolean
  yoloTtl?: YoloTtlConfig
  yoloActivatedAt?: number
  remainingTtlSeconds?: number
  tenantYoloDisabled?: boolean
}

export interface YoloModeStatus {
  isActive: boolean
  activatedAt?: number
  ttl?: YoloTtlConfig
  remainingTtlSeconds?: number
}

// ============================================================================
// 常量 - 参考cline的简洁设计

const ROUTING_MODES: { value: RoutingMode; label: string; description: string }[] = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'All actions require confirmation',
  },
  {
    value: 'auto',
    label: 'Auto',
    description: 'Auto-execute non-sensitive actions',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Dynamic based on risk level',
  },
  {
    value: 'yolo',
    label: 'YOLO',
    description: 'No confirmations, act immediately',
  },
]

const YOLO_TTL_OPTIONS: { value: YoloTtlType; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'one_hour', label: '1 Hour' },
  { value: 'today', label: 'Today' },
  { value: 'custom', label: 'Custom' },
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
// YOLO确认对话框

interface YoloConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (ttl: YoloTtlConfig) => void
}

export const YoloConfirmDialog = ({ open, onClose, onConfirm }: YoloConfirmDialogProps) => {
  const [selectedTtl, setSelectedTtl] = useState<YoloTtlType>('once')
  const [customSeconds, setCustomSeconds] = useState('3600')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!confirmed) return
    const ttl: YoloTtlConfig = {
      type: selectedTtl,
      customSeconds: selectedTtl === 'custom' ? parseInt(customSeconds, 10) : undefined,
    }
    onConfirm(ttl)
    setConfirmed(false)
    setSelectedTtl('once')
  }

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '20px',
          width: '420px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertTriangle style={{ color: '#d97706', width: '20px', height: '20px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Activate YOLO Mode</h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
          YOLO mode will skip all confirmations. This action cannot be undone.
        </p>

        {/* TTL Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
            Duration
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {YOLO_TTL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedTtl(opt.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${selectedTtl === opt.value ? 'var(--ring)' : 'var(--border)'}`,
                  background: selectedTtl === opt.value ? 'var(--accent)' : 'transparent',
                  color: selectedTtl === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom seconds input */}
        {selectedTtl === 'custom' && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="number"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.target.value)}
              placeholder="Seconds"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--input)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            />
          </div>
        )}

        {/* Confirmation checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <input
            type="checkbox"
            id="yolo-confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="yolo-confirm" style={{ fontSize: '13px', cursor: 'pointer' }}>
            I understand the risks
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!confirmed}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Zap style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            Activate
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 路由模式指示器

interface RoutingModeIndicatorProps {
  currentMode: RoutingMode
  yoloActive?: boolean
}

export const RoutingModeIndicator = ({ currentMode, yoloActive: _yoloActive }: RoutingModeIndicatorProps) => {
  const mode = ROUTING_MODES.find((m) => m.value === currentMode)

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 text-xs',
        currentMode === 'yolo' && 'bg-amber-50 border-amber-200 text-amber-700',
        currentMode === 'manual' && 'bg-red-50 border-red-200 text-red-700',
        currentMode === 'auto' && 'bg-green-50 border-green-200 text-green-700',
        currentMode === 'hybrid' && 'bg-blue-50 border-blue-200 text-blue-700'
      )}
    >
      {currentMode === 'yolo' && <Zap style={{ width: '12px', height: '12px' }} />}
      {currentMode === 'manual' && <Shield style={{ width: '12px', height: '12px' }} />}
      {currentMode === 'auto' && <Check style={{ width: '12px', height: '12px' }} />}
      {mode?.label}
    </Badge>
  )
}

// ============================================================================
// 主组件

interface YoloModeConfigProps {
  className?: string
  initialMode?: RoutingMode
  onModeChange?: (mode: RoutingMode) => void
  initialYoloActive?: boolean
  onYoloActivate?: (ttl: YoloTtlConfig) => void
  onYoloDeactivate?: () => void
  tenantYoloDisabled?: boolean
}

export const YoloModeConfig = ({
  className,
  initialMode = 'auto',
  onModeChange,
  initialYoloActive = false,
  onYoloActivate,
  onYoloDeactivate,
  tenantYoloDisabled = false,
}: YoloModeConfigProps) => {
  const [currentMode, setCurrentMode] = useState<RoutingMode>(initialMode)
  const [isYoloActive, setIsYoloActive] = useState(initialYoloActive)
  const [showYoloDialog, setShowYoloDialog] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number | undefined>(undefined)

  const handleModeChange = (mode: RoutingMode) => {
    if (mode === 'yolo' && currentMode !== 'yolo') {
      setShowYoloDialog(true)
      return
    }
    setCurrentMode(mode)
    onModeChange?.(mode)
  }

  const handleYoloConfirm = (ttl: YoloTtlConfig) => {
    setCurrentMode('yolo')
    setIsYoloActive(true)
    onYoloActivate?.(ttl)
    onModeChange?.('yolo')

    // Calculate remaining time based on TTL
    if (ttl.type === 'one_hour') {
      setRemainingSeconds(3600)
    } else if (ttl.type === 'today') {
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      setRemainingSeconds(Math.floor((endOfDay.getTime() - Date.now()) / 1000))
    } else if (ttl.type === 'custom' && ttl.customSeconds) {
      setRemainingSeconds(ttl.customSeconds)
    } else {
      setRemainingSeconds(undefined)
    }
  }

  const handleYoloDeactivate = () => {
    setCurrentMode('auto')
    setIsYoloActive(false)
    setRemainingSeconds(undefined)
    onYoloDeactivate?.()
    onModeChange?.('auto')
  }

  // Countdown timer
  useEffect(() => {
    if (!isYoloActive || remainingSeconds === undefined) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === undefined || prev <= 1) {
          handleYoloDeactivate()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isYoloActive, remainingSeconds])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <>
      <Card className={cn('', className)}>
        <CardHeader style={{ paddingBottom: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardTitle style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap style={{ width: '16px', height: '16px', color: '#9663f1' }} />
                Routing Mode
              </CardTitle>
              <CardDescription style={{ fontSize: '12px' }}>
                Control how tools are executed
              </CardDescription>
            </div>
            <RoutingModeIndicator currentMode={currentMode} yoloActive={isYoloActive} />
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
            {ROUTING_MODES.map((mode) => (
              <TabButton
                key={mode.value}
                isActive={currentMode === mode.value}
                onClick={() => handleModeChange(mode.value)}
                disabled={tenantYoloDisabled && mode.value === 'yolo'}
              >
                {mode.label}
              </TabButton>
            ))}
          </div>

          {/* Description */}
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
            {ROUTING_MODES.find((m) => m.value === currentMode)?.description}
          </p>

          {/* YOLO active state */}
          {currentMode === 'yolo' && isYoloActive && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: 'var(--accent)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap style={{ width: '16px', height: '16px', color: '#d97706' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>YOLO Mode Active</p>
                  {remainingSeconds !== undefined && (
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      <Clock style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                      {formatTime(remainingSeconds)} remaining
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleYoloDeactivate}>
                Deactivate
              </Button>
            </div>
          )}

          {/* Tenant disabled notice */}
          {tenantYoloDisabled && (
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              YOLO mode has been disabled by your organization administrator.
            </p>
          )}
        </CardContent>
      </Card>

      <YoloConfirmDialog
        open={showYoloDialog}
        onClose={() => setShowYoloDialog(false)}
        onConfirm={handleYoloConfirm}
      />
    </>
  )
}

export default YoloModeConfig
