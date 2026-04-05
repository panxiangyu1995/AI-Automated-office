# Tasks: 意图路由引擎

## 实现类型

- **类型**: new
- **优先级**: critical
- **阶段**: Phase 3 - 高级特性

## 任务列表

### Task 1: 意图分类器

- **描述**: 实现关键词匹配和语义分类
- **文件**: `src-tauri/src/agent/router/classifier.rs`
- **验收**: 关键词匹配准确率 > 90%

### Task 2: 路由决策器

- **描述**: 实现路由决策逻辑
- **文件**: `src-tauri/src/agent/router/router.rs`
- **验收**: 正确路由到目标 Subagent

### Task 3: 委派执行器

- **描述**: 实现委派协议执行
- **文件**: `src-tauri/src/agent/router/executor.rs`
- **验收**: 超时和错误处理正确

### Task 4: 路由中间件

- **描述**: 集成到主 Agent Runtime
- **验收**: 路由透明执行

## 测试要点

- [x] 单元测试：关键词匹配
- [x] 集成测试：路由决策
- [x] E2E 测试：完整委派流程

### 实现记录

#### Task 1: 意图分类器 (classifier.rs)
- [x] 实现关键词匹配规则
- [x] 实现语义分类（使用 LLM）
- [x] 实现默认关键词规则（finance, sales, hr, cross-department）
- [x] 单元测试

#### Task 2: 路由决策器 (router.rs)
- [x] 实现路由规则表
- [x] 实现权限检查
- [x] 实现模型选择（Haiku/Sonnet/Opus）
- [x] 实现约束构建

#### Task 3: 委派执行器 (executor.rs)
- [x] 实现委派协议
- [x] 实现超时处理
- [x] 实现会话管理
- [x] 错误处理

#### Task 4: 路由中间件
- [x] 集成到 agent/mod.rs
- [x] 导出类型和接口
