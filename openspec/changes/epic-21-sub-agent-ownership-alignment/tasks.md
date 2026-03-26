# Tasks

## 1. Alignment
- [x] 1.1 Confirm mapped FR/NFR/ARCH/UX references are still valid against the updated iron-law documents
- [x] 1.2 Confirm this corrective change supersedes standalone execution for Story 21.17-21.23 settings surfaces

## 2. Build
- [x] 2.1 Rebind Sub-Agent registry, persona, permission, model, routing, and execution fixtures to the user-owned Sub-Agent model
- [x] 2.2 Remove department-specific Agent mock copy and sample data from the affected settings surfaces
- [x] 2.3 Make new persona defaults inherit the selected Sub-Agent template role and invocation description

## 3. Acceptance Mapping
- [x] 3.x New Sub-Agent defaults belong to the current user's main Agent instead of a department Agent
- [x] 3.x Departments are shown as context or permission boundaries, not independent Agent identities
- [x] 3.x Routing and execution examples use corrective Sub-Agent samples consistently across the settings area

## 4. Verification
- [x] 4.1 Settings integration tests updated and passing
- [x] 4.2 Lint and build pass
- [x] 4.3 Scenario checks in `specs/spec.md` verified

## 5. Documentation
- [x] 5.1 Update progress tracking
- [x] 5.2 Keep task status unchanged until all checks pass
