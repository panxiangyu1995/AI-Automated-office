## ADDED Requirements

### Requirement: Conversation summary generation
The system SHALL generate concise summaries of conversation rounds, preserving key information in compressed form.

#### Scenario: Middle rounds summarized
- **WHEN** compression is triggered for rounds 11-N
- **THEN** each round SHALL be summarized to 1-2 sentences capturing the essence

#### Scenario: Summary preserves user intent
- **WHEN** summarizing a user message
- **THEN** the user's primary intent SHALL be preserved

#### Scenario: Summary preserves AI solutions
- **WHEN** summarizing an AI response
- **THEN** key solutions and answers SHALL be preserved

### Requirement: Summary format for LLM
The system SHALL generate summaries in a format suitable for inclusion in LLM context.

#### Scenario: Summary uses clear markers
- **WHEN** summary is generated
- **THEN** it SHALL be wrapped with [[SUMMARY]] markers for LLM to identify

#### Scenario: Summary is concise
- **WHEN** summary is generated
- **THEN** it SHALL be no more than 20% of the original token count
