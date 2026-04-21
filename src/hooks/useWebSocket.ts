import { useEffect, useCallback } from "react";
import { wsClient, on, connectWs, disconnectWs } from "@/lib/ws";
import type { WSMessage } from "@/lib/ws";

export function useWebSocket() {
  useEffect(() => {
    connectWs();
    return () => {
      disconnectWs();
    };
  }, []);

  const subscribe = useCallback(
    <T = unknown>(type: string, handler: (msg: WSMessage<T>) => void) => {
      const wrapped: typeof handler = (msg) => handler(msg as WSMessage<T>);
      const unsubscribe = on(type as Parameters<typeof on>[0], wrapped as Parameters<typeof on>[1]);
      return unsubscribe;
    },
    []
  );

  return { subscribe, isConnected: wsClient.isConnected };
}
