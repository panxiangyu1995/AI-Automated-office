## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Create backend retrieval service
- [ ] 2.2 Replace mockRetrieve with real async retrieval
- [ ] 2.3 Enforce scope filters for tenant, department, and session
- [ ] 2.4 Inject retrieval results into planner, runtime, and tool context
- [ ] 2.5 Add caching, timeout, and degradation behavior

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done