# Proposal: Sub-Agent结果汇总与回传

## 变更类型
- [x] 新功能 (new)

## 背景

当Sub-Agent完成执行后，其执行结果需要返回给主Agent进行汇总和处理。这个过程涉及多个关键环节：

1. **结果归一化**：不同Sub-Agent可能返回不同格式的结果，需要统一格式便于主Agent处理
2. **执行摘要生成**：Sub-Agent的执行过程需要生成摘要，帮助主Agent理解执行情况
3. **上下文整合**：Sub-Agent执行过程中产生的新上下文信息需要合并到主Agent上下文中
4. **失败回退处理**：当Sub-Agent执行失败时，需要提供明确的错误信息和回退建议

当前系统缺少Sub-Agent结果返回机制，需要创建`SubAgentResultNormalizer`来实现这一核心能力，确保主Agent能够正确接收和处理Sub-Agent的执行结果。

## 目标

实现Sub-Agent结果汇总与回传机制，确保执行结果正确返回并整合到主Agent上下文，具体目标包括：

- 创建`SubAgentResultNormalizer`结果归一化器，统一不同Sub-Agent的返回格式
- 实现Sub-Agent执行摘要自动生成，包含执行时间、工具调用、输出概要等信息
- 实现结果与主Agent上下文的整合机制，支持记忆和状态的合并
- 添加Sub-Agent执行失败的回退处理机制
- 提供结果可视化展示数据结构

## 范围

### 包含

- `SubAgentResultNormalizer`结果归一化器
- Sub-Agent执行摘要自动生成
- 结果与主Agent上下文整合
- 失败回退处理机制
- 结果可视化数据结构
- Rust后端实现（`src-tauri/src/agent/subagent/result.rs`）
- 前端类型定义与接口

### 不包含

- Sub-Agent执行上下文的创建和管理（由Story 52.2覆盖）
- Sub-Agent嵌套调用控制（由Story 52.3覆盖）
- 前端UI界面实现（由其他Story覆盖）

## 影响范围

### 前端

- **新增文件**：
  - `src/features/agent/types/subagent-result.types.ts` - 结果相关类型定义
- **修改文件**：
  - `src/features/agent/types/index.ts` - 添加结果类型导出
- **影响范围**：前端定义结果处理的类型接口

### 后端

- **新增文件**：
  - `src-tauri/src/agent/subagent/result.rs` - 结果归一化器核心实现
  - `src-tauri/src/agent/subagent/summary.rs` - 执行摘要生成实现
  - `src-tauri/src/agent/subagent/integration.rs` - 上下文整合实现
- **修改文件**：
  - `src-tauri/src/agent/subagent/mod.rs` - 添加新模块导出
  - `src-tauri/src/agent/subagent/nested.rs` - 集成结果返回逻辑
- **影响范围**：后端结果处理的核心逻辑实现

### 数据库

- **变更说明**：本Story不涉及数据库直接变更
- **间接影响**：结果可能需要存储到现有的审计日志表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 结果格式不统一导致解析失败 | 中 | 高 | 定义严格的结果Schema，验证不通过则返回错误 |
| 执行摘要生成消耗过多Token | 中 | 中 | 限制摘要长度，使用固定模板 |
| 上下文整合产生冲突 | 中 | 中 | 实现冲突解决策略，优先保留主Agent数据 |
| 循环调用导致结果返回死循环 | 低 | 高 | 在嵌套控制Story中已实现深度限制 |
| 结果数据过大导致传输问题 | 低 | 中 | 实现结果数据压缩和分页 |

## 依赖

### 前置依赖

- **Story 52.2** (Sub-Agent执行上下文)：提供执行上下文基础，结果返回需要上下文信息
- **Story 52.3** (Sub-Agent嵌套调用控制)：提供调用链路信息用于摘要生成
- **Task 101** (后端Rust Agent基础架构)：提供基础目录结构

### 后置依赖

- **Story 52.5** (Sub-Agent执行监控与诊断)：依赖本Story提供的执行摘要数据

### 同期依赖

- **Story 52.1**: Sub-Agent路由与结果返回的协同工作

## 实现步骤

1. **创建SubAgentResultNormalizer结果归一化器**
   - 定义统一的结果数据结构`SubAgentResult`
   - 实现不同格式结果的转换逻辑
   - 实现结果验证机制

2. **实现Sub-Agent执行摘要自动生成**
   - 收集执行过程中的关键信息
   - 生成结构化执行摘要
   - 支持摘要的长度控制

3. **实现结果与主Agent上下文的整合**
   - 定义上下文整合策略
   - 实现记忆合并逻辑
   - 实现状态更新逻辑

4. **添加Sub-Agent执行失败的回退处理**
   - 定义失败类型和错误码
   - 实现回退建议生成
   - 实现错误信息的脱敏处理

5. **实现结果的可视化数据结构**
   - 定义前端展示所需的数据结构
   - 支持调用链路的可视化
   - 支持执行状态的时间线展示
