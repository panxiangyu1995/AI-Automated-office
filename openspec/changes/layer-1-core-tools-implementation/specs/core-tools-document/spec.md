# Core Tools - Document

## ADDED Requirements

### Requirement: document_parse tool
The system SHALL provide a `document_parse` tool that extracts content from documents.

#### Scenario: Parse text file
- **WHEN** Agent calls `document_parse` with path to text file (.txt, .md)
- **THEN** system SHALL return file content as plain text

#### Scenario: Parse PDF file
- **WHEN** Agent calls `document_parse` with path to PDF file
- **THEN** system SHALL extract text content from PDF

#### Scenario: Parse with structure extraction
- **WHEN** Agent calls `document_parse` with path and structure_hint
- **THEN** system SHALL return content with structure markers

### Requirement: document_convert tool
The system SHALL provide a `document_convert` tool that converts documents between formats.

#### Scenario: Convert Markdown to HTML
- **WHEN** Agent calls `document_convert` with input path and output format HTML
- **THEN** system SHALL convert content and save as HTML

#### Scenario: Convert with template
- **WHEN** Agent calls `document_convert` with input path, output format, and template
- **THEN** system SHALL apply template and convert content

## Supported Formats

### Requirement: Text format support
The document tools SHALL support plain text formats: .txt, .md, .rst

### Requirement: Structured format support
The document tools SHALL support structured formats: .json, .yaml, .toml

### Requirement: Office format support
The document tools SHALL support office formats: .docx (read-only)
