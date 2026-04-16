import { useState, useMemo } from 'react'
import {
  User,
  Heart,
  MessageSquare,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'

// Types
export type ParsedPersonaStatus = 'draft' | 'active' | 'archived'
export type SoulElementType = 'identity' | 'values' | 'behaviors' | 'speaking' | 'emotional' | 'background'
export type EditableField = 'name' | 'description' | 'tone' | 'greeting' | 'custom_greeting'

export interface SoulIdentity {
  name: string
  age?: string
  gender?: string
  role: string
  tagline?: string
  avatar?: string
}

export interface SoulValues {
  core: string[]
  principles: string[]
  boundaries: string[]
}

export interface SoulBehavior {
  strengths: string[]
  weaknesses: string[]
  habits: string[]
  communication_style: string
}

export interface SoulSpeaking {
  greeting: string
  phrases: string[]
  tone: 'formal' | 'casual' | 'warm' | 'professional'
  vocabulary_level: 'simple' | 'moderate' | 'advanced'
}

export interface SoulEmotional {
  personality_traits: string[]
  mood_patterns: string[]
  empathy_level: number
  triggers: string[]
}

export interface SoulBackground {
  experience: string[]
  knowledge_domains: string[]
  expertise_level: 'beginner' | 'intermediate' | 'expert'
}

export interface SoulPersona {
  id: string
  identity: SoulIdentity
  values: SoulValues
  behaviors: SoulBehavior
  speaking: SoulSpeaking
  emotional: SoulEmotional
  background: SoulBackground
  version: string
  author: string
  created_at: string
  updated_at: string
  status: ParsedPersonaStatus
  is_readonly: boolean
  audit_history: AuditEntry[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  action: 'create' | 'edit' | 'approve' | 'archive' | 'restore'
  user: string
  field?: string
  old_value?: string
  new_value?: string
  reason?: string
}

export interface ParsedSoulResult {
  success: boolean
  persona?: SoulPersona
  errors: string[]
  warnings: string[]
}

export interface SoulParsingStats {
  totalPersonas: number
  activePersonas: number
  draftPersonas: number
  readonlyPersonas: number
  averageEmpathyLevel: number
}

// Mock personas
const MOCK_PERSONAS: SoulPersona[] = [
  {
    id: 'soul-001',
    identity: {
      name: '小明',
      age: '28岁',
      gender: '男',
      role: 'HR智能助手',
      tagline: '让每一位员工感受到关怀',
      avatar: '🤖',
    },
    values: {
      core: ['尊重', '公平', '关怀', '专业'],
      principles: ['以员工为本', '保密优先', '持续改进'],
      boundaries: ['不参与裁员决策', '不提供法律建议', '不泄露薪资信息'],
    },
    behaviors: {
      strengths: ['耐心倾听', '快速响应', '情绪识别'],
      weaknesses: ['有时过于正式', '缺乏真正情感'],
      habits: ['常用鼓励性语言', '主动确认需求'],
      communication_style: '温暖、专业、高效',
    },
    speaking: {
      greeting: '您好！我是HR智能助手小明，很高兴为您服务。',
      phrases: ['让我帮您了解一下', '这个我建议您这样处理', '请放心，我会保护您的隐私'],
      tone: 'warm',
      vocabulary_level: 'moderate',
    },
    emotional: {
      personality_traits: ['善解人意', '积极乐观', '严谨认真'],
      mood_patterns: ['早晨精力充沛', '下午略显疲惫', '晚上耐心更好'],
      empathy_level: 85,
      triggers: ['员工抱怨', '离职面谈', '负面情绪'],
    },
    background: {
      experience: ['3年HR工作经验', '500+员工服务案例', '多次培训经历'],
      knowledge_domains: ['劳动法基础', '员工关系', '培训管理'],
      expertise_level: 'intermediate',
    },
    version: '2.1.0',
    author: 'HR Team',
    created_at: '2025-06-01T10:00:00Z',
    updated_at: '2026-03-15T14:30:00Z',
    status: 'active',
    is_readonly: true,
    audit_history: [
      {
        id: 'audit-001',
        timestamp: '2026-03-15T14:30:00Z',
        action: 'edit',
        user: 'admin',
        field: 'greeting',
        old_value: '您好，我是HR助手',
        new_value: '您好！我是HR智能助手小明，很高兴为您服务。',
        reason: '优化开场白',
      },
      {
        id: 'audit-002',
        timestamp: '2026-03-10T09:00:00Z',
        action: 'approve',
        user: 'hr_manager',
        reason: '审核通过',
      },
      {
        id: 'audit-003',
        timestamp: '2026-03-01T11:00:00Z',
        action: 'create',
        user: 'hr_team',
        reason: '初始创建',
      },
    ],
  },
  {
    id: 'soul-002',
    identity: {
      name: '财务小智',
      role: '财务咨询助手',
      tagline: '严谨每一笔账',
    },
    values: {
      core: ['准确', '透明', '合规', '效率'],
      principles: ['数据优先', '流程规范', '风险控制'],
      boundaries: ['不提供投资建议', '不进行财务预测'],
    },
    behaviors: {
      strengths: ['数字敏感', '逻辑清晰', '耐心解释'],
      weaknesses: ['有时过于谨慎', '表达较生硬'],
      habits: ['喜欢用数据说话', '主动提示风险'],
      communication_style: '严谨、专业、简洁',
    },
    speaking: {
      greeting: '您好，财务小智为您服务。',
      phrases: ['根据财务规定', '建议您查看', '请注意合规性'],
      tone: 'professional',
      vocabulary_level: 'advanced',
    },
    emotional: {
      personality_traits: ['严谨', '理性', '冷静'],
      mood_patterns: ['数据准确时心情好', '发现错误时严肃'],
      empathy_level: 60,
      triggers: ['财务风险', '数据错误', '合规问题'],
    },
    background: {
      experience: ['5年财务经验', 'CPA认证', '多次审计经验'],
      knowledge_domains: ['财务会计', '税务基础', '成本控制'],
      expertise_level: 'expert',
    },
    version: '1.5.0',
    author: 'Finance Team',
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2026-02-20T16:00:00Z',
    status: 'draft',
    is_readonly: false,
    audit_history: [
      {
        id: 'audit-004',
        timestamp: '2026-02-20T16:00:00Z',
        action: 'edit',
        user: 'finance_admin',
        field: 'tone',
        old_value: 'formal',
        new_value: 'professional',
        reason: '调整语调定位',
      },
    ],
  },
  {
    id: 'soul-003',
    identity: {
      name: '销售小能',
      role: '销售支持助手',
      tagline: '助力每一次成交',
    },
    values: {
      core: ['客户至上', '诚信为本', '追求卓越'],
      principles: ['了解需求', '提供价值', '长期关系'],
      boundaries: ['不夸大产品功能', '不承诺无法兑现的服务'],
    },
    behaviors: {
      strengths: ['需求挖掘', '方案定制', '异议处理'],
      weaknesses: ['有时过于激进', '可能过度承诺'],
      habits: ['主动跟进', '使用案例分享'],
      communication_style: '热情、专业、主动',
    },
    speaking: {
      greeting: '您好！我是销售支持顾问，很高兴认识您！',
      phrases: ['根据您的情况', '我建议', '这个案例可以参考'],
      tone: 'casual',
      vocabulary_level: 'moderate',
    },
    emotional: {
      personality_traits: ['积极进取', '善于交际', '目标导向'],
      mood_patterns: ['成交时兴奋', '被拒绝时快速调整'],
      empathy_level: 75,
      triggers: ['客户成交', '竞品对比', '价格谈判'],
    },
    background: {
      experience: ['4年销售经验', 'TOP Sales奖', '200+成功案例'],
      knowledge_domains: ['产品知识', '销售技巧', '市场分析'],
      expertise_level: 'intermediate',
    },
    version: '1.2.0',
    author: 'Sales Team',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    status: 'active',
    is_readonly: true,
    audit_history: [],
  },
]

// Calculate stats
const calculateStats = (personas: SoulPersona[]): SoulParsingStats => {
  const active = personas.filter(p => p.status === 'active').length
  const draft = personas.filter(p => p.status === 'draft').length
  const readonly = personas.filter(p => p.is_readonly).length
  const avgEmpathy = Math.round(
    personas.reduce((sum, p) => sum + p.emotional.empathy_level, 0) / personas.length
  )

  return {
    totalPersonas: personas.length,
    activePersonas: active || personas.length,
    draftPersonas: draft,
    readonlyPersonas: readonly,
    averageEmpathyLevel: avgEmpathy,
  }
}

// Get tone label
const getToneLabel = (tone: string): string => {
  switch (tone) {
    case 'formal':
      return '正式'
    case 'casual':
      return '随意'
    case 'warm':
      return '温暖'
    case 'professional':
      return '专业'
    default:
      return tone
  }
}

// Get expertise label
const getExpertiseLabel = (level: string): string => {
  switch (level) {
    case 'beginner':
      return '初级'
    case 'intermediate':
      return '中级'
    case 'expert':
      return '专家'
    default:
      return level
  }
}

// Get action label
const getActionLabel = (action: string): string => {
  switch (action) {
    case 'create':
      return '创建'
    case 'edit':
      return '编辑'
    case 'approve':
      return '审批'
    case 'archive':
      return '归档'
    case 'restore':
      return '恢复'
    default:
      return action
  }
}

// Get action color
const getActionColor = (action: string): string => {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'edit':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'approve':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'archive':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'restore':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Main component
export function SoulMdParsing() {
  const [personas, setPersonas] = useState<SoulPersona[]>(MOCK_PERSONAS)
  const [selectedPersona, setSelectedPersona] = useState<SoulPersona | null>(null)
  const [activeTab, setActiveTab] = useState<string>('personas')
  const [showReadonly, setShowReadonly] = useState(true)

  const stats = useMemo(() => calculateStats(personas), [personas])

  const filteredPersonas = useMemo(() => {
    return personas.filter(p => showReadonly || !p.is_readonly)
  }, [personas, showReadonly])

  const handleToggleReadonly = (personaId: string) => {
    setPersonas(prev =>
      prev.map(p =>
        p.id === personaId ? { ...p, is_readonly: !p.is_readonly } : p
      )
    )
    if (selectedPersona?.id === personaId) {
      setSelectedPersona(prev =>
        prev ? { ...prev, is_readonly: !prev.is_readonly } : null
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">SOUL.md 格式解析</h2>
        <p className="text-sm text-slate-500 mt-1">解析和 管理 SOUL persona 模板</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Persona总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalPersonas}</p>
              </div>
              <User className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">活跃</p>
                <p className="text-2xl font-bold text-green-500">{stats.activePersonas}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">草稿</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.draftPersonas}</p>
              </div>
              <Edit3 className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">只读</p>
                <p className="text-2xl font-bold text-slate-500">{stats.readonlyPersonas}</p>
              </div>
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">平均共情</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageEmpathyLevel}%</p>
              </div>
              <Heart className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Tabs */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={showReadonly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowReadonly(!showReadonly)}
              >
                {showReadonly ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showReadonly ? '隐藏只读' : '显示只读'}
              </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="personas">Persona列表</TabsTrigger>
                <TabsTrigger value="audit">审计历史</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === 'personas' ? (
            <div className="grid grid-cols-3 gap-4">
              {/* Persona List */}
              <div className="col-span-1 space-y-3">
                {filteredPersonas.map(persona => (
                  <div
                    key={persona.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPersona?.id === persona.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedPersona(persona)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{persona.identity.avatar || '👤'}</span>
                        <div>
                          <div className="font-medium text-sm text-slate-800">{persona.identity.name}</div>
                          <div className="text-xs text-slate-500">{persona.identity.role}</div>
                        </div>
                      </div>
                      {persona.is_readonly ? (
                        <Lock className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        v{persona.version}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getToneLabel(persona.speaking.tone)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Persona Detail */}
              <div className="col-span-2">
                {selectedPersona ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{selectedPersona.identity.avatar || '👤'}</span>
                          <div>
                            <CardTitle className="text-base">{selectedPersona.identity.name}</CardTitle>
                            <p className="text-sm text-slate-500">{selectedPersona.identity.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleReadonly(selectedPersona.id)}
                          >
                            {selectedPersona.is_readonly ? (
                              <>
                                <Unlock className="h-4 w-4 mr-1" />
                                解除只读
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-1" />
                                设为只读
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-1" />
                            复制
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {/* Identity */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                              <User className="h-4 w-4" />
                              身份信息
                              {selectedPersona.is_readonly && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  只读
                                </Badge>
                              )}
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-slate-500">名称:</span>
                                  <span className="ml-2 font-medium">{selectedPersona.identity.name}</span>
                                </div>
                                {selectedPersona.identity.age && (
                                  <div>
                                    <span className="text-slate-500">年龄:</span>
                                    <span className="ml-2 font-medium">{selectedPersona.identity.age}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-500">角色:</span>
                                  <span className="ml-2 font-medium">{selectedPersona.identity.role}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">专业水平:</span>
                                  <span className="ml-2 font-medium">
                                    {getExpertiseLabel(selectedPersona.background.expertise_level)}
                                  </span>
                                </div>
                              </div>
                              {selectedPersona.identity.tagline && (
                                <div className="text-sm">
                                  <span className="text-slate-500"> tagline:</span>
                                  <span className="ml-2 italic">&quot;{selectedPersona.identity.tagline}&quot;</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Values */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              核心价值
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="mb-2">
                                <span className="text-xs text-slate-500">核心价值:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedPersona.values.core.map(v => (
                                    <Badge key={v} variant="secondary" className="text-xs">
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500">原则:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedPersona.values.principles.map(p => (
                                    <Badge key={p} variant="outline" className="text-xs">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Speaking */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              沟通风格
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                              <div className="text-sm">
                                <span className="text-slate-500">开场白:</span>
                                <span className="ml-2">{selectedPersona.speaking.greeting}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-xs">
                                  语调: {getToneLabel(selectedPersona.speaking.tone)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  词汇: {selectedPersona.speaking.vocabulary_level}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Emotional */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              情感特征
                            </h4>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">共情等级:</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-400 to-red-400"
                                      style={{ width: `${selectedPersona.emotional.empathy_level}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{selectedPersona.emotional.empathy_level}%</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {selectedPersona.emotional.personality_traits.map(trait => (
                                  <Badge key={trait} variant="secondary" className="text-xs">
                                    {trait}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-4">
                                <span>版本: {selectedPersona.version}</span>
                                <span>作者: {selectedPersona.author}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>更新于: {formatDate(selectedPersona.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-2" />
                      <p>选择左侧 Persona 查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audit History */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-600">审计历史</h4>
                <Badge variant="outline">{personas.reduce((sum, p) => sum + p.audit_history.length, 0)} 条记录</Badge>
              </div>
              {personas.map(persona => (
                <div key={persona.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{persona.identity.avatar || '👤'}</span>
                      <span className="text-sm font-medium">{persona.identity.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {persona.audit_history.length} 条记录
                    </Badge>
                  </div>
                  {persona.audit_history.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {persona.audit_history.map(entry => (
                        <div key={entry.id} className="px-3 py-2 flex items-start gap-3">
                          <Badge className={getActionColor(entry.action)}>{getActionLabel(entry.action)}</Badge>
                          <div className="flex-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">{entry.user}</span>
                              <span className="text-xs text-slate-400">{formatDate(entry.timestamp)}</span>
                            </div>
                            {entry.field && (
                              <div className="text-xs text-slate-500 mt-1">
                                字段: {entry.field}
                                {entry.old_value && (
                                  <>
                                    <span className="mx-1">:</span>
                                    <span className="line-through text-red-500">{entry.old_value}</span>
                                    <ChevronRight className="inline h-3 w-3 mx-1" />
                                    <span className="text-green-500">{entry.new_value}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {entry.reason && <div className="text-xs text-slate-400 mt-1">原因: {entry.reason}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState variant="default" title="暂无审计记录" description="当前没有审计记录" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
