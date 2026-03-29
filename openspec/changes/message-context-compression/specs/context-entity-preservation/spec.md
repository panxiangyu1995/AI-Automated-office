## ADDED Requirements

### Requirement: Critical entity preservation during compression
The system SHALL identify and preserve critical entities (names, dates, amounts, technical terms) during compression.

#### Scenario: Person names preserved
- **WHEN** compression occurs
- **THEN** person names SHALL be preserved with marker: [person:Name]

#### Scenario: Date and time preserved
- **WHEN** compression occurs
- **THEN** dates and times SHALL be preserved with marker: [date:value]

#### Scenario: Monetary values preserved
- **WHEN** compression occurs
- **THEN** amounts and percentages SHALL be preserved with marker: [amount:value]

#### Scenario: Technical terms preserved
- **WHEN** compression occurs
- **THEN** technical terms and abbreviations SHALL be preserved if they appear in critical context

### Requirement: Entity extraction before compression
The system SHALL extract entities from messages before generating summaries.

#### Scenario: Entities extracted from user message
- **WHEN** a user message is being summarized
- **THEN** entities SHALL be identified and stored separately for preservation

#### Scenario: Entities re-injected after compression
- **WHEN** summary is generated
- **THEN** preserved entities SHALL be re-injected into the compressed context
