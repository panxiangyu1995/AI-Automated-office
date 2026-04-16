/**
 * Template Designer - 模板设计器 Canvas UI
 *
 * J1: Template Canvas/Designer 前端 (FR1280-FR1287)
 * - FR1280: 元素操作 (添加/删除/移动/调整)
 * - FR1281: 图层操作 (排序/分组/锁定)
 * - FR1282: 元素属性面板
 * - FR1283: 对齐与分布
 * - FR1284: 撤销/重做
 * - FR1286: 画布缩放与平移
 * - FR1287: 导出预览
 *
 * 铁律合规: FR1280-FR1287, ADR-037
 */

import { useState, useCallback, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  Type,
  Square,
  Image as ImageIcon,
  Table,
  Download,
  MousePointer2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

// ==================== Types ====================

export interface TemplateElement {
  id: string
  type: 'text' | 'rect' | 'image' | 'table'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  visible?: boolean
  locked?: boolean
  label?: string
  style?: Record<string, string>
}

export interface TemplateLayer {
  id: string
  name: string
  elements: TemplateElement[]
  visible: boolean
  locked: boolean
  order: number
}

export interface TemplateSchema {
  id: string
  name: string
  width: number
  height: number
  layers: TemplateLayer[]
  unit: 'mm' | 'px' | 'pt'
  dpi: number
}

export type AlignmentType = 'left' | 'center_h' | 'right' | 'top' | 'center_v' | 'bottom'

export type ToolMode = 'select' | 'text' | 'rect' | 'image' | 'table'

interface TemplateDesignerProps {
  schema?: TemplateSchema
  onSchemaChange?: (schema: TemplateSchema) => void
  onSave?: (schemaJson: string) => void
  onExport?: (schemaJson: string) => void
}

// ==================== Canvas ====================

interface CanvasProps {
  schema: TemplateSchema
  zoom: number
  selectedElementIds: string[]
  toolMode: ToolMode
  onElementSelect: (ids: string[]) => void
  onElementMove: (id: string, x: number, y: number) => void
  onElementAdd: (type: ToolMode, x: number, y: number) => void
}

function TemplateCanvas({
  schema,
  zoom,
  selectedElementIds,
  toolMode,
  onElementSelect,
  onElementMove,
  onElementAdd,
}: CanvasProps) {
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)

  const allElements = useMemo(() => {
    return schema.layers
      .filter((l) => l.visible)
      .flatMap((l) => l.elements.filter((e) => e.visible !== false))
  }, [schema.layers])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'select') {
      onElementSelect([])
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    onElementAdd(toolMode, x, y)
  }, [toolMode, zoom, onElementSelect, onElementAdd])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: TemplateElement) => {
    e.stopPropagation()
    if (element.locked) return
    onElementSelect([element.id])
    setDragState({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: element.x,
      offsetY: element.y,
    })
  }, [onElementSelect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return
    const dx = (e.clientX - dragState.startX) / zoom
    const dy = (e.clientY - dragState.startY) / zoom
    onElementMove(dragState.id, dragState.offsetX + dx, dragState.offsetY + dy)
  }, [dragState, zoom, onElementMove])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  return (
    <div
      className="flex-1 relative overflow-auto"
      style={{ backgroundColor: 'var(--ao-workbench.background)' }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          width: schema.width * zoom,
          height: schema.height * zoom,
          backgroundImage: `radial-gradient(circle, var(--ao-workbench-secondaryForeground) 0.5px, transparent 0.5px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          border: `1px solid var(--ao-workbench.border)`,
        }}
      >
        {allElements.map((el) => {
          const isSelected = selectedElementIds.includes(el.id)
          return (
            <div
              key={el.id}
              className={`absolute ${isSelected ? 'ring-2' : ''}`}
              style={{
                left: el.x * zoom,
                top: el.y * zoom,
                width: el.width * zoom,
                height: el.height * zoom,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                outlineColor: isSelected ? 'var(--ao-infoForeground)' : undefined,
                backgroundColor: el.type === 'rect' ? 'var(--ao-bottomPanel.activeBackground)' : undefined,
                border: `1px solid ${isSelected ? 'var(--ao-infoForeground)' : 'var(--ao-workbench.border)'}`,
                cursor: el.locked ? 'not-allowed' : toolMode === 'select' ? 'move' : 'crosshair',
              }}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
            >
              {el.type === 'text' && (
                <span
                  className="text-xs select-none"
                  style={{ color: 'var(--ao-workbench.foreground)' }}
                >
                  {el.label || '文本元素'}
                </span>
              )}
              {el.type === 'image' && (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-6 w-6" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                </div>
              )}
              {el.type === 'table' && (
                <div className="flex items-center justify-center h-full">
                  <Table className="h-6 w-6" style={{ color: 'var(--ao-workbench.secondaryForeground)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== Layer Panel ====================

interface LayerPanelProps {
  layers: TemplateLayer[]
  selectedLayerId: string | null
  onLayerSelect: (id: string) => void
  onLayerToggleVisible: (id: string) => void
  onLayerToggleLock: (id: string) => void
}

function LayerPanel({ layers, selectedLayerId, onLayerSelect, onLayerToggleVisible, onLayerToggleLock }: LayerPanelProps) {
  return (
    <div className="w-48 border-r flex flex-col" style={{ borderColor: 'var(--ao-workbench.border)', backgroundColor: 'var(--ao-sidebar.background)' }}>
      <div className="p-2 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--ao-sidebar.foreground)' }}>
        <Layers className="h-3.5 w-3.5" />
        图层
      </div>
      <ScrollArea className="flex-1">
        {layers
          .sort((a, b) => b.order - a.order)
          .map((layer) => (
            <div
              key={layer.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer ${
                selectedLayerId === layer.id ? 'font-medium' : ''
              }`}
              style={{
                color: selectedLayerId === layer.id ? 'var(--ao-sidebar.foreground)' : 'var(--ao-sidebar.secondaryForeground)',
                backgroundColor: selectedLayerId === layer.id ? 'var(--ao-sidebar.activeBackground)' : 'transparent',
              }}
              onClick={() => onLayerSelect(layer.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onLayerToggleVisible(layer.id) }}
                className="p-0.5"
                style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}
              >
                {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onLayerToggleLock(layer.id) }}
                className="p-0.5"
                style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}
              >
                {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </button>
              <span className="flex-1 truncate">{layer.name}</span>
              <span style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>{layer.elements.length}</span>
            </div>
          ))}
      </ScrollArea>
    </div>
  )
}

