/**
 * Task Trace Analysis - Types & Mock Data
 * Story 32.2 - 任务链路追踪
 */

export type TraceStatus = 'running' | 'completed' | 'failed' | 'cancelled'
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TraceSpan {
  id: string
  traceId: string
  parentSpanId?: string
  name: string
  type: 'task' | 'step' | 'tool' | 'agent' | 'system'
  status: StepStatus
  startTime: Date
  endTime?: Date
  duration?: number
  latency?: number
  inputTokens?: number
  outputTokens?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
  children?: TraceSpan[]
}

export interface TraceEvent {
  id: string
  traceId: string
  spanId: string
  type: 'start' | 'end' | 'error' | 'retry' | 'skip' | 'manual'
  timestamp: Date
  message: string
  details?: Record<string, unknown>
}

export interface Trace {
  id: string
  traceId: string
  taskName: string
  taskType: string
  status: TraceStatus
  startTime: Date
  endTime?: Date
  duration?: number
  totalSteps: number
  completedSteps: number
  failedSteps: number
  totalToolCalls: number
  successfulToolCalls: number
  failedToolCalls: number
  totalLatency: number
  avgLatency: number
  inputTokens: number
  outputTokens: number
  rootSpan: TraceSpan
  events: TraceEvent[]
}

export interface LatencyBucket {
  range: string
  count: number
  percentage: number
}

export interface TraceStats {
  totalTraces: number
  activeTraces: number
  completedTraces: number
  failedTraces: number
  avgDuration: number
  avgStepsPerTrace: number
  totalToolCalls: number
  successfulToolCalls: number
  failedToolCalls: number
}

export interface TaskTraceAnalysisProps {
  className?: string
  traces?: Trace[]
  onViewTraceDetails?: (trace: Trace) => void
  onExportTrace?: (traceId: string) => void
}

// ==================== Mock Data ====================

