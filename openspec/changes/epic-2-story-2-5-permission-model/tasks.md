## 1. 准备工作

- [x] 1.1 确认前置依赖 E2-S2.3-01（部门架构）已完成
- [x] 1.2 确认 FR/NFR/ARCH/UX 需求映射正确

## 2. 核心开发任务

### 2.1 数据库设计与迁移
- [x] 2.1.1 创建 roles 表迁移脚本
- [x] 2.1.2 创建 permissions 表迁移脚本
- [x] 2.1.3 创建 user_roles 表迁移脚本
- [x] 2.1.4 创建 role_permissions 表迁移脚本
- [x] 2.1.5 添加必要的数据库索引

### 2.2 权限模型定义
- [x] 2.2.1 定义三层权限层级常量（base/department/approval）
- [x] 2.2.2 定义权限类型枚举（read/write/delete/admin）
- [x] 2.2.3 定义默认角色数据（超级管理员/部门管理员/普通员工/审批人）
- [x] 2.2.4 定义默认权限数据（按模块分组）

### 2.3 数据访问层开发
- [x] 2.3.1 实现 RoleRepository 接口和实现
- [x] 2.3.2 实现 PermissionRepository 接口和实现
- [x] 2.3.3 实现 UserRoleRepository 接口和实现
- [ ] 2.3.4 实现 RolePermissionRepository 接口和实现（已合并到 RoleRepository）

### 2.4 业务服务层开发
- [x] 2.4.1 实现 RoleService（角色 CRUD 业务逻辑）
- [x] 2.4.2 实现 PermissionService（权限查询业务逻辑）
- [x] 2.4.3 实现 PermissionCalculator（权限计算核心逻辑）
- [x] 2.4.4 实现权限缓存机制

### 2.5 API 接口开发
- [x] 2.5.1 实现角色列表查询接口 GET /api/admin/roles
- [x] 2.5.2 实现角色创建接口 POST /api/admin/roles
- [x] 2.5.3 实现角色详情接口 GET /api/admin/roles/:id
- [x] 2.5.4 实现角色更新接口 PUT /api/admin/roles/:id
- [x] 2.5.5 实现角色删除接口 DELETE /api/admin/roles/:id
- [x] 2.5.6 实现角色权限查询接口 GET /api/admin/roles/:id/permissions
- [x] 2.5.7 实现角色权限更新接口 PUT /api/admin/roles/:id/permissions
- [x] 2.5.8 实现权限列表查询接口 GET /api/admin/permissions
- [x] 2.5.9 实现用户角色查询接口 GET /api/admin/users/:id/roles
- [x] 2.5.10 实现用户角色更新接口 PUT /api/admin/users/:id/roles

## 3. 测试验证

### 3.1 单元测试
- [x] 3.1.1 权限计算逻辑单元测试
- [x] 3.1.2 权限继承逻辑单元测试
- [x] 3.1.3 缓存机制单元测试

### 3.2 集成测试
- [x] 3.2.1 角色管理 API 集成测试
- [x] 3.2.2 权限查询 API 集成测试
- [x] 3.2.3 用户角色分配 API 集成测试

### 3.3 验收测试
- [x] 3.3.1 验证三层权限模型定义正确
- [x] 3.3.2 验证权限计算结果符合预期
- [x] 3.3.3 验证多租户数据隔离正确

## 4. 文档与交付

- [ ] 4.1 更新 API 文档
- [ ] 4.2 编写数据库迁移说明文档
- [ ] 4.3 标记 Story 完成状态
