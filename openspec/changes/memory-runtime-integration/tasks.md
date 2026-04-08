# Tasks: 三层记忆与Runtime集成

## 实现类型
- **类型**: enhancement
- **优先级**: high (P1)
- **阶段**: Phase 3 - P1核心

## 任务列表

### Task 1: 创建Runtime集成模块
- **描述**: 创建MemoryRuntimeIntegration
- **文件**:
  - `src-tauri/src/agent/memory/runtime_integration.rs` (新建)
- **验收**: 基础集成完成
- **状态**: ✅ 已完成

### Task 2: 实现Hook事件自动捕获
- **描述**: 实现SessionStart/UserPrompt/PostToolUse/Stop Hooks
- **文件**:
  - `src-tauri/src/agent/memory/runtime_integration.rs`
- **验收**: Hook正确触发
- **状态**: ✅ 已完成

### Task 3: 实现记忆检索注入
- **描述**: 实现L1/L2检索和PromptBuilder注入
- **文件**:
  - `src-tauri/src/agent/memory/runtime_integration.rs`
- **验收**: 检索结果正确
- **状态**: ✅ 已完成

### Task 4: 实现记忆更新决策
- **描述**: 实现should_remember和extract_memory_item
- **文件**:
  - `src-tauri/src/agent/memory/runtime_integration.rs`
- **验收**: 决策准确
- **状态**: ✅ 已完成

### Task 5: 创建记忆管理UI
- **描述**: 前端记忆管理组件
- **文件**:
  - `src/features/agent/components/MemoryManagement.tsx`
- **验收**: UI正常显示
- **状态**: ⏳ 待前端实现

### Task 6: 集成测试
- **描述**: 测试记忆集成
- **验收**: 测试通过
- **状态**: ⏳ 待测试

## 已实现功能

### 后端 (Rust)

1. **agent/memory/runtime_integration.rs** - 三层记忆与Runtime集成
   - `MemoryItem` - 记忆项结构
   - `MemoryType` - 记忆类型枚举
   - `MemoryRetrievalResult` - 检索结果
   - `MemoryRuntimeIntegration` - 集成服务
     - `on_session_start` - SessionStart Hook
     - `on_user_prompt` - UserPrompt Hook
     - `on_tool_result` - PostToolUse Hook
     - `on_session_end` - SessionEnd Hook
     - `should_remember` - 判断是否应该记住
     - `extract_memory_item` - 提取记忆项
     - `is_key_result` - 检查是否关键结果
     - `search` - 检索记忆

## 需求覆盖

| FR | 需求 | 实现位置 |
|----|------|----------|
| FR14-4 | 关键事实自动提取到L1 | runtime_integration.rs:extract_memory_item |
| FR14-5 | L1个人记忆检索注入 | runtime_integration.rs:on_session_start |
| FR14-6 | L2企业知识检索注入 | runtime_integration.rs:search |
| FR14-7 | Hook事件自动捕获 | runtime_integration.rs:on_*_hook methods |
| FR14-8 | 记忆更新决策引擎 | runtime_integration.rs:should_remember |
| FR14-9 | 会话结束提取关键事实 | runtime_integration.rs:on_session_end |
| FR14-10 | L3图记忆关联 | (架构预留) |
| FR14-11 | 重要性评分计算 | runtime_integration.rs:calculate_importance |
| FR14-12 | 记忆统计与追踪 | runtime_integration.rs:get_stats |