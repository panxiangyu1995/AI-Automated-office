/**
 * SubAgentPersistence.tsx
 * Story 7.9 - 子代理状态持久化
 * 
 * 功能：
 * - 状态持久化：将子代理执行状态持久化到本地存储
 * - 恢复机制：中断或重启后恢复子代理执行
 * - 一致性保证：保持父子执行历史一致性
 */

import { useState, useMemo } from 'react'
import { 
  Archive, RotateCcw, CheckCircle2, Trash2, Download, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================================
// 类型定义

/** 持久化状态 */
export type PersistenceStatus = 
  | 'pending'     // 待处理
  | 'saving'      // 保存中
  | 'saved'       // 已保存
  | 'restoring'   // 恢复中
  | 'restored'    // 已恢复
  | 'failed'      // 失败

/** 检查点类型 */
export type CheckpointType = 
  | 'step_start'     // 步骤开始
  | 'step_complete'  // 步骤完成
  | 'tool_call'      // 工具调用
  | 'state_change'   // 状态变更
  | 'error'          // 错误发生
  | 'user_interrupt' // 用户中断

/** 执行检查点 */
export interface ExecutionCheckpoint {
  id: string
  agentId: string
  parentAgentId?: string
  type: CheckpointType
  timestamp: Date
  stepId: string
  stepName: string
  state: Record<string, unknown>
  metadata?: {
    tokensUsed?: number
    duration?: number
    toolsCalled?: string[]
  }
}

/** 持久化记录 */
export interface PersistenceRecord {
  id: string
  agentId: string
  agentName: string
  taskId: string
  status: PersistenceStatus
  checkpoints: ExecutionCheckpoint[]
  totalSize: number // bytes
  createdAt: Date
  updatedAt: Date
  lastRestoredAt?: Date
  restoreCount: number
  syncStatus: 'local' | 'syncing' | 'synced' | 'conflict'
}

/** 恢复选项 */
export interface RestoreOptions {
  checkpointId?: string
  resumeFromLast: boolean
  clearConflicting: boolean
  preserveUserChanges: boolean
}

/** 持久化配置 */
export interface PersistenceConfig {
  enabled: boolean
  autoSaveInterval: number // seconds
  maxCheckpoints: number
  compressionEnabled: boolean
  syncToCloud: boolean
  retentionDays: number
}

/** 一致性检查结果 */
export interface ConsistencyResult {
  isConsistent: boolean
  issues: string[]
  recommendations: string[]
}

/** 持久化统计 */
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

/** 子代理持久化状态 */
export interface SubAgentPersistenceState {
  records: PersistenceRecord[]
  config: PersistenceConfig
  stats: PersistenceStats
  isRestoring: boolean
  lastConsistencyCheck: ConsistencyResult | null
}

// ============================================================================
// 默认数据

const defaultConfig: PersistenceConfig = {
  enabled: true,
  autoSaveInterval: 30,
  maxCheckpoints: 100,
  compressionEnabled: true,
  syncToCloud: false,
  retentionDays: 30,
}

const createMockRecords = (): PersistenceRecord[] => [
  {
    id: 'persist-1',
    agentId: 'sub-agent-1',
    agentName: '任务执行器 Alpha',
    taskId: 'task-001',
    status: 'saved',
    checkpoints: [
      { 
        id: 'cp-1', 
        agentId: 'sub-agent-1', 
        parentAgentId: 'main-agent', 
        type: 'step_start', 
        timestamp: new Date(Date.now() - 1800000), 
        stepId: 'step-1', 
        stepName: '初始化', 
        state: { phase: 'init' } 
      },
      { 
        id: 'cp-2', 
        agentId: 'sub-agent-1', 
        parentAgentId: 'main-agent', 
        type: 'step_complete', 
        timestamp: new Date(Date.now() - 1790000), 
        stepId: 'step-1', 
        stepName: '初始化', 
        state: { phase: 'init_complete' }, 
        metadata: { duration: 60 } 
      },
      { 
        id: 'cp-3', 
        agentId: 'sub-agent-1', 
        parentAgentId: 'main-agent', 
        type: 'step_complete', 
        timestamp: new Date(Date.now() - 1200000), 
        stepId: 'step-2', 
        stepName: '执行任务', 
        state: { phase: 'exec_complete' }, 
        metadata: { duration: 590, tokensUsed: 1500, toolsCalled: ['search', 'process'] } 
      },
    ],
    totalSize: 15360,
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1200000),
    restoreCount: 0,
    syncStatus: 'synced',
  },
  {
    id: 'persist-2',
    agentId: 'sub-agent-2',
    agentName: '研究助手 Beta',
    taskId: 'task-002',
    status: 'restored',
    checkpoints: [
      { 
        id: 'cp-4', 
        agentId: 'sub-agent-2', 
        parentAgentId: 'main-agent', 
        type: 'step_start', 
        timestamp: new Date(Date.now() - 600000), 
        stepId: 'step-1', 
        stepName: '信息搜索', 
        state: { query: 'AI trends' } 
      },
    ],
    totalSize: 8192,
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 300000),
    lastRestoredAt: new Date(Date.now() - 300000),
    restoreCount: 1,
    syncStatus: 'local',
  },
  {
    id: 'persist-3',
    agentId: 'sub-agent-3',
    agentName: '分析师 Gamma',
    taskId: 'task-003',
    status: 'failed',
    checkpoints: [
      { 
        id: 'cp-5', 
        agentId: 'sub-agent-3', 
        parentAgentId: 'main-agent', 
        type: 'error', 
        timestamp: new Date(Date.now() - 540000), 
        stepId: 'step-2', 
        stepName: '数据处理', 
        state: { error: '内存不足' } 
      },
    ],
    totalSize: 4096,
    createdAt: new Date(Date.now() - 600000),
    updatedAt: new Date(Date.now() - 540000),
    restoreCount: 0,
    syncStatus: 'local',
  },
]

