# 规格：同步冲突解决

## 冲突检测

当本地版本与服务端版本不一致时，触发冲突检测：

```json
{
  "conflict": {
    "entity_type": "employee",
    "entity_id": "uuid",
    "local_version": 5,
    "server_version": 6,
    "local_timestamp": "2026-04-17T10:00:00Z",
    "server_timestamp": "2026-04-17T10:01:00Z",
    "strategy": "last_write_wins"
  }
}
```

## 冲突解决响应

| 策略 | 返回字段 | 说明 |
|------|----------|------|
| last_write_wins | resolved_data | 自动使用最新数据 |
| server_wins | resolved_data | 返回服务端数据 |
| client_wins | resolved_data | 返回客户端数据 |
| manual | null | 需要客户端确认 |
