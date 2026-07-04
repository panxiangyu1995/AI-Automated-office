## Why

As a Agent，我需要 通过自然语言修改合同字段，以便 用户可以说'把合同金额改成 50 万'来修改合同。这是 Epic 6 的关键功能点。

## What Changes

- Agent 解析自然语言为结构化字段修改请求，调用 PATCH /api/v1/contracts/{contract_id} 更新指定字段
- 只允许修改草稿和审批中状态的合同
- 修改记录写入审计日志

## Capabilities

### New Capabilities
- `agent-natural-language-contract`: Agent 自然语言修改合同字段的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
