# AI 对话模块

Base: `/api/v1`

### POST /ai/sessions
创建 AI 对话会话。
- **Auth**: JWT
- **Body**: `{ "user_id": "UUID", "title?": "string", "model?": "string" }`

### GET /ai/sessions
列出 AI 会话。
- **Auth**: JWT
- **Query**: `?user_id=UUID`

### POST /ai/sessions/:session_id/messages
发送消息到 AI 会话。
- **Auth**: JWT
- **Body**: `{ "content": "string" }`

### GET /ai/sessions/:session_id/messages
获取 AI 会话消息列表。
- **Auth**: JWT

### PUT /ai/preferences
更新 AI 偏好设置。
- **Auth**: JWT
- **Body**: `{ "key": "string", "value": "string" }`