// ==================== Property Panel ====================

interface PropertyPanelProps {
  element: TemplateElement | null
  onPropertyChange: (id: string, props: Partial<TemplateElement>) => void
}

function PropertyPanel({ element, onPropertyChange }: PropertyPanelProps) {
  if (!element) {
    return (
      <div className="w-56 border-l p-3 text-xs" style={{ borderColor: 'var(--ao-workbench.border)', color: 'var(--ao-workbench.secondaryForeground)' }}>
        选择元素查看属性
      </div>
    )
  }

  return (
    <div className="w-56 border-l flex flex-col" style={{ borderColor: 'var(--ao-workbench.border)', backgroundColor: 'var(--ao-sidebar.background)' }}>
      <div className="p-2 text-xs font-medium" style={{ color: 'var(--ao-sidebar.foreground)' }}>属性</div>
      <ScrollArea className="flex-1 p-2 space-y-2">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>类型</label>
          <div className="text-xs font-medium" style={{ color: 'var(--ao-sidebar.foreground)' }}>{element.type}</div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>X</label>
            <Input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => onPropertyChange(element.id, { x: Number(e.target.value) })}
              className="h-6 text-xs"
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>Y</label>
            <Input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => onPropertyChange(element.id, { y: Number(e.target.value) })}
              className="h-6 text-xs"
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>宽</label>
            <Input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => onPropertyChange(element.id, { width: Number(e.target.value) })}
              className="h-6 text-xs"
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>高</label>
            <Input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onPropertyChange(element.id, { height: Number(e.target.value) })}
              className="h-6 text-xs"
            />
          </div>
        </div>
        {element.label !== undefined && (
          <div>
            <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>标签</label>
            <Input
              value={element.label}
              onChange={(e) => onPropertyChange(element.id, { label: e.target.value })}
              className="h-6 text-xs"
            />
          </div>
        )}
        <div>
          <label className="text-xs" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>旋转</label>
          <Input
            type="number"
            value={element.rotation ?? 0}
            onChange={(e) => onPropertyChange(element.id, { rotation: Number(e.target.value) })}
            className="h-6 text-xs"
          />
        </div>
      </ScrollArea>
    </div>
  )
}

