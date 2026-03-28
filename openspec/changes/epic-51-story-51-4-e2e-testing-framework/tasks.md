## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Remove the default simulateResponse path
- [x] 2.2 Connect MessageInput, MessageList, and StagedReviewPanel to the real runtime
- [x] 2.3 Close the loop from user input to tool call to staged writeback to apply
- [x] 2.4 Add a mock provider and a minimum tool set for runtime tests
- [x] 2.5 Add end-to-end coverage for the main Agent loop
  - NOTE: E2E tests require Tauri runtime context (invoke/listen APIs)
  - Tests gracefully skip when running against Vite dev server without Tauri
  - For full testing, run `npm run tauri dev` and execute Playwright against the desktop app

## 3. Verification
- [x] 3.1 Unit and integration tests updated
- [x] 3.2 Lint and build pass
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done
