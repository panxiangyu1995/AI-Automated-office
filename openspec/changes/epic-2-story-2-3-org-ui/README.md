# epic-2-story-2-3-org-ui

## Story 信息
- **Epic**: Epic 2 - 用户认证与部门权限系统
- **Story**: Story 2.3 - 组织管理
- **Title**: Department and Position UI
- **Task ID**: E2-S2.3-02

## Capability 描述
- **Name**: `ui`
- **Description**: 构建部门树管理和岗位管理前端界面。

## 铁律映射 (Requirements Mapping)

### PRD 合规
- **FR**: FR100 - 部门架构管理
- **FR**: FR102 - 岗位管理
- **功能定义**: 部门树展示、创建/编辑/删除部门、岗位列表管理

### 架构合规
- **ARCH**: ADR-001 - 分层微内核架构，React 前端负责 UI 交互

### NFR 合规
- **NFR**: NFR16 - 可扩展性要求

### UX 合规
- **UX-02**: 表单设计规范
- **UX-03**: 树形组件设计规范
- **颜色系统**: 使用品牌色 #1E3A5F
- **组件库**: Shadcn/ui
- **图标库**: Lucide React

## 依赖关系
- **前置依赖**: E2-S2.3-01 (Department and position domain model)
- **共享依赖**: E2-S2.1-03 (Frontend login flow)

## 实现步骤 (Planned Steps)
1. 创建部门树视图组件
2. 支持创建、编辑、删除部门流程
3. 构建岗位列表管理页面
4. 处理节点选择、排序和校验反馈

## 页面路由规划

| 路由 | 页面 | 说明 |
|------|------|------|
| `/admin/organization` | OrganizationPage | 组织管理入口（部门树 + 岗位列表） |
| `/admin/organization/departments` | DepartmentTreePage | 部门树管理 |
| `/admin/organization/positions` | PositionListPage | 岗位列表管理 |

## 验收标准
- [ ] 部门树正确展示层级结构
- [ ] 创建/编辑/删除部门功能正常
- [ ] 岗位列表正确展示
- [ ] 岗位 CRUD 功能正常
- [ ] 节点选择和操作反馈正确
- [ ] 符合 UX 设计规范