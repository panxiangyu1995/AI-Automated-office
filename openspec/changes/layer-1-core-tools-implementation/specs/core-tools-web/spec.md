# Core Tools - Web

## ADDED Requirements

### Requirement: web_search tool
The system SHALL provide a `web_search` tool that performs web searches using configured provider.

#### Scenario: Search with default provider
- **WHEN** Agent calls `web_search` with query
- **THEN** system SHALL use configured default provider and return results

#### Scenario: Search with specified provider
- **WHEN** Agent calls `web_search` with query and provider_id
- **THEN** system SHALL use specified provider and return results

#### Scenario: Search without API key
- **WHEN** Agent calls `web_search` and no provider is configured
- **THEN** system SHALL return error with code `ConfigurationError`

### Requirement: web_fetch tool
The system SHALL provide a `web_fetch` tool that fetches web page content.

#### Scenario: Fetch valid URL
- **WHEN** Agent calls `web_fetch` with valid URL
- **THEN** system SHALL return page content as text

#### Scenario: Fetch with extraction rules
- **WHEN** Agent calls `web_fetch` with URL and extraction rules
- **THEN** system SHALL return extracted content matching rules

#### Scenario: Fetch invalid URL
- **WHEN** Agent calls `web_fetch` with invalid URL
- **THEN** system SHALL return error with code `ValidationError`

#### Scenario: Fetch blocked by robots.txt
- **WHEN** Agent calls `web_fetch` for page blocked by robots.txt
- **THEN** system SHALL return error with code `PermissionDenied`

### Requirement: http_request tool
The system SHALL provide an `http_request` tool that sends HTTP requests.

#### Scenario: GET request
- **WHEN** Agent calls `http_request` with method GET and URL
- **THEN** system SHALL return response with status and body

#### Scenario: POST request with JSON body
- **WHEN** Agent calls `http_request` with method POST, URL, and JSON body
- **THEN** system SHALL send request and return response

#### Scenario: Request with custom headers
- **WHEN** Agent calls `http_request` with custom headers
- **THEN** system SHALL include headers in request

#### Scenario: Request timeout
- **WHEN** Agent calls `http_request` and request times out
- **THEN** system SHALL return error with code `Timeout`

#### Scenario: Request to blocked domain
- **WHEN** Agent calls `http_request` to domain not in allowed list
- **THEN** system SHALL return error with code `PermissionDenied`

## Configuration Requirements

### Requirement: Web search provider selection
The web_search tool SHALL support multiple providers: Brave, Google (Gemini), Perplexity, Tavily.

### Requirement: Provider API key configuration
Each web search provider SHALL require API key configuration.

### Requirement: HTTP allowed domains
The http_request tool SHALL support configurable allowed domain list.
