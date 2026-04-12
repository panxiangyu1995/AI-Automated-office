# 设计文档: Agent模块-TODO清理与调试代码移除

## 1. 问题分析

### 1.1 TODO 遗留

| 文件 | 行号 | 描述 | 优先级 | 工作量 |
|------|------|------|--------|--------|
| intercom/mod.rs | 120 | 内容安全检查 | 高 | 中 |
| intercom/service.rs | 292 | 内容安全检查 | 高 | 中 |
| message_sync.rs | 134 | 实际同步逻辑 | 高 | 大 |
| heartbeat/delivery.rs | 53 | HTTP客户端 | 中 | 小 |

### 1.2 调试代码

| 位置 | 数量 | 类型 |
|------|------|------|
| useAgentRuntime.ts | 3 | console.log |
| AgentChatPanel.tsx | 1 | console.log |
| FailoverSessionRepair.tsx | 2 | console.log |
| ErrorClassificationGuidance.tsx | 3 | console.log |
| ScheduledTaskCenter.tsx | 3 | console.log |
| manager.rs | 1 | println! |
| loader.rs | 1 | eprintln! |

## 2. 解决方案

### 2.1 TODO 实现

#### 内容安全检查

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

#### 消息同步逻辑

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

### 2.2 调试代码移除

**Frontend console.log**:

```typescript
// 之前
console.log('[AgentRuntime] User message confirmed:', event.messageId)

// 之后 - 生产环境移除
if (import.meta.env.DEV) {
  console.log('[AgentRuntime] User message confirmed:', event.messageId)
}
```

**Backend println!**:

```rust
// 之前
println!("Matched: {:?}", matched.len());

// 之后 - 使用日志
tracing::debug!("Matched subagents: {:?}", matched.len());
```

## 3. 验收标准

- [ ] intercom/mod.rs 内容安全检查实现
- [ ] intercom/service.rs 内容安全检查实现
- [ ] message_sync.rs 实际同步逻辑实现
- [ ] heartbeat/delivery.rs HTTP客户端实现
- [ ] 前端 console.log 移除或条件化
- [ ] 后端 println!/eprintln! 移除或使用日志
- [ ] npm run lint 无 console.log
- [ ] cargo clippy 无警告