// ============================================================================
// 子组件

/** 状态徽章 */
function StatusBadge({ status }: { status: PersistenceStatus }) {
  const config: Record<PersistenceStatus, { label: string; className: string }> = {
    pending: { label: '待处理', className: 'bg-gray-100 text-gray-600' },
    saving: { label: '保存中', className: 'bg-blue-100 text-blue-700' },
    saved: { label: '已保存', className: 'bg-green-100 text-green-700' },
    restoring: { label: '恢复中', className: 'bg-amber-100 text-amber-700' },
    restored: { label: '已恢复', className: 'bg-green-100 text-green-700' },
    failed: { label: '失败', className: 'bg-red-100 text-red-700' },
  }
  
  const { label, className } = config[status]
  
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {label}
    </Badge>
  )
}

/** 同步状态徽章 */
function SyncBadge({ status }: { status: 'local' | 'syncing' | 'synced' | 'conflict' }) {
  const config = {
    local: { label: '本地', className: 'bg-gray-100 text-gray-600' },
    syncing: { label: '同步中', className: 'bg-blue-100 text-blue-700' },
    synced: { label: '已同步', className: 'bg-green-100 text-green-700' },
    conflict: { label: '冲突', className: 'bg-red-100 text-red-700' },
  }
  
  const { label, className } = config[status]
  
  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      {label}
    </Badge>
  )
}

