## ADDED Requirements

### Requirement: Metadata Filter Language

The system SHALL provide a structured metadata filtering language for precise retrieval control.

#### Scenario: Filter Structure
- **WHEN** a filter is specified
- **THEN** it SHALL contain:
  - `conditions`: Array of filter conditions
  - `logical_operator`: Either "and" or "or"

#### Scenario: Equality Comparison
- **WHEN** filter condition has `operator: "eq"`
- **THEN** the system SHALL match exact equality of the field value

#### Scenario: Numeric Comparison
- **WHEN** filter condition has operators `gt`, `gte`, `lt`, `lte`
- **THEN** the system SHALL apply the corresponding numeric comparison

#### Scenario: String Contains
- **WHEN** filter condition has `operator: "contains"`
- **THEN** the system SHALL match if the field value contains the specified substring

#### Scenario: IN Operator
- **WHEN** filter condition has `operator: "in"`
- **THEN** the system SHALL match if the field value is in the provided list

#### Scenario: Timestamp Filter
- **WHEN** filtering by timestamp fields
- **THEN** the system SHALL support ISO 8601 format timestamps
- **AND** convert to Unix timestamp for comparison

### Requirement: Qdrant Filter Conversion

The system SHALL convert the internal filter DSL to Qdrant-compatible filter format.

#### Scenario: Single Condition Conversion
- **WHEN** internal filter is `{ "field": "department_id", "operator": "eq", "value": "sales" }`
- **THEN** the Qdrant filter SHALL be:
  ```json
  {
    "must": [{
      "key": "metadata.department_id",
      "match": { "value": "sales" }
    }]
  }
  ```

#### Scenario: Multiple Conditions AND
- **WHEN** internal filter has `logical_operator: "and"` with two conditions
- **THEN** the Qdrant filter SHALL use `must` array

#### Scenario: Multiple Conditions OR
- **WHEN** internal filter has `logical_operator: "or"` with two conditions
- **THEN** the Qdrant filter SHALL use `should` array
- **AND** set `minimum_should_match: 1`

### Requirement: Filter Validation

The system SHALL validate filter conditions before applying them.

#### Scenario: Valid Field Name
- **WHEN** filter references a valid metadata field name
- **THEN** the filter SHALL pass validation

#### Scenario: Invalid Operator
- **WHEN** filter uses an unsupported operator
- **THEN** the system SHALL return a validation error

#### Scenario: Empty Filter
- **WHEN** the filter conditions array is empty
- **THEN** the system SHALL skip filtering
- **AND** return all results

### Requirement: Multi-Tenant Filter Isolation

The system SHALL automatically include tenant isolation in all metadata filters.

#### Scenario: Automatic Tenant Filter
- **WHEN** any search request is made
- **THEN** the system SHALL automatically add `tenant_id` equality check
- **AND** this SHALL be combined with user-specified filters using AND logic
