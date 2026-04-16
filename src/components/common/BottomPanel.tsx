import { useState, useEffect } from 'react'
import { Settings, Wrench, Eye, MessageSquare, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { ResizablePanel } from './ResizablePanel'
import { useUIStore } from '../../stores/uiStore'
import { bottomPanelEventBus, type PanelType } from '../../lib/bottomPanelEventBus'
import {
  PropertiesPanel,
  DiagnosticsPanel,
  PreviewPanel,
  AiSuggestionsPanel,
  ProblemCenter,
} from './panel'

const PANEL_TYPES: { type: PanelType; icon: React.ReactNode; label: string }[] = [
  { type: 'properties', icon: <Settings className="h-3.5 w-3.5" />, label: '属性' },
  { type: 'diagnostics', icon: <Wrench className="h-3.5 w-3.5" />, label: '诊断' },
  { type: 'preview', icon: <Eye className="h-3.5 w-3.5" />, label: '预览' },
  { type: 'ai-suggestions', icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'AI 建议' },
  { type: 'problems', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: '问题' },
]

export function BottomPanel() {
  const bottomPanelHeight = useUIStore((state) => state.bottomPanelHeight)
  const bottomPanelCollapsed = useUIStore((state) => state.bottomPanelCollapsed)
  const setBottomPanelHeight = useUIStore((state) => state.setBottomPanelHeight)
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel)

  const [activePanel, setActivePanel] = useState<PanelType>('diagnostics')

  // Subscribe to bottom panel event bus for smart expand
  useEffect(() => {
    const handler = (event: { type: string; panelType?: PanelType }) => {
      if (event.type === 'manual') {
        toggleBottomPanel()
      } else if (event.panelType) {
        setActivePanel(event.panelType)
        if (bottomPanelCollapsed) {
          toggleBottomPanel()
        }
      }
    }
    return bottomPanelEventBus.subscribe(handler)
  }, [toggleBottomPanel, bottomPanelCollapsed])

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'properties':
        return <PropertiesPanel properties={[]} />
      case 'diagnostics':
        return <DiagnosticsPanel diagnostics={[]} />
      case 'preview':
        return <PreviewPanel preview={undefined} />
      case 'ai-suggestions':
        return <AiSuggestionsPanel suggestions={[]} />
      case 'problems':
        return <ProblemCenter problems={[]} />
      default:
        return null
    }
  }

  return (
    <ResizablePanel
      width={bottomPanelHeight}
      minWidth={100}
      maxWidth={600}
      onWidthChange={setBottomPanelHeight}
      direction="top"
      collapsed={bottomPanelCollapsed}
      className="border-t"
      style={{ borderColor: 'var(--ao-bottomPanel-border)' }}
    >
      <div
        className="flex h-full flex-col"
        style={{ backgroundColor: 'var(--ao-bottomPanel-background)' }}
      >
        <div className="flex items-center justify-between flex-1 px-1">
          <div className="flex gap-1">
            {PANEL_TYPES.map((panel) => (
              <button
                key={panel.type}
                type="button"
                aria-label={panel.label}
                aria-selected={activePanel === panel.type}
                className={`
                  flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors
                  ${activePanel === panel.type
                    ? 'text-white'
                    : 'hover:text-white'
                  }
                `}
                style={activePanel === panel.type
                  ? { backgroundColor: 'var(--ao-bottomPanel-activeBackground)', color: 'var(--ao-bottomPanel-activeForeground)' }
                  : { color: 'var(--ao-bottomPanel-foreground)' }
                }
                onClick={() => setActivePanel(panel.type)}
              >
                {panel.icon}
                <span>{panel.label}</span>
              </button>
            ))}
          </div>
          
          <button
            type="button"
            aria-label={bottomPanelCollapsed ? '展开面板' : '折叠面板'}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
            style={{ color: 'var(--ao-bottomPanel-foreground)' }}
            onClick={() => bottomPanelEventBus.toggle()}
          >
            {bottomPanelCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{bottomPanelCollapsed ? '展开' : '折叠'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderPanelContent()}
        </div>
      </div>
    </ResizablePanel>
  )
}
