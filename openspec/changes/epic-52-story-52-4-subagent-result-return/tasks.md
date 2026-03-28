## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Normalize Sub-Agent result and summary payloads
  - Created SubAgentResult struct with status, output, summary, tools_used/denied
  - SubAgentResultStatus enum (Success, Failed, Timeout, Cancelled, MaxStepsExceeded)
  - MemoryEntrySummary for memory snapshot in results
- [x] 2.2 Merge results and failures back into the main Agent context
  - ResultMergeService with receive_result() for processing results
  - MergeDecision enum (AutoMerge, ReviewRequired, Reject)
  - MergedResultRecord tracks merge status and failure info
  - FailureInfo includes error type, message, recovery suggestion
- [x] 2.3 Allow main Agent replanning or review handoff based on returned results
  - ReviewDecision and ReviewOutcome (Accept, Reject, Modify, Retry, Escalate)
  - submit_review_decision() handles review workflow
  - generate_replan_suggestion() provides replan hints based on failures
- [x] 2.4 Preserve context boundaries during result merge
  - ResultMergePolicy with preserve_context_boundaries flag
  - build_parent_update() creates ParentContextUpdate for main Agent
  - ToolUsageReport summarizes tools used/denied
- [x] 2.5 Add visible debug and review data for parent-child Agent interaction
  - MergedResultRecord includes review_notes field
  - get_merged_results() provides merged results for debugging
  - get_review_decisions() retrieves review history

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Tests for MergeStatus Display
  - Tests for SubAgentResultStatus Display
  - Tests for ReviewOutcome Display
  - Tests for success result auto-merge
  - Tests for failure result review requirement
  - Tests for review decision submission
  - Tests for parent context update building
- [x] 3.2 Lint and build pass
  - cargo check: passed (warnings only)
  - npm run tauri build: passed (3分05秒)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done
