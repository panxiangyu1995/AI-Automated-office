# Proposal: 销售模块 - Agent工具集成

## 变更类型
- [x] 重构 (refactor)

## 背景

当前销售模块的AI能力尚未与Agent Runtime集成。虽然前端已有SalesPilotIntegration组件，但缺乏实际可执行的工具集，导致Agent无法执行销售相关任务。这限制了AI在销售场景下的自动化能力。

本Story将创建完整的销售模块Agent工具集，实现从客户查询、报价创建到合同生成的全流程工具支持，使Agent能够自主完成销售任务。

## 目标

实现销售模块 - Agent工具集成，满足以下验收标准：
- 创建销售模块工具集（sales_customer_query、sales_quotation_create、sales_contract_generate等）
- 实现工具与销售数据层的集成
- 添加销售场景的智能推荐
- 实现销售数据的批量操作
- 集成销售模块到Agent对话流程

## 范围

### 包含
- 创建销售模块工具集（sales_customer_query、sales_quotation_create、sales_contract_generate等）
- 实现工具与销售数据层的集成
- 添加销售场景的智能推荐
- 实现销售数据的批量操作
- 集成销售模块到Agent对话流程
- 前端SalesPilotIntegration组件与后端工具的连接

### 不包含
- 销售数据层的创建（Story 54.3负责）
- 销售动态表单的绑定（Story 54.4负责）
- 真实OCR识别服务（仅集成模拟或API调用）
- 销售报表和数据分析功能

## 影响范围

### 前端
- 修改 `src/features/agent/components/SalesPilotIntegration.tsx`
- 创建 `src/features/sales/tools/` 目录及工具定义文件
- 创建 `src/features/sales/hooks/useSalesTools.ts` 工具Hook
- 修改 `src/features/sales/stores/salesStore.ts` 添加工具相关状态

### 后端
- 创建 `src-tauri/src/plugins/sales/` 模块目录
- 创建 `src-tauri/src/plugins/sales/tools.rs` 销售工具实现
- 创建 `src-tauri/src/plugins/sales/commands.rs` Tauri命令接口
- 修改 `src-tauri/src/commands/mod.rs` 导出销售命令

### 数据库
- 依赖Story 54.3创建的销售数据模型
- 无需新增数据库表结构

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Story 54.3/54.4未完成导致无法集成 | 高 | 高 | 在Task 128前确保前置Story完成，或使用Mock数据进行隔离开发 |
| 销售数据层API接口变更 | 中 | 中 | 定义清晰的接口契约，使用适配器模式隔离变化 |
| 工具参数验证复杂度过高 | 中 | 中 | 简化验证规则，提供清晰的错误提示 |
| 批量操作性能问题 | 低 | 中 | 实现分页和流式处理 |

## 依赖

### 前置依赖
- **Story 54.3**: 销售模块数据层 - 数据模型与API（必需）
- **Story 54.4**: 销售模块 - 动态表单与数据绑定（必需）
- **Story 51.3**: 工具执行管道 - 完整执行链（必需）

### 后置依赖
- **Story 54.8**: AI暂存写回与审阅机制（可选，本Story完成后可解锁）

## 实现步骤

1. 创建销售模块工具集（sales_customer_query、sales_quotation_create、sales_contract_generate等）
2. 实现工具与销售数据层的集成
3. 添加销售场景的智能推荐
4. 实现销售数据的批量操作
5. 集成销售模块到Agent对话流程

## 技术约束

- 遵循工具命名规范：`sales_{entity}_{action}` 格式
- 遵循ADR-025关于业务模块集成的规范
- 遵循ADR-037关于Agent Runtime集成的规范
- 遵循NFR1和NFR16的性能要求
