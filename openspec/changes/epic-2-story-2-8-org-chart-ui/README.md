# Epic 2, Story 2.8: Org Chart View

## 概述

构建组织架构图可视化页面，展示部门层级结构、员工汇报关系和部门详情。作为效率增强阶段的最后一个子任务，本功能帮助员工和管理层直观了解企业组织架构，支持折叠展开和大树性能优化。

## 铁律映射

### PRD 需求
- **FR106**: 员工可以查看组织架构图

### 架构需求
- **ADR-001**: 分层微内核架构，UI逻辑在前端层
- 前端 React 负责可视化展示和交互
- 数据来源为云端 Go 后端的组织架构 API

### UX 需求
- **UX-02**: 使用 Shadcn/ui 组件库
- **UX-03**: VSCode 风格四栏布局，组织架构展示在工作区
- **UX-04**: 交互透明可控，支持折叠展开

## 验收标准

- [ ] 创建组织架构图页面
- [ ] 展示部门和员工层级关系
- [ ] 展示部门详情和负责人信息
- [ ] 处理折叠和大树性能优化

## 技术方案

### 前端组件结构

```
src/features/hr/components/
├── OrgChart/
│   ├── index.tsx              # 组织架构图主组件
│   ├── OrgChartNode.tsx       # 节点组件（部门/员工）
│   ├── OrgChartTree.tsx       # 树形结构渲染
│   ├── DepartmentDetail.tsx   # 部门详情面板
│   ├── EmployeeCard.tsx       # 员工卡片
│   └── hooks/
│       ├── useOrgChart.ts     # 组织架构数据 Hook
│       └── useChartLayout.ts  # 布局计算 Hook
```

### 核心功能

1. **组织架构树可视化**
   - 树形/矩阵布局切换
   - 部门节点折叠/展开
   - 员工头像和基本信息展示

2. **部门详情面板**
   - 部门名称、编码、描述
   - 部门负责人信息
   - 部门成员列表
   - 上级部门和下级部门链接

3. **员工汇报关系**
   - 直属上级显示
   - 下属列表展示
   - 虚线汇报关系标注

4. **性能优化**
   - 虚拟滚动处理大型组织
   - 懒加载子节点
   - 缓存已加载数据

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`