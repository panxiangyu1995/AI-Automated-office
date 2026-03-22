import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Workbench } from '@/components/common/Workbench'
import type { WorkbenchHostDescriptor } from '@/components/common'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Workbench host foundation', () => {
  it('keeps compatibility with existing static route pages', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/" element={<Workbench />}>
            <Route path="admin/users" element={<div>User list page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('User list page')).toBeInTheDocument()
  })

  it('renders the default static fallback when no route content is mounted', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<Workbench />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('欢迎使用 AI-Automated-Office')).toBeInTheDocument()
  })

  it('supports dynamic and editor mode switching through host descriptors', async () => {
    const createDescriptor = (mode: 'dynamic' | 'editor'): WorkbenchHostDescriptor => ({
      id: `host-${mode}`,
      title: `${mode} host`,
      mode,
    })

    const { rerender } = render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Routes>
          <Route path="*" element={<Workbench descriptor={createDescriptor('dynamic')} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('dynamic host')).toBeInTheDocument()
    expect(screen.getByText('Dynamic page host is ready to accept schema-driven content.')).toBeInTheDocument()

    rerender(
      <MemoryRouter initialEntries={['/workspace']}>
        <Routes>
          <Route path="*" element={<Workbench descriptor={createDescriptor('editor')} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('editor host')).toBeInTheDocument()
    expect(screen.getByText('Editor host is ready to accept built-in or extension editors.')).toBeInTheDocument()
  })

  it('runs lifecycle callbacks and isolates runtime errors with an error boundary', async () => {
    const onMount = vi.fn()
    const onUnmount = vi.fn()
    const onError = vi.fn()

    const descriptor: WorkbenchHostDescriptor = {
      id: 'broken-editor',
      title: 'Broken editor',
      mode: 'editor',
      onMount,
      onUnmount,
      onError,
      render: () => {
        throw new Error('boom')
      },
    }

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { unmount } = render(
      <MemoryRouter initialEntries={['/editor']}>
        <Routes>
          <Route path="*" element={<Workbench descriptor={descriptor} />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Broken editor unavailable')).toBeInTheDocument()
    expect(screen.getByText('The editor host hit a runtime error. Reload or switch to another page.')).toBeInTheDocument()
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)

    unmount()

    expect(onUnmount).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })
})
