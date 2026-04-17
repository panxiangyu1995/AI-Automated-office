# 提案：云端错误处理和响应格式统一

## 变更背景

当前云端服务存在以下问题：
1. 错误处理不统一，`pkg/errors` 和 `pkg/response` 存在重复定义
2. 响应格式不一致，部分 handler 直接使用 gin.H 返回
3. 缺少统一的错误码规范和 Trace ID 支持

## 变更目标

- 统一 API 响应格式
- 建立标准化的错误码体系
- 添加 Trace ID 支持便于问题追踪
- 统一超时和重试策略的错误处理

## 预期效果

- 所有 API 响应格式一致
- 错误信息包含 Trace ID，便于排查
- 错误码体系完整，支持前端按码处理

## 涉及文件

- `pkg/response/response.go` - 统一响应格式
- `pkg/errors/errors.go` - 错误码定义
- `pkg/errors/codes.go` - 错误码常量
- `internal/middleware/auth.go` - 添加 Trace ID
