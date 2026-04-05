# Tasks: 模型分层与自动路由

## 实现类型

- **类型**: new
- **优先级**: high
- **阶段**: Phase 3 - 高级特性

## 任务列表

### Task 1: 模型路由器

- **描述**: 实现模型选择逻辑
- **文件**: `src-tauri/src/agent/model_router/router.rs`
- **验收**: 复杂度评估准确

### Task 2: 复杂度评估器

- **描述**: 实现任务复杂度评估
- **文件**: `src-tauri/src/agent/model_router/complexity.rs`
- **验收**: 覆盖所有任务类型

### Task 3: 动态切换

- **描述**: 实现执行过程中模型动态切换
- **文件**: `src-tauri/src/agent/model_router/switcher.rs`
- **验收**: 切换逻辑正确

### Task 4: 成本统计

- **描述**: 统计各模型使用量
- **验收**: 准确记录 token 使用

## 测试要点

- [x] 单元测试：复杂度评估
- [x] 单元测试：模型选择
- [x] 集成测试：规则匹配

### 实现记录

#### Task 1: 模型路由器 (router.rs)
- [x] 实现 ModelRouter 结构
- [x] 实现复杂度评估
- [x] 实现模型选择逻辑

#### Task 2: 复杂度评估
- [x] Simple: OCR、简单查询、意图分类
- [x] Medium: 一般查询
- [x] Complex: 报表、多步骤推理、跨部门协调
- [x] NoTool: 标题、摘要、压缩

#### Task 3: 规则系统
- [x] 实现 ModelSelectionRule
- [x] 实现 SelectionCondition
- [x] 支持自定义规则

#### Task 4: 模型配置
- [x] Primary/Light/Small 三层模型配置
- [x] 温度参数覆盖
- [x] Token 限制配置
