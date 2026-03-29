## ADDED Requirements

### Requirement: Virtualized message list for performance
The system SHALL use virtual scrolling to render only visible messages plus a buffer, enabling smooth scrolling with 1000+ messages.

#### Scenario: Only visible messages rendered
- **WHEN** message list has 1000 messages but only 20 are visible
- **THEN** only ~25 messages (visible + buffer) SHALL be rendered in the DOM

#### Scenario: Scroll position maintained
- **WHEN** user scrolls through message list
- **THEN** the scroll position SHALL be maintained accurately

#### Scenario: Dynamic height messages supported
- **WHEN** a message contains expandable content (e.g., long code block)
- **THEN** the virtual list SHALL correctly calculate and update the scroll height

### Requirement: Efficient memory usage
The system SHALL limit memory usage by unloading messages outside the visible range.

#### Scenario: Old messages unloaded from memory
- **WHEN** user scrolls away from a range of messages
- **THEN** those messages SHALL be unloaded from React state but remain in SQLite

#### Scenario: Scroll up loads history
- **WHEN** user scrolls to the top of message list
- **THEN** older messages SHALL be loaded from SQLite and displayed
