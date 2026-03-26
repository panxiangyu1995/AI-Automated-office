# AI-Automated-office Agent Guide

## Encoding

- All manifest, OpenSpec, and iron-law document reads/writes must use explicit UTF-8.
- Prefer `npm run validate:manifests` or the helpers in `scripts/ops/manifest-io.mjs` when reading task manifests and iron-law documents.

## Product Summary

**AI-Automated-office** is a **general Agent work platform for enterprise business objects**.

- The platform borrows the runtime and interaction model of tools like Cursor, Claude Code, OpenCode, and OpenClaw, but it is **not** a coding product.
- The primary execution model is **one main Agent per user + configurable Sub-Agents**.
- Departments are **context / permission / capability boundaries**, not independent Agent kernels.
- Capability supply comes from **platform built-in Skills**, department capability packs, and user-configurable `Skills / MCP / plugins / prompts / UI templates`.
- Knowledge-base bindings, workflow rules, sensitive data permissions, and governance policy are admin-controlled.
- Results are rendered through **fixed UI + mixed UI + dynamic UI**, with AI changes staged for human review before final apply.
- Cross-user, user-to-Agent, and Agent-to-Agent collaboration must go through the unified messaging, audit, permission, and tenant model.

## Iron-Law Documents

These documents are the authoritative baseline for implementation:

1. `_bmad-output/planning-artifacts/prd.md`
2. `_bmad-output/planning-artifacts/architecture.md`
3. `_bmad-output/planning-artifacts/ux-design-specification.md`
4. `_bmad-output/planning-artifacts/epics.md`

Corrective governance for refactor-affected areas lives here:

- `openspec/changes/agent-platform-course-correction/legacy-governance.md`

Use the documents above as the source of truth for:

- Product model: general Agent Runtime, user-owned Sub-Agents, department boundaries, capability supply, enterprise messaging, staged review
- Technical model: layered runtime, Tool Calling 2.0, built-in Skills baseline, human-only review actions, multi-tenant and audit boundaries
- UX model: fixed + mixed + dynamic UI, VSCode-like shell, transparent and controllable AI interaction
- Delivery model: stories, acceptance criteria, and OpenSpec change alignment

## Task And Change Governance

Task manifests currently have different roles:

- `task.json` tasks `1-103`: frozen implementation history
- `task.json` task `104`: completed corrective rebaseline traceability
- `task-course-correction.json`: completed corrective batch traceability
- `task-archived.json` / `task-archived-1.json`: archived history

Rules:

- Do **not** treat frozen or completed task manifests as an active backlog.
- Do **not** resume superseded legacy OpenSpec changes as standalone work.
- If the user asks to continue an active change, use that change directly.
- If there is no active change, derive the next work item from the current user request and the iron-law documents, then create or select the appropriate OpenSpec change.
- When historical traceability is needed, read the legacy change together with `legacy-governance.md`.

## Mandatory Workflow

Every new implementation session should follow this order:

1. Initialize the environment as needed.
   - Preferred bootstrap: `./init.sh`
2. Validate manifest readability when touching task or iron-law artifacts.
   - Run `npm run validate:manifests`
3. Read the four iron-law documents.
4. If touching corrected Agent-platform areas, read `openspec/changes/agent-platform-course-correction/legacy-governance.md`.
5. Select the work source.
   - Prefer the current user request plus the active OpenSpec change.
   - If no active change exists, propose or create one aligned with the iron laws.
6. Implement against the OpenSpec artifacts and current codebase.
7. Test proportionally.
   - UI-heavy changes: browser verification is mandatory.
   - Code-only changes: run targeted tests plus `npm run lint` and `npm run build`.
8. Update the relevant progress artifact.
   - `progress.txt`
   - active OpenSpec `tasks.md`
   - task manifest only if the work actually belongs to an active task batch
9. Commit only when appropriate and only after validation passes.

## Compliance Checklist

Use this checklist before substantial implementation:

