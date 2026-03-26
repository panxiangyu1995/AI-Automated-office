## 1. Governance Baseline

- [x] 1.1 Audit completed task batches, active OpenSpec changes, and implemented code to classify each area as keep, rename/rebind, refactor, or freeze/supersede
- [x] 1.2 Define the corrective execution source and stop using legacy unarchived changes as the default implementation direction
- [x] 1.3 Create and maintain a dedicated corrective task batch that future refactor work can execute against

## 2. Main Agent And Sub-Agent Ownership

- [x] 2.1 Introduce a shared state contract that models one main Agent per user and user-owned Sub-Agent configurations
- [x] 2.2 Refactor `SubAgentRegistry`, persona, tool binding, permission, model, routing, and execution screens to use shared corrective state instead of department-specific mock agents
- [x] 2.3 Align copy, labels, and examples so departments are shown as context and permission boundaries rather than independent Agents

## 3. Tool And Capability Rebaseline

- [x] 3.1 Rebaseline tool descriptor samples, tool history, observability, and module capability views to the Tool Calling 2.0 layered model
- [x] 3.2 Demote restricted tools such as `db_query` from default-facing samples and surfaces, and align legacy command-execution naming with `sandbox_execute`
- [x] 3.3 Surface platform built-in Skills, department built-in Skills, and user-installed Skills as distinct capability sources

## 4. Review Writeback Rebaseline

- [x] 4.1 Normalize existing form/detail/workbench/editor writeback adapters under a shared staged-review contract
- [x] 4.2 Add a change-list surface above chat and keep candidate-change review separate from tool call cards
- [x] 4.3 Enforce user-only accept/reject/apply/rollback semantics for staged candidate changes

## 5. Verification And Cleanup

- [x] 5.1 Update tests, fixtures, and mock data to the corrected ownership and capability model
- [x] 5.2 Re-run targeted session/settings/workbench/writeback test suites for affected areas
- [x] 5.3 Archive, supersede, or explicitly freeze obsolete refactor-affected OpenSpec changes after the corrective path is validated
