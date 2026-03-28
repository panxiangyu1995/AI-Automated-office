## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Move sensitive input and dangerous action checks into backend guards
  - Created security.rs module with SecurityStore and SecurityService
  - SensitiveActionRule, DetectedSensitiveAction, RiskAssessment types
  - RiskLevel enum (Low, Medium, High, Critical)
  - SensitivityCategory enum (10 categories)
  - 8 default sensitive action rules covering deletion, bulk, permission, financial, auth, config, PII, export
- [x] 2.2 Implement backend confirmation, rejection, and permission-denied flows
  - ConfirmationOutcome enum (Approved, Rejected, Cancelled, Timeout)
  - record_confirmation_request() for pending confirmations
  - record_confirmation_decision() for recording outcomes
  - Integration with tracing for real-time monitoring
- [x] 2.3 Add allow and block policy for system, path, and network tools
  - check_tool_execution() performs security analysis before tool execution
  - Returns SecurityCheckResult with allowed/requires_confirmation/requires_approval/blocked flags
  - Critical risk actions are automatically blocked
- [x] 2.4 Add second-pass validation for risky writeback and outbound requests
  - ToolExecutionContext captures full tool execution context
  - evaluate_condition() supports multiple condition types (tool_id, tool_category, action_type, field_name, resource_type)
  - Operators: equals, contains, in, not_in
- [x] 2.5 Write security events into audit records
  - SecurityEvent type with trace_id, session_id, event_type, severity
  - record_security_event() persists to security_events table
  - record_authorization_decision() for authorization outcomes
  - Integration with tracing for real-time monitoring

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for RiskLevel Display, AuthorizationOutcome Display, ConfirmationOutcome Display
  - Tests for default rules loading
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分10秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done