# Tasks: 财务模块 - 发票OCR与台账生成

## 任务列表

### Task 130: 财务模块 - 发票OCR与台账生成
- **描述**: 实现财务模块的发票OCR识别和自动台账生成功能，与Agent Runtime集成。
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **验收标准**:
  - 集成发票OCR工具（模拟或真实）
  - 实现发票信息的自动提取与验证
  - 实现台账的自动生成逻辑
  - 创建台账编辑与确认界面
  - 实现应收应付的自动计算

## implementationType
**refactor** - 基于现有前端组件(FinancePilotIntegration)和后端数据层(Story 54.6)进行重构扩展

## 执行顺序

1. 完成前置依赖（Story 54.6, Story 40.1）
2. 创建OCR处理相关前端组件
3. 创建台账生成相关前端组件
4. 创建后端OCR处理器
5. 创建后端台账生成器
6. 创建后端应收应付计算器
7. 前后端对接
8. 集成测试
9. UI优化

## 详细任务

### 任务1: 创建OCR处理前端组件
- [ ] 创建 `src/features/finance/components/OcrCapture.tsx` - 图像上传组件
- [ ] 创建 `src/features/finance/components/OcrResultReview.tsx` - 结果确认组件
- [ ] 创建 `src/features/finance/components/OcrFieldValidation.tsx` - 字段验证显示
- [ ] 创建 `src/features/finance/hooks/useOcrCapture.ts` - OCR捕获Hook
- [ ] 创建 `src/features/finance/hooks/useOcrValidation.ts` - OCR验证Hook

### 任务2: 创建台账生成前端组件
- [ ] 创建 `src/features/finance/components/LedgerEntryEditor.tsx` - 台账条目编辑器
- [ ] 创建 `src/features/finance/components/LedgerConfirmation.tsx` - 台账确认界面
- [ ] 创建 `src/features/finance/components/LedgerEntryList.tsx` - 台账条目列表
- [ ] 创建 `src/features/finance/hooks/useLedgerAutoGenerate.ts` - 台账自动生成Hook
- [ ] 创建 `src/features/finance/hooks/useLedgerConfirmation.ts` - 台账确认Hook
- [ ] 创建 `src/features/finance/utils/ledgerCalculator.ts` - 台账计算工具

### 任务3: 创建后端OCR处理器
- [ ] 创建 `src-tauri/src/plugins/finance/ocr_processor.rs`
- [ ] 实现recognize_invoice函数
- [ ] 实现validate_ocr_result函数
- [ ] 添加模拟OCR识别逻辑

### 任务4: 创建后端台账生成器
- [ ] 创建 `src-tauri/src/plugins/finance/ledger_generator.rs`
- [ ] 实现generate_from_invoice函数
- [ ] 实现create_sale_ledger_entries函数（销售发票→应收）
- [ ] 实现create_purchase_ledger_entries函数（采购发票→应付）
- [ ] 确保借贷平衡

### 任务5: 创建后端应收应付计算器
- [ ] 创建 `src-tauri/src/plugins/finance/receivable_payable_calculator.rs`
- [ ] 实现calculate_receivable函数
- [ ] 实现calculate_payable函数
- [ ] 实现update_overdue_days函数
- [ ] 实现record_payment函数

### 任务6: 增强FinancePilotIntegration组件
- [ ] 修改 `src/features/agent/components/FinancePilotIntegration.tsx`
- [ ] 集成OCR捕获组件
- [ ] 集成台账确认组件
- [ ] 连接后端OCR和台账生成功能

### 任务7: 创建财务工具供Agent调用
- [ ] 创建 `src/features/finance/tools/financeToolDefinitions.ts`
- [ ] 定义 finance_invoice_ocr 工具
- [ ] 定义 finance_ledger_generate 工具
- [ ] 定义 finance_receivable_query 工具
- [ ] 创建 `src/features/finance/hooks/useFinanceTools.ts`

### 任务8: 集成测试
- [ ] 编写OCR识别单元测试
- [ ] 编写台账生成单元测试（借贷平衡）
- [ ] 编写应收应付计算单元测试
- [ ] 编写前后端集成测试

### 任务9: UI优化
- [ ] 添加加载状态指示器
- [ ] 添加错误提示组件
- [ ] 优化台账确认界面布局

## 验收标准详细说明

### 验收标准1: 集成发票OCR工具
- [ ] 用户可上传发票图片
- [ ] 系统显示OCR识别进度
- [ ] 系统返回发票号码、金额、日期等字段
- [ ] 显示识别置信度
- [ ] 支持重新识别

### 验收标准2: 实现发票信息的自动提取与验证
- [ ] 自动验证发票号码格式
- [ ] 自动验证金额数值
- [ ] 自动验证日期格式
- [ ] 显示验证错误提示
- [ ] 支持用户手动修正

### 验收标准3: 实现台账的自动生成逻辑
- [ ] 发票审核通过后自动生成台账条目
- [ ] 销售发票生成应收台账（借：应收账款，贷：收入，贷：税费）
- [ ] 采购发票生成应付台账（借：库存商品，借：税费，贷：应付账款）
- [ ] 自动计算余额
- [ ] 确保借贷平衡

### 验收标准4: 创建台账编辑与确认界面
- [ ] 显示待确认台账条目列表
- [ ] 支持修改台账条目金额
- [ ] 支持驳回单个条目（需填写原因）
- [ ] 支持驳回全部
- [ ] 显示借贷平衡状态
- [ ] 确认后正式入账

### 验收标准5: 实现应收应付的自动计算
- [ ] 发票创建时自动创建应收/应付记录
- [ ] 记录收款/付款时自动更新状态
- [ ] 自动计算逾期天数
- [ ] 逾期后状态自动变为overdue
- [ ] 支持部分还款/付款

## 测试要点

### 单元测试
- [ ] OCR字段验证逻辑测试
- [ ] 台账生成借贷平衡测试
- [ ] 应收应付金额计算测试
- [ ] 逾期天数计算测试

### 集成测试
- [ ] OCR→发票→台账完整流程测试
- [ ] 收款→应收状态更新测试
- [ ] Agent调用财务工具测试

### 浏览器测试
- [ ] OCR上传组件交互测试
- [ ] 台账确认界面测试
- [ ] 错误提示显示测试

## 技术约束

- 遵循ADR-025业务模块集成规范
- 遵循ADR-037 Agent Runtime集成规范
- 遵循NFR1/NFR16性能要求
- 金额计算必须精确到分，使用整数存储（分）
- 借贷平衡误差必须 < 0.01元

## 依赖项

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| Story 54.6 | 前置必需 | 财务数据层（Invoice/Ledger/Receivable/Payable模型） |
| Story 40.1 | 前置必需 | 动态表单组件 |
| Story 54.8 | 后置依赖 | AI暂存写回（直接依赖本Story） |
| Story 101 | 前置必需 | Rust后端基础设施 |
