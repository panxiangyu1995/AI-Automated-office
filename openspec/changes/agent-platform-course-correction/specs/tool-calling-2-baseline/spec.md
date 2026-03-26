## ADDED Requirements

### Requirement: Tool Calling 2.0 MUST use a layered, minimal, atomic tool model
The system SHALL present Tool Calling 2.0 as a layered tool model composed of high-capability atomic tools, platform enhancement tools, department capability tools, and restricted tools, while minimizing redundant tool choices.

#### Scenario: Inspecting tool catalog or runtime descriptors
- **WHEN** a user or developer reviews runtime tool definitions, status pages, observability, or history samples
- **THEN** tools SHALL be grouped by layered baseline rather than by uncontrolled scene-specific sprawl
- **AND** examples SHALL prefer parameterized tool naming over one-off business action tool names

### Requirement: Restricted tools MUST NOT be treated as default platform tools
The system SHALL treat low-level or high-risk tools such as unrestricted database querying as restricted capabilities rather than default tools exposed in standard user-facing surfaces.

#### Scenario: Rendering tool history or observability samples
- **WHEN** default examples, mock data, or demo statistics are shown
- **THEN** restricted tools SHALL NOT be presented as ordinary default platform tools
- **AND** any restricted capability exposure SHALL be explicitly marked as governed or admin-only
