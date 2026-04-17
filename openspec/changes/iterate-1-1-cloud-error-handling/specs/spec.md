# 规格：云端错误处理和响应格式

## API 响应规格

### 成功响应
```json
{
  "success": true,
  "code": "SUCCESS",
  "data": { ... },
  "message": "操作成功",
  "trace_id": "uuid-v4"
}
```

### 错误响应
```json
{
  "success": false,
  "code": "ERR_XXX",
  "message": "错误描述",
  "details": { ... },
  "trace_id": "uuid-v4"
}
```

## 错误码定义

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| SUCCESS | 200 | 成功 |
| ERR_BAD_REQUEST | 400 | 请求参数错误 |
| ERR_UNAUTHORIZED | 401 | 未认证 |
| ERR_FORBIDDEN | 403 | 无权限 |
| ERR_NOT_FOUND | 404 | 资源不存在 |
| ERR_INTERNAL | 500 | 服务器内部错误 |
