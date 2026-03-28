## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Add metrics for Sub-Agent latency, failure rate, and token usage
  - Created SubAgentMetrics with total_calls, successful_calls, failed_calls, timeout_calls
  - Average, min, max latency tracking
  - Estimated token usage tracking
  - Last called timestamp
- [x] 2.2 Connect Sub-Agent monitoring to the shared telemetry and trace stack
  - SubAgentMonitoringService integrates with existing execution, nested, result modules
  - record_execution_start/complete for lifecycle tracking
  - Active executions tracked for runtime inspection
- [x] 2.3 Support inspection by main session, child call, and role template
  - get_session_stats() returns SessionSubAgentStats
  - SubAgentSummary provides quick reference for active Sub-Agents
  - get_sub_agent_metrics() and get_all_metrics() for metrics queries
- [x] 2.4 Emit diagnostics for multi-agent troubleshooting
  - DiagnosticEntry with severity and category
  - emit_diagnostic() for custom diagnostic events
  - record_loop_detection() and record_permission_denial()
  - get_diagnostic_summary() for troubleshooting overview
  - DiagnosticSeverity (Info, Warning, Error, Critical)
  - DiagnosticCategory (Performance, Failure, Security, Resource, Timeout, Loop, Permission, Integration)
- [x] 2.5 Verify monitoring does not create new permission leaks
  - verify_no_permission_leaks() checks permission hierarchy
  - MonitoringConfig with enable_permission_audit flag
  - Permission denial events tracked but not causing leaks

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for execution start/completion recording
  - Tests for latency threshold diagnostics
  - Tests for metrics retrieval
  - Tests for loop detection recording
  - Tests for permission denial recording
  - Tests for diagnostic summary
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分06秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done
