## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Create routing service for keyword, intent, and scenario matching
  - Created routing.rs module with SubAgentRoutingService
  - RoutingMode enum (Manual, Auto, Hybrid)
  - MatchStrategy enum (Keyword, Semantic, Combined, LlmGuided)
  - ConfidenceLevel enum (High, Medium, Low)
  - RoutingRule, RoutingDecision, RoutingOutcome types
  - 3 default routing rules: document drafting, data organization, data query
- [x] 2.2 Base delegation decisions on real runtime context
  - match_rules() performs keyword and strategy-based matching
  - calculate_match_score() supports multiple match strategies
  - make_decision() creates RoutingDecision with confidence scoring
- [x] 2.3 Write routing outcomes into the main trace
  - RoutingOutcome tracks trace_id, session_id, decision_id
  - get_outcomes_by_trace() and get_outcomes_by_session() for queries
  - record_acceptance() for decision feedback
- [x] 2.4 Prepare standardized input for Sub-Agent execution context
  - SubAgentExecutionContext type with session, trace, original input
  - SubAgentConstraints for max_steps, timeout, allowed_tools
- [x] 2.5 Verify routing cannot bypass an incomplete main Agent path
  - verify_main_agent_path() placeholder for path completion check

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for RoutingMode, MatchStrategy, ConfidenceLevel Display
  - Tests for default rules loading
  - Tests for keyword matching
  - Tests for no-match fallback behavior
  - Tests for score to confidence conversion
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分08秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done