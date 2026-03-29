# Tasks: workspace-layout-presets

## 1. LayoutPresetStore Implementation

- [ ] 1.1 Create `src/stores/layoutPresetStore.ts` with Zustand store
- [ ] 1.2 Define LayoutPreset interface and config types
- [ ] 1.3 Implement preset CRUD actions (create, update, delete)
- [ ] 1.4 Implement preset list getters (by workspace, built-in)
- [ ] 1.5 Add preset persistence to localStorage
- [ ] 1.6 Add built-in preset initialization

## 2. UIStore Integration

- [ ] 2.1 Extend UIStore to track activePresetId
- [ ] 2.2 Add currentWorkspaceState for state recovery
- [ ] 2.3 Implement debounced state save (2 seconds)
- [ ] 2.4 Add resetToDefault action

## 3. Built-in Presets

- [ ] 3.1 Create Focus Mode preset config
- [ ] 3.2 Create Approval Mode preset config
- [ ] 3.3 Create Draft Mode preset config
- [ ] 3.4 Create Audit Mode preset config
- [ ] 3.5 Implement built-in preset initialization on first launch

## 4. Preset Picker UI

- [ ] 4.1 Create PresetPicker component
- [ ] 4.2 Add preset list display with icons
- [ ] 4.3 Add current preset highlight
- [ ] 4.4 Add "Save Current as Preset" functionality
- [ ] 4.5 Add preset delete (custom only)
- [ ] 4.6 Integrate into TopBar or StatusBar

## 5. Workspace State Recovery

- [ ] 5.1 Implement saveWorkspaceState() function
- [ ] 5.2 Implement restoreWorkspaceState() function
- [ ] 5.3 Add tab state save/restore
- [ ] 5.4 Add filter state save/restore
- [ ] 5.5 Add AI panel state save/restore
- [ ] 5.6 Add scroll position save/restore
- [ ] 5.7 Integrate with workspace switching

## 6. Preset Application

- [ ] 6.1 Implement applyPreset() function
- [ ] 6.2 Handle unsaved changes confirmation dialog
- [ ] 6.3 Implement layout config restoration
- [ ] 6.4 Track active preset changes
- [ ] 6.5 Clear active preset on manual layout change

## 7. Testing

- [ ] 7.1 Write unit tests for layoutPresetStore
- [ ] 7.2 Write unit tests for preset matching logic
- [ ] 7.3 Test preset switching in browser
- [ ] 7.4 Test workspace state recovery in browser
- [ ] 7.5 Test built-in presets initialization
