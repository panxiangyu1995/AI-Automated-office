## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Track nested depth and enforce limits
  - Created NestedCallService with depth tracking
  - NestedCallPolicy with configurable max_depth (default 5)
  - get_current_depth() to query current nesting level
- [x] 2.2 Add loop detection and call budgets
  - CallChainEntry for loop detection history
  - detect_loop() checks recent sub-agent calls at same depth
  - CallBudget for per-execution call tracking
  - max_calls_per_depth limit enforcement
- [x] 2.3 Propagate timeout and failure correctly
  - check_timeout() detects exceeded timeouts
  - record_nested_call_completion() with status propagation
  - NestedCallStatus includes Timeout, MaxDepthExceeded, LoopDetected
- [x] 2.4 Link nested calls to trace, audit, and failure records
  - NestedCallRecord with parent_trace_id equivalent (parent_execution_id)
  - get_nested_calls() and get_session_nested_calls() for record retrieval
  - get_execution_chain() for audit trail
- [x] 2.5 Verify no unbounded recursion or privilege escalation
  - verify_no_privilege_escalation() checks permission hierarchy
  - cancel_nested_calls() to stop all child calls on failure
  - Policy-based depth and budget enforcement prevents unbounded recursion

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for NestedCallStatus Display
  - Tests for NestedCallPolicy default values
  - Tests for nested call allowed check (depth 0)
  - Tests for nested call recording
  - Tests for max depth enforcement
  - Tests for call chain tracking
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分01秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done
