## 1. Preparation
- [ ] 1.1 Confirm dependency stories are complete
- [ ] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [ ] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [ ] 2.1 Add metrics for Sub-Agent latency, failure rate, and token usage
- [ ] 2.2 Connect Sub-Agent monitoring to the shared telemetry and trace stack
- [ ] 2.3 Support inspection by main session, child call, and role template
- [ ] 2.4 Emit diagnostics for multi-agent troubleshooting
- [ ] 2.5 Verify monitoring does not create new permission leaks

## 3. Verification
- [ ] 3.1 Unit and integration tests updated
- [ ] 3.2 Lint and build pass
- [ ] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [ ] 4.1 Update progress.txt
- [ ] 4.2 Update task.json passes when done