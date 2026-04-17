# 设计：云端错误处理和响应格式统一

## 响应格式

```go
// 统一响应结构
type ApiResponse struct {
    Success bool        `json:"success"`
    Code    string      `json:"code,omitempty"`
    Data    interface{} `json:"data,omitempty"`
    Message string      `json:"message,omitempty"`
    TraceID string      `json:"trace_id,omitempty"`
    Details interface{} `json:"details,omitempty"`
}
```

## 错误码体系

| 分类 | 前缀 | 说明 |
|------|------|------|
| 通用错误 | ERR_ | 通用业务错误 |
| 认证错误 | AUTH_ | 认证相关错误 |
| 权限错误 | PERM_ | 权限相关错误 |
| 业务错误 | BIZ_ | 业务逻辑错误 |

## Trace ID 中间件

- 请求进入时生成 UUID
- 挂载到 context
- 在日志和响应中输出