export const mockTraces: Trace[] = [
  {
    id: 'trace-1',
    traceId: 'trace-abc123',
    taskName: 'Employee Onboarding',
    taskType: 'workflow',
    status: 'completed',
    startTime: new Date(Date.now() - 300000),
    endTime: new Date(Date.now() - 120000),
    duration: 180000,
    totalSteps: 5,
    completedSteps: 5,
    failedSteps: 0,
    totalToolCalls: 12,
    successfulToolCalls: 11,
    failedToolCalls: 1,
    totalLatency: 2450,
    avgLatency: 204,
    inputTokens: 3200,
    outputTokens: 4850,
    rootSpan: {
      id: 'span-1',
      traceId: 'trace-abc123',
      name: 'Employee Onboarding',
      type: 'task',
      status: 'completed',
      startTime: new Date(Date.now() - 300000),
      endTime: new Date(Date.now() - 120000),
      duration: 180000,
      children: [
        {
          id: 'span-1-1',
          traceId: 'trace-abc123',
          parentSpanId: 'span-1',
          name: 'Create User Account',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 280000),
          endTime: new Date(Date.now() - 240000),
          duration: 40000,
          latency: 120,
          children: [
            {
              id: 'span-1-1-1',
              traceId: 'trace-abc123',
              parentSpanId: 'span-1-1',
              name: 'hr_create_account',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 275000),
              endTime: new Date(Date.now() - 240000),
              duration: 35000,
              latency: 95,
            },
          ],
        },
        {
          id: 'span-1-2',
          traceId: 'trace-abc123',
          parentSpanId: 'span-1',
          name: 'Setup Email',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 240000),
          endTime: new Date(Date.now() - 200000),
          duration: 40000,
          latency: 150,
          children: [
            {
              id: 'span-1-2-1',
              traceId: 'trace-abc123',
              parentSpanId: 'span-1-2',
              name: 'email_setup_account',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 235000),
              endTime: new Date(Date.now() - 200000),
              duration: 35000,
              latency: 130,
            },
          ],
        },
        {
          id: 'span-1-3',
          traceId: 'trace-abc123',
          parentSpanId: 'span-1',
          name: 'Send Welcome Email',
          type: 'step',
          status: 'failed',
          startTime: new Date(Date.now() - 200000),
          endTime: new Date(Date.now() - 160000),
          duration: 40000,
          latency: 180,
          errorMessage: 'SMTP connection timeout',
          children: [
            {
              id: 'span-1-3-1',
              traceId: 'trace-abc123',
              parentSpanId: 'span-1-3',
              name: 'email_send',
              type: 'tool',
              status: 'failed',
              startTime: new Date(Date.now() - 195000),
              endTime: new Date(Date.now() - 160000),
              duration: 35000,
              latency: 180,
              errorMessage: 'SMTP connection timeout after 30s',
            },
          ],
        },
        {
          id: 'span-1-4',
          traceId: 'trace-abc123',
          parentSpanId: 'span-1',
          name: 'Assign Permissions',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 160000),
          endTime: new Date(Date.now() - 140000),
          duration: 20000,
          latency: 80,
          children: [
            {
              id: 'span-1-4-1',
              traceId: 'trace-abc123',
              parentSpanId: 'span-1-4',
              name: 'hr_assign_role',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 155000),
              endTime: new Date(Date.now() - 140000),
              duration: 15000,
              latency: 65,
            },
          ],
        },
        {
          id: 'span-1-5',
          traceId: 'trace-abc123',
          parentSpanId: 'span-1',
          name: 'Send Notification',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 140000),
          endTime: new Date(Date.now() - 120000),
          duration: 20000,
          latency: 95,
          children: [
            {
              id: 'span-1-5-1',
              traceId: 'trace-abc123',
              parentSpanId: 'span-1-5',
              name: 'notification_send',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 135000),
              endTime: new Date(Date.now() - 120000),
              duration: 15000,
              latency: 75,
            },
          ],
        },
      ],
    },
    events: [
      { id: 'evt-1', traceId: 'trace-abc123', spanId: 'span-1', type: 'start', timestamp: new Date(Date.now() - 300000), message: 'Task started' },
      { id: 'evt-2', traceId: 'trace-abc123', spanId: 'span-1-3', type: 'error', timestamp: new Date(Date.now() - 160000), message: 'Tool call failed: SMTP connection timeout' },
      { id: 'evt-3', traceId: 'trace-abc123', spanId: 'span-1', type: 'end', timestamp: new Date(Date.now() - 120000), message: 'Task completed with 1 error' },
    ],
  },
  {
    id: 'trace-2',
    traceId: 'trace-def456',
    taskName: 'Invoice Processing',
    taskType: 'workflow',
    status: 'running',
    startTime: new Date(Date.now() - 60000),
    totalSteps: 3,
    completedSteps: 2,
    failedSteps: 0,
    totalToolCalls: 6,
    successfulToolCalls: 6,
    failedToolCalls: 0,
    totalLatency: 850,
    avgLatency: 142,
    inputTokens: 1850,
    outputTokens: 2100,
    rootSpan: {
      id: 'span-2',
      traceId: 'trace-def456',
      name: 'Invoice Processing',
      type: 'task',
      status: 'running',
      startTime: new Date(Date.now() - 60000),
      children: [
        {
          id: 'span-2-1',
          traceId: 'trace-def456',
          parentSpanId: 'span-2',
          name: 'Extract Invoice Data',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 55000),
          endTime: new Date(Date.now() - 35000),
          duration: 20000,
          latency: 180,
          children: [
            {
              id: 'span-2-1-1',
              traceId: 'trace-def456',
              parentSpanId: 'span-2-1',
              name: 'ocr_extract',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 54000),
              endTime: new Date(Date.now() - 35000),
              duration: 19000,
              latency: 165,
            },
          ],
        },
        {
          id: 'span-2-2',
          traceId: 'trace-def456',
          parentSpanId: 'span-2',
          name: 'Validate Amount',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 35000),
          endTime: new Date(Date.now() - 20000),
          duration: 15000,
          latency: 95,
          children: [
            {
              id: 'span-2-2-1',
              traceId: 'trace-def456',
              parentSpanId: 'span-2-2',
              name: 'finance_validate',
              type: 'tool',
              status: 'completed',
              startTime: new Date(Date.now() - 34000),
              endTime: new Date(Date.now() - 20000),
              duration: 14000,
              latency: 85,
            },
          ],
        },
        {
          id: 'span-2-3',
          traceId: 'trace-def456',
          parentSpanId: 'span-2',
          name: 'Update Ledger',
          type: 'step',
          status: 'running',
          startTime: new Date(Date.now() - 20000),
          children: [
            {
              id: 'span-2-3-1',
              traceId: 'trace-def456',
              parentSpanId: 'span-2-3',
              name: 'finance_update_ledger',
              type: 'tool',
              status: 'running',
              startTime: new Date(Date.now() - 19000),
            },
          ],
        },
      ],
    },
    events: [
      { id: 'evt-4', traceId: 'trace-def456', spanId: 'span-2', type: 'start', timestamp: new Date(Date.now() - 60000), message: 'Task started' },
      { id: 'evt-5', traceId: 'trace-def456', spanId: 'span-2-1', type: 'end', timestamp: new Date(Date.now() - 35000), message: 'Step completed' },
      { id: 'evt-6', traceId: 'trace-def456', spanId: 'span-2-2', type: 'end', timestamp: new Date(Date.now() - 20000), message: 'Step completed' },
    ],
  },
  {
    id: 'trace-3',
    traceId: 'trace-ghi789',
    taskName: 'Customer Support',
    taskType: 'chat',
    status: 'failed',
    startTime: new Date(Date.now() - 120000),
    endTime: new Date(Date.now() - 60000),
    duration: 60000,
    totalSteps: 4,
    completedSteps: 2,
    failedSteps: 2,
    totalToolCalls: 8,
    successfulToolCalls: 5,
    failedToolCalls: 3,
    totalLatency: 3200,
    avgLatency: 400,
    inputTokens: 4500,
    outputTokens: 3200,
    rootSpan: {
      id: 'span-3',
      traceId: 'trace-ghi789',
      name: 'Customer Support',
      type: 'task',
      status: 'failed',
      startTime: new Date(Date.now() - 120000),
      endTime: new Date(Date.now() - 60000),
      duration: 60000,
      children: [
        {
          id: 'span-3-1',
          traceId: 'trace-ghi789',
          parentSpanId: 'span-3',
          name: 'Classify Intent',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 115000),
          endTime: new Date(Date.now() - 95000),
          duration: 20000,
          latency: 200,
        },
        {
          id: 'span-3-2',
          traceId: 'trace-ghi789',
          parentSpanId: 'span-3',
          name: 'Search Knowledge Base',
          type: 'step',
          status: 'failed',
          startTime: new Date(Date.now() - 95000),
          endTime: new Date(Date.now() - 75000),
          duration: 20000,
          latency: 250,
          errorMessage: 'Knowledge base query timeout',
        },
        {
          id: 'span-3-3',
          traceId: 'trace-ghi789',
          parentSpanId: 'span-3',
          name: 'Generate Response',
          type: 'step',
          status: 'completed',
          startTime: new Date(Date.now() - 75000),
          endTime: new Date(Date.now() - 65000),
          duration: 10000,
          latency: 180,
        },
        {
          id: 'span-3-4',
          traceId: 'trace-ghi789',
          parentSpanId: 'span-3',
          name: 'Send Response',
          type: 'step',
          status: 'failed',
          startTime: new Date(Date.now() - 65000),
          endTime: new Date(Date.now() - 60000),
          duration: 5000,
          latency: 300,
          errorMessage: 'Message queue unavailable',
        },
      ],
    },
    events: [
      { id: 'evt-7', traceId: 'trace-ghi789', spanId: 'span-3', type: 'start', timestamp: new Date(Date.now() - 120000), message: 'Task started' },
      { id: 'evt-8', traceId: 'trace-ghi789', spanId: 'span-3-2', type: 'error', timestamp: new Date(Date.now() - 75000), message: 'Knowledge base query failed' },
      { id: 'evt-9', traceId: 'trace-ghi789', spanId: 'span-3-4', type: 'error', timestamp: new Date(Date.now() - 60000), message: 'Message queue unavailable' },
    ],
  },
]
