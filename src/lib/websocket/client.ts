type EventName = 'connected' | 'disconnected' | 'message' | 'error'
type EventHandler = (payload?: unknown) => void

class SimpleEmitter {
  private listeners = new Map<EventName, Set<EventHandler>>()

  on(event: EventName, handler: EventHandler) {
    const handlers = this.listeners.get(event) ?? new Set<EventHandler>()
    handlers.add(handler)
    this.listeners.set(event, handlers)
  }

  off(event: EventName, handler: EventHandler) {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    handlers.delete(handler)
  }

  emit(event: EventName, payload?: unknown) {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    handlers.forEach((handler) => handler(payload))
  }
}

export class WebSocketClient extends SimpleEmitter {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval = 30000
  private heartbeatTimeout = 10000
  private heartbeatTimer: number | null = null
  private lastPongAt: number | null = null
  private manualClose = false

  constructor(url: string) {
    super()
    this.url = url
  }

  connect(token: string) {
    this.manualClose = false
    const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.emit('connected')
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.ws.onclose = () => {
      this.stopHeartbeat()
      this.emit('disconnected')
      if (!this.manualClose) {
        this.attemptReconnect(token)
      }
    }

    this.ws.onerror = (error) => {
      this.emit('error', error)
    }
  }

  disconnect() {
    this.manualClose = true
    this.stopHeartbeat()
    this.ws?.close()
    this.ws = null
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }))
    }
  }

  private handleMessage(raw: string) {
    try {
      const message = JSON.parse(raw)
      if (message?.type === 'pong') {
        this.lastPongAt = Date.now()
      }
      this.emit('message', message)
    } catch {
      this.emit('message', raw)
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }
    this.reconnectAttempts += 1
    window.setTimeout(
      () => this.connect(token),
      this.reconnectDelay * this.reconnectAttempts
    )
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.lastPongAt = Date.now()
    this.heartbeatTimer = window.setInterval(() => {
      const now = Date.now()
      if (this.lastPongAt && now - this.lastPongAt > this.heartbeatInterval + this.heartbeatTimeout) {
        this.ws?.close()
        return
      }
      this.send('ping', {})
    }, this.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}
