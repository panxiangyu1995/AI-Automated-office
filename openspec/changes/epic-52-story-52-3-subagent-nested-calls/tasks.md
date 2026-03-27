## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Track nested depth and enforce limits
- [ ] 2.2 Add loop detection and call budgets
- [ ] 2.3 Propagate timeout and failure correctly
- [ ] 2.4 Link nested calls to trace, audit, and failure records
- [ ] 2.5 Verify no unbounded recursion or privilege escalation

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done