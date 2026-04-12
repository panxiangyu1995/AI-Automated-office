import { X, FileText, BarChart3, FileCheck, FilePen, Layout } from 'lucide-react'
import type { WorkbenchTab } from '../../stores/workbenchStore'

const TAB_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  report: BarChart3,
  detail: FileCheck,
  form: FilePen,
  custom: Layout,
}

export interface TabProps {
  tab: WorkbenchTab
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
  className?: string
}

export function Tab({ tab, isActive, onClick, onClose, className = '' }: TabProps) {
  const IconComponent = TAB_TYPE_ICONS[tab.type] ?? TAB_TYPE_ICONS.custom

  return (
    <div
      role="tab"
      aria-selected={isActive}
      aria-label={`${tab.title} tab`}
      className={`
        group relative flex h-full min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 border-r px-3 py-2
        transition-colors duration-150
        ${isActive
          ? 'border-b-2 border-b-[#238636] bg-[#21262D] text-white'
          : 'border-b-2 border-b-transparent text-[#8B949E] hover:bg-white/[0.05] hover:text-white'
        }
        ${className}
      `}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
    >
      <IconComponent className="h-4 w-4 shrink-0 flex-shrink-0" />

      <span
        className="min-w-0 flex-1 truncate text-sm"
        title={tab.title}
      >
        {tab.title}
      </span>

      {tab.dirty && (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]"
          title="有未保存的更改"
          aria-label="未保存"
        />
      )}

      {tab.closable && (
        <button
          type="button"
          aria-label={`关闭 ${tab.title}`}
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity duration-150 hover:bg-[#F85149] hover:text-white group-hover:opacity-100"
          onClick={onClose}
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
