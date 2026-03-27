## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Remove the default simulateResponse path
- [ ] 2.2 Connect MessageInput, MessageList, and StagedReviewPanel to the real runtime
- [ ] 2.3 Close the loop from user input to tool call to staged writeback to apply
- [ ] 2.4 Add a mock provider and a minimum tool set for runtime tests
- [ ] 2.5 Add end-to-end coverage for the main Agent loop

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done