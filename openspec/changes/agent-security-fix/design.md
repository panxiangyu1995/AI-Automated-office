# Agent模块安全漏洞修复 - 设计文档

## 1. XSS漏洞修复设计

### 1.1 问题分析

**文件**: `src/features/agent/components/ChatMessage.tsx:80`

```tsx
dangerouslySetInnerHTML={{ __html: rendered }}
```

**风险**: 如果markdown渲染器输出包含用户输入的未转义内容，可能导致XSS攻击。

### 1.2 修复方案

#### 方案A: 使用sanitize-html（推荐）

```typescript
// src/lib/sanitize.ts
import sanitizeHtml from 'sanitize-html';

export function sanitizeMarkdown(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 'strong',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['class'],
      'pre': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  });
}
```

#### 方案B: 使用DOMPurify（备选）

如果项目已使用DOMPurify，直接使用：

```typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...],
    ALLOWED_ATTR: [...]
  });
}
```

### 1.3 实现步骤

1. 安装依赖: `npm install sanitize-html @types/sanitize-html`
2. 创建 `src/lib/sanitize.ts`
3. 修改 `ChatMessage.tsx`:
   - 导入 sanitizeMarkdown
   - 在 dangerouslySetInnerHTML 前调用 sanitizeMarkdown

---

## 2. 敏感数据存储修复设计

### 2.1 问题分析

**文件**: `src/features/agent/hooks/useCheckpointStore.ts:980`

```typescript
// 持久化到 localStorage
```

**风险**: localStorage中的敏感数据可能被XSS攻击窃取。

### 2.2 修复方案

#### 检查点数据分析

Checkpoint通常存储：
- session_id: 会话标识
- message_index: 消息索引
- token_count: token计数
- timestamp: 时间戳

**评估**: Checkpoint数据一般不包含敏感信息，但需确认：
- 是否包含用户输入的原始内容
- 是否包含API响应数据

#### 实现步骤

1. 添加数据类型审查函数
2. 如果包含敏感字段，使用 Tauri secure storage
3. 如果不包含敏感字段，可保留localStorage但添加加密

```typescript
// src/features/agent/hooks/useCheckpointStore.ts

// 判断是否包含敏感数据
function containsSensitiveData(data: CheckpointData): boolean {
  return !!(data.rawContent || data.apiResponse);
}

// 安全存储策略
async function safePersist(key: string, data: CheckpointData) {
  if (containsSensitiveData(data)) {
    // 使用加密存储
    await invoke('secure_store', { key, data: JSON.stringify(data) });
  } else {
    // 普通存储
    localStorage.setItem(key, JSON.stringify(data));
  }
}
```

---

## 3. SQL注入风险修复设计

### 3.1 问题分析

**文件**: `src-tauri/src/agent/subagent/personal_loader.rs`

```rust
// 行200
&format!("SELECT * FROM personal_subagents WHERE creator_id = '{}' AND enabled = 1", safe_user_id)

// 行263
"UPDATE personal_subagents SET {} WHERE name = '{}' AND creator_id = '{}'"

// 行296
&format!("DELETE FROM personal_subagents WHERE name = '{}' AND creator_id = '{}'", safe_name, safe_user_id)
```

**风险**: 虽然使用了safe_前缀变量，但仍存在字符串拼接SQL的风险。

### 3.2 修复方案

使用 sqlx 参数化查询：

```rust
// 重构前
&format!("SELECT * FROM personal_subagents WHERE creator_id = '{}'", safe_user_id)

// 重构后
sqlx::query_scalar!(
  "SELECT COUNT(*) FROM personal_subagents WHERE creator_id = ? AND enabled = 1",
  safe_user_id
)
.fetch_one(&self.pool)
.await
```

### 3.3 实现示例

```rust
// 行116 - count查询
pub async fn exists(&self, name: &str, creator_id: &str) -> Result<bool> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM personal_subagents WHERE name = ? AND creator_id = ?"
    )
    .bind(name)
    .bind(creator_id)
    .fetch_one(&self.pool)
    .await?;
    
    Ok(count > 0)
}

// 行156 - insert语句
pub async fn save(&self, agent: &PersonalSubagent) -> Result<()> {
    sqlx::query(
        "INSERT INTO personal_subagents (name, description, config, created_at, updated_at, enabled, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&agent.name)
    .bind(&agent.description)
    .bind(&agent.config)
    .bind(agent.created_at)
    .bind(agent.updated_at)
    .bind(agent.enabled)
    .bind(&agent.creator_id)
    .execute(&self.pool)
    .await?;
    
    Ok(())
}
```

---

## 4. 测试设计

### 4.1 XSS测试

```typescript
// src/__tests__/sanitize.test.ts
describe('XSS防护测试', () => {
  test('恶意脚本被过滤', () => {
    const malicious = '<script>alert("XSS")</script><p>正常内容</p>';
    const sanitized = sanitizeMarkdown(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>正常内容</p>');
  });
  
  test('事件处理器被移除', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const sanitized = sanitizeMarkdown(malicious);
    expect(sanitized).not.toContain('onerror');
  });
});
```

### 4.2 SQL注入测试

```rust
// src-tauri/src/agent/subagent/tests/personal_loader_test.rs
#[tokio::test]
async fn test_sql_injection_prevention() {
    let loader = PersonalLoader::new_in_memory("test_user".to_string()).unwrap();
    
    // SQL注入payload
    let malicious_name = "'; DROP TABLE personal_subagents; --";
    
    // 应该安全处理，不执行注入
    let result = loader.exists(malicious_name, "test_user").await;
    assert!(result.is_ok());
}
```

---

## 5. 风险评估

| 风险 | 影响 | 概率 | 优先级 |
|------|------|------|--------|
| XSS漏洞 | 高 | 中 | P0 |
| SQL注入 | 高 | 低 | P0 |
| 敏感数据泄露 | 中 | 低 | P1 |
