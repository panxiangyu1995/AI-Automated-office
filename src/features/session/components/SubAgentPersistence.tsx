import { useMemo, useState } from 'react'
import { Archive, CheckCircle2, Clock3, Download, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SETTINGS_SUB_AGENT_OPTIONS } from '@/features/settings/components/subAgentSettingsFixtures'

export type PersistenceStatus = 'pending' | 'saving' | 'saved' | 'restoring' | 'restored' | 'failed'
export type CheckpointType = 'step_start' | 'step_complete' | 'tool_call' | 'state_change' | 'error' | 'user_interrupt'

export interface ExecutionCheckpoint {
  id: string
  agentId: string
  parentAgentId?: string
  type: CheckpointType
  timestamp: Date
  stepId: string
  stepName: string
  state: Record<string, unknown>
  metadata?: { tokensUsed?: number; duration?: number; toolsCalled?: string[] }
}

export interface PersistenceRecord {
  id: string
  agentId: string
  agentName: string
  taskId: string
  taskLabel: string
  status: PersistenceStatus
  checkpoints: ExecutionCheckpoint[]
  totalSize: number
  createdAt: Date
  updatedAt: Date
  lastRestoredAt?: Date
  restoreCount: number
  syncStatus: 'local' | 'syncing' | 'synced' | 'conflict'
}

export interface RestoreOptions {
  checkpointId?: string
  resumeFromLast: boolean
  clearConflicting: boolean
  preserveUserChanges: boolean
}

export interface PersistenceConfig {
  enabled: boolean
  autoSaveInterval: number
  maxCheckpoints: number
  compressionEnabled: boolean
  syncToCloud: boolean
  retentionDays: number
}

export interface ConsistencyResult {
  isConsistent: boolean
  issues: string[]
  recommendations: string[]
}

export interface PersistenceStats {
  totalRecords: number
  totalSize: number
  checkpointCount: number
  averageRestoreTime: number
  successRate: number
  lastBackup: Date
  storageUsed: number
  storageLimit: number
}

export interface SubAgentPersistenceState {
  records: PersistenceRecord[]
  config: PersistenceConfig
  stats: PersistenceStats
  isRestoring: boolean
  lastConsistencyCheck: ConsistencyResult | null
}

const DEFAULT_CONFIG: PersistenceConfig = {
  enabled: true,
  autoSaveInterval: 30,
  maxCheckpoints: 120,
  compressionEnabled: true,
  syncToCloud: true,
  retentionDays: 30,
}

const AGENT_NAMES = Object.fromEntries(SETTINGS_SUB_AGENT_OPTIONS.map((item) => [item.id, item.name]))