// ==================== Main Designer ====================

const TOOL_CONFIG: { mode: ToolMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { mode: 'select', icon: MousePointer2, label: '选择' },
  { mode: 'text', icon: Type, label: '文本' },
  { mode: 'rect', icon: Square, label: '矩形' },
  { mode: 'image', icon: ImageIcon, label: '图片' },
  { mode: 'table', icon: Table, label: '表格' },
]

const DEFAULT_SCHEMA: TemplateSchema = {
  id: 'new-template',
  name: '新模板',
  width: 800,
  height: 600,
  layers: [{ id: 'layer-1', name: '图层 1', elements: [], visible: true, locked: false, order: 0 }],
  unit: 'px',
  dpi: 96,
}

export function TemplateDesigner({
  schema: externalSchema,
  onSchemaChange,
  onSave,
  onExport,
}: TemplateDesignerProps) {
  const [schema, setSchema] = useState<TemplateSchema>(externalSchema ?? DEFAULT_SCHEMA)
  const [zoom, setZoom] = useState(1)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(schema.layers[0]?.id ?? null)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])

  const updateSchema = useCallback((newSchema: TemplateSchema) => {
    setUndoStack((prev) => [...prev, JSON.stringify(schema)])
    setRedoStack([])
    setSchema(newSchema)
    onSchemaChange?.(newSchema)
  }, [schema, onSchemaChange])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack((r) => [...r, JSON.stringify(schema)])
    setUndoStack((u) => u.slice(0, -1))
    const restored = JSON.parse(prev) as TemplateSchema
    setSchema(restored)
    onSchemaChange?.(restored)
  }, [undoStack, schema, onSchemaChange])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack((u) => [...u, JSON.stringify(schema)])
    setRedoStack((r) => r.slice(0, -1))
    const restored = JSON.parse(next) as TemplateSchema
    setSchema(restored)
    onSchemaChange?.(restored)
  }, [redoStack, schema, onSchemaChange])

  const handleElementAdd = useCallback((type: ToolMode, x: number, y: number) => {
    const newEl: TemplateElement = {
      id: `el-${Date.now()}`,
      type: type === 'select' ? 'rect' : type,
      x: Math.round(x),
      y: Math.round(y),
      width: type === 'text' ? 120 : 100,
      height: type === 'text' ? 30 : 80,
      label: type === 'text' ? '文本' : undefined,
    }
    const newSchema = {
      ...schema,
      layers: schema.layers.map((l) =>
        l.id === selectedLayerId ? { ...l, elements: [...l.elements, newEl] } : l
      ),
    }
    updateSchema(newSchema)
    setSelectedElementIds([newEl.id])
    setToolMode('select')
  }, [schema, selectedLayerId, updateSchema])

  const handleElementMove = useCallback((id: string, x: number, y: number) => {
    const newSchema = {
      ...schema,
      layers: schema.layers.map((l) => ({
        ...l,
        elements: l.elements.map((e) => e.id === id ? { ...e, x: Math.round(x), y: Math.round(y) } : e),
      })),
    }
    setSchema(newSchema)
  }, [schema])

  const handlePropertyChange = useCallback((id: string, props: Partial<TemplateElement>) => {
    const newSchema = {
      ...schema,
      layers: schema.layers.map((l) => ({
        ...l,
        elements: l.elements.map((e) => e.id === id ? { ...e, ...props } : e),
      })),
    }
    updateSchema(newSchema)
  }, [schema, updateSchema])

  const handleLayerToggleVisible = useCallback((layerId: string) => {
    const newSchema = {
      ...schema,
      layers: schema.layers.map((l) => l.id === layerId ? { ...l, visible: !l.visible } : l),
    }
    updateSchema(newSchema)
  }, [schema, updateSchema])

  const handleLayerToggleLock = useCallback((layerId: string) => {
    const newSchema = {
      ...schema,
      layers: schema.layers.map((l) => l.id === layerId ? { ...l, locked: !l.locked } : l),
    }
    updateSchema(newSchema)
  }, [schema, updateSchema])

  const handleAlign = useCallback(async (alignment: AlignmentType) => {
    if (selectedElementIds.length < 2) return
    try {
      const result = await invoke<string>('template_align_elements', {
        schemaJson: JSON.stringify(schema),
        layerId: selectedLayerId ?? '',
        elementIds: selectedElementIds,
        alignment,
      })
      const newSchema = JSON.parse(result) as TemplateSchema
      updateSchema(newSchema)
    } catch {
      // Fallback: skip alignment if Tauri unavailable
    }
  }, [schema, selectedElementIds, selectedLayerId, updateSchema])

  const handleSave = useCallback(() => {
    onSave?.(JSON.stringify(schema))
  }, [schema, onSave])

  const handleExport = useCallback(() => {
    onExport?.(JSON.stringify(schema))
  }, [schema, onExport])

  const selectedElement = useMemo(() => {
    if (selectedElementIds.length !== 1) return null
    for (const layer of schema.layers) {
      const el = layer.elements.find((e) => e.id === selectedElementIds[0])
      if (el) return el
    }
    return null
  }, [schema.layers, selectedElementIds])

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--ao-workbench.background)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b px-2 py-1" style={{ borderColor: 'var(--ao-workbench.border)', backgroundColor: 'var(--ao-sidebar.background)' }}>
        {/* Tool modes */}
        {TOOL_CONFIG.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setToolMode(mode)}
            className="rounded p-1.5 transition-colors"
            title={label}
            style={{
              backgroundColor: toolMode === mode ? 'var(--ao-bottomPanel.activeBackground)' : 'transparent',
              color: toolMode === mode ? 'var(--ao-bottomPanel.activeForeground)' : 'var(--ao-sidebar.secondaryForeground)',
            }}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        <div className="mx-1 h-4" style={{ borderLeft: '1px solid var(--ao-workbench.border)' }} />

        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="rounded p-1.5 disabled:opacity-30"
          title="撤销"
          style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="rounded p-1.5 disabled:opacity-30"
          title="重做"
          style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4" style={{ borderLeft: '1px solid var(--ao-workbench.border)' }} />

        {/* Alignment */}
        <button onClick={() => handleAlign('left')} title="左对齐" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button onClick={() => handleAlign('center_h')} title="水平居中" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <AlignCenterHorizontal className="h-4 w-4" />
        </button>
        <button onClick={() => handleAlign('right')} title="右对齐" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4" style={{ borderLeft: '1px solid var(--ao-workbench.border)' }} />

        {/* Zoom */}
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="缩小" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs w-10 text-center" style={{ color: 'var(--ao-sidebar.foreground)' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title="放大" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        {/* Save/Export */}
        <button onClick={handleSave} title="保存" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <Download className="h-4 w-4" />
        </button>
        <button onClick={handleExport} title="导出" className="rounded p-1.5" style={{ color: 'var(--ao-sidebar.secondaryForeground)' }}>
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        <LayerPanel
          layers={schema.layers}
          selectedLayerId={selectedLayerId}
          onLayerSelect={setSelectedLayerId}
          onLayerToggleVisible={handleLayerToggleVisible}
          onLayerToggleLock={handleLayerToggleLock}
        />
        <TemplateCanvas
          schema={schema}
          zoom={zoom}
          selectedElementIds={selectedElementIds}
          toolMode={toolMode}
          onElementSelect={setSelectedElementIds}
          onElementMove={handleElementMove}
          onElementAdd={handleElementAdd}
        />
        <PropertyPanel
          element={selectedElement}
          onPropertyChange={handlePropertyChange}
        />
      </div>
    </div>
  )
}
