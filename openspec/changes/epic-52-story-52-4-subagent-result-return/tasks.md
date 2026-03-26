# Tasks: Sub-Agent结果汇总与回传

## 任务列表

### Task 118: Sub-Agent结果汇总与回传

- **描述**: 实现Sub-Agent执行结果返回主Agent的机制，包括结果格式化、上下文整合、执行摘要生成。
- **实现类型**: new（新功能开发）
- **优先级**: medium
- **阶段**: Phase 2 - Sub-Agent运行时实现

#### 验收标准

| 验收项 | 标准描述 | 验证方式 |
|--------|----------|----------|
| AC-1 | 创建`SubAgentResultNormalizer`结果归一化器 | 单元测试 |
| AC-2 | 实现不同格式结果的转换和验证 | 单元测试 |
| AC-3 | 生成包含overview、toolsUsed、keyDecisions等字段的执行摘要 | 单元测试 |
| AC-4 | 实现上下文整合功能，支持Replace/Merge/Append/Ignore策略 | 集成测试 |
| AC-5 | 实现失败回退处理，生成fallbackSuggestions | 单元测试 |
| AC-6 | 生成ResultVisualizationData可视化数据 | 单元测试验证结构 |
| AC-7 | 实现`normalize_result`、`integrate_to_main_context`等Tauri命令 | API集成测试 |

#### 任务分解

1. **前端类型定义**
   - 创建`src/features/agent/types/subagent-result.types.ts`
   - 定义`SubAgentResult`、`ExecutionSummary`、`ContextIntegrationRequest`等类型
   - 导出类型供其他模块使用

2. **结果归一化器**
   - 创建`src-tauri/src/agent/subagent/result.rs`
   - 实现`SubAgentResultNormalizer`核心结构
   - 实现多种格式的解析和转换
   - 实现结果验证机制

3. **执行摘要生成**
   - 创建`src-tauri/src/agent/subagent/summary.rs`
   - 实现`ExecutionSummaryGenerator`执行摘要生成
   - 实现overview、mainOutput、toolsUsed等字段的生成
   - 实现suggestedNextSteps建议生成

4. **上下文整合**
   - 创建`src-tauri/src/agent/subagent/integration.rs`
   - 实现`ContextIntegrator`上下文整合器
   - 实现记忆合并和冲突解决
   - 实现状态合并和冲突解决

5. **失败回退处理**
   - 在`result.rs`中添加失败处理逻辑
   - 实现`generate_fallback_suggestions`方法
   - 实现错误的分类和脱敏

6. **Tauri命令接口**
   - 在`src-tauri/src/agent/subagent/commands.rs`中添加新命令
   - 实现`normalize_result`命令
   - 实现`integrate_to_main_context`命令
   - 实现`get_result_visualization`命令

7. **集成与测试**
   - 编写单元测试覆盖核心逻辑
   - 编写集成测试验证前后端对接
   - 更新模块导出

## 执行顺序

1. **Phase 1: 前端类型定义**（0.5天）
   - 定义完整的TypeScript类型接口
   - 与后端确认接口设计

2. **Phase 2: 核心模块实现**（3天）
   - 结果归一化器
   - 执行摘要生成器
   - 上下文整合器

3. **Phase 3: 失败处理和可视化**（1天）
   - 失败回退处理
   - 可视化数据生成

4. **Phase 4: Tauri命令接口**（1天）
   - 实现Tauri命令
   - 前后端联调

5. **Phase 5: 测试与完善**（1.5天）
   - 单元测试
   - 集成测试
   - 文档完善

## 测试要点

### 单元测试

- [ ] `SubAgentResultNormalizer`解析和转换测试
- [ ] `ExecutionSummaryGenerator`摘要生成测试
- [ ] `ContextIntegrator`记忆和状态合并测试
- [ ] 冲突解决逻辑测试
- [ ] 失败回退建议生成测试

### 集成测试

- [ ] `normalize_result`完整流程测试
- [ ] `integrate_to_main_context`各策略测试
- [ ] 多种输入格式的兼容测试

### E2E测试

- [ ] Sub-Agent执行到结果返回完整流程测试（根据优先级）

### 浏览器测试

- [ ] 前端类型定义正确性验证

## 关键代码路径

```
前端：
src/features/agent/types/subagent-result.types.ts

后端：
src-tauri/src/agent/subagent/
├── result.rs        # 结果归一化器
├── summary.rs       # 执行摘要生成
├── integration.rs  # 上下文整合
└── commands.rs     # Tauri命令
```

## 里程碑检查点

1. **M1**: 前端类型定义完成并评审通过
2. **M2**: `SubAgentResultNormalizer`通过单元测试
3. **M3**: 执行摘要和上下文整合通过单元测试
4. **M4**: Tauri命令接口完成，前后端联调通过
5. **M5**: 所有测试用例通过，文档完善
