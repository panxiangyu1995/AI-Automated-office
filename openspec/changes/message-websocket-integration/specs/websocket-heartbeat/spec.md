## ADDED Requirements

### Requirement: Client heartbeat mechanism
The system SHALL send ping messages every 30 seconds to keep the WebSocket connection alive.

#### Scenario: Heartbeat ping sent periodically
- **WHEN** WebSocket connection is active
- **THEN** a ping message SHALL be sent every 30 seconds

#### Scenario: No heartbeat response triggers reconnect
- **WHEN** a ping is sent and no pong is received within 10 seconds
- **THEN** the connection SHALL be considered dead and reconnection SHALL be triggered

### Requirement: Server heartbeat response
The system SHALL respond to server-initiated pings with appropriate pong messages.

#### Scenario: Server ping triggers client pong
- **WHEN** a ping is received from the server
- **THEN** a pong response SHALL be sent within 1 second
