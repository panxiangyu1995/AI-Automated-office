# Specification: MCP模块-注册表职责分离重构

## 需求来源

### 架构约束
- **ARCH-01**: 分层微内核架构 - MCP模块属于Agent Core Layer

### SOLID原则
- **SRP（单一职责）**: 当前MCPServiceRegistry承担多种职责
- **高内聚低耦合**: 各模块应职责单一、依赖清晰

## 功能规格

### 验收场景

#### Scenario 1: 分离ServiceManager

- **GIVEN** 需要管理MCP服务生命周期
- **WHEN** 调用ServiceManager方法
- **THEN** 服务被正确添加/启动/停止/删除

#### Scenario 2: 分离ConfigStore

- **GIVEN** 需要持久化MCP服务配置
- **WHEN** 调用ConfigStore方法
- **THEN** 配置被正确保存/加载/更新/删除

#### Scenario 3: 分离PolicyEngine

- **GIVEN** 需要检查工具调用审批策略
- **WHEN** 调用PolicyEngine.check()
- **THEN** 返回正确的AutoApproveResult

## 约束条件

1. **向后兼容**: MCPServiceRegistry接口保持不变
2. **线程安全**: 所有模块支持并发访问
3. **错误处理**: 使用Result类型
