## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Define runtime event protocol and event type mapping
- [ ] 2.2 Implement backend to frontend event bridge
- [ ] 2.3 Connect StreamingHostContext to the real event source
- [ ] 2.4 Handle ordering, reconnect, replay, and interruption consistency
- [ ] 2.5 Verify chat and debug panels consume real runtime events

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done