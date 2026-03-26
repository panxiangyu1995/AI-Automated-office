# Proposal: 财务模块 - 发票OCR与台账生成

## 变更类型
- [x] 重构 (refactor)

## 背景

财务模块需要实现发票OCR识别和自动台账生成功能。当前前端已有FinancePilotIntegration组件，后端财务数据层（Story 54.6）也已建立。本Story需要实现：
1. 发票OCR识别的完整流程（图像上传→识别→结果确认→创建发票）
2. 自动台账生成逻辑（发票审核通过后自动生成台账条目）
3. 应收应付的自动计算和状态更新
4. 台账编辑与确认界面

## 目标

实现财务模块 - 发票OCR与台账生成，满足以下验收标准：
- 集成发票OCR工具（模拟或真实）
- 实现发票信息的自动提取与验证
- 实现台账的自动生成逻辑
- 创建台账编辑与确认界面
- 实现应收应付的自动计算

## 范围

### 包含
- 集成发票OCR工具（图像上传→识别→结果确认→创建发票完整流程）
- 实现发票信息的自动提取与验证（金额、日期、买方卖方等）
- 实现台账的自动生成逻辑（发票审核通过后自动创建台账条目）
- 创建台账编辑与确认界面（用户可修改、确认或驳回台账条目）
- 实现应收应付的自动计算（根据发票金额和收付款状态自动计算）
- 前端FinancePilotIntegration组件与后端的完整连接

### 不包含
- 真实的第三方OCR服务集成（仅提供模拟实现和接口契约）
- 财务报表分析功能
- 财务审批流程（Story 54.1/54.2负责）
- 财务数据的云端同步

## 影响范围

### 前端
- 修改 `src/features/agent/components/FinancePilotIntegration.tsx`
- 创建 `src/features/finance/components/OcrCapture.tsx` - OCR图像上传组件
- 创建 `src/features/finance/components/OcrResultReview.tsx` - OCR结果确认组件
- 创建 `src/features/finance/components/LedgerEntryEditor.tsx` - 台账编辑组件
- 创建 `src/features/finance/components/LedgerConfirmation.tsx` - 台账确认组件
- 创建 `src/features/finance/hooks/useOcrCapture.ts` - OCR Hook
- 创建 `src/features/finance/hooks/useLedgerAutoGenerate.ts` - 台账自动生成Hook

### 后端
- 修改 `src-tauri/src/plugins/finance/commands.rs` 添加OCR命令
- 修改 `src-tauri/src/plugins/finance/commands.rs` 添加台账生成命令
- 创建 `src-tauri/src/plugins/finance/ocr_processor.rs` - OCR处理器
- 创建 `src-tauri/src/plugins/finance/ledger_generator.rs` - 台账生成器
- 创建 `src-tauri/src/plugins/finance/receivable_payable_calculator.rs` - 应收应付计算器

### 数据库
- 无需新增表结构
- 复用Story 54.6创建的表结构

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Story 54.6未完成导致无法集成 | 高 | 高 | 确保54.6完成后再开始本Story，或使用Mock数据隔离开发 |
| OCR识别准确率不足 | 高 | 中 | 使用模拟OCR，逐步优化算法 |
| 台账生成逻辑复杂，边界情况多 | 中 | 中 | 详细设计状态机，处理所有边界情况 |
| 应收应付自动计算出现误差 | 低 | 高 | 使用精确的定点数计算，多次测试验证 |

## 依赖

### 前置依赖
- **Story 54.6**: 财务模块数据层 - 数据模型与API（必需）
- **Story 40.1**: 动态表单组件（必需）

### 后置依赖
- **Story 54.8**: AI暂存写回与审阅机制（直接依赖本Story）

## 实现步骤

1. 集成发票OCR工具（模拟或真实）
2. 实现发票信息的自动提取与验证
3. 实现台账的自动生成逻辑
4. 创建台账编辑与确认界面
5. 实现应收应付的自动计算

## 技术约束

- 遵循ADR-025关于业务模块集成的规范
- 遵循ADR-037关于Agent Runtime集成的规范
- 遵循NFR1和NFR16的性能要求
- 台账生成必须符合借贷平衡原则
- 金额计算必须精确到分，使用整数存储（分）
