# Messages 消息与文件模块

Base: `/api/v1`

## Files（文件）

### POST /enterprises/:enterprise_id/files
上传文件（multipart）。
- **Auth**: JWT
- **Form**: `file` (multipart), `category?`, `ref_id?`, `ref_type?`

### GET /enterprises/:enterprise_id/files
列出文件（分页）。
- **Query**: `?page=1&page_size=20`

## Messages（消息）

### POST /enterprises/:enterprise_id/messages
发送消息。
- **Auth**: JWT
- **Body**: `{ "sender_id": "UUID", "receiver_id": "UUID", "title?": "string", "content": "string", "msg_type?": "string" }`

### GET /enterprises/:enterprise_id/messages
列出消息（分页）。
- **Query**: `?page=1&page_size=20`
