# Tasks

## 1. Alignment
- [x] 1.1 Confirm the React and Zustand best-practice audit still fits the current iron-law UI and runtime model
- [x] 1.2 Confirm this corrective change stays within shell/session implementation quality, not product-scope expansion

## 2. Build
- [x] 2.1 Refactor App shell and auth-facing components to use selector-based Zustand subscriptions
- [x] 2.2 Refactor workbench and shell layout surfaces to use shallow composite selectors only where multiple fields are required together
- [x] 2.3 Refactor session-facing components and selector hooks to avoid whole-store subscriptions on chat runtime state

## 3. Acceptance Mapping
- [x] 3.x Workbench, sidebar, account menu, and AI chat shell continue to render and navigate without behavior regressions
- [x] 3.x Session creation, selection, history filtering, and staged review entry points continue to work after selector refactors
- [x] 3.x Fixed UI, mixed UI host, and dynamic/editor host responsibilities remain unchanged

## 4. Verification
- [x] 4.1 Targeted integration tests updated and passing
- [x] 4.2 Browser smoke verification passes on a real shell entry path
- [x] 4.3 Lint and build pass

## 5. Documentation
- [x] 5.1 Update progress tracking
- [x] 5.2 Mark task status complete only after all checks pass
