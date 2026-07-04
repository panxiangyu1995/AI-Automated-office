## Why

As a 销售人员，我需要 创建、编辑、删除客户档案，以便 可以管理企业的客户资源。这是 Epic 4 的关键功能点。

## What Changes

- POST /api/v1/customers 创建客户档案，客户以公司名称为企业内唯一标识，同一企业内不可创建公司名称重复的客户
- PUT /api/v1/customers/{customer_id} 更新客户信息
- DELETE /api/v1/customers/{customer_id} 软删除客户（有关联合同/订单时禁止删除）

## Capabilities

### New Capabilities
- `customer-crud`: 客户档案 CRUD的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
