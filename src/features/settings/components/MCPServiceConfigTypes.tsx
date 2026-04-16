/**
 * MCP Service Config - Types & Data
 * Story 21.3
 */

// Types
export type MCPServiceStatus = 'running' | 'stopped' | 'error' | 'pending'
export type MCPServiceType = 'stdio' | 'http' | 'websocket'
export type RuntimePolicy = 'always' | 'on_demand' | 'manual'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface MCPServiceArg {
  name: string
  value: string
  description?: string
}

export interface MCPServiceEnv {
  key: string
  value: string
  encrypted: boolean
  description?: string
}

export interface MCPServiceCapability {
  name: string
  version: string
  description: string
}

export interface MCPServiceConfig {
  id: string
  name: string
  description: string
  type: MCPServiceType
  command: string
  args: MCPServiceArg[]
  env: MCPServiceEnv[]
  capabilities: MCPServiceCapability[]
  runtimePolicy: RuntimePolicy
  autoRestart: boolean
  maxRestarts: number
  restartDelay: number
  timeout: number
  logLevel: LogLevel
  status: MCPServiceStatus
  pid?: number
  startedAt?: string
  lastError?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  version: number
}

export interface MCPServiceRecord {
  id: string
  serviceId: string
  serviceName: string
  action: 'create' | 'update' | 'delete' | 'start' | 'stop' | 'restart'
  timestamp: string
  actor: string
  changes?: {
    field: string
    oldValue: string
    newValue: string
  }[]
  success: boolean
  errorMessage?: string
}

export interface MCPServiceStats {
  totalServices: number
  runningServices: number
  stoppedServices: number
  errorServices: number
  totalCapabilities: number
}

export interface MCPServiceConfigState {
  services: MCPServiceConfig[]
  records: MCPServiceRecord[]
  stats: MCPServiceStats
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

// Per-Tool Approval Policy Types
export type ApprovalPolicyType = 'auto_approve' | 'manual' | 'denied'

export interface PerToolApprovalConfig {
  id: string
  serviceId: string
  toolPattern: string
  isRegex: boolean
  policy: ApprovalPolicyType
  description?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface AutoApproveResult {
  approved: boolean
  policy: ApprovalPolicyType
  matchedConfigId?: string
  reason: string
}

// Mock data generators
export const generateMockServices = (): MCPServiceConfig[] => [
  {
    id: 'mcp-1',
    name: 'filesystem',
    description: '文件系统访问 MCP 服务',
    type: 'stdio',
    command: 'mcp-server-filesystem',
    args: [
      { name: 'root', value: '/home/user/documents', description: '根目录路径' },
      { name: 'readonly', value: 'false', description: '只读模式' },
    ],
    env: [
      { key: 'LOG_LEVEL', value: 'info', encrypted: false },
    ],
    capabilities: [
      { name: 'fs.read', version: '1.0.0', description: '读取文件' },
      { name: 'fs.write', version: '1.0.0', description: '写入文件' },
      { name: 'fs.list', version: '1.0.0', description: '列出目录' },
    ],
    runtimePolicy: 'on_demand',
    autoRestart: true,
    maxRestarts: 3,
    restartDelay: 5,
    timeout: 30,
    logLevel: 'info',
    status: 'running',
    pid: 12345,
    startedAt: '2026-03-24T08:00:00Z',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-24T08:00:00Z',
    createdBy: 'admin',
    version: 2,
  },
  {
    id: 'mcp-2',
    name: 'brave-search',
    description: 'Brave 搜索 MCP 服务',
    type: 'http',
    command: 'https://api.brave.com/mcp',
    args: [],
    env: [
      { key: 'BRAVE_API_KEY', value: '••••••••••••', encrypted: true },
    ],
    capabilities: [
      { name: 'search.web', version: '1.0.0', description: '网页搜索' },
    ],
    runtimePolicy: 'always',
    autoRestart: true,
    maxRestarts: 5,
    restartDelay: 10,
    timeout: 60,
    logLevel: 'warn',
    status: 'running',
    pid: 12346,
    startedAt: '2026-03-24T09:00:00Z',
    createdAt: '2026-03-21T14:00:00Z',
    updatedAt: '2026-03-24T09:00:00Z',
    createdBy: 'admin',
    version: 1,
  },
  {
    id: 'mcp-3',
    name: 'postgres',
    description: 'PostgreSQL 数据库 MCP 服务',
    type: 'stdio',
    command: 'mcp-server-postgres',
    args: [
      { name: 'connection-string', value: 'postgresql://localhost:5432/mydb', description: '数据库连接字符串' },
    ],
    env: [
      { key: 'PG_PASSWORD', value: '••••••••••••', encrypted: true },
    ],
    capabilities: [
      { name: 'db.query', version: '1.0.0', description: '执行 SQL 查询' },
      { name: 'db.schema', version: '1.0.0', description: '获取数据库模式' },
    ],
    runtimePolicy: 'manual',
    autoRestart: false,
    maxRestarts: 0,
    restartDelay: 5,
    timeout: 30,
    logLevel: 'info',
    status: 'stopped',
    createdAt: '2026-03-22T16:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    createdBy: 'user1',
    version: 3,
  },
]

export const generateMockRecords = (): MCPServiceRecord[] => [
  {
    id: 'rec-1',
    serviceId: 'mcp-1',
    serviceName: 'filesystem',
    action: 'start',
    timestamp: '2026-03-24T08:00:00Z',
    actor: 'system',
    success: true,
  },
  {
    id: 'rec-2',
    serviceId: 'mcp-3',
    serviceName: 'postgres',
    action: 'update',
    timestamp: '2026-03-24T10:00:00Z',
    actor: 'user1',
    changes: [
      { field: 'runtimePolicy', oldValue: 'on_demand', newValue: 'manual' },
    ],
    success: true,
  },
]

export const generateMockStats = (services: MCPServiceConfig[]): MCPServiceStats => ({
  totalServices: services.length,
  runningServices: services.filter(s => s.status === 'running').length,
  stoppedServices: services.filter(s => s.status === 'stopped').length,
  errorServices: services.filter(s => s.status === 'error').length,
  totalCapabilities: services.reduce((acc, s) => acc + s.capabilities.length, 0),
})

