## ADDED Requirements

### Requirement: Smooth streaming text rendering
The system SHALL render streaming text updates smoothly using requestAnimationFrame batching, not triggering excessive re-renders.

#### Scenario: Part delta updates content incrementally
- **WHEN** a part_delta event is received during streaming
- **THEN** the text SHALL be appended to the display within 50ms

#### Scenario: RAF batching reduces setState calls
- **WHEN** multiple part_delta events arrive in quick succession
- **THEN** they SHALL be batched and applied in a single requestAnimationFrame callback

### Requirement: Streaming content display with animation
The system SHALL display streaming content with a subtle typing animation for visual feedback.

#### Scenario: Text appears with typing effect
- **WHEN** streaming text is being received
- **THEN** a blinking cursor SHALL be shown at the end of the text

#### Scenario: Streaming complete removes cursor
- **WHEN** message streaming is complete
- **THEN** the cursor SHALL be removed and full text displayed
