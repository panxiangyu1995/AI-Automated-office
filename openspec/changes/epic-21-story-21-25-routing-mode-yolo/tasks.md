# Tasks: 路由模式与YOLO Mode

## 1. Backend Data Models

- [ ] 1.1 Add `RoutingMode` enum in `src-tauri/src/agent/config.rs`: `Manual`, `Auto`, `Yolo`, `Hybrid`
- [ ] 1.2 Add `YoloTtl` enum: `Once`, `OneHour`, `Today`, `Custom(u64)`
- [ ] 1.3 Add `routing_mode` and `yolo_ttl` fields to `AgentConfig` struct
- [ ] 1.4 Add `yolo_mode: bool` field to `AuditLog` struct
- [ ] 1.5 Add `is_yolo_active()` method to check if YOLO mode is currently active

## 2. Backend Routing Logic

- [ ] 2.1 Implement routing decision logic in `ToolPipeline::execute()`
- [ ] 2.2 Add `should_request_confirmation()` method based on routing mode
- [ ] 2.3 Implement YOLO TTL check logic in `ToolPipeline`
- [ ] 2.4 Add `request_confirmation()` call for Manual and Hybrid modes
- [ ] 2.5 Handle YOLO mode expiration in `check_yolo_ttl_expired()`

## 3. YOLO Mode Security

- [ ] 3.1 Implement YOLO mode activation with TTL tracking
- [ ] 3.2 Add `activate_yolo_mode()` with TTL configuration
- [ ] 3.3 Add `deactivate_yolo_mode()` to manually disable YOLO
- [ ] 3.4 Implement automatic deactivation when TTL expires
- [ ] 3.5 Add YOLO mode logging to audit trail

## 4. Frontend UI Implementation

- [ ] 4.1 Create `RoutingModeSelector.tsx` component with 4 mode options
- [ ] 4.2 Create `YoloConfirmDialog.tsx` with safety warning and checkbox
- [ ] 4.3 Create `YoloTtlSelector.tsx` component with TTL options
- [ ] 4.4 Add `RoutingModeIndicator.tsx` to display current mode in chat
- [ ] 4.5 Update `SettingsView.tsx` to include routing mode configuration
- [ ] 4.6 Integrate YOLO confirmation dialog in settings page

## 5. API Commands

- [ ] 5.1 Add `get_routing_mode` Tauri command
- [ ] 5.2 Add `set_routing_mode` Tauri command
- [ ] 5.3 Add `activate_yolo_mode` Tauri command with TTL parameter
- [ ] 5.4 Add `deactivate_yolo_mode` Tauri command
- [ ] 5.5 Add `get_yolo_status` Tauri command (active, remaining TTL)

## 6. Admin Controls

- [ ] 6.1 Add `allow_yolo_mode` field to tenant settings
- [ ] 6.2 Implement tenant-level YOLO disable check in backend
- [ ] 6.3 Add admin UI toggle to disable YOLO mode for enterprise
- [ ] 6.4 Update frontend to hide YOLO options when disabled by admin

## 7. Testing

- [ ] 7.1 Write unit tests for `RoutingMode` routing logic
- [ ] 7.2 Write unit tests for YOLO TTL expiration
- [ ] 7.3 Write integration tests for YOLO mode activation flow
- [ ] 7.4 Test admin disable YOLO functionality
- [ ] 7.5 E2E tests for routing mode selector UI
- [ ] 7.6 E2E tests for YOLO confirmation dialog

## 8. Documentation

- [ ] 8.1 Document routing mode behavior for users
- [ ] 8.2 Add security guidelines for YOLO mode usage
- [ ] 8.3 Document admin controls for YOLO management
