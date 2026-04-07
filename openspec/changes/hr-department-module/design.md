# Design: HR人事部门模块

## 技术方案

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    HR 部门架构                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │ 员工管理   │     │ 部门管理   │     │ 岗位管理   │  │
│  │ Employee   │     │ Department │     │ Position   │  │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘  │
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             │                             │
│                    ┌────────▼────────┐                    │
│                    │   HR Subagent  │                    │
│                    │  HR 智能助手  │                    │
│                    └─────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据模型

```typescript
// 员工
interface Employee {
  id: string;
  employeeCode: string;        // 工号
  name: string;
  email: string;
  phone?: string;
  departmentId: string;        // 所属部门
  positionId: string;          // 岗位
  managerId?: string;          // 直接主管
  hireDate: Date;
  status: 'active' | 'inactive' | 'probation';
  avatar?: string;
  metadata: Record<string, unknown>;
}

// 部门
interface Department {
  id: string;
  code: string;
  name: string;
  parentId?: string;           // 上级部门
  managerId?: string;          // 部门负责人
  level: number;              // 层级
  sortOrder: number;
  children?: Department[];
}

// 岗位
interface Position {
  id: string;
  code: string;
  name: string;
  level: number;             // 职级
  departmentId?: string;
  permissions: string[];
}
```

### API 设计

```typescript
// 员工 API
POST   /api/hr/employees                    // 创建员工
GET    /api/hr/employees                   // 列表员工
GET    /api/hr/employees/:id              // 获取员工详情
PUT    /api/hr/employees/:id              // 更新员工
DELETE /api/hr/employees/:id              // 删除员工
POST   /api/hr/employees/batch            // 批量导入

// 部门 API
POST   /api/hr/departments                 // 创建部门
GET    /api/hr/departments                // 部门树
GET    /api/hr/departments/:id           // 部门详情
PUT    /api/hr/departments/:id           // 更新部门
DELETE /api/hr/departments/:id           // 删除部门

// 岗位 API
POST   /api/hr/positions                  // 创建岗位
GET    /api/hr/positions                 // 岗位列表
PUT    /api/hr/positions/:id            // 更新岗位
DELETE /api/hr/positions/:id             // 删除岗位
```

### 前端结构

```
src/features/hr/
├── types/
│   └── hr.types.ts
├── api/
│   └── hrApi.ts
├── stores/
│   └── hrStore.ts
├── components/
│   ├── EmployeeList.tsx
│   ├── EmployeeForm.tsx
│   ├── DepartmentTree.tsx
│   ├── DepartmentForm.tsx
│   ├── PositionList.tsx
│   └── OnboardingWizard.tsx
└── index.ts
```

## 验收标准

1. 员工 CRUD 功能正常
2. 部门树展示正常
3. 岗位管理正常
4. 入职引导流程可用
5. HR Subagent 可以回答员工相关问题
