# Core Tools - Browser

## ADDED Requirements

### Requirement: browser_interact tool
The system SHALL provide a `browser_interact` tool that controls a browser via CDP (Chrome DevTools Protocol).

#### Scenario: Get browser status
- **WHEN** Agent calls `browser_interact` with action=status
- **THEN** system SHALL return browser running status, profile info

#### Scenario: Start browser
- **WHEN** Agent calls `browser_interact` with action=start
- **THEN** system SHALL start browser and return status

#### Scenario: Stop browser
- **WHEN** Agent calls `browser_interact` with action=stop
- **THEN** system SHALL stop browser and return status

### Requirement: Browser tab management
The browser_interact tool SHALL support tab operations.

#### Scenario: Open new tab
- **WHEN** Agent calls `browser_interact` with action=open and url
- **THEN** system SHALL open new tab with URL and return tab info

#### Scenario: List tabs
- **WHEN** Agent calls `browser_interact` with action=tabs
- **THEN** system SHALL return list of open tabs

#### Scenario: Close tab
- **WHEN** Agent calls `browser_interact` with action=close and targetId
- **THEN** system SHALL close specified tab

### Requirement: Browser navigation
The browser_interact tool SHALL support page navigation.

#### Scenario: Navigate to URL
- **WHEN** Agent calls `browser_interact` with action=navigate and url
- **THEN** system SHALL navigate to URL in specified tab

#### Scenario: Get current URL
- **WHEN** Agent calls `browser_interact` with action=snapshot
- **THEN** system SHALL return current page snapshot with URL

### Requirement: Browser screenshot
The browser_interact tool SHALL support screenshot capture.

#### Scenario: Take full page screenshot
- **WHEN** Agent calls `browser_interact` with action=screenshot and fullPage=true
- **THEN** system SHALL capture and return full page screenshot

#### Scenario: Take element screenshot
- **WHEN** Agent calls `browser_interact` with action=screenshot and element ref
- **THEN** system SHALL capture and return element screenshot

### Requirement: Browser page snapshot
The browser_interact tool SHALL support DOM snapshot.

#### Scenario: Get aria snapshot
- **WHEN** Agent calls `browser_interact` with action=snapshot and format=aria
- **THEN** system SHALL return accessible DOM tree with refs

#### Scenario: Get ai snapshot
- **WHEN** Agent calls `browser_interact` with action=snapshot and format=ai
- **THEN** system SHALL return AI-optimized page summary

### Requirement: Browser act operations
The browser_interact tool SHALL support user interaction operations.

#### Scenario: Click element
- **WHEN** Agent calls `browser_interact` with action=act and kind=click
- **THEN** system SHALL perform click on element

#### Scenario: Type text
- **WHEN** Agent calls `browser_interact` with action=act and kind=type
- **THEN** system SHALL type text into element

#### Scenario: Press key
- **WHEN** Agent calls `browser_interact` with action=act and kind=press
- **THEN** system SHALL press specified key

#### Scenario: Submit form
- **WHEN** Agent calls `browser_interact` with action=act, kind=type and submit=true
- **THEN** system SHALL type text and submit form

## Architecture Requirements

### Requirement: Playwright CDP integration
The browser tool SHALL use Playwright as the CDP client implementation.

### Requirement: Profile isolation
The browser tool SHALL support multiple profiles for isolation.

### Requirement: Browser process management
The browser tool SHALL manage browser lifecycle (start/stop/status).
