# Tasks: LLM Provider Plan/Act 双配置模式

## 1. Backend Data Models

- [ ] 1.1 Add `plan_mode` and `act_mode` fields to `ProviderConfig` struct in `src-tauri/src/agent/llm_provider/config.rs`
- [ ] 1.2 Create `ModeConfig` struct with `provider`, `model_id`, `api_key`, `base_url` fields
- [ ] 1.3 Add `is_read_only` field to `ToolDescriptor` capabilities in `src-tauri/src/agent/tools/descriptor.rs`
- [ ] 1.4 Create `RoutingConfig` struct to hold dual configuration
- [ ] 1.5 Update database migration to add `plan_mode_settings` JSON column to `provider_config` table

## 2. Backend Logic Implementation

- [ ] 2.1 Modify `LlmAgentProvider` to support mode selection in `create_llm_request()`
- [ ] 2.2 Add `get_active_mode()` method to determine current mode (Plan/Act)
- [ ] 2.3 Implement mode switching logic in `Task` engine (`src-tauri/src/agent/task/mod.rs`)
- [ ] 2.4 Add `filter_readonly_tools()` method to `ToolRegistry` for Plan mode
- [ ] 2.5 Update `ToolPipeline` to check `is_read_only` flag when in Plan mode
- [ ] 2.6 Implement fallback logic when Plan mode config is not set

## 3. Frontend UI Implementation

- [ ] 3.1 Create `PlanActConfigPanel.tsx` component with Plan/Act tabs
- [ ] 3.2 Add `ModeSelector` component to switch between Plan/Act configuration
- [ ] 3.3 Update `ProviderConfigForm.tsx` to support dual configuration
- [ ] 3.4 Add `ModeIndicator` component to display current mode in chat interface
- [ ] 3.5 Update `SettingsView.tsx` to include Plan/Act configuration section

## 4. API Commands

- [ ] 4.1 Add `update_provider_config` Tauri command to handle dual config
- [ ] 4.2 Add `get_provider_config` Tauri command to retrieve dual config
- [ ] 4.3 Add `get_current_mode` Tauri command to return active mode
- [ ] 4.4 Add `switch_mode` Tauri command to manually switch mode

## 5. Testing

- [ ] 5.1 Write unit tests for `ModeConfig` struct serialization
- [ ] 5.2 Write unit tests for `filter_readonly_tools()` in Plan mode
- [ ] 5.3 Write integration tests for mode switching flow
- [ ] 5.4 Test API commands with Playwright E2E tests
- [ ] 5.5 Test UI components with browser testing

## 6. Documentation

- [ ] 6.1 Update API documentation for new dual config endpoints
- [ ] 6.2 Add user guide for Plan/Act configuration
- [ ] 6.3 Document mode switching behavior for developers
