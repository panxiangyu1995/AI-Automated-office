import React, { useState, useMemo } from 'react'
import {
  MessageSquare,
  Brain,
  Target,
  Filter,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Tag,
  Layers,
  Zap,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// Intent Parsing Types
export type IntentCategory =
  | 'task_execution'
  | 'information_query'
  | 'data_manipulation'
  | 'navigation'
  | 'configuration'
  | 'communication'
  | 'analysis'
  | 'automation'
  | 'unknown'

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type ParsingStatus = 'pending' | 'parsing' | 'parsed' | 'clarifying' | 'confirmed' | 'failed'
export type ParameterType = 'string' | 'number' | 'boolean' | 'date' | 'entity' | 'list' | 'object'
export type ParameterSource = 'explicit' | 'inferred' | 'context' | 'default'
export type EntityType = 'person' | 'organization' | 'location' | 'date' | 'number' | 'product' | 'event'
export type AmbiguityType = 'multiple_intents' | 'missing_parameter' | 'unclear_reference' | 'conflicting_info'

export interface ExtractedParameter {
  name: string
  value: unknown
  type: ParameterType
  required: boolean
  source: ParameterSource
  confidence: number
  rawText?: string
}

export interface IntentEntity {
  id: string
  type: EntityType
  value: string
  confidence: number
  position: { start: number; end: number }
}

export interface AmbiguityIssue {
  id: string
  type: AmbiguityType
  description: string
  suggestions: string[]
  resolved: boolean
  selectedOption?: string
}

export interface ParsedIntent {
  id: string
  rawInput: string
  category: IntentCategory
  action: string
  target?: string
  parameters: ExtractedParameter[]
  entities: IntentEntity[]
  confidence: number
  confidenceLevel: ConfidenceLevel
  ambiguities: AmbiguityIssue[]
  status: ParsingStatus
  timestamp: Date
}

export interface IntentClarification {
  intentId: string
  question: string
  options: string[]
  selectedOption?: string
}

export interface ParsingStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  duration?: number
}

export interface PlannerOutput {
  steps: PlannerStep[]
  estimatedTime?: number
  requiredTools?: string[]
  dependencies?: string[]
}

export interface PlannerStep {
  id: string
  action: string
  target: string
  parameters: Record<string, unknown>
  order: number
}

export interface IntentParsingStats {
  totalParsed: number
  successfulParsed: number
  clarifiedCount: number
  avgConfidence: number
  avgParseTime: number
  categoryDistribution: Record<IntentCategory, number>
}

// Intent category labels
const categoryLabels: Record<IntentCategory, string> = {
  task_execution: '任务执行',
  information_query: '信息查询',
  data_manipulation: '数据处理',
  navigation: '导航操作',
  configuration: '配置设置',
  communication: '沟通协作',
  analysis: '分析报告',
  automation: '自动化',
  unknown: '未知',
}

const categoryColors: Record<IntentCategory, string> = {
  task_execution: 'var(--ao-infoForeground)',
  information_query: 'var(--ao-successForeground)',
  data_manipulation: 'var(--ao-warningForeground)',
  navigation: 'var(--ao-infoForeground)',
  configuration: 'var(--ao-errorForeground)',
  communication: 'var(--ao-button.linkForeground)',
  analysis: 'var(--ao-successForeground)',
  automation: 'var(--ao-warningForeground)',
  unknown: 'var(--ao-workbench.secondaryForeground)',
}

