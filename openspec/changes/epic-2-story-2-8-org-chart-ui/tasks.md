# Tasks: Org Chart View

## 任务列表

### 任务 1: 创建组件目录结构
- **描述**: 创建 OrgChart 组件的目录结构和基础文件
- **文件**: 
  - `src/features/hr/components/OrgChart/index.tsx`
  - `src/features/hr/components/OrgChart/OrgChartNode.tsx`
  - `src/features/hr/components/OrgChart/OrgChartTree.tsx`
  - `src/features/hr/components/OrgChart/DepartmentDetail.tsx`
  - `src/features/hr/components/OrgChart/EmployeeCard.tsx`
- **验收**: 目录结构清晰，组件骨架已创建

### 任务 2: 实现 OrgChart 主组件
- **描述**: 实现组织架构图主组件，包含布局切换和工具栏
- **文件**: 
  - `src/features/hr/components/OrgChart/index.tsx`
  - `src/features/hr/components/OrgChart/OrgChartToolbar.tsx`
- **验收**: 
  - 支持树形/矩阵布局切换
  - 包含缩放控制按钮
  - 包含搜索框

### 任务 3: 实现 OrgChartTree 树形渲染
- **描述**: 实现组织架构树的渲染逻辑
- **文件**: 
  - `src/features/hr/components/OrgChart/OrgChartTree.tsx`
  - `src/features/hr/components/OrgChart/OrgChartNode.tsx`
- **验收**: 
  - 正确渲染部门层级关系
  - 支持节点折叠/展开
  - 支持节点选中状态

### 任务 4: 实现 DepartmentDetail 面板
- **描述**: 实现部门详情面板，展示部门信息和成员列表
- **文件**: 
  - `src/features/hr/components/OrgChart/DepartmentDetail.tsx`
  - `src/features/hr/components/OrgChart/EmployeeCard.tsx`
- **验收**: 
  - 显示部门名称、编码、描述
  - 显示部门负责人信息
  - 显示部门成员列表

### 任务 5: 实现数据获取 Hooks
- **描述**: 实现组织架构数据获取的自定义 Hooks
- **文件**: 
  - `src/features/hr/components/OrgChart/hooks/useOrgChart.ts`
  - `src/features/hr/components/OrgChart/hooks/useChartLayout.ts`
- **验收**: 
  - useOrgChart 获取组织架构树数据
  - useChartLayout 计算布局位置
  - 使用 React Query 进行数据缓存

### 任务 6: 实现员工汇报关系展示
- **描述**: 在员工卡片上展示直属上级和下属信息
- **文件**: 
  - `src/features/hr/components/OrgChart/EmployeeCard.tsx`
  - `src/features/hr/components/OrgChart/ReportingLine.tsx`
- **验收**: 
  - 显示直属上级
  - 显示直接下属列表
  - 支持虚线汇报关系标注

### 任务 7: 实现性能优化
- **描述**: 实现虚拟滚动和懒加载优化
- **文件**: 
  - `src/features/hr/components/OrgChart/OrgChartTree.tsx`
  - `src/features/hr/components/OrgChart/hooks/useVirtualTree.ts`
- **验收**: 
  - 大型组织（1000+节点）渲染流畅
  - 支持懒加载子节点
  - 数据缓存策略生效

### 任务 8: 创建页面入口和路由
- **描述**: 创建组织架构页面入口，配置路由
- **文件**: 
  - `src/pages/hr/OrgChartPage.tsx`
  - `src/routes/hr.routes.tsx`（更新）
- **验收**: 
  - 页面可正常访问
  - 路由配置正确
  - 侧边栏菜单项已添加

### 任务 9: 编写单元测试
- **描述**: 为组件编写单元测试
- **文件**: 
  - `src/features/hr/components/OrgChart/__tests__/OrgChart.test.tsx`
  - `src/features/hr/components/OrgChart/__tests__/OrgChartNode.test.tsx`
- **验收**: 
  - 测试覆盖率 > 80%
  - 关键交互路径已测试

### 任务 10: 浏览器测试和优化
- **描述**: 在浏览器中进行功能测试和性能优化
- **验收**: 
  - 所有功能正常工作
  - 大数据量性能达标
  - 响应式布局适配

## 执行顺序

```
1. 创建组件目录结构
      ↓
2. 实现数据获取 Hooks
      ↓
3. 实现 OrgChartTree 树形渲染
      ↓
4. 实现 OrgChart 主组件
      ↓
5. 实现 DepartmentDetail 面板
      ↓
6. 实现员工汇报关系展示
      ↓
7. 实现性能优化
      ↓
8. 创建页面入口和路由
      ↓
9. 编写单元测试
      ↓
10. 浏览器测试和优化
```

## 测试要点

- [ ] 单元测试：组件渲染、交互逻辑
- [ ] 集成测试：数据获取、状态管理
- [ ] 性能测试：大型组织渲染时间
- [ ] E2E 测试：用户查看组织架构流程

## 交付物

1. OrgChart 组件及其子组件
2. 数据获取 Hooks
3. 页面入口和路由配置
4. 单元测试文件