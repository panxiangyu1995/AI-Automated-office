import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Lightbulb,
  Copy,
  Upload,
  MoreVertical,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Correction Rule Types
export type CorrectionStatus = 'active' | 'inactive' | 'deprecated' | 'testing'
export type RuleCategory = 'output_format' | 'content_accuracy' | 'behavior' | 'safety' | 'performance'
export type TriggerType = 'keyword' | 'pattern' | 'context' | 'tool_output'
export type ApplicationScope = 'global' | 'user' | 'session' | 'tool'

export interface CorrectionCase {
  id: string
  originalOutput: string
  correctedOutput: string
  correctionReason: string
  toolName?: string
  sessionId: string
  timestamp: number
  userId: string
  extractedRules: string[]
}

export interface LearningCorrectionRule {
  id: string
  name: string
  description: string
  category: RuleCategory
  triggerType: TriggerType
  triggerCondition: string
  correctionAction: string
  status: CorrectionStatus
  scope: ApplicationScope
  priority: number
  successRate: number
  applicationsCount: number
  sourceCaseId?: string
  createdAt: number
  updatedAt: number
  createdBy: string
  tags: string[]
}

export interface RuleStats {
  totalRules: number
  activeRules: number
  totalCorrections: number
  avgSuccessRate: number
  byCategory: Record<RuleCategory, number>
  byStatus: Record<CorrectionStatus, number>
  recentApplications: number
  topRules: { ruleId: string; name: string; applications: number }[]
}

// Mock Data
const mockCorrectionCases: CorrectionCase[] = [
  {
    id: 'case-001',
    originalOutput: '根据您的需求，我建议使用A方案。',
    correctedOutput: '根据您的需求，我建议使用A方案。具体实施步骤如下：...',
    correctionReason: '输出过于简略，缺少具体实施步骤',
    toolName: 'chat',
    sessionId: 'session-001',
    timestamp: Date.now() - 3600000,
    userId: 'user@example.com',
    extractedRules: ['rule-001'],
  },
  {
    id: 'case-002',
    originalOutput: '错误信息：File not found',
    correctedOutput: '文件未找到，请检查路径是否正确。',
    correctionReason: '错误信息过于简单，缺少解决方案',
    toolName: 'fs_read',
    sessionId: 'session-002',
    timestamp: Date.now() - 7200000,
    userId: 'user@example.com',
    extractedRules: ['rule-002'],
  },
  {
    id: 'case-003',
    originalOutput: '执行成功',
    correctedOutput: '执行成功。已完成操作。',
    correctionReason: '输出缺少执行详情',
    toolName: 'shell_execute',
    sessionId: 'session-003',
    timestamp: Date.now() - 86400000,
    userId: 'admin@example.com',
    extractedRules: ['rule-003'],
  },
]

const mockCorrectionRules: LearningCorrectionRule[] = [
  {
    id: 'rule-001',
    name: '详细输出规则',
    description: '当提供方案建议时，必须包含具体实施步骤',
    category: 'output_format',
    triggerType: 'keyword',
    triggerCondition: '建议|方案|推荐',
    correctionAction: '添加详细实施步骤和预期结果',
    status: 'active',
    scope: 'global',
    priority: 1,
    successRate: 0.92,
    applicationsCount: 156,
    sourceCaseId: 'case-001',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 3600000,
    createdBy: 'admin@example.com',
    tags: ['输出格式', '详细性'],
  },
  {
    id: 'rule-002',
    name: '错误信息增强规则',
    description: '错误信息应包含问题描述和解决方案建议',
    category: 'content_accuracy',
    triggerType: 'pattern',
    triggerCondition: '(error|错误|失败)',
    correctionAction: '添加问题分析和解决方案建议',
    status: 'active',
    scope: 'global',
    priority: 2,
    successRate: 0.88,
    applicationsCount: 89,
    sourceCaseId: 'case-002',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000,
    createdBy: 'admin@example.com',
    tags: ['错误处理', '用户体验'],
  },
  {
    id: 'rule-003',
    name: '执行结果详情规则',
    description: '工具执行结果应包含详细的操作记录',
    category: 'output_format',
    triggerType: 'tool_output',
    triggerCondition: 'shell_execute|fs_*',
    correctionAction: '列出所有执行的操作和结果',
    status: 'active',
    scope: 'tool',
    priority: 3,
    successRate: 0.95,
    applicationsCount: 234,
    sourceCaseId: 'case-003',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 2,
    createdBy: 'admin@example.com',
    tags: ['工具输出', '透明性'],
  },
]

