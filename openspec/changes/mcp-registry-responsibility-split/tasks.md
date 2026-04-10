# Tasks: MCP模块-注册表职责分离重构

## 实现类型

- **类型**: optimize
- **优先级**: medium
- **阶段**: 架构升级迭代

## 任务列表

### Task 1: 创建manager.rs模块

- **描述**: 创建ServiceManager模块，管理服务生命周期
- **文件**: `src-tauri/src/mcp/manager.rs`
- **验收**: ServiceManager能正常管理服务
- [x] **已完成**

### Task 2: 创建store.rs模块

- **描述**: 创建ConfigStore模块，处理配置存储
- **文件**: `src-tauri/src/mcp/store.rs`
- **验收**: ConfigStore能正确保存/加载配置
- [x] **已完成**

### Task 3: 创建engine.rs模块

- **描述**: 创建PolicyEngine模块，处理审批策略
- **文件**: `src-tauri/src/mcp/engine.rs`
- **验收**: PolicyEngine能正确执行审批检查
- [x] **已完成**

### Task 4: 重构registry.rs

- **描述**: 修改MCPServiceRegistry使用委托模式
- **文件**: `src-tauri/src/mcp/registry.rs`
- **验收**: Registry接口保持兼容
- [x] **已完成**

### Task 5: 添加单元测试

- **描述**: 为各模块编写单元测试
- **文件**: `src-tauri/src/mcp/manager.rs`, `store.rs`, `engine.rs`
- **验收**: 所有测试通过
- [x] **已完成**

### Task 6: 更新mod.rs导出

- **描述**: 在mcp/mod.rs中导出新模块
- **文件**: `src-tauri/src/mcp/mod.rs`
- **验收**: 模块导出正确
- [x] **已完成**

## 测试要点

- [ ] 单元测试覆盖ServiceManager
- [ ] 单元测试覆盖ConfigStore
- [ ] 单元测试覆盖PolicyEngine
- [ ] 集成测试验证Registry委托
- [ ] cargo clippy无警告

## 验收标准

- [ ] ServiceManager模块独立
- [ ] ConfigStore模块独立
- [ ] PolicyEngine模块独立
- [ ] MCPServiceRegistry接口保持不变
- [ ] 所有单元测试通过
- [ ] cargo clippy无警告
- [ ] 审批逻辑与重构前一致
