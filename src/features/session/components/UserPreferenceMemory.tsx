import React, { useState, useMemo } from 'react'
import {
  User,
  Settings,
  Code,
  FileText,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Clock,
  Tag,
  Layers,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

// User Preference Types
export type PreferenceScene =
  | 'general'
  | 'code_generation'
  | 'document_writing'
  | 'data_analysis'
  | 'communication'
  | 'workflow'

export type PreferenceType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum'

export type PreferenceStatus = 'active' | 'inactive' | 'pending' | 'conflict'

export interface UserPreference {
  id: string
  key: string
  value: unknown
  type: PreferenceType
  scene: PreferenceScene
  status: PreferenceStatus
  description: string
  tags: string[]
  priority: number
  createdAt: number
  updatedAt: number
  lastAppliedAt?: number
  applicationCount: number
  source: 'explicit' | 'inferred' | 'default'
  confidence: number
  metadata?: Record<string, unknown>
}

export interface PreferenceCategory {
  scene: PreferenceScene
  label: string
  description: string
  icon: React.ReactNode
  color: string
  count: number
}

export interface PreferenceStats {
  totalPreferences: number
  activePreferences: number
  inferredPreferences: number
  explicitPreferences: number
  byScene: Record<PreferenceScene, number>
  applicationRate: number
}

// Mock Data
const mockPreferences: UserPreference[] = [
  {
    id: '1',
    key: 'code_style_indentation',
    value: 2,
    type: 'number',
    scene: 'code_generation',
    status: 'active',
    description: '代码缩进空格数',
    tags: ['style', 'formatting'],
    priority: 10,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 2,
    lastAppliedAt: Date.now() - 1800000,
    applicationCount: 156,
    source: 'explicit',
    confidence: 1.0,
  },
  {
    id: '2',
    key: 'code_language_preference',
    value: 'TypeScript',
    type: 'enum',
    scene: 'code_generation',
    status: 'active',
    description: '首选编程语言',
    tags: ['language', 'development'],
    priority: 9,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 5,
    lastAppliedAt: Date.now() - 3600000,
    applicationCount: 243,
    source: 'explicit',
    confidence: 1.0,
  },
  {
    id: '3',
    key: 'document_language',
    value: 'zh-CN',
    type: 'enum',
    scene: 'document_writing',
    status: 'active',
    description: '文档撰写语言',
    tags: ['language', 'writing'],
    priority: 8,
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 3,
    lastAppliedAt: Date.now() - 7200000,
    applicationCount: 89,
    source: 'explicit',
    confidence: 1.0,
  },
  {
    id: '4',
    key: 'response_detail_level',
    value: 'detailed',
    type: 'enum',
    scene: 'general',
    status: 'active',
    description: '回复详细程度',
    tags: ['communication', 'style'],
    priority: 7,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000,
    lastAppliedAt: Date.now() - 300000,
    applicationCount: 312,
    source: 'inferred',
    confidence: 0.85,
  },
  {
    id: '5',
    key: 'code_comment_style',
    value: 'JSDoc',
    type: 'enum',
    scene: 'code_generation',
    status: 'active',
    description: '代码注释风格',
    tags: ['style', 'documentation'],
    priority: 6,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 4,
    lastAppliedAt: Date.now() - 5400000,
    applicationCount: 78,
    source: 'inferred',
    confidence: 0.75,
  },
  {
    id: '6',
    key: 'notification_enabled',
    value: true,
    type: 'boolean',
    scene: 'general',
    status: 'active',
    description: '启用通知',
    tags: ['notifications', 'settings'],
    priority: 5,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 10,
    lastAppliedAt: Date.now() - 86400000,
    applicationCount: 1,
    source: 'explicit',
    confidence: 1.0,
  },
  {
    id: '7',
    key: 'data_visualization_theme',
    value: 'dark',
    type: 'enum',
    scene: 'data_analysis',
    status: 'active',
    description: '数据可视化主题',
    tags: ['visualization', 'theme'],
    priority: 6,
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 3,
    lastAppliedAt: Date.now() - 86400000 * 2,
    applicationCount: 34,
    source: 'inferred',
    confidence: 0.9,
  },
  {
    id: '8',
    key: 'workflow_auto_save',
    value: true,
    type: 'boolean',
    scene: 'workflow',
    status: 'active',
    description: '自动保存工作流',
    tags: ['workflow', 'automation'],
    priority: 8,
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now() - 86400000 * 7,
    lastAppliedAt: Date.now() - 3600000 * 5,
    applicationCount: 67,
    source: 'explicit',
    confidence: 1.0,
  },
]

const mockStats: PreferenceStats = {
  totalPreferences: 24,
  activePreferences: 22,
  inferredPreferences: 6,
  explicitPreferences: 18,
  byScene: {
    general: 4,
    code_generation: 8,
    document_writing: 4,
    data_analysis: 3,
    communication: 2,
    workflow: 3,
  },
  applicationRate: 0.94,
}

const preferenceCategories: PreferenceCategory[] = [
  {
    scene: 'general',
    label: '通用设置',
    description: '全局偏好设置',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-100',
    count: mockStats.byScene.general,
  },
  {
    scene: 'code_generation',
    label: '代码生成',
    description: '代码生成相关偏好',
    icon: <Code className="h-4 w-4" />,
    color: 'text-green-600 bg-green-100',
    count: mockStats.byScene.code_generation,
  },
  {
    scene: 'document_writing',
    label: '文档撰写',
    description: '文档写作偏好',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-purple-600 bg-purple-100',
    count: mockStats.byScene.document_writing,
  },
  {
    scene: 'data_analysis',
    label: '数据分析',
    description: '数据分析偏好',
    icon: <Layers className="h-4 w-4" />,
    color: 'text-orange-600 bg-orange-100',
    count: mockStats.byScene.data_analysis,
  },
  {
    scene: 'communication',
    label: '沟通方式',
    description: '沟通交互偏好',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-cyan-600 bg-cyan-100',
    count: mockStats.byScene.communication,
  },
  {
    scene: 'workflow',
    label: '工作流',
    description: '工作流自动化偏好',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-pink-600 bg-pink-100',
    count: mockStats.byScene.workflow,
  },
]

const sceneColors: Record<PreferenceScene, string> = {
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  code_generation: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  document_writing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  data_analysis: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  communication: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  workflow: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
}

const sourceColors: Record<string, string> = {
  explicit: 'bg-green-100 text-green-800',
  inferred: 'bg-yellow-100 text-yellow-800',
  default: 'bg-gray-100 text-gray-800',
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

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

export function UserPreferenceMemory(): React.ReactNode {
  const [activeTab, setActiveTab] = useState('preferences')
  const [preferences, setPreferences] = useState<UserPreference[]>(mockPreferences)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScene, setSelectedScene] = useState<PreferenceScene | 'all'>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPreference, setEditingPreference] = useState<UserPreference | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Filter preferences
  const filteredPreferences = useMemo(() => {
    return preferences.filter((pref) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !pref.key.toLowerCase().includes(query) &&
          !pref.description.toLowerCase().includes(query) &&
          !pref.tags.some((tag) => tag.toLowerCase().includes(query))
        ) {
          return false
        }
      }
      if (selectedScene !== 'all' && pref.scene !== selectedScene) return false
      if (selectedSource !== 'all' && pref.source !== selectedSource) return false
      return true
    })
  }, [preferences, searchQuery, selectedScene, selectedSource])

  // Group by scene
  const groupedPreferences = useMemo(() => {
    const groups: Record<PreferenceScene, UserPreference[]> = {
      general: [],
      code_generation: [],
      document_writing: [],
      data_analysis: [],
      communication: [],
      workflow: [],
    }
    filteredPreferences.forEach((pref) => {
      groups[pref.scene].push(pref)
    })
    return groups
  }, [filteredPreferences])

  // Handlers
  const handleTogglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
          : p
      )
    )
  }

  const handleDeletePreference = (id: string) => {
    setPreferences((prev) => prev.filter((p) => p.id !== id))
  }

  const handleEditPreference = (pref: UserPreference) => {
    setEditingPreference({ ...pref })
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (editingPreference) {
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === editingPreference.id
            ? { ...editingPreference, updatedAt: Date.now() }
            : p
        )
      )
      setShowEditDialog(false)
      setEditingPreference(null)
    }
  }

  const handleExportPreferences = () => {
    const data = JSON.stringify(preferences, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-preferences-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderValueInput = (pref: UserPreference, onChange: (value: unknown) => void) => {
    switch (pref.type) {
      case 'boolean':
        return (
          <Switch
            checked={pref.value as boolean}
            onCheckedChange={onChange}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={pref.value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-32"
          />
        )
      case 'enum':
        return (
          <Select
            value={pref.value as string}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TypeScript">TypeScript</SelectItem>
              <SelectItem value="JavaScript">JavaScript</SelectItem>
              <SelectItem value="Python">Python</SelectItem>
              <SelectItem value="Rust">Rust</SelectItem>
              <SelectItem value="Go">Go</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Textarea
            value={JSON.stringify(pref.value)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
            className="min-h-[60px]"
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ao-button.background)]">用户偏好记忆</h2>
          <p className="text-muted-foreground">管理长期用户偏好捕获和应用</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPreferences}>
            <Download className="h-4 w-4 mr-2" />
            导出偏好
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入偏好
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加偏好
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--ao-button.background)]" />
              <div>
                <p className="text-2xl font-bold">{mockStats.totalPreferences}</p>
                <p className="text-sm text-muted-foreground">总偏好设置</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.activePreferences}</p>
                <p className="text-sm text-muted-foreground">活跃偏好</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.explicitPreferences}</p>
                <p className="text-sm text-muted-foreground">显式设置</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{mockStats.inferredPreferences}</p>
                <p className="text-sm text-muted-foreground">推断偏好</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Rate */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">偏好应用率</span>
            <span className="text-sm text-muted-foreground">
              {(mockStats.applicationRate * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={mockStats.applicationRate * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preferences">偏好列表</TabsTrigger>
          <TabsTrigger value="byScene">按场景分类</TabsTrigger>
          <TabsTrigger value="application">应用统计</TabsTrigger>
        </TabsList>

        {/* Preferences List Tab */}
        <TabsContent value="preferences" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索偏好键、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedScene}
              onValueChange={(v) => setSelectedScene(v as PreferenceScene | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="场景" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部场景</SelectItem>
                {preferenceCategories.map((cat) => (
                  <SelectItem key={cat.scene} value={cat.scene}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSource}
              onValueChange={setSelectedSource}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="explicit">显式设置</SelectItem>
                <SelectItem value="inferred">推断</SelectItem>
                <SelectItem value="default">默认</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferences List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredPreferences.map((pref) => (
                <Card key={pref.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Switch
                            checked={pref.status === 'active'}
                            onCheckedChange={() => handleTogglePreference(pref.id)}
                          />
                          <span className="font-mono font-medium">{pref.key}</span>
                          <Badge className={sceneColors[pref.scene]}>{pref.scene}</Badge>
                          <Badge className={sourceColors[pref.source]}>{pref.source}</Badge>
                          {pref.source === 'inferred' && (
                            <span className="text-xs text-yellow-600">
                              置信度: {(pref.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{pref.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>类型: {pref.type}</span>
                          <span>优先级: {pref.priority}</span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {pref.tags.join(', ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            应用 {pref.applicationCount} 次
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPreference(pref)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreference(pref.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* By Scene Tab */}
        <TabsContent value="byScene" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {preferenceCategories.map((category) => (
              <Card key={category.scene} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {groupedPreferences[category.scene].map((pref) => (
                        <div
                          key={pref.id}
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <span className="font-mono text-xs truncate flex-1">{pref.key}</span>
                          <Switch
                            checked={pref.status === 'active'}
                            onCheckedChange={() => handleTogglePreference(pref.id)}
                            className="ml-2"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Application Stats Tab */}
        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">按场景应用分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Object.entries(mockStats.byScene) as [PreferenceScene, number][]).map(
                    ([scene, count]) => (
                      <div key={scene} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge className={sceneColors[scene]}>{scene}</Badge>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress
                          value={(count / mockStats.totalPreferences) * 100}
                          className="h-2"
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">最近应用的偏好</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {preferences
                      .filter((p) => p.lastAppliedAt)
                      .sort((a, b) => (b.lastAppliedAt || 0) - (a.lastAppliedAt || 0))
                      .slice(0, 10)
                      .map((pref) => (
                        <div
                          key={pref.id}
                          className="flex items-center justify-between p-2 border rounded text-sm"
                        >
                          <div>
                            <span className="font-mono">{pref.key}</span>
                            <p className="text-xs text-muted-foreground">{pref.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(pref.lastAppliedAt || 0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Top Used Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">高频使用偏好</CardTitle>
              <CardDescription>应用次数最多的偏好设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preferences
                  .sort((a, b) => b.applicationCount - a.applicationCount)
                  .slice(0, 5)
                  .map((pref, index) => (
                    <div key={pref.id} className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{pref.key}</span>
                          <Badge className={sceneColors[pref.scene]}>{pref.scene}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{pref.applicationCount}</p>
                        <p className="text-xs text-muted-foreground">次应用</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新偏好</DialogTitle>
            <DialogDescription>创建新的用户偏好设置</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">偏好键</label>
              <Input placeholder="preference_key_name" />
            </div>
            <div>
              <label className="text-sm font-medium">类型</label>
              <Select defaultValue="string">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">字符串</SelectItem>
                  <SelectItem value="number">数字</SelectItem>
                  <SelectItem value="boolean">布尔值</SelectItem>
                  <SelectItem value="enum">枚举</SelectItem>
                  <SelectItem value="array">数组</SelectItem>
                  <SelectItem value="object">对象</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">场景</label>
              <Select defaultValue="general">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferenceCategories.map((cat) => (
                    <SelectItem key={cat.scene} value={cat.scene}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <Textarea placeholder="偏好描述..." className="min-h-[60px]" />
            </div>
            <div>
              <label className="text-sm font-medium">标签（逗号分隔）</label>
              <Input placeholder="tag1, tag2, tag3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑偏好</DialogTitle>
          </DialogHeader>
          {editingPreference && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">偏好键</label>
                <Input value={editingPreference.key} disabled />
              </div>
              <div>
                <label className="text-sm font-medium">当前值</label>
                <div className="mt-1">
                  {renderValueInput(editingPreference, (value) =>
                    setEditingPreference({ ...editingPreference, value })
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <Textarea
                  value={editingPreference.description}
                  onChange={(e) =>
                    setEditingPreference({
                      ...editingPreference,
                      description: e.target.value,
                    })
                  }
                  className="min-h-[60px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">优先级</label>
                <Input
                  type="number"
                  value={editingPreference.priority}
                  onChange={(e) =>
                    setEditingPreference({
                      ...editingPreference,
                      priority: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">标签（逗号分隔）</label>
                <Input
                  value={editingPreference.tags.join(', ')}
                  onChange={(e) =>
                    setEditingPreference({
                      ...editingPreference,
                      tags: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>创建时间: {formatTimestamp(editingPreference.createdAt)}</p>
                <p>更新时间: {formatTimestamp(editingPreference.updatedAt)}</p>
                <p>应用次数: {editingPreference.applicationCount}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
