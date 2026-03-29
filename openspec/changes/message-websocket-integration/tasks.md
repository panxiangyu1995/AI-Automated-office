## 1. Setup and Dependencies

- [ ] 1.1 Add tauri-plugin-websocket to Cargo.toml dependencies
- [ ] 1.2 Configure WebSocket permissions in tauri.conf.json
- [ ] 1.3 Verify existing websocket/client.ts structure

## 2. Rust WebSocket Client

- [ ] 2.1 Implement WebSocket client in Rust using tauri-plugin-websocket
- [ ] 2.2 Add WebSocket event types for bidirectional communication
- [ ] 2.3 Implement heartbeat ping/pong mechanism (30s interval)
- [ ] 2.4 Implement reconnection with exponential backoff (1s-30s, max 5 retries)

## 3. Frontend Event Bridge Integration

- [ ] 3.1 Extend RuntimeEventBridge to listen to WebSocket events
- [ ] 3.2 Add WebSocket event forwarding to RuntimeEventEmitter
- [ ] 3.3 Implement fallback to Tauri IPC when WebSocket unavailable

## 4. Connection State Management

- [ ] 4.1 Add WebSocket connection state to useAgentRuntime
- [ ] 4.2 Display connection status indicator in UI
- [ ] 4.3 Implement message queuing during disconnection

## 5. Testing

- [ ] 5.1 Test WebSocket connection establishment
- [ ] 5.2 Test reconnection after network interruption
- [ ] 5.3 Test heartbeat mechanism
- [ ] 5.4 Test bidirectional event flow
- [ ] 5.5 Verify Tauri IPC fallback works
