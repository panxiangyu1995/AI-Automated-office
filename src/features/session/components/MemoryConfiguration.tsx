import React, { useState } from 'react'
import {
  Database,
  Cloud,
  HardDrive,
  Clock,
  RefreshCw,
  Building,
  Zap,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'

// Memory Configuration Types
export type DeploymentMode = 'local' | 'cloud' | 'hybrid'
export type ExtractionMode = 'auto' | 'manual' | 'hybrid'
export type RetentionPolicy = 'forever' | 'days_30' | 'days_90' | 'days_180' | 'days_365'
export type HookCaptureMode = 'all' | 'explicit' | 'filtered'
export type ConfigAccessScope = 'private' | 'user' | 'team' | 'tenant' | 'global'
export type SyncMode = 'realtime' | 'interval' | 'manual'

export interface MemoryDeploymentConfig {
  mode: DeploymentMode
  cloudEndpoint?: string
  syncMode: SyncMode
  syncInterval?: number
  offlineCapable: boolean
  encryptionEnabled: boolean
  compressionEnabled: boolean
}

export interface AutoExtractionConfig {
  mode: ExtractionMode
  minConfidence: number
  maxEntriesPerSession: number
  deduplicationEnabled: boolean
  semanticClusteringEnabled: boolean
  extractionRules: ExtractionRule[]
}

export interface ExtractionRule {
  id: string
  name: string
  pattern: string
  scope: ConfigAccessScope
  enabled: boolean
  priority: number
}

export interface RetentionConfig {
  policy: RetentionPolicy
  archiveEnabled: boolean
  archiveAfterDays?: number
  deleteAfterDays?: number
  preserveTagged: boolean
  preserveHighConfidence: boolean
  minConfidenceToPreserve: number
}

export interface HookCaptureConfig {
  mode: HookCaptureMode
  captureUserMessages: boolean
  captureAiResponses: boolean
  captureToolResults: boolean
  captureErrors: boolean
  captureCorrections: boolean
  excludePatterns: string[]
  includePatterns: string[]
}

export interface EnterpriseKnowledgeConfig {
  defaultAccessScope: ConfigAccessScope
  allowCrossTenantAccess: boolean
  requireApprovalForGlobal: boolean
  maxDocumentSize: number
  allowedFileTypes: string[]
  indexingEnabled: boolean
  embeddingModel: string
  searchMode: 'keyword' | 'semantic' | 'hybrid'
}

export interface MemoryConfig {
  deployment: MemoryDeploymentConfig
  extraction: AutoExtractionConfig
  retention: RetentionConfig
  hooks: HookCaptureConfig
  enterprise: EnterpriseKnowledgeConfig
}

// Default Configuration
const defaultConfig: MemoryConfig = {
  deployment: {
    mode: 'hybrid',
    syncMode: 'interval',
    syncInterval: 300,
    offlineCapable: true,
    encryptionEnabled: true,
    compressionEnabled: true,
  },
  extraction: {
    mode: 'hybrid',
    minConfidence: 0.7,
    maxEntriesPerSession: 100,
    deduplicationEnabled: true,
    semanticClusteringEnabled: true,
    extractionRules: [
      {
        id: 'rule-001',
        name: 'User Preferences',
        pattern: 'user.*prefer|prefer.*is',
        scope: 'user',
        enabled: true,
        priority: 1,
      },
      {
        id: 'rule-002',
        name: 'Task Completion',
        pattern: 'completed|finished|done',
        scope: 'user',
        enabled: true,
        priority: 2,
      },
    ],
  },
  retention: {
    policy: 'days_90',
    archiveEnabled: true,
    archiveAfterDays: 30,
    deleteAfterDays: 365,
    preserveTagged: true,
    preserveHighConfidence: true,
    minConfidenceToPreserve: 0.9,
  },
  hooks: {
    mode: 'filtered',
    captureUserMessages: true,
    captureAiResponses: true,
    captureToolResults: true,
    captureErrors: true,
    captureCorrections: true,
    excludePatterns: ['password', 'secret', 'token'],
    includePatterns: [],
  },
  enterprise: {
    defaultAccessScope: 'tenant',
    allowCrossTenantAccess: false,
    requireApprovalForGlobal: true,
    maxDocumentSize: 10 * 1024 * 1024,
    allowedFileTypes: ['pdf', 'docx', 'txt', 'md', 'json'],
    indexingEnabled: true,
    embeddingModel: 'text-embedding-3-small',
    searchMode: 'hybrid',
  },
}

const syncModeLabels: Record<SyncMode, string> = {
  realtime: '实时同步',
  interval: '定时同步',
  manual: '手动同步',
}

const retentionPolicyLabels: Record<RetentionPolicy, string> = {
  forever: '永久保留',
  days_30: '30天',
  days_90: '90天',
  days_180: '180天',
  days_365: '365天',
}

const accessScopeLabels: Record<ConfigAccessScope, string> = {
  private: '私有',
  user: '用户',
  team: '团队',
  tenant: '租户',
  global: '全局',
}

const searchModeLabels: Record<'keyword' | 'semantic' | 'hybrid', string> = {
  keyword: '关键词',
  semantic: '语义',
  hybrid: '混合',
}

export function MemoryConfiguration(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('deployment')
  const [config, setConfig] = useState<MemoryConfig>(defaultConfig)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  // Deployment handlers
  const updateDeployment = (updates: Partial<MemoryDeploymentConfig>) => {
    setConfig((prev) => ({
      ...prev,
      deployment: { ...prev.deployment, ...updates },
    }))
    setHasChanges(true)
  }

  // Extraction handlers
  const updateExtraction = (updates: Partial<AutoExtractionConfig>) => {
    setConfig((prev) => ({
      ...prev,
      extraction: { ...prev.extraction, ...updates },
    }))
    setHasChanges(true)
  }

  // Retention handlers
  const updateRetention = (updates: Partial<RetentionConfig>) => {
    setConfig((prev) => ({
      ...prev,
      retention: { ...prev.retention, ...updates },
    }))
    setHasChanges(true)
  }

  // Hooks handlers
  const updateHooks = (updates: Partial<HookCaptureConfig>) => {
    setConfig((prev) => ({
      ...prev,
      hooks: { ...prev.hooks, ...updates },
    }))
    setHasChanges(true)
  }

  // Enterprise handlers
  const updateEnterprise = (updates: Partial<EnterpriseKnowledgeConfig>) => {
    setConfig((prev) => ({
      ...prev,
      enterprise: { ...prev.enterprise, ...updates },
    }))
    setHasChanges(true)
  }

  // Reset to defaults
  const handleReset = () => {
    setConfig(defaultConfig)
    setHasChanges(false)
    setShowResetDialog(false)
  }

  // Save configuration
  const handleSave = () => {
    // Save configuration
    setHasChanges(false)
  }

  const toggleRuleExpand = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">记忆层配置</h2>
          <p className="text-muted-foreground">配置记忆存储、提取、保留策略和企业知识访问</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              有未保存的更改
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置默认
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            保存配置
          </Button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="deployment">
            <Database className="h-4 w-4 mr-2" />
            部署模式
          </TabsTrigger>
          <TabsTrigger value="extraction">
            <Zap className="h-4 w-4 mr-2" />
            自动提取
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Clock className="h-4 w-4 mr-2" />
            保留策略
          </TabsTrigger>
          <TabsTrigger value="hooks">
            <RefreshCw className="h-4 w-4 mr-2" />
            Hook捕获
          </TabsTrigger>
          <TabsTrigger value="enterprise">
            <Building className="h-4 w-4 mr-2" />
            企业知识
          </TabsTrigger>
        </TabsList>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                存储部署模式
              </CardTitle>
              <CardDescription>配置记忆数据的存储位置和同步方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="grid grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-all ${
                    config.deployment.mode === 'local' ? 'border-[var(--ao-button.background)] bg-[var(--ao-button.background)]/5' : 'border-transparent'
                  }`}
                  onClick={() => updateDeployment({ mode: 'local' })}
                >
                  <CardContent className="pt-4 text-center">
                    <HardDrive className="h-8 w-8 mx-auto mb-2 text-[var(--ao-button.background)]" />
                    <p className="font-medium">本地存储</p>
                    <p className="text-xs text-muted-foreground mt-1">数据仅存储在本地设备</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer border-2 transition-all ${
                    config.deployment.mode === 'cloud' ? 'border-[var(--ao-button.background)] bg-[var(--ao-button.background)]/5' : 'border-transparent'
                  }`}
                  onClick={() => updateDeployment({ mode: 'cloud' })}
                >
                  <CardContent className="pt-4 text-center">
                    <Cloud className="h-8 w-8 mx-auto mb-2 text-[var(--ao-button.background)]" />
                    <p className="font-medium">云端存储</p>
                    <p className="text-xs text-muted-foreground mt-1">数据存储在云端服务器</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer border-2 transition-all ${
                    config.deployment.mode === 'hybrid' ? 'border-[var(--ao-button.background)] bg-[var(--ao-button.background)]/5' : 'border-transparent'
                  }`}
                  onClick={() => updateDeployment({ mode: 'hybrid' })}
                >
                  <CardContent className="pt-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 text-[var(--ao-button.background)]" />
                    <p className="font-medium">混合模式</p>
                    <p className="text-xs text-muted-foreground mt-1">本地+云端同步</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cloud Settings */}
              {(config.deployment.mode === 'cloud' || config.deployment.mode === 'hybrid') && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>云端端点</Label>
                      <Input
                        placeholder="https://api.example.com/memory"
                        value={config.deployment.cloudEndpoint || ''}
                        onChange={(e) => updateDeployment({ cloudEndpoint: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>同步模式</Label>
                      <Select
                        value={config.deployment.syncMode}
                        onValueChange={(v) => updateDeployment({ syncMode: v as SyncMode })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(syncModeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {config.deployment.syncMode === 'interval' && (
                    <div className="space-y-2">
                      <Label>同步间隔（秒）</Label>
                      <Input
                        type="number"
                        value={config.deployment.syncInterval || 300}
                        onChange={(e) =>
                          updateDeployment({ syncInterval: parseInt(e.target.value) || 300 })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Security Settings */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">安全设置</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>离线可用</Label>
                      <p className="text-xs text-muted-foreground">在离线时仍可访问本地缓存</p>
                    </div>
                    <Switch
                      checked={config.deployment.offlineCapable}
                      onCheckedChange={(checked) => updateDeployment({ offlineCapable: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>数据加密</Label>
                      <p className="text-xs text-muted-foreground">使用AES-256加密存储数据</p>
                    </div>
                    <Switch
                      checked={config.deployment.encryptionEnabled}
                      onCheckedChange={(checked) => updateDeployment({ encryptionEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>数据压缩</Label>
                      <p className="text-xs text-muted-foreground">压缩存储以节省空间</p>
                    </div>
                    <Switch
                      checked={config.deployment.compressionEnabled}
                      onCheckedChange={(checked) => updateDeployment({ compressionEnabled: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extraction Tab */}
        <TabsContent value="extraction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                自动提取配置
              </CardTitle>
              <CardDescription>配置记忆自动提取行为和规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>提取模式</Label>
                  <Select
                    value={config.extraction.mode}
                    onValueChange={(v) => updateExtraction({ mode: v as ExtractionMode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动提取</SelectItem>
                      <SelectItem value="manual">手动提取</SelectItem>
                      <SelectItem value="hybrid">混合模式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>每会话最大条目数</Label>
                  <Input
                    type="number"
                    value={config.extraction.maxEntriesPerSession}
                    onChange={(e) =>
                      updateExtraction({ maxEntriesPerSession: parseInt(e.target.value) || 100 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>最低置信度阈值: {(config.extraction.minConfidence * 100).toFixed(0)}%</Label>
                <Slider
                  value={[config.extraction.minConfidence]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([value]) => updateExtraction({ minConfidence: value })}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>去重</Label>
                    <p className="text-xs text-muted-foreground">自动合并重复内容</p>
                  </div>
                  <Switch
                    checked={config.extraction.deduplicationEnabled}
                    onCheckedChange={(checked) => updateExtraction({ deduplicationEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>语义聚类</Label>
                    <p className="text-xs text-muted-foreground">按语义相似度聚类记忆</p>
                  </div>
                  <Switch
                    checked={config.extraction.semanticClusteringEnabled}
                    onCheckedChange={(checked) =>
                      updateExtraction({ semanticClusteringEnabled: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Extraction Rules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">提取规则</h4>
                  <Button variant="outline" size="sm">
                    添加规则
                  </Button>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {config.extraction.extractionRules.map((rule) => {
                      const isExpanded = expandedRules.has(rule.id)
                      return (
                        <Card key={rule.id}>
                          <CardContent className="pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRuleExpand(rule.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <span className="font-medium">{rule.name}</span>
                                <Badge variant="outline">{accessScopeLabels[rule.scope]}</Badge>
                                {rule.enabled ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  updateExtraction({
                                    extractionRules: config.extraction.extractionRules.map((r) =>
                                      r.id === rule.id ? { ...r, enabled: checked } : r
                                    ),
                                  })
                                }}
                              />
                            </div>
                            {isExpanded && (
                              <div className="mt-3 space-y-2 pl-8">
                                <div className="space-y-1">
                                  <Label className="text-xs">模式</Label>
                                  <Input value={rule.pattern} readOnly className="font-mono text-sm" />
                                </div>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>优先级: {rule.priority}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                保留策略配置
              </CardTitle>
              <CardDescription>配置记忆数据的保留和清理策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>保留期限</Label>
                  <Select
                    value={config.retention.policy}
                    onValueChange={(v) => updateRetention({ policy: v as RetentionPolicy })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(retentionPolicyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>归档天数</Label>
                  <Input
                    type="number"
                    value={config.retention.archiveAfterDays || 30}
                    onChange={(e) =>
                      updateRetention({ archiveAfterDays: parseInt(e.target.value) || 30 })
                    }
                    disabled={!config.retention.archiveEnabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动归档</Label>
                    <p className="text-xs text-muted-foreground">自动归档旧记忆数据</p>
                  </div>
                  <Switch
                    checked={config.retention.archiveEnabled}
                    onCheckedChange={(checked) => updateRetention({ archiveEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>保留标记数据</Label>
                    <p className="text-xs text-muted-foreground">不删除用户标记的重要数据</p>
                  </div>
                  <Switch
                    checked={config.retention.preserveTagged}
                    onCheckedChange={(checked) => updateRetention({ preserveTagged: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>保留高置信度数据</Label>
                    <p className="text-xs text-muted-foreground">保留置信度高于阈值的数据</p>
                  </div>
                  <Switch
                    checked={config.retention.preserveHighConfidence}
                    onCheckedChange={(checked) => updateRetention({ preserveHighConfidence: checked })}
                  />
                </div>
              </div>

              {config.retention.preserveHighConfidence && (
                <div className="space-y-2">
                  <Label>
                    保留置信度阈值: {(config.retention.minConfidenceToPreserve * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    value={[config.retention.minConfidenceToPreserve]}
                    min={0.5}
                    max={1}
                    step={0.05}
                    onValueChange={([value]) => updateRetention({ minConfidenceToPreserve: value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Hook捕获配置
              </CardTitle>
              <CardDescription>配置记忆捕获的触发条件和过滤规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>捕获模式</Label>
                <Select
                  value={config.hooks.mode}
                  onValueChange={(v) => updateHooks({ mode: v as HookCaptureMode })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">捕获全部</SelectItem>
                    <SelectItem value="explicit">仅显式标记</SelectItem>
                    <SelectItem value="filtered">按规则过滤</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">捕获内容类型</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>用户消息</Label>
                      <p className="text-xs text-muted-foreground">捕获用户输入</p>
                    </div>
                    <Switch
                      checked={config.hooks.captureUserMessages}
                      onCheckedChange={(checked) => updateHooks({ captureUserMessages: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>AI响应</Label>
                      <p className="text-xs text-muted-foreground">捕获AI输出</p>
                    </div>
                    <Switch
                      checked={config.hooks.captureAiResponses}
                      onCheckedChange={(checked) => updateHooks({ captureAiResponses: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>工具结果</Label>
                      <p className="text-xs text-muted-foreground">捕获工具执行结果</p>
                    </div>
                    <Switch
                      checked={config.hooks.captureToolResults}
                      onCheckedChange={(checked) => updateHooks({ captureToolResults: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>错误信息</Label>
                      <p className="text-xs text-muted-foreground">捕获错误和异常</p>
                    </div>
                    <Switch
                      checked={config.hooks.captureErrors}
                      onCheckedChange={(checked) => updateHooks({ captureErrors: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>纠正记录</Label>
                      <p className="text-xs text-muted-foreground">捕获用户纠正</p>
                    </div>
                    <Switch
                      checked={config.hooks.captureCorrections}
                      onCheckedChange={(checked) => updateHooks({ captureCorrections: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">过滤规则</h4>
                <div className="space-y-2">
                  <Label>排除模式（每行一个）</Label>
                  <Textarea
                    placeholder="password&#10;secret&#10;token"
                    value={config.hooks.excludePatterns.join('\n')}
                    onChange={(e) =>
                      updateHooks({
                        excludePatterns: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    包含这些关键词的内容将被排除
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enterprise Tab */}
        <TabsContent value="enterprise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                企业知识配置
              </CardTitle>
              <CardDescription>配置企业知识库访问范围和控制策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>默认访问范围</Label>
                  <Select
                    value={config.enterprise.defaultAccessScope}
                    onValueChange={(v) => updateEnterprise({ defaultAccessScope: v as ConfigAccessScope })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accessScopeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>搜索模式</Label>
                  <Select
                    value={config.enterprise.searchMode}
                    onValueChange={(v) =>
                      updateEnterprise({ searchMode: v as 'keyword' | 'semantic' | 'hybrid' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(searchModeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">访问控制</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>跨租户访问</Label>
                      <p className="text-xs text-muted-foreground">允许访问其他租户知识</p>
                    </div>
                    <Switch
                      checked={config.enterprise.allowCrossTenantAccess}
                      onCheckedChange={(checked) =>
                        updateEnterprise({ allowCrossTenantAccess: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>全局知识需审批</Label>
                      <p className="text-xs text-muted-foreground">发布全局知识需要审批</p>
                    </div>
                    <Switch
                      checked={config.enterprise.requireApprovalForGlobal}
                      onCheckedChange={(checked) =>
                        updateEnterprise({ requireApprovalForGlobal: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">文档设置</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>最大文档大小 (MB)</Label>
                    <Input
                      type="number"
                      value={config.enterprise.maxDocumentSize / (1024 * 1024)}
                      onChange={(e) =>
                        updateEnterprise({
                          maxDocumentSize: parseInt(e.target.value) * 1024 * 1024,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>索引功能</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enterprise.indexingEnabled}
                        onCheckedChange={(checked) =>
                          updateEnterprise({ indexingEnabled: checked })
                        }
                      />
                      <span className="text-sm">
                        {config.enterprise.indexingEnabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>允许的文件类型</Label>
                  <Input
                    value={config.enterprise.allowedFileTypes.join(', ')}
                    onChange={(e) =>
                      updateEnterprise({
                        allowedFileTypes: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">嵌入模型</h4>
                <div className="space-y-2">
                  <Label>嵌入模型</Label>
                  <Select
                    value={config.enterprise.embeddingModel}
                    onValueChange={(v) => updateEnterprise({ embeddingModel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                      <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                      <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置配置</DialogTitle>
            <DialogDescription>确定要将所有配置重置为默认值吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
