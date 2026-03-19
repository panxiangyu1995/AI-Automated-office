# Design: Structured Audit Log Model

## 技术方案

### 数据库设计

```sql
-- 审计日志表
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    trace_id VARCHAR(36),                    -- 链路追踪 ID
    
    -- 操作人信息
    operator_id VARCHAR(36) NOT NULL,        -- 操作人 ID
    operator_type VARCHAR(20) NOT NULL,      -- user, system, agent
    operator_ip VARCHAR(45),                 -- 操作人 IP
    
    -- 目标信息
    target_id VARCHAR(36),                   -- 目标对象 ID
    target_type VARCHAR(50),                 -- user, role, department, etc.
    
    -- 事件信息
    event_type VARCHAR(50) NOT NULL,         -- 事件类型
    resource VARCHAR(50) NOT NULL,           -- 资源类型
    action VARCHAR(50) NOT NULL,             -- 操作动作
    result VARCHAR(20) NOT NULL,             -- success, failure, partial
    reason TEXT,                             -- 原因说明
    
    -- 详细信息
    details JSON,                            -- 详细信息
    old_values JSON,                         -- 变更前值
    new_values JSON,                         -- 变更后值
    
    -- 元数据
    user_agent TEXT,
    request_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_time (tenant_id, created_at),
    INDEX idx_operator (operator_id),
    INDEX idx_target (target_id, target_type),
    INDEX idx_event (event_type),
    INDEX idx_trace (trace_id)
);

-- 分区表（按月分区，用于大数据量）
-- CREATE TABLE audit_logs_202603 PARTITION OF audit_logs
--     FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### 核心接口设计

#### 1. 审计日志实体

```go
// AuditLog 审计日志实体
type AuditLog struct {
    ID           string                 `gorm:"primaryKey"`
    TenantID     string                 `gorm:"index:idx_tenant_time"`
    TraceID      string                 `gorm:"index"`
    
    // 操作人信息
    OperatorID   string                 `gorm:"index"`
    OperatorType OperatorType           // user, system, agent
    OperatorIP   string
    
    // 目标信息
    TargetID     string                 `gorm:"index:idx_target"`
    TargetType   string                 `gorm:"index:idx_target"`
    
    // 事件信息
    EventType    EventType              `gorm:"index"`
    Resource     string                 `gorm:"index"`
    Action       string
    Result       ResultType
    Reason       string
    
    // 详细信息
    Details      map[string]interface{} `gorm:"type:json"`
    OldValues    map[string]interface{} `gorm:"type:json"`
    NewValues    map[string]interface{} `gorm:"type:json"`
    
    // 元数据
    UserAgent    string
    RequestID    string
    CreatedAt    time.Time              `gorm:"index:idx_tenant_time"`
}

// OperatorType 操作人类型
type OperatorType string

const (
    OperatorTypeUser   OperatorType = "user"    // 用户操作
    OperatorTypeSystem OperatorType = "system"  // 系统操作
    OperatorTypeAgent  OperatorType = "agent"   // AI Agent 操作
)

// ResultType 结果类型
type ResultType string

const (
    ResultSuccess ResultType = "success"   // 成功
    ResultFailure ResultType = "failure"   // 失败
    ResultPartial ResultType = "partial"   // 部分成功
)

// EventType 事件类型
type EventType string

