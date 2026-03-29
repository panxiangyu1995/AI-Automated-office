# Tasks: workspace-data-model

## 1. Data Model Definition

- [ ] 1.1 Define TypeScript interfaces for Workspace entity
- [ ] 1.2 Define TypeScript interfaces for Project entity
- [ ] 1.3 Define TypeScript interfaces for WorkspaceMember entity
- [ ] 1.4 Define WorkspaceRole enum (owner, admin, member, viewer)
- [ ] 1.5 Define ProjectStatus enum (active, archived)

## 2. WorkspaceStore Implementation

- [ ] 2.1 Create `src/stores/workspaceStore.ts` with Zustand store
- [ ] 2.2 Implement currentWorkspaceId state and setter
- [ ] 2.3 Implement currentProjectId state and setter
- [ ] 2.4 Implement workspaceList state
- [ ] 2.5 Implement workspace CRUD actions (create, update, delete)
- [ ] 2.6 Implement project CRUD actions (create, update, archive, restore)
- [ ] 2.7 Add workspace persistence to localStorage
- [ ] 2.8 Add workspace list caching with invalidation

## 3. Workspace API Layer

- [ ] 3.1 Create `src/lib/api/workspace.ts` API client
- [ ] 3.2 Implement workspace CRUD API calls
- [ ] 3.3 Implement project CRUD API calls
- [ ] 3.4 Implement workspace membership API calls
- [ ] 3.5 Add error handling and loading states

## 4. Workspace Switcher Component

- [ ] 4.1 Create `WorkspaceSwitcher` component in `src/components/workspace/`
- [ ] 4.2 Implement workspace list display
- [ ] 4.3 Implement workspace search/filter
- [ ] 4.4 Implement workspace selection with confirmation dialog for unsaved changes
- [ ] 4.5 Add to TopBar or ActivityBar integration

## 5. Workspace Management UI

- [ ] 5.1 Create workspace list page (`/workspace`)
- [ ] 5.2 Create workspace creation dialog
- [ ] 5.3 Create workspace settings page
- [ ] 5.4 Create workspace member management UI
- [ ] 5.5 Create project list within workspace

## 6. Integration

- [ ] 6.1 Integrate workspace context into uiStore
- [ ] 6.2 Update RouteContainer to check workspace access
- [ ] 6.3 Add workspace validation on app load
- [ ] 6.4 Update sidebar to show workspace context
- [ ] 6.5 Add workspace routes to workbenchRoutes

## 7. Testing

- [ ] 7.1 Write unit tests for workspaceStore
- [ ] 7.2 Write unit tests for workspace API client
- [ ] 7.3 Test workspace switcher component in browser
- [ ] 7.4 Test workspace CRUD flow end-to-end