const createRecords = (): PersistenceRecord[] => [
  {
    id: 'persist-001',
    agentId: 'subagent-001',
    agentName: AGENT_NAMES['subagent-001'] ?? '文档起草助手',
    taskId: 'task-bid-outline',
    taskLabel: '起草新标书章节草稿',
    status: 'saved',
    checkpoints: [
      { id: 'cp-001', agentId: 'subagent-001', parentAgentId: 'main-agent:user-001', type: 'step_start', timestamp: new Date(Date.now() - 22 * 60 * 1000), stepId: 'step-001', stepName: '读取招标要求与历史模板', state: { source: 'cloud' } },
      { id: 'cp-002', agentId: 'subagent-001', parentAgentId: 'main-agent:user-001', type: 'tool_call', timestamp: new Date(Date.now() - 20 * 60 * 1000), stepId: 'step-002', stepName: 'document_parse', state: { template: 'bid-template-v3' }, metadata: { duration: 46, toolsCalled: ['file_read', 'document_parse'] } },
      { id: 'cp-003', agentId: 'subagent-001', parentAgentId: 'main-agent:user-001', type: 'state_change', timestamp: new Date(Date.now() - 16 * 60 * 1000), stepId: 'step-003', stepName: '写入工作区暂存变更', state: { stagedChangeCount: 6 }, metadata: { tokensUsed: 2840 } },
    ],
    totalSize: 17_408,
    createdAt: new Date(Date.now() - 22 * 60 * 1000),
    updatedAt: new Date(Date.now() - 16 * 60 * 1000),
    restoreCount: 0,
    syncStatus: 'synced',
  },
  {
    id: 'persist-002',
    agentId: 'subagent-002',
    agentName: AGENT_NAMES['subagent-002'] ?? '资料整理助手',
    taskId: 'task-resource-brief',
    taskLabel: '整理历史标书与资质材料',
    status: 'restored',
    checkpoints: [
      { id: 'cp-004', agentId: 'subagent-002', parentAgentId: 'main-agent:user-001', type: 'step_start', timestamp: new Date(Date.now() - 9 * 60 * 1000), stepId: 'step-004', stepName: '读取云端资料目录', state: { folder: '/tender/archive' } },
      { id: 'cp-005', agentId: 'subagent-002', parentAgentId: 'main-agent:user-001', type: 'step_complete', timestamp: new Date(Date.now() - 7 * 60 * 1000), stepId: 'step-005', stepName: '清洗投标要求与附件引用', state: { normalizedFiles: 18 }, metadata: { duration: 94 } },
    ],
    totalSize: 9_216,
    createdAt: new Date(Date.now() - 9 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000),
    lastRestoredAt: new Date(Date.now() - 3 * 60 * 1000),
    restoreCount: 1,
    syncStatus: 'syncing',
  },
  {
    id: 'persist-003',
    agentId: 'subagent-003',
    agentName: AGENT_NAMES['subagent-003'] ?? '规则校验助手',
    taskId: 'task-policy-check',
    taskLabel: '校验敏感字段与规则约束',
    status: 'failed',
    checkpoints: [
      { id: 'cp-006', agentId: 'subagent-003', parentAgentId: 'main-agent:user-001', type: 'step_start', timestamp: new Date(Date.now() - 13 * 60 * 1000), stepId: 'step-007', stepName: '载入制度与模板规则', state: { source: 'policy-kb' } },
      { id: 'cp-007', agentId: 'subagent-003', parentAgentId: 'main-agent:user-001', type: 'error', timestamp: new Date(Date.now() - 11 * 60 * 1000), stepId: 'step-008', stepName: '检查权限受限字段', state: { error: 'permission_denied', field: 'sensitive_pricing' } },
    ],
    totalSize: 4_608,
    createdAt: new Date(Date.now() - 13 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11 * 60 * 1000),
    restoreCount: 0,
    syncStatus: 'local',
  },
]

function StatusBadge({ status }: { status: PersistenceStatus }) {
  const classes: Record<PersistenceStatus, string> = {
    pending: 'bg-slate-100 text-slate-700',
    saving: 'bg-blue-100 text-blue-700',
    saved: 'bg-emerald-100 text-emerald-700',
    restoring: 'bg-amber-100 text-amber-700',
    restored: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  }
  return <Badge variant="outline" className={cn('text-xs', classes[status])}>{status}</Badge>
}

function SyncBadge({ status }: { status: PersistenceRecord['syncStatus'] }) {
  const classes: Record<PersistenceRecord['syncStatus'], string> = {
    local: 'bg-slate-100 text-slate-700',
    syncing: 'bg-blue-100 text-blue-700',
    synced: 'bg-emerald-100 text-emerald-700',
    conflict: 'bg-red-100 text-red-700',
  }
  return <Badge variant="outline" className={cn('text-xs', classes[status])}>{status}</Badge>
}

