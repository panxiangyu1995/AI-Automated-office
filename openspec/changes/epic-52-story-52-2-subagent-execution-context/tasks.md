## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Create SubAgentExecutionContext and tool filtering
- [ ] 2.2 Project main Agent context into isolated Sub-Agent context
- [ ] 2.3 Ensure permissions can only inherit or shrink
- [ ] 2.4 Link Sub-Agent calls back to the main trace
- [ ] 2.5 Provide the shared context model needed by later Sub-Agent tasks

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done