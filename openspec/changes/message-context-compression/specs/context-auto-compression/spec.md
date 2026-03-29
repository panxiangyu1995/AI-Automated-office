## ADDED Requirements

### Requirement: Automatic context compression threshold
The system SHALL automatically trigger context compression when either message count exceeds 50 OR token count exceeds 32000.

#### Scenario: Message count threshold triggers compression
- **WHEN** user message causes context to exceed 50 messages
- **THEN** compression SHALL be triggered before the next LLM call

#### Scenario: Token count threshold triggers compression
- **WHEN** context token count exceeds 32000
- **THEN** compression SHALL be triggered before the next LLM call

### Requirement: Compression preserves recent context
The system SHALL preserve the most recent 10 conversation rounds fully intact during compression.

#### Scenario: Recent rounds kept intact
- **WHEN** compression is triggered
- **THEN** the most recent 10 user-AI conversation rounds SHALL NOT be compressed

#### Scenario: Middle rounds compressed
- **WHEN** compression is triggered
- **THEN** conversation rounds 11-N SHALL be summarized into a compact form