const (
    // 认证事件
    EventAuthLogin        EventType = "auth.login"
    EventAuthLogout       EventType = "auth.logout"
    EventAuthRefresh      EventType = "auth.refresh"
    EventAuthSessionRevoke EventType = "auth.session.revoke"
    
    // 用户管理事件
    EventUserCreate       EventType = "user.create"
    EventUserUpdate       EventType = "user.update"
    EventUserDelete       EventType = "user.delete"
    EventUserEnable       EventType = "user.enable"
    EventUserDisable      EventType = "user.disable"
    
    // 部门管理事件
    EventDeptCreate       EventType = "dept.create"
    EventDeptUpdate       EventType = "dept.update"
    EventDeptDelete       EventType = "dept.delete"
    
    // 权限管理事件
    EventRoleCreate       EventType = "role.create"
    EventRoleUpdate       EventType = "role.update"
    EventRoleDelete       EventType = "role.delete"
    EventPermissionGrant  EventType = "permission.grant"
    EventPermissionRevoke EventType = "permission.revoke"
    
    // 导入导出事件
    EventImportPreview    EventType = "import.preview"
    EventImportCommit     EventType = "import.commit"
    EventExport           EventType = "export.execute"
)
```

#### 2. 审计服务接口

```go
// AuditService 审计服务接口
type AuditService interface {
    // Log 记录审计日志
    Log(ctx context.Context, log *AuditLog) error
    
    // LogBatch 批量记录审计日志
    LogBatch(ctx context.Context, logs []*AuditLog) error
    
    // Query 查询审计日志
    Query(ctx context.Context, query *AuditQuery) ([]*AuditLog, int64, error)
    
    // GetByTraceID 根据 TraceID 获取日志链
    GetByTraceID(ctx context.Context, traceID string) ([]*AuditLog, error)
}

// AuditQuery 审计查询条件
type AuditQuery struct {
    TenantID    string
    OperatorID  string
    TargetID    string
    TargetType  string
    EventType   EventType
    Result      ResultType
    StartTime   time.Time
    EndTime     time.Time
    Keyword     string
    Page        int
    PageSize    int
}
```

#### 3. 审计写入器

```go
// AuditLogger 审计写入器
type AuditLogger struct {
    repo        AuditLogRepository
    queue       chan *AuditLog
    batchSize   int
    flushPeriod time.Duration
}

// NewAuditLogger 创建审计写入器
func NewAuditLogger(repo AuditLogRepository, opts ...Option) *AuditLogger {
    logger := &AuditLogger{
        repo:        repo,
        queue:       make(chan *AuditLog, 10000),
        batchSize:   100,
        flushPeriod: 5 * time.Second,
    }
    
    for _, opt := range opts {
        opt(logger)
    }
    
    // 启动后台写入协程
    go logger.runBatchWriter()
    
    return logger
}

// Log 记录审计日志（异步）
func (l *AuditLogger) Log(ctx context.Context, log *AuditLog) error {
    select {
    case l.queue <- log:
        return nil
    default:
        // 队列满时同步写入
        return l.repo.Create(ctx, log)
    }
}

// LogSync 同步记录审计日志
func (l *AuditLogger) LogSync(ctx context.Context, log *AuditLog) error {
    return l.repo.Create(ctx, log)
}

// runBatchWriter 批量写入协程
func (l *AuditLogger) runBatchWriter() {
    ticker := time.NewTicker(l.flushPeriod)
    defer ticker.Stop()
    
    batch := make([]*AuditLog, 0, l.batchSize)
    
    for {
        select {
        case log := <-l.queue:
            batch = append(batch, log)
            if len(batch) >= l.batchSize {
                l.flushBatch(batch)
                batch = make([]*AuditLog, 0, l.batchSize)
            }
        case <-ticker.C:
            if len(batch) > 0 {
                l.flushBatch(batch)
                batch = make([]*AuditLog, 0, l.batchSize)
            }
        }
    }
}

// flushBatch 刷新批次
func (l *AuditLogger) flushBatch(batch []*AuditLog) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    if err := l.repo.CreateBatch(ctx, batch); err != nil {
        log.Printf("Failed to write audit logs batch: %v", err)
    }
}
```

#### 4. 审计日志构建器

```go
// AuditLogBuilder 审计日志构建器
type AuditLogBuilder struct {
    log *AuditLog
}

// NewAuditLogBuilder 创建构建器
func NewAuditLogBuilder() *AuditLogBuilder {
    return &AuditLogBuilder{
        log: &AuditLog{
            ID:        uuid.New().String(),
            CreatedAt: time.Now(),
        },
    }
}

