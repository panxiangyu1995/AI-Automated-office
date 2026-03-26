# Tasks: 销售模块 - Agent工具集成

## 任务列表

### Task 128: 销售模块 - Agent工具集成
- **描述**: 为销售模块创建Agent可用的工具集，支持Agent执行销售相关任务。
- **类型**: refactor
- **优先级**: medium
- **阶段**: Phase 4 - 业务模块动态化
- **验收标准**:
  - 创建销售模块工具集（sales_customer_query、sales_quotation_create、sales_contract_generate等）
  - 实现工具与销售数据层的集成
  - 添加销售场景的智能推荐
  - 实现销售数据的批量操作
  - 集成销售模块到Agent对话流程

## implementationType
**refactor** - 基于现有前端组件(SalesPilotIntegration)进行重构扩展，需实现后端工具逻辑并连接前端

## 执行顺序

1. 完成前置依赖（Story 54.3, Story 54.4, Story 51.3）
2. 创建销售工具定义（前端）
3. 创建销售工具Rust后端实现
4. 创建Tauri命令接口
5. 前后端对接测试
6. 集成测试
7. UI优化

## 详细任务

### 任务1: 创建销售工具定义（前端）
- [ ] 创建 `src/features/sales/tools/salesToolDefinitions.ts`
- [ ] 定义 sales_customer_query 工具
- [ ] 定义 sales_quotation_create 工具
- [ ] 定义 sales_contract_generate 工具
- [ ] 定义 sales_batch_operation 工具
- [ ] 创建类型定义文件 `src/features/sales/types/index.ts`

### 任务2: 创建销售工具Hook（前端）
- [ ] 创建 `src/features/sales/hooks/useSalesTools.ts`
- [ ] 实现工具执行器接口
- [ ] 实现工具注册逻辑
- [ ] 实现智能推荐Hook

### 任务3: 创建销售工具Rust后端
- [ ] 创建 `src-tauri/src/plugins/sales/mod.rs`
- [ ] 创建 `src-tauri/src/plugins/sales/tools.rs`
- [ ] 实现 sales_customer_query 工具逻辑
- [ ] 实现 sales_quotation_create 工具逻辑
- [ ] 实现 sales_contract_generate 工具逻辑
- [ ] 实现 sales_batch_operation 工具逻辑

### 任务4: 创建Tauri命令接口
- [ ] 创建 `src-tauri/src/plugins/sales/commands.rs`
- [ ] 实现 get_customer 命令
- [ ] 实现 create_quotation 命令
- [ ] 实现 generate_contract 命令
- [ ] 实现 batch_operation 命令
- [ ] 修改 `src-tauri/src/commands/mod.rs` 导出销售命令

### 任务5: 集成SalesPilotIntegration组件
- [ ] 修改 `src/features/agent/components/SalesPilotIntegration.tsx`
- [ ] 连接前端工具与后端执行器
- [ ] 实现工具结果展示
- [ ] 添加错误处理和加载状态

### 任务6: 集成测试
- [ ] 编写工具单元测试
- [ ] 编写前后端集成测试
- [ ] 编写E2E测试（可选）

### 任务7: UI优化
- [ ] 添加加载状态指示器
- [ ] 添加错误提示组件
- [ ] 优化工具结果展示样式

## 验收标准详细说明

### 验收标准1: 创建销售模块工具集
- [ ] sales_customer_query 工具可查询客户信息
- [ ] sales_quotation_create 工具可创建报价单
- [ ] sales_contract_generate 工具可根据报价单生成合同
- [ ] sales_batch_operation 工具可批量更新/删除/导出数据
- [ ] 所有工具描述符符合 `{plugin}_{entity}_{action}` 命名规范

### 验收标准2: 实现工具与销售数据层的集成
- [ ] 工具调用Story 54.3创建的数据层API
- [ ] 工具正确处理数据层返回的错误
- [ ] 数据权限控制正确生效

### 验收标准3: 添加销售场景的智能推荐
- [ ] 基于用户历史查询推荐相关操作
- [ ] 基于时间节点（如月初）推荐报表
- [ ] 推荐结果正确展示在UI中

### 验收标准4: 实现销售数据的批量操作
- [ ] 支持批量更新客户/报价单/合同状态
- [ ] 支持批量删除（带二次确认）
- [ ] 支持批量导出（CSV格式）
- [ ] 批量操作有分页保护（每批最多100条）

### 验收标准5: 集成销售模块到Agent对话流程
- [ ] Agent可识别销售相关意图
- [ ] Agent可调用相应工具
- [ ] 工具执行结果正确返回给Agent
- [ ] 销售Pilot集成面板正确展示

## 测试要点

### 单元测试
- [ ] 工具参数验证测试
- [ ] 工具执行逻辑测试
- [ ] 智能推荐算法测试
- [ ] 数据模型序列化测试

### 集成测试
- [ ] 前端工具与后端命令集成测试
- [ ] 工具与销售数据层集成测试
- [ ] 工具与Agent Runtime集成测试

### E2E测试（可选）
- [ ] 完整销售流程E2E测试
- [ ] Agent销售对话E2E测试

### 浏览器测试
- [ ] SalesPilotIntegration组件渲染测试
- [ ] 工具执行UI交互测试
- [ ] 错误场景UI测试
- [ ] 批量操作UI测试

## 技术约束

- 遵循工具命名规范：`sales_{entity}_{action}`
- 遵循ADR-025业务模块集成规范
- 遵循ADR-037 Agent Runtime集成规范
- 遵循NFR1/NFR16性能要求（工具执行 < 2s）
- 遵循UX-01/UX-04设计规范

## 依赖项

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| Story 54.3 | 前置必需 | 销售数据层（Customer/Quotation/Contract模型） |
| Story 54.4 | 前置必需 | 销售动态表单 |
| Story 51.3 | 前置必需 | 工具执行管道 |
| Story 101 | 前置必需 | Rust后端基础设施 |
