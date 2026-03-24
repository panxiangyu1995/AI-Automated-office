import { useState, useMemo } from 'react'
import {
  FileCode,
  Package,
  Wrench,
  Zap,
  GitBranch,
  CheckCircle2,
  XCircle,
  Shield,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
export type ParsedSkillStatus = 'draft' | 'active' | 'deprecated' | 'archived'
export type ParsedToolType = 'mcp' | 'builtin' | 'custom'
export type ParsedTriggerType = 'event' | 'schedule' | 'manual' | 'condition'
export type ParsedParamType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export interface SkillMetadata {
  name: string
  version: string
  description: string
  author: string
  tags: string[]
  category: string
  icon?: string
  homepage?: string
  repository?: string
  license?: string
}

export interface SkillTool {
  id: string
  name: string
  type: ParsedToolType
  description: string
  parameters: ParsedSkillParameter[]
  returnType: string
  examples?: string[]
}

export interface ParsedSkillParameter {
  name: string
  type: ParsedParamType
  description: string
  required: boolean
  default?: string
  enum?: string[]
}

export interface SkillTrigger {
  id: string
  type: ParsedTriggerType
  name: string
  description: string
  config: Record<string, string>
}

export interface ParsedSkill {
  id: string
  metadata: SkillMetadata
  tools: SkillTool[]
  triggers: SkillTrigger[]
  dependencies: string[]
  parsedAt: string
  rawContent: string
}

export interface ParseResult {
  success: boolean
  skill?: ParsedSkill
  errors: string[]
  warnings: string[]
}

export interface SkillParsingStats {
  totalSkills: number
  activeSkills: number
  totalTools: number
  totalTriggers: number
  averageToolsPerSkill: number
}

// Mock parsed skills
const MOCK_PARSED_SKILLS: ParsedSkill[] = [
  {
    id: 'skill-001',
    metadata: {
      name: 'hr-employee-onboarding',
      version: '1.2.0',
      description: '自动化员工入职流程，包括账号创建、工位分配、培训安排等',
      author: 'HR Team',
      tags: ['hr', 'onboarding', 'automation'],
      category: '人力资源',
      icon: 'user-plus',
      homepage: 'https://docs.example.com/skills/hr-onboarding',
      repository: 'https://github.com/example/hr-onboarding',
      license: 'MIT',
    },
    tools: [
      {
        id: 'tool-001',
        name: 'create_account',
        type: 'mcp',
        description: '创建新员工账号',
        parameters: [
          { name: 'employee_id', type: 'string', description: '员工ID', required: true },
          { name: 'email', type: 'string', description: '员工邮箱', required: true },
          { name: 'department', type: 'string', description: '部门', required: true },
          { name: 'role', type: 'string', description: '角色', required: false, default: 'member' },
        ],
        returnType: 'object',
        examples: ['create_account(email="zhangsan@company.com", department="研发部")'],
      },
      {
        id: 'tool-002',
        name: 'send_welcome_email',
        type: 'mcp',
        description: '发送欢迎邮件',
        parameters: [
          { name: 'email', type: 'string', description: '收件人邮箱', required: true },
          { name: 'template', type: 'string', description: '邮件模板', required: false, default: 'default' },
        ],
        returnType: 'boolean',
        examples: ['send_welcome_email(email="zhangsan@company.com")'],
      },
    ],
    triggers: [
      {
        id: 'trigger-001',
        type: 'event',
        name: '员工入职事件',
        description: '当新员工入职时自动触发',
        config: { event: 'employee.onboard', async: 'true' },
      },
      {
        id: 'trigger-002',
        type: 'schedule',
        name: '每日入职检查',
        description: '每天早上9点检查当天入职安排',
        config: { cron: '0 9 * * *', timezone: 'Asia/Shanghai' },
      },
    ],
    dependencies: ['mcp-hr-system', 'mcp-email-service'],
    parsedAt: '2026-03-20T10:00:00Z',
    rawContent: '',
  },
  {
    id: 'skill-002',
    metadata: {
      name: 'finance-invoice-processing',
      version: '2.0.1',
      description: '发票处理和报销审核技能',
      author: 'Finance Team',
      tags: ['finance', 'invoice', 'approval'],
      category: '财务',
      icon: 'receipt',
      license: 'Proprietary',
    },
    tools: [
      {
        id: 'tool-003',
        name: 'validate_invoice',
        type: 'builtin',
        description: '验证发票真实性',
        parameters: [
          { name: 'invoice_id', type: 'string', description: '发票ID', required: true },
          { name: 'amount', type: 'number', description: '金额', required: true },
        ],
        returnType: 'object',
      },
      {
        id: 'tool-004',
        name: 'approve_expense',
        type: 'mcp',
        description: '审批报销申请',
        parameters: [
          { name: 'expense_id', type: 'string', description: '报销单ID', required: true },
          { name: 'approved', type: 'boolean', description: '是否批准', required: true },
          { name: 'comment', type: 'string', description: '审批意见', required: false },
        ],
        returnType: 'boolean',
      },
      {
        id: 'tool-005',
        name: 'extract_invoice_data',
        type: 'custom',
        description: '从发票图片提取数据',
        parameters: [
          { name: 'image_url', type: 'string', description: '发票图片URL', required: true },
        ],
        returnType: 'object',
      },
    ],
    triggers: [
      {
        id: 'trigger-003',
        type: 'manual',
        name: '手动触发审批',
        description: '管理员手动触发报销审批流程',
        config: { requiresApproval: 'true' },
      },
      {
        id: 'trigger-004',
        type: 'condition',
        name: '金额阈值触发',
        description: '当报销金额超过5000元时触发',
        config: { field: 'amount', operator: 'gt', value: '5000' },
      },
    ],
    dependencies: ['mcp-finance-system', 'ocr-service'],
    parsedAt: '2026-03-19T15:30:00Z',
    rawContent: '',
  },
  {
    id: 'skill-003',
    metadata: {
      name: 'warehouse-inventory-check',
      version: '1.0.0',
      description: '仓库库存盘点和预警',
      author: 'Warehouse Team',
      tags: ['warehouse', 'inventory', 'alert'],
      category: '仓储',
    },
    tools: [
      {
        id: 'tool-006',
        name: 'check_stock',
        type: 'mcp',
        description: '检查库存数量',
        parameters: [
          { name: 'product_id', type: 'string', description: '产品ID', required: true },
        ],
        returnType: 'object',
      },
      {
        id: 'tool-007',
        name: 'create_alert',
        type: 'mcp',
        description: '创建库存预警',
        parameters: [
          { name: 'product_id', type: 'string', description: '产品ID', required: true },
          { name: 'threshold', type: 'number', description: '阈值', required: true },
        ],
        returnType: 'boolean',
      },
    ],
    triggers: [
      {
        id: 'trigger-005',
        type: 'schedule',
        name: '每周库存盘点',
        description: '每周一早上8点进行库存盘点',
        config: { cron: '0 8 * * 1', timezone: 'Asia/Shanghai' },
      },
    ],
    dependencies: ['mcp-warehouse-system'],
    parsedAt: '2026-03-18T09:00:00Z',
    rawContent: '',
  },
]

// Calculate stats
const calculateStats = (skills: ParsedSkill[]): SkillParsingStats => {
  return {
    totalSkills: skills.length,
    activeSkills: skills.length,
    totalTools: skills.reduce((sum, s) => sum + s.tools.length, 0),
    totalTriggers: skills.reduce((sum, s) => sum + s.triggers.length, 0),
    averageToolsPerSkill: Math.round(skills.reduce((sum, s) => sum + s.tools.length, 0) / skills.length),
  }
}

// Parse SKILL.md content (mock implementation)
const parseSkillMdContent = (content: string): ParseResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!content.includes('# SKILL')) {
    errors.push('缺少 # SKILL 标题')
  }

  if (!content.includes('## Metadata')) {
    warnings.push('缺少 ## Metadata 部分')
  }

  if (!content.includes('## Tools')) {
    warnings.push('缺少 ## Tools 部分')
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings }
  }

  // Mock parsed result
  const skill: ParsedSkill = {
    id: `skill-${Date.now()}`,
    metadata: {
      name: 'new-skill',
      version: '1.0.0',
      description: '解析的新技能',
      author: 'Unknown',
      tags: [],
      category: '未分类',
    },
    tools: [],
    triggers: [],
    dependencies: [],
    parsedAt: new Date().toISOString(),
    rawContent: content,
  }

  return { success: true, skill, errors, warnings }
}

