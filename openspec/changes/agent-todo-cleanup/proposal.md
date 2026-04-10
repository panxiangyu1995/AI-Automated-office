# Agent模块TODO清理与调试代码移除

## Overview

清理Agent模块中的TODO遗留(4处)和调试代码(console.log/println 13处)，提升代码完成度。

## Motivation

代码扫描发现以下问题需要清理：
1. **TODO遗留(4处)**: 关键功能未实现
2. **调试代码(13处)**: 影响生产环境性能和日志

## Files to Modify

### TODO清理
- `src-tauri/src/agent/intercom/mod.rs:120` - 内容安全检查
- `src-tauri/src/agent/intercom/service.rs:292` - 内容安全检查
- `src-tauri/src/agent/message_sync.rs:134` - 实际同步逻辑
- `src-tauri/src/agent/heartbeat/delivery.rs:53` - HTTP客户端

### 调试代码移除
**Frontend**:
- `src/features/agent/hooks/useAgentRuntime.ts` (3处)
- `src/features/agent/components/AgentChatPanel.tsx` (1处)
- `src/features/agent/components/FailoverSessionRepair.tsx` (2处)
- `src/features/agent/components/ErrorClassificationGuidance.tsx` (3处)
- `src/features/agent/components/ScheduledTaskCenter.tsx` (3处)

**Backend**:
- `src-tauri/src/agent/subagent/manager.rs` (1处)
- `src-tauri/src/agent/config/loader.rs` (1处)

## Specification

### 1. TODO实现优先级

| TODO | 优先级 | 工作量 |
|------|--------|--------|
| 内容安全检查 | 高 | 中 |
| 消息同步逻辑 | 高 | 大 |
| HTTP客户端 | 中 | 小 |

### 2. 内容安全检查实现

**位置**: `intercom/mod.rs` 和 `intercom/service.rs`

```rust
pub async fn check_content_safety(&self, content: &str) -> Result<ContentSafetyResult> {
    // 1. 检查敏感词库
    if self.contains_blocked_keywords(content) {
        return Ok(ContentSafetyResult {
            safe: false,
            reason: Some("Contains blocked content".to_string()),
            flagged: true,
        });
    }
    
    // 2. 检查长度限制
    if content.len() > MAX_CONTENT_LENGTH {
        return Ok(ContentSafetyResult {
            safe: false,
            reason: Some("Content exceeds length limit".to_string()),
            flagged: true,
        });
    }
    
    Ok(ContentSafetyResult {
        safe: true,
        reason: None,
        flagged: false,
    })
}
```

### 3. 消息同步逻辑实现

**位置**: `message_sync.rs`

```rust
pub async fn sync_messages(&self, session_id: &str) -> Result<SyncResult> {
    // 1. 获取本地未同步消息
    let local_messages = self.get_unsynced_messages(session_id).await?;
    
    // 2. 上传到服务器
    for msg in local_messages {
        self.upload_message(&msg).await?;
        self.mark_synced(&msg.id).await?;
    }
    
    // 3. 获取远程新消息
    let remote_messages = self.fetch_remote_messages(session_id).await?;
    
    // 4. 合并到本地
    self.merge_messages(session_id, remote_messages).await?;
    
    Ok(SyncResult {
        uploaded: local_messages.len(),
        downloaded: remote_messages.len(),
    })
}
```

### 4. 调试代码替换

**Frontend console.log → 移除或改为条件编译**

```typescript
// 之前
console.log('[AgentRuntime] User message confirmed:', event.messageId)

// 之后 - 生产环境移除
if (import.meta.env.DEV) {
  console.log('[AgentRuntime] User message confirmed:', event.messageId)
}
```

**Backend println! → 移除或使用日志框架**

```rust
// 之前
println!("Matched: {:?}", matched.len());

// 之后 - 使用日志
tracing::debug!("Matched subagents: {:?}", matched.len());
```

---

## Testing

1. `npm run lint` - 验证无console.log
2. `cargo clippy` - 验证无println!
3. 功能测试 - 验证TODO实现的功能正常工作
