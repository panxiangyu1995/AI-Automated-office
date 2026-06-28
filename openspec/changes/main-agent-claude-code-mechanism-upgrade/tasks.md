# Tasks: 主通用Agent机制升级

## 变更元信息

- **类型**: new (新功能)
- **优先级**: high
- **阶段**: Phase 2 - Agent核心能力增强

## 任务列表

### 1. 内置Agent类型体系

- [ ] 1.1 创建 `src-tauri/src/agent/builtin_agent/` 目录结构
- [ ] 1.2 创建 `builtin_agent_types.rs` 定义 `BuiltinAgentType` 枚举
- [ ] 1.3 创建 `builtin_agent_config.rs` 定义 `AgentTypeConfig` 结构体
- [ ] 1.4 实现 `general-purpose` 类型配置（全工具访问）
- [ ] 1.5 实现 `explore` 类型配置（只读搜索工具）
- [ ] 1.6 实现 `plan` 类型配置（搜索工具+禁止写）
- [ ] 1.7 实现 `verification` 类型配置（只读+对抗性测试）
- [ ] 1.8 创建 `mod.rs` 导出所有类型和配置
- [ ] 1.9 编写单元测试验证类型过滤逻辑

### 2. 工具过滤与权限系统

- [ ] 2.1 扩展 `ToolRegistry` 添加 `ToolPermission` 枚举
- [ ] 2.2 添加 `ToolAccessPolicy` 结构体定义
- [ ] 2.3 实现 `filter_for_agent` 方法支持按Agent类型过滤
- [ ] 2.4 实现 glob 模式匹配（`*`, `?`, `[abc]`）
- [ ] 2.5 添加权限验证方法 `validate_tool_access`
- [ ] 2.6 实现动态权限更新机制
- [ ] 2.7 添加权限审计日志记录
- [ ] 2.8 编写单元测试验证过滤逻辑
- [ ] 2.9 编写集成测试验证权限边界

### 3. 生命周期Hook系统

- [ ] 3.1 创建 `src-tauri/src/agent/hooks/` 目录
- [ ] 3.2 定义 `AgentHook` trait（on_tool_call/on_tool_result/on_error/on_message_received）
- [ ] 3.3 定义 `HookContext` 结构体
- [ ] 3.4 定义 `HookConfig` 支持过滤条件
- [ ] 3.5 创建 `HookRegistry` 管理Hook注册和执行
- [ ] 3.6 实现 `LoggingHook` 预定义Hook
- [ ] 3.7 实现 `MetricsHook` 预定义Hook
- [ ] 3.8 实现 `PermissionHook` 预定义Hook
- [ ] 3.9 实现 `AuditHook` 预定义Hook
- [ ] 3.10 添加Hook错误处理机制
- [ ] 3.11 创建 `mod.rs` 导出所有类型
- [ ] 3.12 编写单元测试验证Hook执行顺序
- [ ] 3.13 编写集成测试验证Hook与Agent执行集成

### 4. 进度追踪系统

- [ ] 4.1 扩展 `ProgressUpdate` 结构体添加必要字段
- [ ] 4.2 定义 `TaskStatus` 枚举
- [ ] 4.3 创建 `ProgressTracker` 服务管理进度
- [ ] 4.4 实现实时进度推送机制（使用Channel）
- [ ] 4.5 实现进度数据持久化（SQLite）
- [ ] 4.6 实现活动追踪（Activity Tracking）
- [ ] 4.7 实现后台任务支持
- [ ] 4.8 实现进度通知机制
- [ ] 4.9 添加进度指标收集
- [ ] 4.10 编写单元测试验证进度计算
- [ ] 4.11 编写集成测试验证实时推送

### 5. 三层记忆系统适配

- [ ] 5.1 定义 `MemoryScope` 枚举（User/Project/Local）
- [ ] 5.2 创建 `LayeredMemory` 适配层
- [ ] 5.3 实现按作用域加载记忆（优先级：Local > Project > User）
- [ ] 5.4 实现 `build_memory_prompt` 方法
- [ ] 5.5 实现记忆文件截断（200行/25KB限制）
- [ ] 5.6 实现跨层记忆搜索
- [ ] 5.7 添加作用域访问控制
- [ ] 5.8 实现记忆持久化策略
- [ ] 5.9 编写单元测试验证记忆加载优先级
- [ ] 5.10 编写集成测试验证三层记忆流程

### 6. Agent执行流程集成

- [ ] 6.1 在Agent执行流程中集成工具过滤
- [ ] 6.2 在Agent执行流程中集成Hook调用
- [ ] 6.3 在Agent执行流程中集成进度追踪
- [ ] 6.4 添加Agent类型选择接口
- [ ] 6.5 验证端到端流程

### 7. 前端组件

- [ ] 7.1 创建 `AgentTypeSelector` 组件（类型选择）
- [ ] 7.2 创建 `ProgressDisplay` 组件（进度展示）
- [ ] 7.3 创建 `ActivityList` 组件（活动列表）
- [ ] 7.4 集成到现有ChatPanel
- [ ] 7.5 浏览器测试验证UI

## 测试要点

### 单元测试
- [ ] BuiltinAgentType 枚举转换测试
- [ ] 工具过滤白名单/黑名单测试
- [ ] glob 模式匹配测试
- [ ] Hook执行顺序测试
- [ ] 进度计算逻辑测试
- [ ] 记忆加载优先级测试
- [ ] 记忆截断逻辑测试

### 集成测试
- [ ] 工具过滤与权限边界测试
- [ ] Hook与Agent执行集成测试
- [ ] 进度追踪实时推送测试
- [ ] 三层记忆完整流程测试

### E2E测试
- [ ] Agent类型切换流程测试
- [ ] 进度追踪UI展示测试
- [ ] 敏感操作确认流程测试

### 浏览器测试
- [ ] Agent类型选择器渲染测试
- [ ] 进度面板展示测试
- [ ] 工具调用卡片显示测试

## 验收标准

1. 所有单元测试通过
2. 集成测试覆盖核心流程
3. `cargo check` 无错误
4. `cargo clippy` 无警告
5. 前端 `npm run lint` 无错误
6. 前端 `npm run build` 成功
7. 浏览器测试验证UI正确显示
