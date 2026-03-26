import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ErrorClassificationGuidance,
  FailoverSessionRepair,
  LogMetricsCenter,
} from '@/features/agent'

describe('Runtime panel fallback datasets', () => {
  it('renders default error guidance data without memo-wrapped fallbacks', async () => {
    render(<ErrorClassificationGuidance />)

    expect(await screen.findByRole('heading', { name: '错误分类与用户提示' })).toBeInTheDocument()
    expect(screen.getByText('ERR_NETWORK_TIMEOUT')).toBeInTheDocument()
    expect(screen.queryByText('没有错误记录')).not.toBeInTheDocument()
  })

  it('renders default failover and repair data without memo-wrapped fallbacks', async () => {
    render(<FailoverSessionRepair />)

    expect(await screen.findByRole('heading', { name: '故障转移与会话修复' })).toBeInTheDocument()
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument()
    expect(screen.getByText('DeepSeek V2')).toBeInTheDocument()
  })

  it('renders default log and metric data without memo-wrapped fallbacks', async () => {
    render(<LogMetricsCenter />)

    expect(await screen.findByRole('heading', { name: '日志与指标中心' })).toBeInTheDocument()
    expect(screen.getByText('User session started successfully')).toBeInTheDocument()
    expect(screen.getByText('HTTP request took longer than expected: 2500ms')).toBeInTheDocument()
  })
})
