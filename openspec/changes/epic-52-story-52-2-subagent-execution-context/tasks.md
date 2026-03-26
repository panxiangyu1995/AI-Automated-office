# Tasks: Sub-Agent执行上下文 - 隔离环境

## 任务列表

### Task 116: Sub-Agent执行上下文 - 隔离环境

- **描述**: 创建Sub-Agent执行上下文，实现独立的记忆、工具集、权限配置，确保Sub-Agent执行的隔离性。
- **实现类型**: new（新功能开发）
- **优先级**: high
- **阶段**: Phase 2 - Sub-Agent运行时实现

#### 验收标准

| 验收项 | 标准描述 | 验证方式 |
|--------|----------|----------|
| AC-1 | 创建`SubAgentExecutionContext`类，包含唯一标识、状态、嵌套深度等核心属性 | 代码审查+单元测试 |
| AC-2 | 实现基于配置的记忆注入机制，能够根据`MemoryScopeConfig`过滤和注入记忆 | 单元测试验证过滤逻辑 |
| AC-3 | 实现工具集动态过滤，确保`allowedTools`白名单外的工具无法使用 | 集成测试验证过滤效果 |
| AC-4 | 实现权限上下文的隔离与继承，支持`PermissionLevel`级别控制 | 单元测试验证权限判断 |
| AC-5 | 创建`SubAgentSystemPromptBuilder`，能够组装角色、能力、约束等系统提示词 | 单元测试验证提示词内容 |
| AC-6 | 实现Tauri命令接口，提供`create_subagent_context`等CRUD操作 | API集成测试 |
| AC-7 | 上下文验证机制完整，能在执行前发现配置错误 | 错误场景测试 |

#### 任务分解

1. **前端类型定义**
   - 创建`src/features/agent/types/subagent-context.types.ts`
   - 定义`SubAgentContextConfig`、`MemoryScopeConfig`、`ToolFilterResult`等类型
   - 导出类型供其他模块使用

2. **后端核心实现**
   - 创建`src-tauri/src/agent/subagent/mod.rs`子模块入口
   - 实现`SubAgentExecutionContext`核心结构体
   - 实现上下文状态管理和验证逻辑

3. **记忆注入模块**
   - 创建`src-tauri/src/agent/subagent/memory.rs`
   - 实现`MemoryInjector`进行记忆检索和过滤
   - 支持个人记忆、企业知识、会话记忆、错题集四类记忆

4. **工具过滤模块**
   - 创建`src-tauri/src/agent/subagent/tools.rs`
   - 实现`ToolFilter`进行工具白名单过滤
   - 实现工具描述符的脱敏处理

5. **权限上下文模块**
   - 创建`src-tauri/src/agent/subagent/permission.rs`
   - 实现`PermissionContext`支持权限继承和覆盖
   - 实现四级权限级别控制

6. **系统提示词构建器**
   - 创建`src-tauri/src/agent/subagent/prompt.rs`
   - 实现`SubAgentSystemPromptBuilder`组装系统提示词
   - 支持角色、能力、约束、上下文信息的注入

7. **Tauri命令接口**
   - 创建`src-tauri/src/agent/subagent/commands.rs`
   - 实现`create_subagent_context`命令
   - 实现`get_subagent_context`、`update_subagent_context_status`命令

8. **集成与测试**
   - 编写单元测试覆盖核心逻辑
   - 编写集成测试验证前后端对接
   - 更新`src-tauri/src/agent/mod.rs`导出新模块

## 执行顺序

1. **Phase 1: 前端类型定义**（1天）
   - 定义完整的TypeScript类型接口
   - 与后端确认接口设计

2. **Phase 2: 后端核心实现**（2天）
   - 实现`SubAgentExecutionContext`结构体
   - 实现上下文状态管理和验证

3. **Phase 3: 功能模块实现**（3天）
   - 记忆注入模块
   - 工具过滤模块
   - 权限上下文模块
   - 系统提示词构建器

4. **Phase 4: Tauri命令接口**（1天）
   - 实现Tauri命令
   - 前后端联调

5. **Phase 5: 测试与完善**（1天）
   - 单元测试
   - 集成测试
   - 文档完善

## 测试要点

### 单元测试

- [ ] `SubAgentExecutionContext`创建和验证逻辑测试
- [ ] `MemoryInjector`记忆过滤和注入测试
- [ ] `ToolFilter`工具白名单过滤测试
- [ ] `PermissionContext`权限判断和继承测试
- [ ] `SubAgentSystemPromptBuilder`提示词组装测试

### 集成测试

- [ ] Tauri命令前后端对接测试
- [ ] 上下文创建完整流程测试
- [ ] 工具调用权限验证流程测试

### E2E测试

- [ ] Sub-Agent创建到执行的完整流程测试（根据优先级）

### 浏览器测试

- [ ] 前端类型定义正确性验证

## 关键代码路径

```
前端：
src/features/agent/types/subagent-context.types.ts

后端：
src-tauri/src/agent/subagent/
├── mod.rs
├── context.rs
├── memory.rs
├── tools.rs
├── permission.rs
├── prompt.rs
└── commands.rs
```

## 里程碑检查点

1. **M1**: 前端类型定义完成并评审通过
2. **M2**: `SubAgentExecutionContext`核心实现通过单元测试
3. **M3**: 各功能模块实现并通过集成测试
4. **M4**: Tauri命令接口完成，前后端联调通过
5. **M5**: 所有测试用例通过，文档完善