const mockStats: RuleStats = {
  totalRules: 24,
  activeRules: 18,
  totalCorrections: 491,
  avgSuccessRate: 0.91,
  byCategory: {
    output_format: 8,
    content_accuracy: 6,
    behavior: 4,
    safety: 3,
    performance: 3,
  },
  byStatus: {
    active: 18,
    inactive: 3,
    deprecated: 1,
    testing: 2,
  },
  recentApplications: 45,
  topRules: [
    { ruleId: 'rule-003', name: '执行结果详情规则', applications: 234 },
    { ruleId: 'rule-001', name: '详细输出规则', applications: 156 },
    { ruleId: 'rule-002', name: '错误信息增强规则', applications: 89 },
  ],
}

const statusColors: Record<CorrectionStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  deprecated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  testing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
}

const categoryColors: Record<RuleCategory, string> = {
  output_format: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  content_accuracy: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  behavior: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  safety: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  performance: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}秒前`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export function CorrectionRuleLearning(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('rules')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RuleCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<CorrectionStatus | 'all'>('all')
  const [selectedScope, setSelectedScope] = useState<ApplicationScope | 'all'>('all')
  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false)
  const [selectedRule, setSelectedRule] = useState<LearningCorrectionRule | null>(null)
  const [showRuleDetail, setShowRuleDetail] = useState(false)
  const [selectedCase, setSelectedCase] = useState<CorrectionCase | null>(null)
  const [showCaseDetail, setShowCaseDetail] = useState(false)

  const filteredRules = useMemo(() => {
    return mockCorrectionRules.filter((rule) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !rule.name.toLowerCase().includes(query) &&
          !rule.description.toLowerCase().includes(query) &&
          !rule.tags.some((t) => t.toLowerCase().includes(query))
        ) {
          return false
        }
      }
      if (selectedCategory !== 'all' && rule.category !== selectedCategory) return false
      if (selectedStatus !== 'all' && rule.status !== selectedStatus) return false
      if (selectedScope !== 'all' && rule.scope !== selectedScope) return false
      return true
    })
  }, [searchQuery, selectedCategory, selectedStatus, selectedScope])

  const filteredCases = useMemo(() => {
    if (!searchQuery) return mockCorrectionCases
    const query = searchQuery.toLowerCase()
    return mockCorrectionCases.filter(
      (c) =>
        c.originalOutput.toLowerCase().includes(query) ||
        c.correctedOutput.toLowerCase().includes(query) ||
        c.correctionReason.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const handleViewRule = (rule: LearningCorrectionRule) => {
    setSelectedRule(rule)
    setShowRuleDetail(true)
  }

  const handleViewCase = (caseItem: CorrectionCase) => {
    setSelectedCase(caseItem)
    setShowCaseDetail(true)
  }

  const handleToggleRuleStatus = (_ruleId: string) => {
    // Toggle rule status
  }

  const handleDeleteRule = (_ruleId: string) => {
    // Delete rule
  }

  const handleExtractRule = (_caseId: string) => {
    // Extract rule from case
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">错题集与规则学习</h2>
          <p className="text-muted-foreground">捕获纠正输出，提取规则，持续改进 Agent 能力</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入规则
          </Button>
          <Button size="sm" onClick={() => setShowAddRuleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建规则
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalRules}</p>
                <p className="text-sm text-muted-foreground">总规则数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.activeRules}</p>
                <p className="text-sm text-muted-foreground">活跃规则</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalCorrections}</p>
                <p className="text-sm text-muted-foreground">总纠正次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{(mockStats.avgSuccessRate * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">平均成功率</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.recentApplications}</p>
                <p className="text-sm text-muted-foreground">近期应用</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">纠正规则</TabsTrigger>
          <TabsTrigger value="cases">纠正案例</TabsTrigger>
          <TabsTrigger value="analytics">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索规则..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as RuleCategory | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类别</SelectItem>
                    <SelectItem value="output_format">输出格式</SelectItem>
                    <SelectItem value="content_accuracy">内容准确性</SelectItem>
                    <SelectItem value="behavior">行为</SelectItem>
                    <SelectItem value="safety">安全</SelectItem>
                    <SelectItem value="performance">性能</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as CorrectionStatus | 'all')}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="testing">测试中</SelectItem>
                    <SelectItem value="deprecated">已废弃</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as ApplicationScope | 'all')}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部范围</SelectItem>
                    <SelectItem value="global">全局</SelectItem>
                    <SelectItem value="user">用户</SelectItem>
                    <SelectItem value="session">会话</SelectItem>
                    <SelectItem value="tool">工具</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusColors[rule.status]}>{rule.status}</Badge>
                          <Badge className={categoryColors[rule.category]}>{rule.category}</Badge>
                          <Badge variant="outline">{rule.scope}</Badge>
                          <span className="font-medium">{rule.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            成功率: {(rule.successRate * 100).toFixed(0)}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            应用: {rule.applicationsCount}次
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(rule.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {rule.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={() => handleToggleRuleStatus(rule.id)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleViewRule(rule)}>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              复制
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRule(rule.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <ScrollArea className="h-[450px]">
            <div className="space-y-3">
              {filteredCases.map((caseItem) => (
                <Card key={caseItem.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{caseItem.toolName || 'chat'}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(caseItem.timestamp)}
                          </span>
                          {caseItem.extractedRules.length > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              <Lightbulb className="h-3 w-3 mr-1" />
                              已提取规则
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleExtractRule(caseItem.id)}>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            提取规则
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewCase(caseItem)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            原始输出
                          </p>
                          <p className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded line-clamp-3">
                            {caseItem.originalOutput}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            纠正后输出
                          </p>
                          <p className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded line-clamp-3">
                            {caseItem.correctedOutput}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">纠正原因</p>
                        <p className="text-sm">{caseItem.correctionReason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按类别分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byCategory).map(([category, count]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress value={(count / mockStats.totalRules) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockStats.byStatus).map(([status, count]) => (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={statusColors[status as CorrectionStatus]}>{status}</Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                      <Progress value={(count / mockStats.totalRules) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">高频应用规则</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStats.topRules.map((rule, index) => (
                    <div key={rule.ruleId} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.applications} 次应用</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">成功率趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-500">
                      {(mockStats.avgSuccessRate * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">平均成功率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddRuleDialog} onOpenChange={setShowAddRuleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建纠正规则</DialogTitle>
            <DialogDescription>创建新的纠正规则以改进 Agent 输出</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">规则名称</label>
              <Input placeholder="输入规则名称..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">描述</label>
              <Textarea placeholder="输入规则描述..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">类别</label>
                <Select defaultValue="output_format">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="output_format">输出格式</SelectItem>
                    <SelectItem value="content_accuracy">内容准确性</SelectItem>
                    <SelectItem value="behavior">行为</SelectItem>
                    <SelectItem value="safety">安全</SelectItem>
                    <SelectItem value="performance">性能</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">触发类型</label>
                <Select defaultValue="keyword">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">关键词</SelectItem>
                    <SelectItem value="pattern">正则模式</SelectItem>
                    <SelectItem value="context">上下文</SelectItem>
                    <SelectItem value="tool_output">工具输出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">触发条件</label>
              <Input placeholder="输入触发条件..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">纠正动作</label>
              <Textarea placeholder="输入纠正动作..." />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRuleDetail} onOpenChange={setShowRuleDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>规则详情</DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">名称</label>
                  <p className="font-medium">{selectedRule.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <p>
                    <Badge className={statusColors[selectedRule.status]}>{selectedRule.status}</Badge>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">描述</label>
                <p>{selectedRule.description}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">类别</label>
                  <p>
                    <Badge className={categoryColors[selectedRule.category]}>{selectedRule.category}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground">触发类型</label>
                  <p>{selectedRule.triggerType}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">应用范围</label>
                  <p>
                    <Badge variant="outline">{selectedRule.scope}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground">优先级</label>
                  <p>{selectedRule.priority}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">触发条件</label>
                  <p className="bg-muted p-2 rounded text-sm font-mono">{selectedRule.triggerCondition}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">纠正动作</label>
                  <p className="bg-muted p-2 rounded text-sm">{selectedRule.correctionAction}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">成功率</label>
                  <p className="font-medium text-green-500">{(selectedRule.successRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <label className="text-muted-foreground">应用次数</label>
                  <p className="font-medium">{selectedRule.applicationsCount}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">创建者</label>
                  <p>{selectedRule.createdBy}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">来源案例</label>
                  <p>{selectedRule.sourceCaseId || '手动创建'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">标签</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRule.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCaseDetail} onOpenChange={setShowCaseDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>纠正案例详情</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">工具</label>
                  <p className="font-medium">{selectedCase.toolName || 'chat'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">会话ID</label>
                  <p className="font-medium">{selectedCase.sessionId}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">时间</label>
                  <p>{new Date(selectedCase.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  原始输出
                </label>
                <p className="bg-red-50 dark:bg-red-950 p-3 rounded mt-1">{selectedCase.originalOutput}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  纠正后输出
                </label>
                <p className="bg-green-50 dark:bg-green-950 p-3 rounded mt-1">{selectedCase.correctedOutput}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">纠正原因</label>
                <p className="bg-muted p-3 rounded mt-1">{selectedCase.correctionReason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">已提取规则</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCase.extractedRules.length > 0 ? (
                    selectedCase.extractedRules.map((ruleId) => (
                      <Badge key={ruleId} className="bg-green-100 text-green-800">{ruleId}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">尚未提取规则</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}