# Tasks: Agent Runtime 架构重构 - Phase C+D: 子系统精简与清理

## 实现类型

- **类型**: refactor（架构重构）
- **优先级**: high
- **阶段**: 架构升级迭代 Phase C+D

## 任务列表

### Task C1: 简化路由系统

- **描述**: 将 `SubAgentRoutingService` 简化为 `SimpleRouter`，保留 Keyword 匹配
- **文件**: `src-tauri/src/agent/routing.rs` (重写)
- **验收**: 路由匹配功能正常工作
- **验证**: `cargo test`

### Task C2: 删除路由相关空壳模块

- **描述**: 删除 SemanticRouter、routing_types.rs、model_router.rs
- **文件**: `src-tauri/src/agent/router/`, `routing_types.rs`, `model_router.rs` (删除)
- **验收**: 相关文件删除后编译通过
- **验证**: `cargo check`

### Task C3: 精简记忆系统 MemoryScope

- **描述**: 删除 Inherited 和 SessionOnly 枚举值
- **文件**: `src-tauri/src/agent/layered_memory/layered_types.rs`
- **验收**: MemoryScope 枚举简化但功能保留
- **验证**: `cargo test`

### Task C4: 合并监控模块

- **描述**: 将 6 个监控/审计/事件模块合并为 1 个 monitoring.rs
- **文件**: `src-tauri/src/agent/monitoring.rs` (重写)
- **验收**: 事件推送和指标收集功能保留
- **验证**: `cargo test`

### Task C5: 删除空壳模块

- **描述**: 删除 execution_integration.rs、pilot.rs
- **文件**: `execution_integration.rs`, `pilot.rs` (删除)
- **验收**: 空壳模块删除后编译通过
- **验证**: `cargo check`

### Task C6: 更新 mod.rs 导出

- **描述**: 将导出从 55 个减少到 ~20 个
- **文件**: `src-tauri/src/agent/mod.rs`
- **验收**: 所有保留模块正确导出
- **验证**: `cargo check && cargo build`

### Task D1: 功能回归验证

- **描述**: 运行完整测试套件验证功能回归
- **文件**: 全局
- **验收**: 所有 cargo test 通过
- **验证**: `cargo test --lib && cargo test`

### Task D2: 前端集成验证

- **描述**: 验证前端代码与重构后的后端兼容
- **文件**: `src/features/agent/`
- **验收**: npm run lint && npm run build 通过
- **验证**: `npm run lint && npm run build`

### Task D3: 浏览器端到端测试

- **描述**: 在浏览器中测试 Agent 执行流程
- **文件**: 浏览器测试
- **验收**: Agent 类型选择、执行、进度展示正常工作
- **验证**: Playwright 测试通过

## 测试要点

- [x] 单元测试: 路由、记忆、监控相关测试通过
- [x] 集成测试: cargo test 全部通过
- [x] 编译检查: `cargo check && cargo build && cargo clippy -- -D warnings`
- [x] 前端检查: `npm run lint && npm run build`
- [x] 浏览器测试: Agent 执行流程端到端测试通过
