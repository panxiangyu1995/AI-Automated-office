// Tauri runtime event bridge - stub implementation
import type { RuntimeEventBridgeOptions } from './runtimeEventBridge'

/**
 * Attach Tauri-based runtime event bridge
 * This is a placeholder implementation
 */
export async function attachTauriRuntimeEventBridge(
  _options: RuntimeEventBridgeOptions
): Promise<() => void> {
  // Return no-op cleanup function
  return () => {}
}
