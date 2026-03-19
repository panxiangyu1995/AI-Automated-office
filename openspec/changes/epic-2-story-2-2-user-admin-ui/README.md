# epic-2-story-2-2-user-admin-ui

## Story 信息
- **Epic**: Epic 2 - 用户认证与部门权限系统
- **Story**: Story 2.2 - 用户管理工作台
- **Title**: User Admin UI
- **Task ID**: E2-S2.2-02

## Capability 描述
- **Name**: `admin-ui`
- **Description**: 构建用户管理前端界面，包括用户列表页、筛选器、创建表单和编辑表单。

## 铁律映射 (Requirements Mapping)

### PRD 合规
- **FR**: FR28 - 用户管理功能
- **功能定义**: 用户列表展示、搜索筛选、新增用户、编辑用户、状态展示

### 架构合规
- **ARCH**: ADR-001 - 分层微内核架构，React 前端负责 UI 交互

### NFR 合规
- **NFR**: NFR16 - 可扩展性要求

### UX 合规
- **UX-02**: 表单设计规范
- **UX-04**: 状态反馈与错误处理
- **颜色系统**: 使用品牌色 #1E3A5F
- **组件库**: Shadcn/ui
- **图标库**: Lucide React

## 依赖关系
- **前置依赖**: E2-S2.2-01 (User admin APIs)
- **共享依赖**: E2-S2.1-03 (Frontend login flow - 认证状态管理)

## 实现步骤 (Planned Steps)
1. 创建用户列表页面组件
2. 添加姓名、工号、部门、状态筛选器
3. 实现创建和编辑用户表单
4. 展示基本档案和最新状态

## 页面路由规划

| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin/users` | UserListPage | 用户列表主页面 |
| `/admin/users/create` | UserCreatePage | 创建用户 |
| `/admin/users/:id/edit` | UserEditPage | 编辑用户 |

## 验收标准
- [ ] 用户列表页面正确展示分页数据
- [ ] 筛选器功能正常工作
- [ ] 创建用户表单提交成功
- [ ] 编辑用户表单提交成功
- [ ] 状态展示（启用/停用）正确
- [ ] 符合 UX 设计规范（颜色、组件、图标）