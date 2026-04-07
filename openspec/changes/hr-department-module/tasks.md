# Tasks: HR人事部门模块

## 实现类型
- **类型**: new
- **优先级**: critical
- **阶段**: Phase 1 - 核心部门

## 任务列表

### Task 1: 创建HR数据模型
- **描述**: 定义 Employee、Department、Position 类型
- **文件**: `src/features/hr/types/hr.types.ts`, `src-tauri/src/hr/types.rs`

### Task 2: 实现员工CRUD API
- **描述**: 创建员工管理的完整 CRUD API
- **文件**: `src-tauri/src/hr/commands.rs`, `src-tauri/src/hr/db.rs`

### Task 3: 实现部门树API
- **描述**: 创建部门管理的树形结构 API
- **文件**: `src-tauri/src/hr/department.rs`

### Task 4: 实现岗位管理API
- **描述**: 创建岗位管理的 CRUD API
- **文件**: `src-tauri/src/hr/position.rs`

### Task 5: 创建员工列表页面
- **描述**: 创建员工列表、分页、搜索功能
- **文件**: `src/features/hr/components/EmployeeList.tsx`

### Task 6: 创建员工表单页面
- **描述**: 创建员工新增/编辑表单
- **文件**: `src/features/hr/components/EmployeeForm.tsx`

### Task 7: 创建部门树页面
- **描述**: 创建部门树展示和编辑组件
- **文件**: `src/features/hr/components/DepartmentTree.tsx`

### Task 8: 创建入职引导流程
- **描述**: 创建新员工入职引导向导
- **文件**: `src/features/hr/components/OnboardingWizard.tsx`

### Task 9: 实现HR Subagent
- **描述**: 实现HR Subagent 配置和工具
- **文件**: `src-tauri/src/agent/tools/hr/`

## 测试要点

- [x] 单元测试 - 员工 CRUD、部门树、岗位管理
- [x] 集成测试 - HR API 集成
- [x] E2E 测试 - HR 模块完整流程
- [x] 浏览器测试 - 页面渲染和交互
