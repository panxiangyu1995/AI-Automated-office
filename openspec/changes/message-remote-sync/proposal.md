## Why

当前消息仅存储在本地SQLite，无法跨设备同步。用户更换设备或使用Web版本时，历史消息不可见。这与PRD中"统一数据中台，打破数据孤岛"的核心价值主张相悖。

## What Changes

- 实现消息从本地SQLite到云端服务器的增量同步
- 添加同步状态管理（pending/synced/conflict）
- 实现基于时间戳的增量同步协议
- 添加冲突检测与解决策略
- 同步操作对前端透明，不影响现有UI

## Capabilities

### New Capabilities
- `message-sync-engine`: 消息同步引擎，管理本地与远程的消息状态
- `message-delta-sync`: 增量同步协议，仅同步差异部分
- `sync-conflict-resolution`: 冲突检测与解决策略（last-write-wins + 手动合并）
- `sync-status-tracking`: 同步状态跟踪（pending/synced/conflict/error）

### Modified Capabilities
- (无 - 同步不改变消息本身的能力，仅扩展存储层)

## Impact

**前端：**
- `src/features/streaming/runtime/syncEngine.ts` - 扩展支持远程同步
- 新增`src/features/sync/runtime/syncManager.ts` - 同步状态管理
- `src/features/agent/hooks/useChatStore.ts` - 同步状态与消息关联

**后端 (Rust)：**
- `src-tauri/src/sync/` - 同步引擎
- `src-tauri/src/storage/message_store.rs` - 添加同步标记字段

**云端 (Go)：**
- `cloud-server/api/sync.go` - 消息同步API
- `cloud-server/services/sync_service.go` - 同步业务逻辑

**依赖：**
- 需要云端API支持（需确认cloud-server已实现）
- 消息表需添加`sync_status`、`remote_id`、`updated_at`字段