export function SubAgentPersistence() {
  const [state, setState] = useState<SubAgentPersistenceState>({
    records: createRecords(),
    config: DEFAULT_CONFIG,
    stats: {
      totalRecords: 0,
      totalSize: 0,
      checkpointCount: 0,
      averageRestoreTime: 2.4,
      successRate: 88,
      lastBackup: new Date(Date.now() - 60 * 60 * 1000),
      storageUsed: 31,
      storageLimit: 512,
    },
    isRestoring: false,
    lastConsistencyCheck: null,
  })
  const [activeTab, setActiveTab] = useState<'records' | 'checkpoints' | 'config'>('records')

  const stats = useMemo(() => ({
    ...state.stats,
    totalRecords: state.records.length,
    totalSize: state.records.reduce((sum, item) => sum + item.totalSize, 0),
    checkpointCount: state.records.reduce((sum, item) => sum + item.checkpoints.length, 0),
  }), [state])

  const handleRestore = (recordId: string, _options: RestoreOptions) => {
    setState((prev) => ({
      ...prev,
      isRestoring: true,
      records: prev.records.map((item) => item.id === recordId ? { ...item, status: 'restoring' as const } : item),
    }))
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isRestoring: false,
        records: prev.records.map((item) => item.id === recordId ? { ...item, status: 'restored' as const, lastRestoredAt: new Date(), restoreCount: item.restoreCount + 1 } : item),
      }))
    }, 1200)
  }

  const handleDelete = (recordId: string) => {
    setState((prev) => ({ ...prev, records: prev.records.filter((item) => item.id !== recordId) }))
  }

  const handleExport = (_recordId: string) => {}

  const handleCheckConsistency = () => {
    setState((prev) => ({
      ...prev,
      lastConsistencyCheck: {
        isConsistent: true,
        issues: [],
        recommendations: ['保留用户确认前的 staged change checkpoint，并按 30 天清理旧记录。'],
      },
    }))
  }

  const handleCleanup = () => {
    const cutoff = Date.now() - state.config.retentionDays * 24 * 60 * 60 * 1000
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((item) => item.updatedAt.getTime() > cutoff),
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-[#1E3A5F]" />
              <CardTitle className="text-lg">Sub-Agent 状态持久化</CardTitle>
            </div>
            <CardDescription>保存子 Agent 执行上下文、暂存写回 checkpoint 和恢复记录。</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCheckConsistency}><CheckCircle2 className="mr-1 h-3 w-3" />一致性检查</Button>
            <Button size="sm" variant="outline" onClick={handleCleanup}><Trash2 className="mr-1 h-3 w-3" />清理过期</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-3"><div className="text-xs text-muted-foreground">持久化记录</div><div className="text-2xl font-bold text-[#1E3A5F]">{stats.totalRecords}</div><div className="text-xs text-muted-foreground">条记录</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">检查点</div><div className="text-2xl font-bold text-blue-600">{stats.checkpointCount}</div><div className="text-xs text-muted-foreground">个 checkpoint</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">存储使用</div><div className="text-2xl font-bold text-emerald-600">{(stats.totalSize / 1024).toFixed(1)}</div><div className="text-xs text-muted-foreground">KB</div></Card>
          <Card className="p-3"><div className="text-xs text-muted-foreground">恢复成功率</div><div className="text-2xl font-bold text-amber-600">{stats.successRate}%</div><div className="text-xs text-muted-foreground">平均 {stats.averageRestoreTime}s</div></Card>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs">
            <span>存储空间使用</span>
            <span>{stats.storageUsed} MB / {stats.storageLimit} MB</span>
          </div>
          <Progress value={(stats.storageUsed / stats.storageLimit) * 100} className="h-2" />
        </div>

        <div className="mb-4 flex border-b">
          {(['records', 'checkpoints', 'config'] as const).map((tab) => (
            <button key={tab} type="button" className={cn('border-b-2 px-4 py-2 text-sm font-medium transition-colors', activeTab === tab ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-muted-foreground hover:text-foreground')} onClick={() => setActiveTab(tab)}>
              {tab === 'records' ? '持久化记录' : tab === 'checkpoints' ? '检查点历史' : '配置'}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[360px] pr-4">
          {activeTab === 'records' && state.records.map((item) => (
            <Card key={item.id} className="mb-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">{item.agentName}</CardTitle>
                    <CardDescription className="text-xs">{item.taskLabel}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge status={item.status} /><SyncBadge status={item.syncStatus} /></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">大小:</span> {(item.totalSize / 1024).toFixed(1)} KB</div>
                  <div><span className="font-medium text-foreground">恢复次数:</span> {item.restoreCount}</div>
                  <div><span className="font-medium text-foreground">创建:</span> {item.createdAt.toLocaleString('zh-CN')}</div>
                  <div><span className="font-medium text-foreground">更新:</span> {item.updatedAt.toLocaleString('zh-CN')}</div>
                </div>
                <div className="rounded-md bg-slate-50 p-2 text-xs">
                  <div className="mb-1 font-medium">最新 checkpoint</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-3 w-3 text-muted-foreground" /><span>{item.checkpoints[item.checkpoints.length - 1]?.stepName ?? 'N/A'}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRestore(item.id, { resumeFromLast: true, clearConflicting: false, preserveUserChanges: true })} disabled={state.isRestoring}><RotateCcw className="mr-1 h-3 w-3" />恢复</Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport(item.id)}><Download className="mr-1 h-3 w-3" />导出</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}><Trash2 className="mr-1 h-3 w-3" />删除</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {activeTab === 'checkpoints' && state.records.flatMap((record) => record.checkpoints.map((checkpoint) => ({ record, checkpoint }))).map(({ record, checkpoint }) => (
            <Card key={checkpoint.id} className="mb-3 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{checkpoint.stepName}</div>
                  <div className="text-xs text-muted-foreground">{record.agentName} | {checkpoint.timestamp.toLocaleString('zh-CN')}</div>
                </div>
                <Badge variant="outline" className="text-xs">{checkpoint.type}</Badge>
              </div>
            </Card>
          ))}

          {activeTab === 'config' && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">持久化配置</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs">
                <label className="flex items-center justify-between"><span>启用自动保存</span><input type="checkbox" checked={state.config.enabled} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, enabled: e.target.checked } }))} className="h-4 w-4" /></label>
                <label className="flex items-center justify-between"><span>自动保存间隔（秒）</span><input type="number" value={state.config.autoSaveInterval} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, autoSaveInterval: Number.parseInt(e.target.value, 10) || 30 } }))} className="h-7 w-20 rounded border px-2" /></label>
                <label className="flex items-center justify-between"><span>最大 checkpoint</span><input type="number" value={state.config.maxCheckpoints} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, maxCheckpoints: Number.parseInt(e.target.value, 10) || 120 } }))} className="h-7 w-20 rounded border px-2" /></label>
                <label className="flex items-center justify-between"><span>启用压缩</span><input type="checkbox" checked={state.config.compressionEnabled} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, compressionEnabled: e.target.checked } }))} className="h-4 w-4" /></label>
                <label className="flex items-center justify-between"><span>同步到云端</span><input type="checkbox" checked={state.config.syncToCloud} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, syncToCloud: e.target.checked } }))} className="h-4 w-4" /></label>
                <label className="flex items-center justify-between"><span>保留天数</span><input type="number" value={state.config.retentionDays} onChange={(e) => setState((prev) => ({ ...prev, config: { ...prev.config, retentionDays: Number.parseInt(e.target.value, 10) || 30 } }))} className="h-7 w-20 rounded border px-2" /></label>
              </CardContent>
            </Card>
          )}
        </ScrollArea>

        {state.lastConsistencyCheck && (
          <Card className="mt-4 bg-slate-50 p-3">
            <div className="text-sm font-medium">一致性检查结果</div>
            <div className={cn('text-xs', state.lastConsistencyCheck.isConsistent ? 'text-emerald-700' : 'text-red-700')}>
              状态: {state.lastConsistencyCheck.isConsistent ? '一致' : '存在问题'}
            </div>
            {state.lastConsistencyCheck.recommendations.length > 0 && (
              <div className="mt-1 text-xs text-amber-700">建议: {state.lastConsistencyCheck.recommendations.join('；')}</div>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default SubAgentPersistence