// Mock intent parsing function
const parseIntent = (input: string): ParsedIntent => {
  const inputLower = input.toLowerCase()
  let category: IntentCategory = 'unknown'
  let action = ''
  let target: string | undefined
  const parameters: ExtractedParameter[] = []
  const entities: IntentEntity[] = []
  const ambiguities: AmbiguityIssue[] = []
  let confidence = 0.5

  // Simple intent classification
  if (inputLower.includes('创建') || inputLower.includes('添加') || inputLower.includes('新建')) {
    category = 'task_execution'
    action = 'create'
    confidence = 0.85
    if (inputLower.includes('员工') || inputLower.includes('用户')) {
      target = 'employee'
    } else if (inputLower.includes('订单')) {
      target = 'order'
    } else if (inputLower.includes('报告')) {
      target = 'report'
    }
  } else if (inputLower.includes('查询') || inputLower.includes('搜索') || inputLower.includes('找')) {
    category = 'information_query'
    action = 'query'
    confidence = 0.9
  } else if (inputLower.includes('修改') || inputLower.includes('更新') || inputLower.includes('删除')) {
    category = 'data_manipulation'
    action = 'update'
    confidence = 0.8
  } else if (inputLower.includes('分析') || inputLower.includes('统计')) {
    category = 'analysis'
    action = 'analyze'
    confidence = 0.85
  } else if (inputLower.includes('设置') || inputLower.includes('配置')) {
    category = 'configuration'
    action = 'configure'
    confidence = 0.8
  } else if (inputLower.includes('发送') || inputLower.includes('通知')) {
    category = 'communication'
    action = 'send'
    confidence = 0.85
  } else if (inputLower.includes('自动') || inputLower.includes('定时')) {
    category = 'automation'
    action = 'automate'
    confidence = 0.75
  }

  // Add some mock ambiguities for demonstration
  if (confidence < 0.7) {
    ambiguities.push({
      id: 'amb-001',
      type: 'multiple_intents',
      description: '检测到多个可能的意图',
      suggestions: ['任务执行', '信息查询'],
      resolved: false,
    })
  }

  const confidenceLevel: ConfidenceLevel =
    confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low'

  return {
    id: `intent-${Date.now()}`,
    rawInput: input,
    category,
    action,
    target,
    parameters,
    entities,
    confidence,
    confidenceLevel,
    ambiguities,
    status: confidenceLevel === 'low' ? 'clarifying' : 'parsed',
    timestamp: new Date(),
  }
}

