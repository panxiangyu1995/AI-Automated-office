## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Define runtime metric collection points
  - Created telemetry.rs module with TelemetryStore and TelemetryService
  - MetricCategory enum (Runtime, Tool, Llm, Storage, Network, User)
  - MetricUnit enum (Count, Milliseconds, Bytes, Percentage, Ratio)
  - MetricPoint, AggregatedMetric, MetricSummary types
- [x] 2.2 Persist telemetry and expose aggregate queries
  - TelemetryStore.record_metric() for database persistence
  - TelemetryStore.get_aggregated_metrics() for aggregate queries
  - TelemetryStore.get_metrics_by_name/session for filtered queries
- [x] 2.3 Connect metrics panels to real data
  - TelemetryService provides high-level metric recording
  - record_metric_auto with automatic categorization
  - In-memory cache for recent metrics (100 entries per metric)
- [x] 2.4 Support session and tenant level statistics
  - RuntimeStats, TenantStats, SessionTelemetry types
  - get_runtime_stats() for aggregated runtime statistics
- [x] 2.5 Emit structured diagnostics for troubleshooting
  - DiagnosticEntry type with trace_id, session_id, severity
  - TelemetryService.emit_diagnostic() for structured logging
  - Integration with tracing for real-time monitoring

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for categorize_metric, MetricCategory Display, parse_metric_category
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (0 errors)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done