# Tasks: 权限矩阵基础

## 实现类型

- **类型**: new
- **优先级**: critical
- **阶段**: Phase 2 - 核心部门

## 任务列表

### Task 1: 权限计算引擎

- **描述**: 实现权限计算引擎
- **文件**: `src-tauri/src/agent/permission/engine.rs`
- **验收**: 三层权限正确合并

### Task 2: 字段权限检查器

- **描述**: 实现字段级权限控制
- **文件**: `src-tauri/src/agent/permission/field_checker.rs`
- **验收**: 敏感字段正确过滤

### Task 3: 数据范围过滤器

- **描述**: 实现数据范围过滤
- **文件**: `src-tauri/src/agent/permission/scope_filter.rs`
- **验收**: personal/department/all 正确过滤

### Task 4: 权限中间件

- **描述**: 集成到工具执行管道
- **验收**: 所有工具调用经过权限检查

## 测试要点

- [x] 单元测试：权限计算逻辑 (engine.rs)
- [x] 单元测试：字段过滤 (field_checker.rs)
- [x] 单元测试：范围过滤 (scope_filter.rs)
- [x] 单元测试：权限中间件 (middleware.rs)
