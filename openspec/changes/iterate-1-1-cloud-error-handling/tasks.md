# 任务：云端错误处理和响应格式统一

## 步骤

1. 更新 `pkg/response/response.go` - 添加 Trace ID 支持
2. 更新 `pkg/errors/codes.go` - 补充错误码定义
3. 创建 `internal/middleware/trace.go` - Trace ID 中间件
4. 更新 `router.go` - 注册 Trace 中间件
5. 验证构建和测试

## 验收标准

- [ ] 所有响应包含统一格式
- [ ] 错误响应包含 Trace ID
- [ ] API 文档更新