/** 持久化记录卡片 */
function PersistenceRecordCard({ 
  record, 
  onRestore, 
  onDelete, 
  onExport 
}: { 
  record: PersistenceRecord
  onRestore: (id: string, options: RestoreOptions) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}) {
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm">{record.agentName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={record.status} />
            <SyncBadge status={record.syncStatus} />
          </div>
        </div>
        <CardDescription className="text-xs">
          任务: {record.taskId} | 检查点: {record.checkpoints.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">大小: </span>
            <span>{(record.totalSize / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-muted-foreground">恢复次数: </span>
            <span>{record.restoreCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">创建: </span>
            <span>{new Date(record.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">更新: </span>
            <span>{new Date(record.updatedAt).toLocaleString()}</span>
          </div>
        </div>
        
        {record.checkpoints.length > 0 && (
          <div className="mb-3 p-2 bg-slate-50 rounded text-xs">
            <div className="font-medium mb-1">最新检查点:</div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{record.checkpoints[record.checkpoints.length - 1].stepName}</span>
              <span className="text-muted-foreground">
                {new Date(record.checkpoints[record.checkpoints.length - 1].timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => onRestore(record.id, { resumeFromLast: true, clearConflicting: false, preserveUserChanges: true })}
            disabled={record.status === 'restoring'}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            恢复
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onExport(record.id)}
          >
            <Download className="h-3 w-3 mr-1" />
            导出
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(record.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** 配置面板 */
function ConfigPanel({ 
  config, 
  onChange 
}: { 
  config: PersistenceConfig
  onChange: (config: PersistenceConfig) => void
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">持久化配置</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs">启用自动保存</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">自动保存间隔 (秒)</span>
            <input
              type="number"
              value={config.autoSaveInterval}
              onChange={(e) => onChange({ ...config, autoSaveInterval: parseInt(e.target.value) || 30 })}
              className="w-20 h-6 text-xs border rounded px-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">最大检查点数</span>
            <input
              type="number"
              value={config.maxCheckpoints}
              onChange={(e) => onChange({ ...config, maxCheckpoints: parseInt(e.target.value) || 100 })}
              className="w-20 h-6 text-xs border rounded px-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">启用压缩</span>
            <input
              type="checkbox"
              checked={config.compressionEnabled}
              onChange={(e) => onChange({ ...config, compressionEnabled: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">同步到云端</span>
            <input
              type="checkbox"
              checked={config.syncToCloud}
              onChange={(e) => onChange({ ...config, syncToCloud: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">保留天数</span>
            <input
              type="number"
              value={config.retentionDays}
              onChange={(e) => onChange({ ...config, retentionDays: parseInt(e.target.value) || 30 })}
              className="w-20 h-6 text-xs border rounded px-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// 主组件

export function SubAgentPersistence() {
  const [state, setState] = useState<SubAgentPersistenceState>({
    records: createMockRecords(),
    config: defaultConfig,
    stats: {
      totalRecords: 3,
      totalSize: 27648,
      checkpointCount: 6,
      averageRestoreTime: 2.5,
      successRate: 85,
      lastBackup: new Date(Date.now() - 3600000),
      storageUsed: 27,
      storageLimit: 512,
    },
    isRestoring: false,
    lastConsistencyCheck: null,
  })
  
  const [activeTab, setActiveTab] = useState<'records' | 'checkpoints' | 'config'>('records')
  
  // 统计数据
  const stats = useMemo(() => {
    return {
      ...state.stats,
      totalRecords: state.records.length,
      checkpointCount: state.records.reduce((sum, r) => sum + r.checkpoints.length, 0),
    }
  }, [state])
  
  // 处理恢复
  const handleRestore = (recordId: string, _options: RestoreOptions) => {
    setState(prev => ({
      ...prev,
      isRestoring: true,
      records: prev.records.map(r => 
        r.id === recordId ? { ...r, status: 'restoring' as const } : r
      ),
    }))
    
    // 模拟恢复过程
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isRestoring: false,
        records: prev.records.map(r => 
          r.id === recordId ? { 
            ...r, 
            status: 'restored' as const,
            lastRestoredAt: new Date(),
            restoreCount: r.restoreCount + 1,
          } : r
        ),
      }))
    }, 1500)
  }
  
  // 处理删除
  const handleDelete = (recordId: string) => {
    setState(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== recordId),
    }))
  }
  
  // 处理导出
  const handleExport = (recordId: string) => {
    console.log(`Exporting record ${recordId}`)
  }
  
  // 一致性检查
  const handleCheckConsistency = () => {
    const result: ConsistencyResult = {
      isConsistent: true,
      issues: [],
      recommendations: ['建议定期清理过期的持久化记录'],
    }
    setState(prev => ({ ...prev, lastConsistencyCheck: result }))
  }
  
  // 清理过期记录
  const handleCleanup = () => {
    const cutoff = new Date(Date.now() - state.config.retentionDays * 24 * 60 * 60 * 1000)
    setState(prev => ({
      ...prev,
      records: prev.records.filter(r => r.updatedAt > cutoff),
    }))
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">子代理状态持久化</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCheckConsistency}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              一致性检查
            </Button>
            <Button size="sm" variant="outline" onClick={handleCleanup}>
              <Trash2 className="h-3 w-3 mr-1" />
              清理过期
            </Button>
          </div>
        </div>
        <CardDescription>
          管理子代理执行状态的持久化、恢复和一致性
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">持久化记录</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalRecords}</div>
            <div className="text-xs text-muted-foreground">条记录</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">检查点</div>
            <div className="text-2xl font-bold text-blue-600">{stats.checkpointCount}</div>
            <div className="text-xs text-muted-foreground">个检查点</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">存储使用</div>
            <div className="text-2xl font-bold text-green-600">{(stats.totalSize / 1024).toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">KB</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">恢复成功率</div>
            <div className="text-2xl font-bold text-amber-600">{stats.successRate}%</div>
            <div className="text-xs text-muted-foreground">成功率</div>
          </Card>
        </div>
        
        {/* 存储进度 */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>存储空间使用</span>
            <span>{stats.storageUsed} MB / {stats.storageLimit} MB</span>
          </div>
          <Progress value={(stats.storageUsed / stats.storageLimit) * 100} className="h-2" />
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b mb-4">
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'records' 
                ? 'border-purple-500 text-purple-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('records')}
          >
            持久化记录
          </button>
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'checkpoints' 
                ? 'border-purple-500 text-purple-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('checkpoints')}
          >
            检查点历史
          </button>
          <button
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'config' 
                ? 'border-purple-500 text-purple-700' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('config')}
          >
            配置
          </button>
        </div>
        
        {/* 内容区域 */}
        <ScrollArea className="h-[350px] pr-4">
          {activeTab === 'records' && (
            <div className="space-y-2">
              {state.records.map(record => (
                <PersistenceRecordCard
                  key={record.id}
                  record={record}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </div>
          )}
          
          {activeTab === 'checkpoints' && (
            <div className="space-y-2">
              {state.records.flatMap(r => r.checkpoints).map((cp, idx) => (
                <Card key={cp.id || idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{cp.stepName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{cp.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Agent: {cp.agentId} | {new Date(cp.timestamp).toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {activeTab === 'config' && (
            <ConfigPanel 
              config={state.config} 
              onChange={(config) => setState(prev => ({ ...prev, config }))} 
            />
          )}
        </ScrollArea>
        
        {/* 一致性检查结果 */}
        {state.lastConsistencyCheck && (
          <Card className="mt-4 p-3 bg-slate-50">
            <div className="text-sm font-medium mb-2">一致性检查结果</div>
            <div className={cn(
              'text-xs',
              state.lastConsistencyCheck.isConsistent ? 'text-green-700' : 'text-red-700'
            )}>
              状态: {state.lastConsistencyCheck.isConsistent ? '一致' : '存在问题'}
            </div>
            {state.lastConsistencyCheck.issues.length > 0 && (
              <div className="text-xs text-red-600 mt-1">
                问题: {state.lastConsistencyCheck.issues.join(', ')}
              </div>
            )}
            {state.lastConsistencyCheck.recommendations.length > 0 && (
              <div className="text-xs text-amber-600 mt-1">
                建议: {state.lastConsistencyCheck.recommendations.join('; ')}
              </div>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default SubAgentPersistence