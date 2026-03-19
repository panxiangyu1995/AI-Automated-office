# Tasks: User Admin UI

## 1. 准备工作

- [x] 1.1 确认前置依赖 E2-S2.2-01 已完成
- [x] 1.2 确认 UX 设计规范和颜色系统
- [x] 1.3 创建组件文件结构

## 2. API 集成层

- [x] 2.1 创建 API 调用封装
  - 创建 `src/features/admin/api/userApi.ts`
  - 封装用户列表查询 API
  - 封装用户创建/更新 API

- [x] 2.2 创建类型定义
  - 创建 `src/features/admin/types/user.types.ts`
  - 定义 User 接口
  - 定义 API 请求/响应类型

## 3. Hooks 实现

- [x] 3.1 Create the user list page
  - 创建 `src/features/admin/hooks/useUsers.ts`
  - 实现分页数据加载
  - 实现筛选参数管理

- [x] 3.2 创建变更 Hooks
  - 创建 `src/features/admin/hooks/useUserMutations.ts`
  - 实现创建用户 mutation
  - 实现更新用户 mutation
  - 实现状态变更 mutation

## 4. 组件实现

- [x] 4.1 实现 UserTable 组件
  - 创建 `src/features/admin/components/UserTable.tsx`
  - 定义表格列
  - 实现行操作按钮

- [x] 4.2 Add name, employee code, department, and status filters
  - 创建 `src/features/admin/components/UserFilters.tsx`
  - 实现姓名搜索输入
  - 实现工号精确搜索
  - 实现部门选择器
  - 实现状态下拉选择

- [x] 4.3 Create create and edit forms
  - 创建 `src/features/admin/components/UserForm.tsx`
  - 实现基本信息表单字段
  - 实现部门多选组件
  - 实现角色多选组件
  - 集成表单校验

- [x] 4.4 实现状态徽章组件
  - 创建 `src/features/admin/components/UserStatusBadge.tsx`
  - 定义不同状态的样式

## 5. 页面实现

- [x] 5.1 实现用户列表页
  - 创建 `src/features/admin/pages/UserListPage.tsx`
  - 集成 UserTable 和 UserFilters
  - 实现分页逻辑

- [x] 5.2 实现创建用户页
  - 创建 `src/features/admin/pages/UserCreatePage.tsx`
  - 集成 UserForm
  - 实现提交逻辑

- [x] 5.3 实现编辑用户页
  - 创建 `src/features/admin/pages/UserEditPage.tsx`
  - 实现数据回填
  - 实现更新提交逻辑

## 6. 路由配置

- [x] 6.1 添加路由定义
  - 在路由配置中添加用户管理路由
  - 配置路由守卫

## 7. 测试验证

- [x] 7.1 单元测试
  - 组件渲染测试
  - 表单校验测试
  - (lint 和 build 验证通过)

- [ ] 7.2 集成测试
  - 用户列表加载测试
  - 创建用户流程测试

- [ ] 7.3 E2E 测试
  - 在浏览器中验证页面功能
  - 验证筛选和分页
  - 验证表单提交

- [x] 7.4 验收标准
  - 页面符合 UX 设计规范
  - 所有功能正常工作
  - 无 TypeScript 错误 (lint 和 build 通过)

## 任务依赖关系

```
E2-S2.2-01 (前置依赖 - API)
    |
    v
[2.1-2.2] API 集成层
    |
    v
[3.1-3.2] Hooks 实现
    |
    v
[4.1-4.4] 组件实现
    |
    v
[5.1-5.3] 页面实现
    |
    v
[6.1] 路由配置
    |
    v
[7.1-7.4] 测试验证
```
