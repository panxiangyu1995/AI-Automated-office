# Tasks: 后端Rust Agent基础架构

## 任务列表

### Task 101: 后端Rust Agent基础架构
- **描述**: 创建src-tauri/src/agent/目录和核心模块，为所有后续Agent任务提供后端基础设施。
- **类型**: backendOnly
- **优先级**: critical
- **阶段**: Phase 0 - 后端Rust基础设施
- **验收标准**:
  - 创建src-tauri/src/agent/目录结构
  - 创建agent/mod.rs模块入口
  - 创建agent/llm/目录和Provider trait定义
  - 创建agent/session/目录和会话管理基础结构
  - 创建agent/commands.rs Tauri命令接口定义
  - 创建Cargo.toml依赖配置（tokio, async-trait等）

## 执行顺序

1. 完成前置依赖（无）
2. 实现核心功能
3. 前后端对接
4. 集成测试
5. UI优化

## 测试要点

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E测试（根据优先级）
- [ ] 浏览器测试（如涉及UI）
