# Tasks: Department and Position Domain Model

## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.1-01 已完成
- [ ] 1.2 确认 FR/NFR/ARCH 需求映射
- [ ] 1.3 设计数据库模型并评审

## 2. 数据库模型实现

- [ ] 2.1 Design departments and positions models
  - 创建 departments 表
  - 创建 positions 表
  - 创建 department_closure 闭包表
  - 添加必要索引

- [ ] 2.2 实现数据迁移脚本
  - 创建迁移文件
  - 添加种子数据（可选）

## 3. 部门功能实现

- [ ] 3.1 Implement department tree query
  - 创建 `internal/admin/repository/department_repository.go`
  - 实现树形结构查询
  - 支持闭包表优化查询

- [ ] 3.2 实现部门 CRUD 操作
  - 创建部门 Service
  - 创建部门 Handler
  - 实现创建、更新、删除 API

- [ ] 3.3 实现删除和迁移约束
  - 子部门检查
  - 员工关联检查
  - 循环引用检测

## 4. 岗位功能实现

- [ ] 4.1 实现岗位仓储层
  - 创建 `internal/admin/repository/position_repository.go`
  - 实现基础 CRUD 操作

- [ ] 4.2 实现岗位服务层
  - 创建岗位 Service
  - 实现与部门关联逻辑

- [ ] 4.3 实现岗位 API
  - 创建岗位 Handler
  - 实现列表、创建、更新、删除 API

## 5. API 端点实现

- [ ] 5.1 部门 API 端点
  - `GET /api/admin/departments/tree`
  - `GET /api/admin/departments/:id`
  - `POST /api/admin/departments`
  - `PUT /api/admin/departments/:id`
  - `DELETE /api/admin/departments/:id`

- [ ] 5.2 岗位 API 端点
  - `GET /api/admin/positions`
  - `GET /api/admin/positions/:id`
  - `POST /api/admin/positions`
  - `PUT /api/admin/positions/:id`
  - `DELETE /api/admin/positions/:id`

## 6. 测试验证

- [ ] 6.1 编写单元测试
  - 部门树构建测试
  - 约束检查测试
  - 岗位 CRUD 测试

- [ ] 6.2 编写集成测试
  - API 端点测试
  - 级联操作测试

- [ ] 6.3 验证标准
  - 部门树正确展示
  - 约束规则正确生效
  - API 响应符合规范

## 任务依赖关系

```
E2-S2.1-01 (前置依赖)
    |
    v
[2.1-2.2] 数据库模型实现
    |
    v
[3.1-3.3] 部门功能实现
    |
    v
[4.1-4.3] 岗位功能实现
    |
    v
[5.1-5.2] API 端点实现
    |
    v
[6.1-6.3] 测试验证
    |
    v
E2-S2.3-02 (后续依赖)
```