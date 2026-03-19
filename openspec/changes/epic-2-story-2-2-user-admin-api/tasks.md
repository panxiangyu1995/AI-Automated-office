# Tasks: User Admin APIs

## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.1-01 已完成
- [ ] 1.2 确认 FR/NFR/ARCH/UX 需求映射
- [ ] 1.3 创建 API 设计文档并评审通过

## 2. 数据层实现

- [ ] 2.1 Define user repository and service methods
  - 创建 `internal/admin/repository/user_repository.go`
  - 定义 UserRepository 接口
  - 实现用户 CRUD 基础方法

- [ ] 2.2 Implement pagination and filter support
  - 实现 `FindWithFilters` 方法
  - 支持 name、employee_code、department_id、status 筛选
  - 实现分页查询逻辑

- [ ] 2.3 创建关联表操作
  - 实现用户-部门关联操作
  - 实现用户-角色关联操作

## 3. 服务层实现

- [ ] 3.1 Implement create user service
  - 用户名唯一性校验
  - 工号唯一性校验
  - 密码生成策略
  - 部门/角色绑定逻辑

- [ ] 3.2 Implement update user service
  - 信息更新校验
  - 关联数据更新
  - 变更追踪

- [ ] 3.3 Implement enable/disable user service
  - 状态变更逻辑
  - 审计日志写入

## 4. API 层实现

- [ ] 4.1 Implement user list endpoint
  - `GET /api/admin/users`
  - 分页和筛选参数解析
  - 响应格式化

- [ ] 4.2 Implement user detail endpoint
  - `GET /api/admin/users/:id`
  - 权限摘要聚合

- [ ] 4.3 Implement create user endpoint
  - `POST /api/admin/users`
  - 请求校验
  - 标准响应

- [ ] 4.4 Implement update user endpoint
  - `PUT /api/admin/users/:id`
  - 部分更新支持

- [ ] 4.5 Implement status update endpoint
  - `PATCH /api/admin/users/:id/status`
  - 状态校验

- [ ] 4.6 Add validation and standard error responses
  - 统一错误响应格式
  - 字段校验错误提示

## 5. 审计集成

- [ ] 5.1 集成审计日志服务
  - 用户创建事件
  - 用户更新事件
  - 状态变更事件

## 6. 测试验证

- [ ] 6.1 编写单元测试
  - Repository 层测试
  - Service 层测试

- [ ] 6.2 编写集成测试
  - API 端点测试
  - 完整流程测试

- [ ] 6.3 验证标准
  - 所有 API 返回正确响应
  - 分页筛选功能正常
  - 审计日志正确记录
  - 错误处理符合规范

## 任务依赖关系

```
E2-S2.1-01 (前置依赖)
    |
    v
[2.1-2.3] 数据层实现
    |
    v
[3.1-3.3] 服务层实现
    |
    v
[4.1-4.6] API 层实现
    |
    v
[5.1] 审计集成
    |
    v
[6.1-6.3] 测试验证
    |
    v
E2-S2.2-02 (后续依赖)
```