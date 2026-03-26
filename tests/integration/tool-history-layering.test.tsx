import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToolHistory } from '@/features/session/components/ToolHistory'

describe('Tool history layering', () => {
  it('shows Tool Calling 2.0 categories without restricted legacy defaults', () => {
    render(<ToolHistory />)

    expect(screen.getByText(/按通用工具、平台工具、部门能力工具的分层追溯执行记录/)).toBeInTheDocument()
    expect(screen.getAllByText('sales_query').length).toBeGreaterThan(0)
    expect(screen.queryByText('db_query')).not.toBeInTheDocument()
  })
})
