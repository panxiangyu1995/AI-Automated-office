# MVP Final Integration Tests

## Overview

Task 165 - MVP最终集成测试

## Test Coverage

### 1. Department Module Integration
- HR Department CRUD operations
- Approval workflow end-to-end
- Sales module data flow
- Finance module integration

### 2. Agent Runtime Integration
- SubAgent delegation
- Skill execution
- MCP tool integration
- Message routing

### 3. Permission System Integration
- Role-based access control
- Department-level permissions
- Field-level access filtering

### 4. Notification System Integration
- Real-time notification delivery
- Multi-channel notifications (in-app, email, webhook)

## Test Structure

```
tests/
├── integration/
│   ├── mvp/
│   │   ├── department-integration.test.ts
│   │   ├── agent-runtime-integration.test.ts
│   │   ├── permission-integration.test.ts
│   │   └── notification-integration.test.ts
│   └── smoke/
│       └── mvp-smoke.spec.ts
```

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run MVP smoke tests
npm run test:e2e -- --grep "mvp"

# Run specific test
npm run test:integration -- --grep "department"
```

## Status

- [ ] Department module integration tests
- [ ] Agent runtime integration tests
- [ ] Permission system integration tests
- [ ] Notification system integration tests
- [ ] End-to-end smoke tests