export function IntentParsing(): React.ReactNode {
  const [inputText, setInputText] = useState('')
  const [currentIntent, setCurrentIntent] = useState<ParsedIntent | null>(null)
  const [intentHistory, setIntentHistory] = useState<ParsedIntent[]>([])
  const [clarifications, setClarifications] = useState<IntentClarification[]>([])
  const [activeTab, setActiveTab] = useState('parser')
  const [isProcessing, setIsProcessing] = useState(false)

  // Stats
  const stats: IntentParsingStats = useMemo(() => {
    const total = intentHistory.length
    const successful = intentHistory.filter((i) => i.status === 'confirmed').length
    const clarified = intentHistory.filter((i) => i.ambiguities.length > 0).length
    const avgConf =
      total > 0 ? intentHistory.reduce((sum, i) => sum + i.confidence, 0) / total : 0

    const categoryDist: Record<IntentCategory, number> = {
      task_execution: 0,
      information_query: 0,
      data_manipulation: 0,
      navigation: 0,
      configuration: 0,
      communication: 0,
      analysis: 0,
      automation: 0,
      unknown: 0,
    }
    intentHistory.forEach((i) => {
      categoryDist[i.category]++
    })

    return {
      totalParsed: total,
      successfulParsed: successful,
      clarifiedCount: clarified,
      avgConfidence: avgConf,
      avgParseTime: 150,
      categoryDistribution: categoryDist,
    }
  }, [intentHistory])

  const handleParse = () => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    // Simulate parsing delay
    setTimeout(() => {
      const intent = parseIntent(inputText)
      setCurrentIntent(intent)
      setIntentHistory((prev) => [intent, ...prev])
      setIsProcessing(false)
      setInputText('')
    }, 500)
  }

  const handleClarification = (intentId: string, option: string) => {
    setClarifications((prev) => [
      ...prev.filter((c) => c.intentId !== intentId),
      { intentId, question: '', options: [], selectedOption: option },
    ])

    // Update intent status
    if (currentIntent?.id === intentId) {
      setCurrentIntent((prev) =>
        prev
          ? {
              ...prev,
              status: 'confirmed',
              ambiguities: prev.ambiguities.map((a) => ({
                ...a,
                resolved: true,
                selectedOption: option,
              })),
            }
          : null
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">意图解析</h2>
          <p className="text-muted-foreground">解析用户输入、提取参数、检测歧义</p>
        </div>
        <div className="flex gap-4">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">总解析数</div>
            <div className="text-2xl font-bold">{stats.totalParsed}</div>
          </Card>
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">平均置信度</div>
            <div className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</div>
          </Card>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            输入解析
          </CardTitle>
          <CardDescription>输入自然语言，系统将解析意图和参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="例如：创建一个新的员工档案，姓名是张三，部门是研发部..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleParse()
                }
              }}
            />
            <Button
              onClick={handleParse}
              disabled={!inputText.trim() || isProcessing}
              className="self-end"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              解析
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="parser">
            <Target className="h-4 w-4 mr-2" />
            解析结果
          </TabsTrigger>
          <TabsTrigger value="parameters">
            <Filter className="h-4 w-4 mr-2" />
            参数提取
          </TabsTrigger>
          <TabsTrigger value="ambiguity">
            <HelpCircle className="h-4 w-4 mr-2" />
            歧义处理
          </TabsTrigger>
          <TabsTrigger value="planner">
            <Layers className="h-4 w-4 mr-2" />
            规划流程
          </TabsTrigger>
        </TabsList>

        {/* Parser Tab */}
        <TabsContent value="parser" className="space-y-4">
          {currentIntent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">当前意图</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: categoryColors[currentIntent.category],
                        color: 'white',
                      }}
                    >
                      {categoryLabels[currentIntent.category]}
                    </Badge>
                    <Badge
                      variant={
                        currentIntent.confidenceLevel === 'high'
                          ? 'default'
                          : currentIntent.confidenceLevel === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {currentIntent.confidenceLevel === 'high'
                        ? '高置信度'
                        : currentIntent.confidenceLevel === 'medium'
                          ? '中置信度'
                          : '低置信度'}
                    </Badge>
                    {currentIntent.status === 'clarifying' && (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        需要澄清
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>原始输入</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm">
                    {currentIntent.rawInput}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>意图类别</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[currentIntent.category] }}
                      />
                      <span>{categoryLabels[currentIntent.category]}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>动作</Label>
                    <Badge variant="outline">{currentIntent.action}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>目标对象</Label>
                    <Badge variant="outline">{currentIntent.target || '未指定'}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>置信度</Label>
                  <div className="flex items-center gap-3">
                    <Progress value={currentIntent.confidence * 100} className="flex-1" />
                    <span className="font-medium">{(currentIntent.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {currentIntent.ambiguities.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        检测到的歧义
                      </Label>
                      {currentIntent.ambiguities.map((amb) => (
                        <Card key={amb.id} className="p-3">
                          <div className="text-sm font-medium">{amb.description}</div>
                          {amb.suggestions.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {amb.suggestions.map((s, i) => (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleClarification(currentIntent.id, s)}
                                >
                                  {s}
                                </Button>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>输入自然语言并点击"解析"来分析意图</p>
            </Card>
          )}

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">解析历史</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {intentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {intentHistory.slice(0, 10).map((intent) => (
                      <div
                        key={intent.id}
                        className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                        onClick={() => setCurrentIntent(intent)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColors[intent.category] }}
                          />
                          <span className="text-sm truncate max-w-[300px]">
                            {intent.rawInput}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[intent.category]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(intent.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">暂无历史记录</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                参数提取
              </CardTitle>
              <CardDescription>从用户输入中提取的结构化参数</CardDescription>
            </CardHeader>
            <CardContent>
              {currentIntent && currentIntent.parameters.length > 0 ? (
                <div className="space-y-3">
                  {currentIntent.parameters.map((param, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{param.name}</span>
                          {param.required && (
                            <Badge variant="destructive" className="text-xs">
                              必填
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{param.type}</Badge>
                          <Badge
                            variant={
                              param.source === 'explicit'
                                ? 'default'
                                : param.source === 'inferred'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {param.source === 'explicit'
                              ? '显式'
                              : param.source === 'inferred'
                                ? '推断'
                                : param.source === 'context'
                                  ? '上下文'
                                  : '默认'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        {String(param.value)}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>置信度: {(param.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无提取的参数</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entity Recognition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                实体识别
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentIntent && currentIntent.entities.length > 0 ? (
                <div className="space-y-2">
                  {currentIntent.entities.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entity.type}</Badge>
                        <span>{entity.value}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(entity.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">暂无识别的实体</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambiguity Tab */}
        <TabsContent value="ambiguity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                歧义处理
              </CardTitle>
              <CardDescription>处理检测到的歧义并请求用户澄清</CardDescription>
            </CardHeader>
            <CardContent>
              {currentIntent && currentIntent.ambiguities.length > 0 ? (
                <div className="space-y-4">
                  {currentIntent.ambiguities.map((amb) => (
                    <Card key={amb.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{amb.description}</span>
                          </div>
                          <Badge variant="outline">{amb.type}</Badge>
                        </div>
                        {amb.resolved && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已解决
                          </Badge>
                        )}
                      </div>

                      {amb.suggestions.length > 0 && !amb.resolved && (
                        <div className="mt-4 space-y-2">
                          <Label>请选择一个选项：</Label>
                          <div className="flex flex-wrap gap-2">
                            {amb.suggestions.map((s, i) => (
                              <Button
                                key={i}
                                variant={amb.selectedOption === s ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleClarification(currentIntent.id, s)}
                              >
                                {s}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {amb.resolved && amb.selectedOption && (
                        <div className="mt-4 p-2 bg-green-50 rounded text-sm">
                          已选择: <strong>{amb.selectedOption}</strong>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>未检测到歧义</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clarification History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">澄清历史</CardTitle>
            </CardHeader>
            <CardContent>
              {clarifications.length > 0 ? (
                <div className="space-y-2">
                  {clarifications.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm truncate">{c.intentId}</span>
                      <Badge variant="outline">{c.selectedOption}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">暂无澄清记录</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planner Tab */}
        <TabsContent value="planner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                规划流程
              </CardTitle>
              <CardDescription>将解析的意图转换为执行计划</CardDescription>
            </CardHeader>
            <CardContent>
              {currentIntent && currentIntent.status === 'confirmed' ? (
                <div className="space-y-4">
                  {/* Pipeline visualization */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--ao-button.background)] text-white flex items-center justify-center">
                        1
                      </div>
                      <span className="text-sm">意图解析</span>
                    </div>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--ao-button.background)] text-white flex items-center justify-center">
                        2
                      </div>
                      <span className="text-sm">参数提取</span>
                    </div>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                        3
                      </div>
                      <span className="text-sm">执行计划</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Planner Output */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">执行计划</h4>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        预计 2 步
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Card className="p-3">
                        <div className="flex items-center gap-3">
                          <Badge>Step 1</Badge>
                          <span className="font-medium">{currentIntent.action}</span>
                          {currentIntent.target && (
                            <Badge variant="outline">{currentIntent.target}</Badge>
                          )}
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="flex items-center gap-3">
                          <Badge>Step 2</Badge>
                          <span className="font-medium">确认并执行</span>
                        </div>
                      </Card>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Zap className="h-4 w-4 mr-2" />
                        执行计划
                      </Button>
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重新规划
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {currentIntent?.status === 'clarifying'
                      ? '请先解决歧义后再生成计划'
                      : '解析并确认意图后将生成执行计划'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}