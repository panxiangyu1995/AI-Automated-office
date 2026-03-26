# Tasks: Sub-Agent嵌套调用控制

## 任务列表

### Task 117: Sub-Agent嵌套调用控制

- **描述**: 实现Sub-Agent嵌套调用机制，支持最多3层嵌套，包含深度控制和调用链路追踪。
- **实现类型**: new（新功能开发）
- **优先级**: high
- **阶段**: Phase 2 - Sub-Agent运行时实现

#### 验收标准

| 验收项 | 标准描述 | 验证方式 |
|--------|----------|----------|
| AC-1 | 实现嵌套深度计数器，初始深度为0，最大允许3层 | 单元测试 |
| AC-2 | 创建调用栈追踪器，支持push/pop操作 | 单元测试 |
| AC-3 | 实现循环调用检测，防止A→B→A死循环 | 单元测试 |
| AC-4 | 实现超时控制，支持按层级配置超时时间 | 集成测试 |
| AC-5 | 生成调用链路可视化数据（CallChainData） | 单元测试验证结构 |
| AC-6 | 实现`execute_nested_call` Tauri命令 | API集成测试 |
| AC-7 | 实现`cancel_nested_call`取消调用功能 | 错误场景测试 |

#### 任务分解

1. **前端类型定义**
   - 创建`src/features/agent/types/subagent-nested.types.ts`
   - 定义`NestedCallRequest`、`CallChainData`、`CallStackInfo`等类型
   - 导出类型供其他模块使用

2. **嵌套调用控制器**
   - 创建`src-tauri/src/agent/subagent/nested.rs`
   - 实现`NestedCallController`核心结构
   - 实现深度检查、超时控制、执行逻辑

3. **调用栈追踪器**
   - 创建`src-tauri/src/agent/subagent/call_stack.rs`
   - 实现`CallStackTracker`调用栈追踪
   - 实现栈帧push/pop/get操作

4. **循环检测器**
   - 创建`src-tauri/src/agent/subagent/cycle_detector.rs`
   - 实现`CycleDetector`循环检测
   - 实现调用图管理和循环检测算法

5. **Tauri命令接口**
   - 在`src-tauri/src/agent/subagent/commands.rs`中添加新命令
   - 实现`execute_nested_call`命令
   - 实现`get_call_stack_info`、`cancel_nested_call`命令

6. **上下文集成**
   - 修改`src-tauri/src/agent/subagent/context.rs`
   - 集成嵌套深度控制方法
   - 实现`increment_nesting_depth`、`decrement_nesting_depth`

7. **集成与测试**
   - 编写单元测试覆盖核心逻辑
   - 编写集成测试验证前后端对接
   - 更新模块导出

## 执行顺序

1. **Phase 1: 前端类型定义**（0.5天）
   - 定义完整的TypeScript类型接口
   - 与后端确认接口设计

2. **Phase 2: 核心模块实现**（3天）
   - 嵌套调用控制器
   - 调用栈追踪器
   - 循环检测器

3. **Phase 3: 上下文集成**（1天）
   - 扩展SubAgentExecutionContext
   - 集成深度控制

4. **Phase 4: Tauri命令接口**（1天）
   - 实现Tauri命令
   - 前后端联调

5. **Phase 5: 测试与完善**（1.5天）
   - 单元测试
   - 集成测试
   - 文档完善

## 测试要点

### 单元测试

- [ ] `NestedCallController`深度检查逻辑测试
- [ ] `CallStackTracker` push/pop操作测试
- [ ] `CycleDetector`循环检测测试（包括直接自调用、多层循环）
- [ ] 超时时间计算测试
- [ ] 调用链数据生成测试

### 集成测试

- [ ] `execute_nested_call`完整流程测试
- [ ] 深度超出3层时返回正确错误
- [ ] 循环调用检测正确拒绝
- [ ] 超时后正确清理资源

### E2E测试

- [ ] 完整嵌套调用链路测试（根据优先级）

### 浏览器测试

- [ ] 前端类型定义正确性验证

## 关键代码路径

```
前端：
src/features/agent/types/subagent-nested.types.ts

后端：
src-tauri/src/agent/subagent/
├── nested.rs          # 嵌套调用控制器
├── call_stack.rs      # 调用栈追踪器
├── cycle_detector.rs  # 循环检测器
└── context.rs         # 上下文（扩展）
```

## 里程碑检查点

1. **M1**: 前端类型定义完成并评审通过
2. **M2**: `NestedCallController`核心实现通过单元测试
3. **M3**: 调用栈追踪和循环检测通过单元测试
4. **M4**: Tauri命令接口完成，前后端联调通过
5. **M5**: 所有测试用例通过，文档完善
