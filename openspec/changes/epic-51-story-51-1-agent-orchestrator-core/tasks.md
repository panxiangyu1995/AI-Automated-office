## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Create src-tauri/src/agent and module exports
- [ ] 2.2 Define AgentOrchestrator, provider trait, and runtime session service
- [ ] 2.3 Register agent commands in lib.rs invoke_handler
- [ ] 2.4 Define request and response contracts for frontend runtime integration
- [ ] 2.5 Ensure the main execution loop is interruptible, traceable, and persistable

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done