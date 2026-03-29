# Core Tools - Shell

## ADDED Requirements

### Requirement: sandbox_execute tool
The system SHALL provide a `sandbox_execute` tool that runs predefined commands in a sandboxed environment.

#### Scenario: Execute allowed command
- **WHEN** Agent calls `sandbox_execute` with command from allowed list
- **THEN** system SHALL execute command and return output

#### Scenario: Execute disallowed command
- **WHEN** Agent calls `sandbox_execute` with command not in allowed list
- **THEN** system SHALL return error with code `PermissionDenied`

#### Scenario: Execute with arguments
- **WHEN** Agent calls `sandbox_execute` with allowed command and arguments
- **THEN** system SHALL execute command with arguments and return output

### Requirement: pattern_search tool
The system SHALL provide a `pattern_search` tool that searches for patterns in files.

#### Scenario: Search with regex pattern
- **WHEN** Agent calls `pattern_search` with valid regex pattern and path
- **THEN** system SHALL return matching lines with line numbers

#### Scenario: Search with invalid regex
- **WHEN** Agent calls `pattern_search` with invalid regex pattern
- **THEN** system SHALL return error with code `ValidationError`

#### Scenario: Search in directory
- **WHEN** Agent calls `pattern_search` with directory path
- **THEN** system SHALL recursively search all files in directory

## Security Requirements

### Requirement: Command whitelist
The sandbox_execute tool SHALL only allow execution of predefined commands.

### Requirement: Argument validation
The sandbox_execute tool SHALL validate all arguments to prevent command injection.

### Requirement: Output size limit
The shell tools SHALL limit output size to prevent resource exhaustion.
