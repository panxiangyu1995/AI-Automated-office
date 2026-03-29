## ADDED Requirements

### Requirement: Quick Open UI structure
The system SHALL display a modal overlay when Quick Open is activated (Ctrl+Shift+M).

#### Scenario: Activate Quick Open
- **WHEN** user presses Ctrl+Shift+M
- **THEN** system displays Quick Open modal centered on screen
- **AND** search input is focused
- **AND** backdrop overlay is shown

#### Scenario: Close Quick Open with Escape
- **WHEN** user presses Escape
- **THEN** system closes Quick Open modal
- **AND** clears search input

### Requirement: Search input field
The system SHALL provide a search input field at the top of the Quick Open modal.

#### Scenario: Type in search input
- **WHEN** user types characters in search input
- **THEN** system triggers search after 300ms debounce
- **AND** displays loading indicator while searching

#### Scenario: Search input placeholder
- **WHEN** Quick Open is opened with no search text
- **THEN** input shows placeholder "Type to search projects, documents, templates..."

### Requirement: Search results list
The system SHALL display search results in a scrollable list below the search input.

#### Scenario: Display search results
- **WHEN** search returns results
- **THEN** system displays results grouped by type
- **AND** each result shows icon, title, subtitle, and workspace name
- **AND** results are scrollable if exceeds visible area

#### Scenario: Display no results
- **WHEN** search returns no results
- **THEN** system displays "No results found" message
- **AND** suggests trying different keywords

### Requirement: Keyboard navigation
The system SHALL support keyboard navigation through search results.

#### Scenario: Navigate with arrow keys
- **WHEN** user presses ArrowDown
- **THEN** system moves selection to next result
- **WHEN** user presses ArrowUp
- **THEN** system moves selection to previous result

#### Scenario: Select result with Enter
- **WHEN** user presses Enter with a result selected
- **THEN** system navigates to that result's target location
- **AND** closes Quick Open modal

#### Scenario: Navigate to recently accessed
- **WHEN** search input is empty
- **THEN** system displays recently accessed items
- **AND** Arrow keys navigate through recent items

### Requirement: Result item display
Each search result item SHALL display:
- Icon representing resource type
- Title (primary text)
- Subtitle (secondary text, e.g., path or description)
- Workspace badge (if user has access to multiple workspaces)

#### Scenario: Display project result
- **WHEN** result is a project
- **THEN** system shows project icon
- **AND** title as project name
- **AND** subtitle as workspace name
- **AND** project status badge

#### Scenario: Display document result
- **WHEN** result is a document
- **THEN** system shows document icon
- **AND** title as document title
- **AND** subtitle as document path
