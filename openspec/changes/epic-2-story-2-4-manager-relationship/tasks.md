# Tasks: Direct Manager Relation

## 1. 准备工作

- [x] 1.1 确认前置依赖 E2-S2.2-01 和 E2-S2.3-01 已完成
- [x] 1.2 确认 FR/NFR/ARCH 需求映射
- [x] 1.3 设计循环检测算法

## 2. 数据模型扩展

- [x] 2.1 Add direct manager relation to user model
  - 在 users 表添加 manager_id 字段
  - 添加外键约束和索引
  - 添加自引用检查约束

- [x] 2.2 更新 Go 用户模型
  - 在 User struct 添加 ManagerID 字段
  - 添加 Manager 和 Subordinates 关联字段

## 3. 后端 API 实现

- [x] 3.1 Build manager lookup API
  - 实现 `GET /api/admin/users/:id/managers`
  - 递归查询上级链
  - 返回带层级的上级列表

- [x] 3.2 实现下属查询 API
  - 实现 `GET /api/admin/users/:id/subordinates`
  - 查询直接下属列表

- [x] 3.3 实现上级设置 API
  - 实现 `PUT /api/admin/users/:id/manager`
  - 支持设置和清除上级

- [x] 3.4 Check circular manager chains and illegal cross-tenant links
  - 实现循环检测函数
  - 实现跨租户校验
  - 实现自引用检查
  - 设置最大链深度限制

## 4. 前端集成

- [x] 4.1 Connect manager picker in the user edit form
  - 创建 ManagerPicker 组件
  - 实现用户搜索选择
  - 排除当前用户和已检测的循环用户

- [x] 4.2 更新用户编辑表单
  - 集成上级选择器
  - 处理上级变更提交

- [x] 4.3 错误处理
  - 循环关系错误提示
  - 跨租户错误提示
  - 自引用错误提示

## 5. 测试验证

- [x] 5.1 编写单元测试
  - 循环检测算法测试
  - 约束校验测试

- [x] 5.2 编写集成测试
  - 上级设置流程测试
  - 上级链查询测试

- [x] 5.3 E2E 测试
  - 上级选择器交互测试
  - 错误提示展示测试

- [x] 5.4 验收标准
  - 循环检测正确工作
  - 跨租户设置被阻止
  - 上级选择器正常工作
  - 无 TypeScript 错误

## 任务依赖关系

```
E2-S2.2-01 + E2-S2.3-01 (前置依赖)
    |
    v
[2.1-2.2] 数据模型扩展
    |
    v
[3.1-3.4] 后端 API 实现
    |
    v
[4.1-4.3] 前端集成
    |
    v
[5.1-5.4] 测试验证
    |
    v
E2-S2.8-01 (后续依赖 - 组织架构图)
```

## 实现总结

### 已创建文件

1. **数据库迁移**
   - `cloud-server/migrations/007_manager_relation.up.sql` - 添加 manager_id 字段
   - `cloud-server/migrations/007_manager_relation.down.sql` - 回滚脚本

2. **后端代码**
   - `cloud-server/internal/module/admin/application/service/user_service_manager_test.go` - 单元测试
   - `cloud-server/internal/module/admin/integration/manager_integration_test.go` - 集成测试

3. **前端代码**
   - `src/features/admin/components/ManagerPicker.tsx` - 上级选择器组件

4. **E2E 测试**
   - `tests/e2e/admin/manager-relationship.spec.ts` - E2E 测试

### 已修改文件

1. **后端**
   - `cloud-server/internal/model/user.go` - 添加 ManagerID 字段
   - `cloud-server/internal/module/admin/domain/repository/user_repository.go` - 添加接口方法
   - `cloud-server/internal/module/admin/infrastructure/persistence/user_repo_impl.go` - 实现仓储方法
   - `cloud-server/internal/module/admin/application/service/user_service.go` - 添加服务方法
   - `cloud-server/internal/module/admin/interface/handler/admin_handler.go` - 添加 API 端点

2. **前端**
   - `src/features/admin/types/user.types.ts` - 添加类型定义
   - `src/features/admin/api/userApi.ts` - 添加 API 方法
   - `src/features/admin/components/UserForm.tsx` - 集成上级选择器
   - `src/features/admin/pages/UserEditPage.tsx` - 添加上级搜索功能

### 验收标准验证

| 标准 | 状态 | 说明 |
|------|------|------|
| 用户模型包含 manager_id 字段 | ✅ | User struct 已添加 ManagerID *string |
| 设置上级 API 正确工作 | ✅ | PUT /api/admin/users/:id/manager |
| 清除上级 API 正确工作 | ✅ | 支持 manager_id: null |
| 查询上级链 API 返回正确层级 | ✅ | GET /api/admin/users/:id/managers |
| 查询下属列表 API 正确工作 | ✅ | GET /api/admin/users/:id/subordinates |
| 循环引用检测正确拦截 | ✅ | checkCircularChain 函数 |
| 自引用检测正确拦截 | ✅ | MANAGER_CANNOT_BE_SELF 错误 |
| 跨租户设置正确拦截 | ✅ | CROSS_TENANT_MANAGER 错误 |
| 上级选择器集成到用户编辑表单 | ✅ | ManagerPicker 组件 |
| 错误提示清晰友好 | ✅ | 前端错误处理已实现 |
