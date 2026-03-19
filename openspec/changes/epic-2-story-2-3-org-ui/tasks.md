# Tasks: Department and Position UI

## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.3-01 已完成
- [ ] 1.2 确认 UX 设计规范和颜色系统
- [ ] 1.3 创建组件文件结构

## 2. API 集成层

- [ ] 2.1 创建 API 调用封装
  - 创建 `src/features/organization/api/organizationApi.ts`
  - 封装部门树查询 API
  - 封装部门 CRUD API
  - 封装岗位 CRUD API

- [ ] 2.2 创建类型定义
  - 创建 `src/features/organization/types/organization.types.ts`
  - 定义 Department 和 Position 接口
  - 定义 API 请求/响应类型

## 3. Hooks 实现

- [ ] 3.1 实现部门树数据 Hook
  - 创建 `src/features/organization/hooks/useDepartmentTree.ts`
  - 实现部门树数据加载
  - 实现选中状态管理
  - 实现乐观更新

- [ ] 3.2 实现岗位数据 Hook
  - 创建 `src/features/organization/hooks/usePositions.ts`
  - 实现岗位列表加载
  - 实现岗位变更 mutations

## 4. 部门组件实现

- [ ] 4.1 Create the department tree view
  - 创建 `src/features/organization/components/DepartmentTree.tsx`
  - 实现树形结构渲染
  - 实现展开/折叠逻辑

- [ ] 4.2 实现部门节点组件
  - 创建 `src/features/organization/components/DepartmentNode.tsx`
  - 实现节点渲染
  - 实现右键菜单

- [ ] 4.3 Support create, edit, and delete department flows
  - 创建 `src/features/organization/components/DepartmentForm.tsx`
  - 实现创建部门表单
  - 实现编辑部门表单
  - 实现删除确认对话框

- [ ] 4.4 实现部门详情面板
  - 创建 `src/features/organization/components/DepartmentDetail.tsx`
  - 展示部门基本信息
  - 展示部门下员工列表（可选）

## 5. 岗位组件实现

- [ ] 5.1 Build position list management
  - 创建 `src/features/organization/components/PositionTable.tsx`
  - 实现岗位数据表格
  - 实现筛选和排序

- [ ] 5.2 实现岗位表单
  - 创建 `src/features/organization/components/PositionForm.tsx`
  - 实现创建岗位表单
  - 实现编辑岗位表单

## 6. 页面实现

- [ ] 6.1 实现组织管理入口页
  - 创建 `src/features/organization/pages/OrganizationPage.tsx`
  - 实现左右分栏布局
  - 集成部门树和详情面板

- [ ] 6.2 实现部门管理页
  - 创建 `src/features/organization/pages/DepartmentTreePage.tsx`
  - 集成部门树组件

- [ ] 6.3 实现岗位管理页
  - 创建 `src/features/organization/pages/PositionListPage.tsx`
  - 集成岗位表格组件

## 7. 路由配置

- [ ] 7.1 添加路由定义
  - 在路由配置中添加组织管理路由
  - 配置路由守卫

## 8. 测试验证

- [ ] 8.1 单元测试
  - 组件渲染测试
  - 树组件交互测试

- [ ] 8.2 集成测试
  - 部门管理流程测试
  - 岗位管理流程测试

- [ ] 8.3 E2E 测试
  - 在浏览器中验证页面功能
  - 验证约束处理

- [ ] 8.4 验收标准
  - 页面符合 UX 设计规范
  - 所有功能正常工作
  - 无 TypeScript 错误

## 任务依赖关系

```
E2-S2.3-01 (前置依赖 - API)
    |
    v
[2.1-2.2] API 集成层
    |
    v
[3.1-3.2] Hooks 实现
    |
    v
[4.1-4.4] 部门组件实现
    |
    v
[5.1-5.2] 岗位组件实现
    |
    v
[6.1-6.3] 页面实现
    |
    v
[7.1] 路由配置
    |
    v
[8.1-8.4] 测试验证
```