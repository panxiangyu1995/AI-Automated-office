# Skills 技能模块

Base: `/api/v1`

### POST /skills
创建技能定义。
- **Auth**: JWT
- **Body**: `{ "name": "string", "description": "string", "parameters": "string", "api_endpoint": "string", "module": "string" }`

### GET /skills
列出企业所有技能。
- **Auth**: JWT
