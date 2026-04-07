# Design: 三层记忆与Runtime集成

## 技术架构

### 1. Hook事件集成

```rust
pub struct MemoryRuntimeIntegration {
    memory_service: Arc<MemoryService>,
    prompt_builder: Arc<PromptBuilder>,
}

impl MemoryRuntimeIntegration {
    // Hook: SessionStart
    pub async fn on_session_start(&self, session: &Session) -> Result<()> {
        // 加载L1个人记忆
        let personal_memories = self.memory_service
            .search_l1(&session.user_id, "recent context")
            .await?;
        
        // 注入到Prompt
        self.prompt_builder.add_context("personal_memory", personal_memories);
        Ok(())
    }
    
    // Hook: UserPromptSubmit
    pub async fn on_user_prompt(&self, prompt: &str) -> Result<Option<MemoryItem>> {
        // 分析是否需要记忆
        if self.should_remember(prompt) {
            let item = self.extract_memory_item(prompt);
            self.memory_service.add_l1(&item).await?;
            return Ok(Some(item));
        }
        Ok(None)
    }
    
    // Hook: PostToolUse
    pub async fn on_tool_result(&self, result: &ToolResult) -> Result<Option<MemoryItem>> {
        // 关键结果记忆
        if self.is_key_result(result) {
            let item = MemoryItem::from_tool_result(result);
            self.memory_service.add_l1(&item).await?;
            return Ok(Some(item));
        }
        Ok(None)
    }
    
    // Hook: Stop
    pub async fn on_session_end(&self, session: &Session) -> Result<()> {
        // 提取关键事实到L1
        let key_facts = self.extract_key_facts(&session.history);
        for fact in key_facts {
            self.memory_service.add_l1(&fact).await?;
        }
        Ok(())
    }
}
```

### 2. 检索注入

```rust
pub async fn inject_memories(&self, query: &str) -> Result<String> {
    // L1个人记忆（高优先级）
    let l1 = self.memory_service.search_l1(&self.user_id, query).await?;
    
    // L2企业知识
    let l2 = self.memory_service.search_l2(&self.tenant_id, query).await?;
    
    // 格式化注入
    let context = format!(
        "## 个人记忆\n{}\n\n## 企业知识\n{}",
        self.format_l1(l1),
        self.format_l2(l2),
    );
    
    Ok(context)
}
```

## 验收标准

1. Hook事件正确触发
2. 记忆检索结果准确
3. 关键事实正确提取
