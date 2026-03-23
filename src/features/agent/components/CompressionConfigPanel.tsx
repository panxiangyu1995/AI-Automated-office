/**
 * CompressionConfigPanel - 压缩配置面板组件
 * Story 4.12 - 上下文自动压缩
 *
 * 配置压缩策略和参数
 *
 * 铁律合规：
 * - UX: 使用 Shadcn/ui 组件
 * - ARCH: 分层架构
 */

import { useState } from 'react'
import { Settings2, RotateCcw, Info, Archive, Clock, Hash, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useCompressionConfig,
  useContextCompression,
  type CompressionStrategy,
} from '../hooks/useContextCompression'
import { cn } from '@/lib/utils'

// ==================== Types ====================

export interface CompressionConfigPanelProps {
  onClose?: () => void
  className?: string
}

// ==================== Default Config (for reset) ====================

const DEFAULT_CONFIG = {
  tokenThreshold: 8000,
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  strategy: 'hybrid' as CompressionStrategy,
  preserveRecentCount: 6,
  preserveSystemMessages: true,
  summaryMaxTokens: 500,
  includeKeyFacts: true,
  autoCompress: true,
  compressionCooldown: 60000,
  debugMode: false,
}

// ==================== Constants ====================

const STRATEGY_OPTIONS: { value: CompressionStrategy; label: string; description: string }[] = [
  {
    value: 'summary',
    label: '摘要模式',
    description: '生成历史摘要，保留最近消息',
  },
  {
    value: 'sliding',
    label: '滑动窗口',
    description: '只保留最近N条消息',
  },
  {
    value: 'hybrid',
    label: '混合模式',
    description: '摘要 + 滑动窗口组合',
  },
]

const PRESET_CONFIGS: { label: string; threshold: number }[] = [
  { label: '8K (默认)', threshold: 8000 },
  { label: '16K', threshold: 16000 },
  { label: '32K', threshold: 32000 },
  { label: '64K', threshold: 64000 },
  { label: '128K', threshold: 128000 },
]

// ==================== Component ====================