// WithTenant 设置租户
func (b *AuditLogBuilder) WithTenant(tenantID string) *AuditLogBuilder {
    b.log.TenantID = tenantID
    return b
}

// WithOperator 设置操作人
func (b *AuditLogBuilder) WithOperator(userID string, operatorType OperatorType, ip string) *AuditLogBuilder {
    b.log.OperatorID = userID
    b.log.OperatorType = operatorType
    b.log.OperatorIP = ip
    return b
}

// WithTarget 设置目标
func (b *AuditLogBuilder) WithTarget(targetID, targetType string) *AuditLogBuilder {
    b.log.TargetID = targetID
    b.log.TargetType = targetType
    return b
}

// WithEvent 设置事件
func (b *AuditLogBuilder) WithEvent(eventType EventType, resource, action string) *AuditLogBuilder {
    b.log.EventType = eventType
    b.log.Resource = resource
    b.log.Action = action
    return b
}

// WithResult 设置结果
func (b *AuditLogBuilder) WithResult(result ResultType, reason string) *AuditLogBuilder {
    b.log.Result = result
    b.log.Reason = reason
    return b
}

// WithDetails 设置详情
func (b *AuditLogBuilder) WithDetails(details map[string]interface{}) *AuditLogBuilder {
    b.log.Details = details
    return b
}

// WithChanges 设置变更
func (b *AuditLogBuilder) WithChanges(oldValues, newValues map[string]interface{}) *AuditLogBuilder {
    b.log.OldValues = oldValues
    b.log.NewValues = newValues
    return b
}

// WithTrace 设置链路追踪
func (b *AuditLogBuilder) WithTrace(traceID string) *AuditLogBuilder {
    b.log.TraceID = traceID
    return b
}

// Build 构建
func (b *AuditLogBuilder) Build() *AuditLog {
    return b.log
}

// 使用示例
func Example(logger *AuditLogger) {
    log := NewAuditLogBuilder().
        WithTenant("tenant-001").
        WithOperator("user-001", OperatorTypeUser, "192.168.1.1").
        WithTarget("user-002", "user").
        WithEvent(EventUserUpdate, "users", "update_profile").
        WithResult(ResultSuccess, "").
        WithChanges(
            map[string]interface{}{"name": "张三"},
            map[string]interface{}{"name": "李四"},
        ).
        WithTrace("trace-001").
        Build()
    
    logger.Log(context.Background(), log)
}
```

### 中间件集成

```go
// AuditMiddleware 审计中间件
func AuditMiddleware(logger *AuditLogger) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 生成 TraceID
        traceID := uuid.New().String()
        c.Set("trace_id", traceID)
        
        // 记录请求开始时间
        start := time.Now()
        
        c.Next()
        
        // 记录审计日志（仅记录写操作）
        if c.Request.Method != "GET" {
            log := &AuditLog{
                ID:           uuid.New().String(),
                TenantID:     c.GetString("tenant_id"),
                TraceID:      traceID,
                OperatorID:   c.GetString("user_id"),
                OperatorType: OperatorTypeUser,
                OperatorIP:   c.ClientIP(),
                Resource:     extractResource(c.Request.URL.Path),
                Action:       strings.ToLower(c.Request.Method),
                Result:       getResultFromStatus(c.Writer.Status()),
                UserAgent:    c.Request.UserAgent(),
                RequestID:    traceID,
                CreatedAt:    start,
            }
            
            logger.Log(c.Request.Context(), log)
        }
    }
}
```

## 性能考虑

1. **异步写入**: 使用队列缓冲，批量写入数据库
2. **索引优化**: 在常用查询字段上建立索引
3. **分区表**: 大数据量时按月分区
4. **归档策略**: 定期归档历史数据

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│  Auth Module  │────►│ Audit Logger  │
│  User Module  │     │   (本模块)    │
│  Role Module  │     └───────────────┘
└───────────────┘             │
                              ▼
                      ┌───────────────┐
                      │ Audit Log Repo│
                      │   (数据库)    │
                      └───────────────┘
```