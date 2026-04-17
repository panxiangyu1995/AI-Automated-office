# 设计：数据同步 API

## 同步端点

```
POST /api/v1/sync/push    - 推送本地变更到云端
POST /api/v1/sync/pull    - 从云端拉取变更
POST /api/v1/sync/delta   - 增量同步
GET  /api/v1/sync/status  - 获取同步状态
```

## 同步数据结构

```go
type SyncRequest struct {
    ClientVersion  int64           // 客户端版本号
    LastSyncTime   time.Time       // 上次同步时间
    Changes        []EntityChange  // 变更列表
    DeviceID       string          // 设备ID
}

type EntityChange struct {
    EntityType string      // 实体类型
    EntityID   string      // 实体ID
    Operation  string      // 操作：create/update/delete
    Data       interface{} // 数据
    Timestamp  time.Time   // 时间戳
    Version    int64      // 版本号
}
```
