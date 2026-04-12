/**
 * BottomPanel Event Bus
 * 
 * Event bus for BottomPanel smart expand/collapse actions.
 */

export type PanelType = 'properties' | 'diagnostics' | 'preview' | 'ai-suggestions'

export interface BottomPanelExpandEvent {
  type: 'ai-execution' | 'user-action' | 'manual'
  panelType?: PanelType
}

type BottomPanelEventHandler = (event: BottomPanelExpandEvent) => void

class BottomPanelEventBusImpl {
  private handlers: Set<BottomPanelEventHandler> = new Set()

  emit(event: BottomPanelExpandEvent): void {
    this.handlers.forEach(handler => handler(event))
  }

  subscribe(handler: BottomPanelEventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  /** Emit expand event for AI execution diagnostics */
  expandForDiagnostics(): void {
    this.emit({ type: 'ai-execution', panelType: 'diagnostics' })
  }

  /** Emit expand event for user action */
  expandForUser(panelType: PanelType): void {
    this.emit({ type: 'user-action', panelType })
  }

  /** Emit manual toggle event */
  toggle(): void {
    this.emit({ type: 'manual' })
  }
}

export const bottomPanelEventBus = new BottomPanelEventBusImpl()
