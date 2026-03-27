## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Move sensitive input and dangerous action checks into backend guards
- [ ] 2.2 Implement backend confirmation, rejection, and permission-denied flows
- [ ] 2.3 Add allow and block policy for system, path, and network tools
- [ ] 2.4 Add second-pass validation for risky writeback and outbound requests
- [ ] 2.5 Write security events into audit records

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done