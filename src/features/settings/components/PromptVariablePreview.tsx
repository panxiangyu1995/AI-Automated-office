import { useState, useMemo, useCallback } from 'react'
import {
  Eye,
  Variable,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Hash,
  Copy,
  Loader2,
  Settings,
  FileText,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Types
export type VariableStatus = 'defined' | 'missing' | 'default'
export type TokenType = 'input' | 'output' | 'total'

export interface VariableValue {
  name: string
  value: string
  status: VariableStatus
  defaultValue?: string
  description?: string
}

export interface TokenEstimate {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  currency: string
}

export interface PromptPreviewConfig {
  modelId: string
  modelName: string
  inputCostPer1k: number
  outputCostPer1k: number
  maxContextLength: number
}

export interface PromptPreviewState {
  template: string
  variables: VariableValue[]
  renderedPrompt: string
  tokenEstimate: TokenEstimate
  config: PromptPreviewConfig
  isPreviewOpen: boolean
  isLoading: boolean
}

export interface PromptVariablePreviewProps {
  className?: string
}

// Mock model configurations
const MODEL_CONFIGS: PromptPreviewConfig[] = [
  {
    modelId: 'gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    maxContextLength: 128000,
  },
  {
    modelId: 'gpt-3.5-turbo',
    modelName: 'GPT-3.5 Turbo',
    inputCostPer1k: 0.0005,
    outputCostPer1k: 0.0015,
    maxContextLength: 16000,
  },
  {
    modelId: 'claude-3-opus',
    modelName: 'Claude 3 Opus',
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    maxContextLength: 200000,
  },
  {
    modelId: 'zhipu-glm4',
    modelName: '智谱 GLM-4',
    inputCostPer1k: 0.1,
    outputCostPer1k: 0.1,
    maxContextLength: 128000,
  },
]

// Simple token estimator (approximation)
const estimateTokens = (text: string): number => {
  // Approximation: ~4 characters per token for English, ~2 for Chinese
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 2 + otherChars / 4)
}

// Extract variables from template
const extractVariables = (template: string): { name: string; defaultValue?: string }[] => {
  const regex = /\{\{(\w+)(?::([^}]*))?\}\}/g
  const variables: { name: string; defaultValue?: string }[] = []
  let match

  while ((match = regex.exec(template)) !== null) {
    const name = match[1]
    const defaultValue = match[2] || undefined
    
    if (!variables.find(v => v.name === name)) {
      variables.push({ name, defaultValue })
    }
  }

  return variables
}

// Mock data
const createMockTemplate = (): string => `你是 {{agent_name:默认助手}}，一个专业的 AI 助手。

## 当前用户
- 用户名：{{user_name}}
- 部门：{{department}}

## 任务描述
{{task_description}}

## 输出要求
请用 {{language:中文}} 回复，保持 {{tone:专业}} 的语气。`

