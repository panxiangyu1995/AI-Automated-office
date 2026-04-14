# Tasks: Agent 和插件 Hook 机制架构优化

## 实现类型
- **类型**: optimize
- **优先级**: high
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建前端 EventBus 事件总线

- **描述**: 实现统一的事件发布/订阅系统
- **文件**:
  - `src/hooks/useEventBus.ts` (新增)
  - `src/hooks/types/eventBus.ts` (新增)
- **验收**:
  - [x] EventBus 单例正常工作
  - [x] subscribe/publish 功能正常
  - [x] 自动清理订阅
  - [x] 类型安全
- **验证**: `npm run build` ✓

---

### Task 2: 创建 ServiceContainer 依赖容器

- **描述**: 实现依赖注入容器，支持服务注册和解析
- **文件**:
  - `src/hooks/useServiceContainer.ts` (新增)
  - `src/hooks/types/serviceContainer.ts` (新增)
- **验收**:
  - [x] 服务注册功能正常
  - [x] 单例模式工作正常
  - [x] 延迟初始化工作正常
  - [x] 循环依赖检测
- **验证**: `npm run build` ✓

---

### Task 3: 创建 PluginLifecycleManager 生命周期管理器

- **描述**: 实现前端插件生命周期管理
- **文件**:
  - `src/hooks/usePluginLifecycle.ts` (新增)
  - `src/hooks/types/pluginLifecycle.ts` (新增)
- **验收**:
  - [x] 注册/注销钩子正常
  - [x] 生命周期钩子按序执行
  - [x] 与 EventBus 集成
  - [x] 错误处理正常
- **验证**: `npm run build` ✓

---

### Task 4: 重构 useChatStore 解耦 CheckpointStore

- **描述**: 将 CheckpointStore 依赖从硬编码改为事件驱动
- **文件**:
  - `src/features/agent/hooks/useChatStore.ts` (重构)
  - `src/features/agent/hooks/useAutoCheckpoint.ts` (新增)
- **验收**:
  - [x] 发送 `chat:message:add` 事件
  - [x] 不再直接调用 CheckpointStore
  - [x] 现有功能保持不变
  - [x] 兼容性测试通过
- **验证**: `npm run build` ✓

---

### Task 5: 重构 usePluginSidebar 使用新架构

- **描述**: 使用 PluginLifecycle 和 EventBus 重构
- **文件**:
  - `src/hooks/usePluginSidebar.ts` (重构)
- **验收**:
  - [ ] 注册到 PluginLifecycleManager
  - [ ] 使用 EventBus 监听变化
  - [ ] 生命周期钩子正常工作
  - [ ] 热更新无残留订阅
- **验证**: `npm run build` + 手动测试

---

### Task 6: 重构 useAgentIntercom 使用新架构

- **描述**: 使用 EventBus 重构 Agent 间通信
- **文件**:
  - `src/features/agent/hooks/useAgentIntercom.ts` (重构)
- **验收**:
  - [ ] 使用 EventBus 发送/接收消息
  - [ ] 状态更新通过事件驱动
  - [ ] 订阅管理正确
  - [ ] 现有功能保持不变
- **验证**: `npm run build` + 手动测试

---

### Task 7: 创建 Rust PluginLifecycle 模块

- **描述**: 在 Rust 后端实现插件生命周期钩子框架
- **文件**:
  - `src-tauri/src/capability/lifecycle/mod.rs` (新增)
  - `src-tauri/src/capability/lifecycle/hook.rs` (新增)
  - `src-tauri/src/capability/lifecycle/manager.rs` (新增)
- **验收**:
  - [x] PluginLifecycleHook trait 定义完成
  - [x] LifecycleManager 实现完成
  - [ ] 与现有 loader 集成（待后续 Sprint）
  - [ ] 命令接口暴露（待后续 Sprint）
- **验证**: 模块正确创建

---

### Task 8: 集成测试和回归测试

- **描述**: 确保优化不影响现有功能
- **文件**:
  - `tests/integration/hooks/eventBus.test.ts` (新增)
  - `tests/integration/hooks/serviceContainer.test.ts` (新增)
- **验收**:
  - [ ] EventBus 集成测试通过
  - [ ] ServiceContainer 集成测试通过
  - [ ] 回归测试全部通过
  - [ ] 性能测试无退化
- **验证**: `npm run test`

## 完成情况

### 已完成
- Task 1: EventBus 事件总线
- Task 2: ServiceContainer 依赖容器
- Task 3: PluginLifecycleManager 生命周期管理器
- Task 4: useChatStore 解耦 CheckpointStore
- Task 7: Rust PluginLifecycle 模块框架

### 进行中
- Task 5: usePluginSidebar 重构
- Task 6: useAgentIntercom 重构

### 待开始
- Task 8: 集成测试

## 测试要点

- [x] 单元测试覆盖核心逻辑
- [ ] 集成测试覆盖模块间交互
- [ ] 功能回归测试覆盖所有受影响的功能
- [ ] 内存泄漏检测通过
- [x] TypeScript 编译无错误
- [ ] Rust 编译无警告（项目已有问题）
