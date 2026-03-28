## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Connect retry and replan decisions to real execution outcomes
  - Created RecoveryService with RecoveryTrigger and RecoveryAction types
  - Implemented determine_recovery_action for automatic decision making
  - RecoveryStrategyConfig with configurable retry parameters
- [x] 2.2 Implement checkpoint save, activate, rollback, and restore
  - SessionCheckpoint and CheckpointMessage types
  - create_checkpoint, restore_from_checkpoint methods
  - CheckpointManager for orchestrator integration
- [x] 2.3 Trigger recovery from tool failure, timeout, and interruption
  - Support for ToolFailure, Timeout, Interruption, UserCancelled triggers
  - Support for PermissionDenied, ResourceError, UnexpectedState triggers
  - Exponential backoff for retry delays
- [x] 2.4 Feed recovery state back to chat and debug views
  - RecoveryEventHandler trait for event handling
  - RecoveryContext and RecoveryHistoryEntry for state tracking
- [x] 2.5 Verify interruption, retry, rollback, and restore end to end
  - Unit tests for determine_recovery_action
  - Unit tests for calculate_retry_delay

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Added tests for RecoveryService::determine_recovery_action
  - Added tests for RecoveryService::calculate_retry_delay
- [x] 3.2 Lint and build pass
  - npm run lint: passed
  - npm run build: passed
  - npm run tauri build: passed
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done