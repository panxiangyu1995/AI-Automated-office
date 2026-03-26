# Tasks

## 1. Alignment

- [ ] 1.1 Confirm the refactor stays within fixed-shell and AI auxiliary-panel interaction boundaries defined by the iron-law UX document
- [ ] 1.2 Confirm the change preserves existing session persistence, history management, and staged review behavior instead of introducing a new runtime path

## 2. Build

- [ ] 2.1 Add shared shell state for AI panel secondary surfaces and unify AI panel visibility actions
- [ ] 2.2 Refactor `SessionPanel` and `AgentChatPanel` to a chat-first layout with on-demand session and history secondary surfaces
- [ ] 2.3 Wire TopBar `助手 / 视图` actions, layout controls, and panel header actions to the shared AI panel state contract
- [ ] 2.4 Consolidate AI panel shortcut defaults and displayed shortcut copy across frontend, settings, and Tauri defaults

## 3. Acceptance Mapping

- [ ] 3.1 AI panel opens in chat-first mode without a permanently visible nested session/history sidebar
- [ ] 3.2 Session and history browsing remain available through explicit secondary surfaces and close after selection or dismissal
- [ ] 3.3 New chat, history entry, and AI panel toggle actions remain discoverable and behaviorally consistent across shell entry points

## 4. Verification

- [ ] 4.1 Targeted unit and integration tests updated and passing
- [ ] 4.2 Browser smoke verification covers the new AI panel interaction path
- [ ] 4.3 Lint and build pass

## 5. Documentation

- [ ] 5.1 Update `progress.txt` with the refactor summary and verification results
- [ ] 5.2 Mark the OpenSpec checklist complete only after validation passes
