# epic-2-story-2-2-user-admin-api

## Story 信息
- **Epic**: Epic 2 - 用户认证与部门权限系统
- **Story**: Story 2.2 - 用户管理工作台
- **Title**: User admin APIs
- **Task ID**: E2-S2.2-01

## Capability 描述
- **Name**: `admin-api`
- **Description**: 在 Go 云端后端实现用户管理相关 API，包括用户列表查询、创建、更新、启用/停用等功能。

## 铁律映射 (Requirements Mapping)

### PRD 合规
- **FR**: FR28 - 用户管理功能
- **功能定义**: 用户列表分页查询、新增用户、编辑用户、启停用用户、用户与部门/岗位/角色绑定

### 架构合规
- **ARCH**: ADR-005 - 多租户采用数据库级隔离
- **ARCH**: ADR-001 - 分层微内核架构，业务逻辑在云端

### NFR 合规
- **NFR**: NFR16 - 可扩展性要求，单租户 >= 500 用户

### UX 合规
- 本变更不涉及前端 UI，依赖后续 `user-admin-ui` 变更

## 依赖关系
- **前置依赖**: E2-S2.1-01 (Cloud auth module foundation)
- **后续变更**: E2-S2.2-02 (User admin UI)

## 实现步骤 (Planned Steps)
1. 定义用户仓储和服务方法
2. 实现分页查询和筛选支持
3. 实现创建、更新、启用、停用 API
4. 添加数据校验和标准错误响应

## API 端点规划

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表分页查询 |
| GET | `/api/admin/users/:id` | 获取单个用户详情 |
| POST | `/api/admin/users` | 创建新用户 |
| PUT | `/api/admin/users/:id` | 更新用户信息 |
| PATCH | `/api/admin/users/:id/status` | 启用/停用用户 |
| PUT | `/api/admin/users/:id/roles` | 绑定用户角色 |
| PUT | `/api/admin/users/:id/departments` | 绑定用户部门 |

## 验收标准
- [ ] 所有 API 端点实现完成并通过单元测试
- [ ] 分页查询支持按姓名、工号、部门、状态筛选
- [ ] 创建/更新用户时进行数据校验
- [ ] 启用/停用操作写入审计日志
- [ ] 所有 API 返回标准错误响应格式