export function CompressionConfigPanel({
  onClose: _onClose,
  className,
}: CompressionConfigPanelProps) {
  const config = useCompressionConfig()
  const { updateConfig, resetConfig } = useContextCompression.getState()

  const [localConfig, setLocalConfig] = useState(config)
  const [hasChanges, setHasChanges] = useState(false)

  const handleUpdate = (updates: Partial<typeof config>) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev, ...updates }
      setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(config))
      return newConfig
    })
  }

  const handleSave = () => {
    updateConfig(localConfig)
    setHasChanges(false)
  }

  const handleReset = () => {
    resetConfig()
    setLocalConfig(DEFAULT_CONFIG)
    setHasChanges(false)
  }

  const handlePreset = (threshold: number) => {
    handleUpdate({
      tokenThreshold: threshold,
      warningThreshold: 0.7,
      criticalThreshold: 0.9,
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-[#1E3A5F]" />
          <h3 className="text-lg font-semibold">压缩配置</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>恢复默认配置</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Token 阈值配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Token 阈值</h4>
        </div>

        <div className="space-y-3 pl-6">
          {/* 预设选项 */}
          <div className="flex flex-wrap gap-2">
            {PRESET_CONFIGS.map((preset) => (
              <Button
                key={preset.threshold}
                variant={localConfig.tokenThreshold === preset.threshold ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreset(preset.threshold)}
                className="h-7 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* 自定义阈值 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="threshold" className="text-xs text-muted-foreground min-w-20">
              自定义阈值
            </Label>
            <Input
              id="threshold"
              type="number"
              value={localConfig.tokenThreshold}
              onChange={(e) => handleUpdate({ tokenThreshold: parseInt(e.target.value) || 8000 })}
              className="w-32 h-8 text-sm"
              min={1000}
              max={1000000}
              step={1000}
            />
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>

          {/* 警告/临界阈值 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="warning" className="text-xs text-muted-foreground">
                  警告阈值
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>超过此比例时显示警告</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="warning"
                type="number"
                value={Math.round(localConfig.warningThreshold * 100)}
                onChange={(e) => handleUpdate({ warningThreshold: parseInt(e.target.value) / 100 || 0.7 })}
                className="h-8 text-sm"
                min={50}
                max={99}
                step={5}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="critical" className="text-xs text-muted-foreground">
                  临界阈值
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>超过此比例时显示紧急警告</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="critical"
                type="number"
                value={Math.round(localConfig.criticalThreshold * 100)}
                onChange={(e) => handleUpdate({ criticalThreshold: parseInt(e.target.value) / 100 || 0.9 })}
                className="h-8 text-sm"
                min={70}
                max={99}
                step={5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 压缩策略配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">压缩策略</h4>
        </div>

        <div className="space-y-3 pl-6">
          <Select
            value={localConfig.strategy}
            onValueChange={(value: CompressionStrategy) => handleUpdate({ strategy: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRATEGY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 保留消息数量 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="preserve" className="text-xs text-muted-foreground min-w-20">
              保留消息数
            </Label>
            <Input
              id="preserve"
              type="number"
              value={localConfig.preserveRecentCount}
              onChange={(e) => handleUpdate({ preserveRecentCount: parseInt(e.target.value) || 6 })}
              className="w-24 h-8 text-sm"
              min={2}
              max={50}
              step={2}
            />
            <span className="text-xs text-muted-foreground">条</span>
          </div>

          {/* 保留系统消息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="preserveSystem" className="text-xs">
                保留系统消息
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>压缩时保留所有系统消息</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="preserveSystem"
              checked={localConfig.preserveSystemMessages}
              onCheckedChange={(checked) => handleUpdate({ preserveSystemMessages: checked })}
            />
          </div>
        </div>
      </div>

      {/* 摘要配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">摘要配置</h4>
        </div>

        <div className="space-y-3 pl-6">
          {/* 摘要最大 Token 数 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="summaryTokens" className="text-xs text-muted-foreground min-w-20">
              摘要最大长度
            </Label>
            <Input
              id="summaryTokens"
              type="number"
              value={localConfig.summaryMaxTokens}
              onChange={(e) => handleUpdate({ summaryMaxTokens: parseInt(e.target.value) || 500 })}
              className="w-24 h-8 text-sm"
              min={100}
              max={2000}
              step={100}
            />
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>

          {/* 包含关键事实 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="keyFacts" className="text-xs">
                提取关键事实
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>从对话中提取关键信息</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="keyFacts"
              checked={localConfig.includeKeyFacts}
              onCheckedChange={(checked) => handleUpdate({ includeKeyFacts: checked })}
            />
          </div>
        </div>
      </div>

      {/* 自动压缩配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">自动压缩</h4>
        </div>

        <div className="space-y-3 pl-6">
          {/* 启用自动压缩 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="autoCompress" className="text-xs">
                启用自动压缩
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>超过阈值时自动触发压缩</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="autoCompress"
              checked={localConfig.autoCompress}
              onCheckedChange={(checked) => handleUpdate({ autoCompress: checked })}
            />
          </div>

          {/* 压缩冷却时间 */}
          <div className="flex items-center gap-3">
            <Label htmlFor="cooldown" className="text-xs text-muted-foreground min-w-20">
              冷却时间
            </Label>
            <Input
              id="cooldown"
              type="number"
              value={localConfig.compressionCooldown / 1000}
              onChange={(e) => handleUpdate({ compressionCooldown: (parseInt(e.target.value) || 60) * 1000 })}
              className="w-24 h-8 text-sm"
              min={10}
              max={600}
              step={10}
            />
            <span className="text-xs text-muted-foreground">秒</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalConfig(config)
              setHasChanges(false)
            }}
          >
            取消
          </Button>
          <Button size="sm" onClick={handleSave}>
            保存配置
          </Button>
        </div>
      )}
    </div>
  )
}

export default CompressionConfigPanel
