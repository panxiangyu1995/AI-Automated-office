# 任务: 工作流自动化

## 步骤清单

### Task 1: 创建workflow模块结构
- [ ] 创建 `src-tauri/src/workflow/mod.rs`
- [ ] 创建 `src-tauri/src/workflow/types.rs` - 工作流类型定义
- [ ] 创建 `src-tauri/src/workflow/engine.rs` - 执行引擎
- [ ] 创建 `src-tauri/src/workflow/store.rs` - 状态持久化

### Task 2: 实现工作流定义
- [ ] 实现 WorkflowDefinition 结构体
- [ ] 实现 WorkflowStep 枚举（Action/Approval/Condition/End）
- [ ] 实现工作流DSL解析器

### Task 3: 实现执行引擎
- [ ] 实现 WorkflowExecutor 结构体
- [ ] 实现 execute() 主循环
- [ ] 实现条件分支处理
- [ ] 实现审批节点处理

### Task 4: 状态持久化
- [ ] 实现工作流状态保存到SQLite
- [ ] 实现工作流状态恢复
- [ ] 实现执行历史记录

### Task 5: 集成定时任务
- [ ] 修改 `agent/tools/automation/mod.rs`
- [ ] 集成工作流引擎到 cron_schedule
- [ ] 支持触发式工作流

### Task 6: 测试验证
- [ ] 单元测试: 工作流DSL解析
- [ ] 单元测试: 条件分支逻辑
- [ ] 集成测试: 完整工作流执行
