# Core Tools - Filesystem

## ADDED Requirements

### Requirement: file_read tool
The system SHALL provide a `file_read` tool that reads file contents from allowed directories.

#### Scenario: Read existing file
- **WHEN** Agent calls `file_read` with valid path within allowed directories
- **THEN** system SHALL return file contents as string

#### Scenario: Read non-existent file
- **WHEN** Agent calls `file_read` with non-existent path
- **THEN** system SHALL return error with code `NotFound`

#### Scenario: Read outside allowed directory
- **WHEN** Agent calls `file_read` with path outside allowed directories
- **THEN** system SHALL return error with code `PermissionDenied`

### Requirement: file_write tool
The system SHALL provide a `file_write` tool that writes content to files in allowed directories.

#### Scenario: Write new file
- **WHEN** Agent calls `file_write` with valid path and content
- **THEN** system SHALL create file and return success

#### Scenario: Write to existing file
- **WHEN** Agent calls `file_write` with path to existing file
- **THEN** system SHALL overwrite file and return success

#### Scenario: Write outside allowed directory
- **WHEN** Agent calls `file_write` with path outside allowed directories
- **THEN** system SHALL return error with code `PermissionDenied`

### Requirement: file_edit tool
The system SHALL provide a `file_edit` tool that performs partial file modifications.

#### Scenario: Edit file with match
- **WHEN** Agent calls `file_edit` with valid path, old_text, and new_text
- **THEN** system SHALL replace first occurrence of old_text with new_text

#### Scenario: Edit file with no match
- **WHEN** Agent calls `file_edit` with old_text not found in file
- **THEN** system SHALL return error with code `ValidationError`

### Requirement: dir_list tool
The system SHALL provide a `dir_list` tool that lists directory contents.

#### Scenario: List existing directory
- **WHEN** Agent calls `dir_list` with valid directory path
- **THEN** system SHALL return list of entries with name and type (file/dir)

#### Scenario: List non-existent directory
- **WHEN** Agent calls `dir_list` with non-existent path
- **THEN** system SHALL return error with code `NotFound`

#### Scenario: List with pattern filter
- **WHEN** Agent calls `dir_list` with valid path and pattern
- **THEN** system SHALL return only entries matching pattern

## Security Requirements

### Requirement: Directory restriction
The filesystem tools SHALL restrict all operations to configured allowed directories.

### Requirement: File size limit
The filesystem tools SHALL reject files exceeding configured max_file_size.

### Requirement: Path traversal prevention
The filesystem tools SHALL prevent path traversal attacks (e.g., ../../etc/passwd).