```markdown
## Iron-Law Compliance

### PRD
- [ ] Requirement source identified
- [ ] No functionality added that conflicts with the current product model

### Architecture
- [ ] Implementation follows the current layered Agent-platform architecture
- [ ] Department boundaries are treated as context/permission/capability boundaries
- [ ] Tool Calling 2.0 and built-in Skill rules are respected

### UX
- [ ] Uses Shadcn/ui and Lucide React where applicable
- [ ] Preserves fixed / mixed / dynamic UI responsibilities
- [ ] Preserves staged-review interaction for AI-generated changes

### Epics
- [ ] Story or change scope identified
- [ ] Acceptance criteria reviewed
```

## UI And Agent Rules

- Shadcn/ui and Lucide React are the default UI building blocks.
- Preserve the VSCode-like shell structure unless the iron-law UX docs say otherwise.
- AI may **stage** candidate changes into editors, forms, details, cards, and similar business surfaces.
- Only humans may `accept / reject / rollback / publish` staged changes.
- Review actions are UI actions, not AI tools.
- Avoid deceptive product mock data. Use clear empty states, labeled examples, or explicit placeholders instead.

## Tool And Skill Rules

Tool Calling 2.0 follows a layered model:

- General high-power atomic tools: examples include `file_read`, `file_edit`, `sandbox_execute`, `web_search`, `web_fetch`, `http_request`
- Enterprise platform tools: examples include `resource_upload`, `knowledge_query`, `knowledge_submit_draft`, `message_send`, `workspace_stage_change`, `agent_delegate`
- Department capability tools: prefer parameterized families like `{dept}_query`, `{dept}_aggregate`, `{dept}_mutate`, `{dept}_action`, `{dept}_export`

Rules:

- Keep tools **few, atomic, and high-leverage**.
- Prefer general tools plus department capability packs over many scene-specific one-off tools.
- Platform must expose built-in Skills as a baseline, while still allowing governed user configuration.

## Coding Conventions

### Frontend

- TypeScript strict mode
- React + Vite
- Shadcn/ui + Tailwind CSS
- Lucide React for icons

### Rust / Tauri

- Follow Rust formatting and lint conventions
- Preserve the layered runtime and command boundaries

### Storage And Security

- Local-first storage with sync remains the baseline
- Sensitive data must respect encryption, tenant isolation, and audit requirements from the architecture doc

### Naming

- General tools may use atomic names such as `file_read`
- Department tools should use parameterized families such as `sales_query`, `finance_mutate`, `warehouse_action`
- Avoid reintroducing sprawling scene-specific tool names unless the iron-law documents explicitly require them

## Testing Requirements

- `npm run lint` should pass for code changes.
- `npm run build` should pass for code changes.
- Browser verification is required for major UI or interaction changes.
- Prefer targeted Vitest / Playwright runs for the affected surface before broader suites.

## Progress And Commit Rules

- Record meaningful work in `progress.txt` when the task flow expects it.
- Update the active OpenSpec `tasks.md` when implementing an OpenSpec change.
- Update task manifests only when the work is actually governed by that manifest.
- Do not mark historical or frozen task batches as active again.
- If committing a task-based implementation, keep code changes, progress updates, and task/checklist updates in the same commit.

## Blocking Rules

Stop and ask for help when:

- required credentials, accounts, or approvals are missing
- external services are unavailable
- the iron-law documents conflict
- the only apparent next step would require resuming a superseded legacy change

When blocked:

- do not fake completion
- do not mark tasks or OpenSpec checklist items complete incorrectly
- document the blocker clearly in `progress.txt` or the working notes

## Quick Start

1. Read this file.
2. Run `npm run validate:manifests` if you will touch task manifests or iron-law docs.
3. Read `prd.md`, `architecture.md`, `ux-design-specification.md`, and `epics.md`.
4. Read corrective governance if the work touches Agent-platform refactor areas.
5. Identify the active OpenSpec change or create/select a new one from the current request.
6. Run `./init.sh` or the minimum required setup commands.
7. Implement, test, update progress/checklists, and only then consider a commit.

## Notes

- Qdrant cloud accepts numeric or UUID-style IDs only.
- Current test framework notes: `tests/README.md`
- UI prototyping should use Pencil MCP when applicable.