// Get tool type color
const getToolTypeColor = (type: ParsedToolType): string => {
  switch (type) {
    case 'mcp':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'builtin':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'custom':
      return 'bg-purple-100 text-purple-700 border-purple-200'
  }
}

// Get tool type label
const getToolTypeLabel = (type: ParsedToolType): string => {
  switch (type) {
    case 'mcp':
      return 'MCP'
    case 'builtin':
      return '内置'
    case 'custom':
      return '自定义'
  }
}

// Get trigger type color
const getTriggerTypeColor = (type: ParsedTriggerType): string => {
  switch (type) {
    case 'event':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'schedule':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'manual':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'condition':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }
}

// Get trigger type label
const getTriggerTypeLabel = (type: ParsedTriggerType): string => {
  switch (type) {
    case 'event':
      return '事件'
    case 'schedule':
      return '定时'
    case 'manual':
      return '手动'
    case 'condition':
      return '条件'
  }
}

// Main component
export function SkillMdParsing() {
  const [skills, setSkills] = useState<ParsedSkill[]>(MOCK_PARSED_SKILLS)
  const [selectedSkill, setSelectedSkill] = useState<ParsedSkill | null>(null)
  const [uploadContent, setUploadContent] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const stats = useMemo(() => calculateStats(skills), [skills])

  const handleParseContent = () => {
    setIsParsing(true)
    setTimeout(() => {
      const result = parseSkillMdContent(uploadContent)
      setParseResult(result)
      setIsParsing(false)
    }, 1000)
  }

  const handleRegisterSkill = (skill: ParsedSkill) => {
    setIsRegistering(true)
    setTimeout(() => {
      setSkills(prev => [...prev, { ...skill, id: `skill-${Date.now()}` }])
      setIsRegistering(false)
      setParseResult(null)
      setUploadContent('')
    }, 1500)
  }

  const handleDeleteSkill = (skillId: string) => {
    setSkills(prev => prev.filter(s => s.id !== skillId))
    if (selectedSkill?.id === skillId) {
      setSelectedSkill(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">SKILL.md 格式解析</h2>
        <p className="text-sm text-slate-500 mt-1">解析和注册 SKILL.md 格式的技能</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">技能总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalSkills}</p>
              </div>
              <Package className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">活跃技能</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeSkills}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">工具总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalTools}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">触发器总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalTriggers}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均工具数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageToolsPerSkill}</p>
              </div>
              <GitBranch className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">技能列表</TabsTrigger>
          <TabsTrigger value="upload">上传解析</TabsTrigger>
          <TabsTrigger value="dependencies">依赖关系</TabsTrigger>
        </TabsList>

        {/* Skills List */}
        <TabsContent value="skills">
          <div className="grid grid-cols-3 gap-4">
            {/* Skills List */}
            <div className="col-span-1 space-y-3">
              {skills.map(skill => (
                <div
                  key={skill.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSkill?.id === skill.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedSkill(skill)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm text-slate-800">{skill.metadata.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      v{skill.metadata.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{skill.metadata.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="text-xs" variant="secondary">
                      {skill.tools.length} 工具
                    </Badge>
                    <Badge className="text-xs" variant="secondary">
                      {skill.triggers.length} 触发器
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Detail */}
            <div className="col-span-2">
              {selectedSkill ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{selectedSkill.metadata.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          重新解析
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSkill(selectedSkill.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          元数据
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-500">名称:</span>
                              <span className="ml-2 font-medium">{selectedSkill.metadata.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">版本:</span>
                              <span className="ml-2 font-medium">{selectedSkill.metadata.version}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">作者:</span>
                              <span className="ml-2 font-medium">{selectedSkill.metadata.author}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">分类:</span>
                              <span className="ml-2 font-medium">{selectedSkill.metadata.category}</span>
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500">描述:</span>
                            <span className="ml-2">{selectedSkill.metadata.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">标签:</span>
                            <div className="flex gap-1">
                              {selectedSkill.metadata.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tools */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                          <Wrench className="h-4 w-4" />
                          工具 ({selectedSkill.tools.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedSkill.tools.map(tool => (
                            <div key={tool.id} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{tool.name}</span>
                                  <Badge className={getToolTypeColor(tool.type)}>{getToolTypeLabel(tool.type)}</Badge>
                                </div>
                                <span className="text-xs text-slate-500">返回: {tool.returnType}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{tool.description}</p>
                              {tool.parameters.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-slate-500">参数:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tool.parameters.map(param => (
                                      <Badge key={param.name} variant="outline" className="text-xs">
                                        {param.name}: {param.type}
                                        {param.required ? '*' : ''}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Triggers */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          触发器 ({selectedSkill.triggers.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedSkill.triggers.map(trigger => (
                            <div key={trigger.id} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{trigger.name}</span>
                                  <Badge className={getTriggerTypeColor(trigger.type)}>
                                    {getTriggerTypeLabel(trigger.type)}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{trigger.description}</p>
                              {Object.keys(trigger.config).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {Object.entries(trigger.config).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key}: {value}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dependencies */}
                      {selectedSkill.dependencies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            依赖
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkill.dependencies.map(dep => (
                              <Badge key={dep} variant="secondary">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                    <p>选择左侧技能查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Upload and Parse */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">上传 SKILL.md 内容</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <textarea
                    className="w-full h-64 rounded-md border border-slate-200 p-3 font-mono text-sm"
                    placeholder="粘贴 SKILL.md 内容..."
                    value={uploadContent}
                    onChange={e => setUploadContent(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleParseContent} disabled={!uploadContent || isParsing}>
                    {isParsing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <FileCode className="h-4 w-4 mr-1" />
                        解析内容
                      </>
                    )}
                  </Button>
                </div>

                {/* Parse Result */}
                {parseResult && (
                  <div className={`p-4 rounded-lg border ${parseResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {parseResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`font-medium ${parseResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {parseResult.success ? '解析成功' : '解析失败'}
                      </span>
                    </div>

                    {parseResult.errors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-red-600 font-medium">错误:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {parseResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parseResult.warnings.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-yellow-600 font-medium">警告:</p>
                        <ul className="text-sm text-yellow-600 list-disc list-inside">
                          {parseResult.warnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parseResult.success && parseResult.skill && (
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => handleRegisterSkill(parseResult.skill!)} disabled={isRegistering}>
                          {isRegistering ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              注册中...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              注册技能
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependencies */}
        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">技能依赖关系</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skills.map(skill => (
                  <div key={skill.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 flex-1">
                      <Package className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm">{skill.metadata.name}</span>
                      <Badge variant="outline" className="text-xs">
                        v{skill.metadata.version}
                      </Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center gap-2 flex-1">
                      {skill.dependencies.length > 0 ? (
                        skill.dependencies.map(dep => (
                          <Badge key={dep} variant="secondary" className="text-xs">
                            {dep}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">无依赖</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
