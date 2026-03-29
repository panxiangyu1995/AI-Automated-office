## Context

消息系统当前仅使用本地SQLite存储，无法跨设备同步。用户换设备或使用Web版时，历史消息不可见。这与PRD"统一数据中台"的核心价值冲突。

**当前架构：**
```
本地SQLite ◄──► 前端useChatStore ◄──► UI
     │
     └── 无远程同步
```

**约束：**
- 云端cloud-server可能未完整实现
- 需支持离线优先场景
- 消息量可能很大（每日数千条）

## Goals / Non-Goals

**Goals:**
- 实现消息本地到远程的增量同步
- 支持多设备消息合并
- 冲突检测与解决
- 同步对前端透明

**Non-Goals:**
- 不实现完整的CRDT冲突解决
- 不支持实时协作编辑（仅同步）
- 不改变消息的CRUD接口

## Decisions

### Decision 1: 同步架构

**选择：** 本地优先 + 云端增量同步

**架构：**
```
本地SQLite ◄──► SyncEngine ◄──► 云端API
     │                                    │
     └── 离线优先，无网络也可使用          └── 定期同步
```

**同步时机：**
- 启动时同步一次
- 活跃期间每60秒增量同步
- 关闭时同步
- 用户手动触发同步

### Decision 2: 增量同步协议

**选择：** 基于时间戳的增量同步

**消息表变更：**
```sql
ALTER TABLE messages ADD COLUMN remote_id TEXT;
ALTER TABLE messages ADD COLUMN sync_status TEXT DEFAULT 'local';  -- local/pending/synced/conflict
ALTER TABLE messages ADD COLUMN updated_at INTEGER;
ALTER TABLE messages ADD COLUMN deleted_at INTEGER;  -- 软删除
```

**同步流程：**
```
1. 拉取：GET /api/sync/messages?since={last_sync_timestamp}
2. 合并：本地消息与远程消息合并
3. 上传：POST /api/sync/messages {new_messages}
4. 更新：更新sync_status为'synced'
```

### Decision 3: 冲突解决策略

**选择：** Last-Write-Wins + 用户确认的混合模式

**规则：**
- 同一消息本地和远程都有修改：时间戳更晚的获胜
- 冲突消息保留两份，用户手动合并
- 工具调用结果冲突：远程优先（服务器认为更权威）

**Conflict状态：**
```typescript
type ConflictType = 'content' | 'deleted';
interface MessageConflict {
  local: Message;
  remote: Message;
  conflict_type: ConflictType;
  resolved: boolean;
}
```

### Decision 4: 同步状态UI

**选择：** 静默同步 + 状态图标

**实现：**
- 同步状态不阻塞用户操作
- 顶部状态栏显示同步状态指示器
- 冲突消息显示特殊标记，点击可查看详情

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 云端API未实现 | 同步无法工作 | 优雅降级，继续本地使用 |
| 网络不稳定 | 同步失败 | 重试队列 + 指数退避 |
| 大数据量同步慢 | 用户等待 | 分页同步 + 后台处理 |
| 冲突解决复杂 | 用户困惑 | 简化冲突UI + 默认策略 |

## Migration Plan

**Phase 1: 数据模型扩展**
1. 添加sync_status等数据库字段
2. 实现迁移脚本

**Phase 2: 同步引擎基础**
1. 实现SyncManager
2. 实现DeltaSync协议
3. 实现冲突检测

**Phase 3: 云端API集成**
1. 实现后端同步API
2. 实现冲突解决API
3. 前后端联调

**Phase 4: UI和体验优化**
1. 同步状态指示器
2. 冲突处理UI
3. 手动同步按钮

**Rollback:** 数据库迁移可逆，sync_status字段可降级

## Open Questions

1. 云端API是否已实现？需确认cloud-server状态
2. 消息是否需要版本历史？（当前仅保留最新）
3. 多租户场景下如何隔离消息？
4. 是否需要支持消息的"已读"同步？
