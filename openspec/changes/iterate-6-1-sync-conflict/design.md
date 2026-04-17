# 设计：同步冲突解决策略

## 冲突解决策略枚举

```go
// ConflictResolutionStrategy 冲突解决策略
type ConflictResolutionStrategy string

const (
    StrategyLastWriteWins ConflictResolutionStrategy = "last_write_wins"  // 以最新为准
    StrategyServerWins   ConflictResolutionStrategy = "server_wins"      // 服务端优先
    StrategyClientWins    ConflictResolutionStrategy = "client_wins"     // 客户端优先
    StrategyManual       ConflictResolutionStrategy = "manual"          // 手动解决
)
```

## 冲突元数据

```go
// ConflictMeta 冲突元数据
type ConflictMeta struct {
    EntityType  string
    EntityID    string
    LocalVersion int64
    ServerVersion int64
    LocalTimestamp time.Time
    ServerTimestamp time.Time
    ConflictStrategy ConflictResolutionStrategy
}
```

## 冲突解决器接口

```go
// ConflictResolver 冲突解决器接口
type ConflictResolver interface {
    Resolve(ctx context.Context, conflict *Conflict) (*ResolvedConflict, error)
    Detect(local, server *EntityVersion) bool
}
```
