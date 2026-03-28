## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Add correction rule read and match capability
  - Created correction.rs module with CorrectionRuleService
  - LearningCorrectionRule type with category, trigger type, scope
  - CorrectionStatus enum (Active, Inactive, Deprecated, Testing)
  - RuleCategory enum (OutputFormat, ContentAccuracy, Behavior, Safety, Performance)
  - TriggerType enum (Keyword, Pattern, Context, ToolOutput)
  - 3 default correction rules for output detail, error info, execution result
- [x] 2.2 Inject rule suggestions into planner and runtime without auto-mutation
  - match_rules() performs pattern matching against RuleMatchContext
  - generate_suggestions() creates RuleSuggestion objects
  - Always requires human review (requires_human_review = true)
- [x] 2.3 Link rule hits to failure and audit records
  - RuleHitRecord tracks every rule match with session_id and trace_id
  - link_to_failure() connects rule suggestions to error context
  - Hit records stored in memory with application count tracking
- [x] 2.4 Output reviewable improvement suggestions
  - RuleSuggestion type with correction_action, priority, reason
  - get_stats() provides RuleStats with top rules and metrics
  - Suggestions sorted by priority and confidence
- [x] 2.5 Verify human review remains required for governance changes
  - All suggestions have requires_human_review = true
  - No automatic mutation of rules or configuration
  - Rules can be added/updated but not auto-modified

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for CorrectionStatus, RuleCategory, TriggerType Display
  - Tests for default rules loading
  - Tests for keyword trigger matching
  - Tests for regex pattern matching
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分06秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done