export function PromptVariablePreview({ className = '' }: PromptVariablePreviewProps) {
  const [template, setTemplate] = useState<string>(createMockTemplate())
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [selectedConfig, setSelectedConfig] = useState<PromptPreviewConfig>(MODEL_CONFIGS[0])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Extract variables from template
  const extractedVariables = useMemo(() => {
    return extractVariables(template)
  }, [template])

  // Build variable value objects
  const variables = useMemo<VariableValue[]>(() => {
    return extractedVariables.map(v => {
      const value = variableValues[v.name]
      if (value !== undefined && value !== '') {
        return {
          name: v.name,
          value,
          status: 'defined' as VariableStatus,
          defaultValue: v.defaultValue,
        }
      }
      if (v.defaultValue) {
        return {
          name: v.name,
          value: v.defaultValue,
          status: 'default' as VariableStatus,
          defaultValue: v.defaultValue,
        }
      }
      return {
        name: v.name,
        value: '',
        status: 'missing' as VariableStatus,
        defaultValue: v.defaultValue,
      }
    })
  }, [extractedVariables, variableValues])

  // Render prompt with variable substitution
  const renderedPrompt = useMemo(() => {
    let result = template
    for (const v of variables) {
      const pattern = new RegExp(`\\{\\{${v.name}(?::[^}]*)?\\}\\}`, 'g')
      result = result.replace(pattern, v.value || `[缺失: ${v.name}]`)
    }
    return result
  }, [template, variables])

  // Token estimation
  const tokenEstimate = useMemo<TokenEstimate>(() => {
    const inputTokens = estimateTokens(renderedPrompt)
    const outputTokens = Math.ceil(inputTokens * 0.5) // Estimate output as 50% of input
    const totalTokens = inputTokens + outputTokens
    
    const inputCost = (inputTokens / 1000) * selectedConfig.inputCostPer1k
    const outputCost = (outputTokens / 1000) * selectedConfig.outputCostPer1k
    const estimatedCost = inputCost + outputCost

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      currency: 'USD',
    }
  }, [renderedPrompt, selectedConfig])

  // Check if any variables are missing
  const hasMissingVariables = useMemo(() => {
    return variables.some(v => v.status === 'missing')
  }, [variables])

  // Check if over context limit
  const isOverLimit = useMemo(() => {
    return tokenEstimate.totalTokens > selectedConfig.maxContextLength
  }, [tokenEstimate, selectedConfig])

  // Handle variable value change
  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(renderedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [renderedPrompt])

  // Handle preview
  const handlePreview = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsPreviewOpen(true)
    }, 500)
  }, [])

  // Render variable status badge
  const renderVariableBadge = (status: VariableStatus) => {
    switch (status) {
      case 'defined':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            已定义
          </Badge>
        )
      case 'default':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Settings className="h-3 w-3 mr-1" />
            默认值
          </Badge>
        )
      case 'missing':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            缺失
          </Badge>
        )
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">提示词变量预览</h2>
          <p className="text-muted-foreground">
            渲染变量替换后的提示词预览，预估 Token 使用量和成本
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview} disabled={hasMissingVariables}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            预览
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Template and Variables */}
        <div className="space-y-4">
          {/* Template */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>模板内容</Label>
                  <Badge variant="secondary">
                    {extractedVariables.length} 个变量
                  </Badge>
                </div>
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="输入提示词模板，使用 {{variable}} 格式定义变量"
                />
                <p className="text-xs text-muted-foreground">
                  变量格式: {"{{variable_name}}"} 或 {"{{variable_name:default_value}}"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>变量值</Label>
                  {hasMissingVariables && (
                    <Badge variant="destructive" className="text-xs">
                      有未填写的变量
                    </Badge>
                  )}
                </div>
                
                {variables.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    <Variable className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    模板中没有定义变量
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variables.map(v => (
                      <div key={v.name} className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                              {v.name}
                            </code>
                            {renderVariableBadge(v.status)}
                          </div>
                          <Input
                            placeholder={v.defaultValue ? `默认: ${v.defaultValue}` : `输入 ${v.name} 的值`}
                            value={variableValues[v.name] || ''}
                            onChange={(e) => handleVariableChange(v.name, e.target.value)}
                            className={v.status === 'missing' ? 'border-red-300' : ''}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview and Token Estimation */}
        <div className="space-y-4">
          {/* Token Estimation */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Token 估算</Label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={selectedConfig.modelId}
                    onChange={(e) => {
                      const config = MODEL_CONFIGS.find(c => c.modelId === e.target.value)
                      if (config) setSelectedConfig(config)
                    }}
                  >
                    {MODEL_CONFIGS.map(c => (
                      <option key={c.modelId} value={c.modelId}>
                        {c.modelName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{tokenEstimate.inputTokens}</div>
                    <div className="text-xs text-muted-foreground">输入 Token</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{tokenEstimate.outputTokens}</div>
                    <div className="text-xs text-muted-foreground">输出 Token</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{tokenEstimate.totalTokens}</div>
                    <div className="text-xs text-muted-foreground">总计</div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">预估成本</span>
                  </div>
                  <div className="text-lg font-semibold">
                    ${tokenEstimate.estimatedCost.toFixed(4)} {tokenEstimate.currency}
                  </div>
                </div>

                {isOverLimit && (
                  <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      超出 {selectedConfig.modelName} 上下文限制 ({selectedConfig.maxContextLength.toLocaleString()} tokens)
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rendered Preview */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>渲染预览</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={handleCopy}>
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? '已复制' : '复制到剪贴板'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <ScrollArea className="h-[300px] rounded border bg-muted p-3">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {renderedPrompt}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span>{variables.length} 变量</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{template.length} 字符</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>{renderedPrompt.length} 渲染字符</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {variables.filter(v => v.status === 'defined').length > 0 && (
                    <Badge variant="outline" className="text-green-600">
                      {variables.filter(v => v.status === 'defined').length} 已定义
                    </Badge>
                  )}
                  {variables.filter(v => v.status === 'default').length > 0 && (
                    <Badge variant="outline" className="text-yellow-600">
                      {variables.filter(v => v.status === 'default').length} 默认值
                    </Badge>
                  )}
                  {variables.filter(v => v.status === 'missing').length > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      {variables.filter(v => v.status === 'missing').length} 缺失
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>完整提示词预览</DialogTitle>
            <DialogDescription>
              变量替换后的完整提示词内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedConfig.modelName}</Badge>
                <Badge variant="outline">{tokenEstimate.totalTokens} tokens</Badge>
                <Badge variant="outline">${tokenEstimate.estimatedCost.toFixed(4)}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </Button>
            </div>
            <ScrollArea className="h-[60vh] rounded border bg-muted p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {renderedPrompt}
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

