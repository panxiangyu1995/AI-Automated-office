# Tasks: 三层记忆与Runtime集成

## 实现类型
- **类型**: enhancement
- **优先级**: high (P1)
- **阶段**: Phase 3 - P1核心

## 任务列表

### Task 1: 创建Runtime集成模块
- **描述**: 创建MemoryRuntimeIntegration
- **文件**:
  - `src-tauri/src/agent/memory/integration.rs` (新建)
- **验收**: 基础集成完成

### Task 2: 实现Hook事件自动捕获
- **描述**: 实现SessionStart/UserPrompt/PostToolUse/Stop Hooks
- **文件**:
  - `src-tauri/src/agent/memory/hooks.rs`
- **验收**: Hook正确触发

### Task 3: 实现记忆检索注入
- **描述**: 实现L1/L2检索和PromptBuilder注入
- **文件**:
  - `src-tauri/src/agent/memory/integration.rs`
- **验收**: 检索结果正确

### Task 4: 实现记忆更新决策
- **描述**: 实现should_remember和extract_memory_item
- **文件**:
  - `src-tauri/src/agent/memory/update.rs`
- **验收**: 决策准确

### Task 5: 创建记忆管理UI
- **描述**: 前端记忆管理组件
- **文件**:
  - `src/features/agent/components/MemoryManagement.tsx` (新建)
- **验收**: UI正常显示

### Task 6: 集成测试
- **描述**: 测试记忆集成
- **验收**: 测试通过
