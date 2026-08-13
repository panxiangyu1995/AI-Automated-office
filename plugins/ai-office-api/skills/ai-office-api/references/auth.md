# Auth 认证模块

Base: `/api/v1`

## POST /auth/login
用户登录，返回 access_token + refresh_token。
- **Auth**: 无需
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `{ "data": { "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 3600 } }`

## POST /auth/refresh
刷新 access_token。
- **Auth**: 无需
- **Body**: `{ "refresh_token": "string" }`
- **Response**: 同 login

## POST /auth/switch-enterprise
切换当前企业上下文，返回新 Token。
- **Auth**: JWT
- **Body**: `{ "enterprise_id": "UUID" }`
- **Response**: 同 login

## GET /me
获取当前用户信息。
- **Auth**: JWT
- **Response**: `{ "data": { "id", "email", "name", "role" } }`

## GET /me/profile
获取当前用户 + 关联员工档案。
- **Auth**: JWT
- **Response**: `{ "data": { "user": {...}, "employee": {...} } }`
