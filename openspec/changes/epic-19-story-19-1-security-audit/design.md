# Design: Security 安全审计基础架构

## Context

实现安全审计基础能力，追踪用户关键操作。

## Goals / Non-Goals

### Goals

- [x] 实现审计日志记录
- [x] 实现审计日志查询
- [x] 实现敏感操作标记

### Non-Goals

- [ ] 实时威胁检测（Story 19.4）
- [ ] 自动告警

## Decisions

### 1. 数据库Schema

```sql
CREATE TABLE security_audit_logs (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
    ip_address TEXT,
    user_agent TEXT,
    details TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL,
    
    INDEX idx_audit_user ON security_audit_logs(user_id),
    INDEX idx_audit_time ON security_audit_logs(created_at DESC),
    INDEX idx_audit_type ON security_audit_logs(event_type),
    INDEX idx_audit_resource ON security_audit_logs(resource_type, resource_id)
);
```

### 2. 审计事件类型

```typescript
type AuditEventType = 
  | 'login' | 'logout' 
  | 'create' | 'update' | 'delete'
  | 'view' | 'export' | 'import'
  | 'permission_change' | 'config_change'
  | 'api_call' | 'data_access';
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 审计日志量大 | 使用分区表和定期归档 |
| 查询性能 | 使用索引优化和分页 |
