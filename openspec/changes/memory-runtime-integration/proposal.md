# Proposal: 三层记忆与Runtime集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

三层记忆系统存储已存在：
- `src-tauri/src/agent/memory/` - 记忆模块

**缺失部分**：与AgentRuntime的集成。

## 目标

将三层记忆系统与AgentRuntime集成（FR14-4至FR14-12）：
1. Hook事件自动捕获
2. 记忆检索注入PromptBuilder
3. 记忆更新决策引擎
4. 关键事实提取到L1层
5. 记忆管理UI

## 范围

### 包含
- 记忆Hook集成
- PromptBuilder注入
- 更新决策引擎
- UI组件

### 不包含
- 记忆存储（已有）

## 影响范围

### 后端
- `src-tauri/src/agent/memory/integration.rs` - Runtime集成模块

### 前端
- `src/features/agent/components/MemoryManagement.tsx`

## 依赖

- **前置依赖**: Task 158 (三层记忆系统)
- **后置依赖**: Task 209 (MVP最终集成测试)

## 验收标准

1. 记忆自动捕获Hook正常工作
2. 检索结果正确注入Prompt
3. 关键事实持久化到L1层
