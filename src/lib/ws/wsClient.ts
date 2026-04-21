import { invoke } from "@tauri-apps/api/core";

export type WSMessageType =
  | "new_message"
  | "message_read"
  | "message_recall"
  | "new_announcement"
  | "unread_update"
  | "system_notification"
  | "ping"
  | "pong";

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp?: number;
}

export type WSHandler<T = unknown> = (msg: WSMessage<T>) => void;

interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  token: string | null;
}

const state: ConnectionState = {
  connected: false,
  reconnecting: false,
  token: null,
};

const handlers: Map<WSMessageType, Set<WSHandler>> = new Map();
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
let pingTimer: number | null = null;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;

function notifyHandlers<T>(msg: WSMessage<T>) {
  const typeHandlers = handlers.get(msg.type);
  if (typeHandlers) {
    typeHandlers.forEach((h) => h(msg));
  }
  const wildcardHandlers = handlers.get("*");
  if (wildcardHandlers) {
    wildcardHandlers.forEach((h) => h(msg));
  }
}

function clearTimers() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingTimer !== null) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

async function getWsUrl(): Promise<string> {
  const apiUrl = await invoke<string | null>("get_api_base_url").catch(() => null);
  const base = apiUrl || "http://localhost:8080";
  return base.replace(/^http/, "ws") + "/api/v1/ws";
}

async function connect() {
  if (state.connected || state.reconnecting) return;

  clearTimers();
  state.reconnecting = true;

  try {
    const url = await getWsUrl();
    const token = localStorage.getItem("auth_token");
    if (!token) {
      state.reconnecting = false;
      return;
    }

    ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      state.connected = true;
      state.reconnecting = false;
      console.log("[WS] Connected");

      pingTimer = window.setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type !== "pong") {
          notifyHandlers(msg);
        }
      } catch {
        // ignore non-json
      }
    };

    ws.onclose = () => {
      state.connected = false;
      clearTimers();
      scheduleReconnect();
    };

    ws.onerror = () => {
      state.connected = false;
    };
  } catch {
    state.reconnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer !== null) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

export function on<T = unknown>(type: WSMessageType, handler: WSHandler<T>): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler as WSHandler);
  return () => off(type, handler);
}

export function off<T = unknown>(type: WSMessageType, handler: WSHandler<T>) {
  const typeHandlers = handlers.get(type);
  if (typeHandlers) {
    typeHandlers.delete(handler as WSHandler);
  }
}

export function send(data: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export async function connectWs(): Promise<void> {
  return connect();
}

export function disconnectWs() {
  clearTimers();
  if (ws) {
    ws.close();
    ws = null;
  }
  state.connected = false;
  state.reconnecting = false;
}

export function isConnected(): boolean {
  return state.connected;
}

export const wsClient = {
  on,
  off,
  send,
  connect: connectWs,
  disconnect: disconnectWs,
  isConnected,
};
