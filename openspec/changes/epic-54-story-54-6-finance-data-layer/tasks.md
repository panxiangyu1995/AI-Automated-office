# Tasks: 财务模块数据层 - 数据模型与API

## 任务列表

### Task 129: 财务模块数据层 - 数据模型与API
- **描述**: 创建财务模块的完整数据层，包括发票、台账、应收应付的数据模型和API。
- **类型**: new
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **验收标准**:
  - 定义财务模块数据模型（Invoice、Ledger、Receivable、Payable）
  - 创建模拟数据API
  - 实现发票OCR数据解析接口
  - 实现台账数据结构
  - 添加财务数据权限控制

## implementationType
**new** - 全新开发，需要从零创建财务数据层的前后端实现

## 执行顺序

1. 完成前置依赖（Story 39.1, Story 39.2）
2. 创建前端类型定义
3. 创建前端API接口
4. 创建Rust数据模型
5. 创建模拟数据生成器
6. 创建Tauri命令接口
7. 创建数据库表结构
8. 实现权限控制
9. 集成测试

## 详细任务

### 任务1: 创建前端类型定义
- [ ] 创建 `src/features/finance/types/invoice.ts` - 发票类型
- [ ] 创建 `src/features/finance/types/ledger.ts` - 台账类型
- [ ] 创建 `src/features/finance/types/receivable.ts` - 应收类型
- [ ] 创建 `src/features/finance/types/payable.ts` - 应付类型
- [ ] 创建 `src/features/finance/types/common.ts` - 公共类型
- [ ] 创建 `src/features/finance/types/index.ts` - 统一导出

### 任务2: 创建前端API接口
- [ ] 创建 `src/features/finance/api/invoiceApi.ts` - 发票API
- [ ] 创建 `src/features/finance/api/ledgerApi.ts` - 台账API
- [ ] 创建 `src/features/finance/api/receivableApi.ts` - 应收API
- [ ] 创建 `src/features/finance/api/payableApi.ts` - 应付API
- [ ] 创建 `src/features/finance/api/ocrApi.ts` - OCR接口
- [ ] 创建 `src/features/finance/api/index.ts` - 统一导出

### 任务3: 创建前端状态管理
- [ ] 创建 `src/features/finance/stores/invoiceStore.ts` - 发票状态
- [ ] 创建 `src/features/finance/stores/ledgerStore.ts` - 台账状态
- [ ] 创建 `src/features/finance/stores/receivableStore.ts` - 应收状态
- [ ] 创建 `src/features/finance/stores/payableStore.ts` - 应付状态
- [ ] 创建 `src/features/finance/stores/index.ts` - 统一导出

### 任务4: 创建Rust数据模型
- [ ] 创建 `src-tauri/src/plugins/finance/mod.rs` - 模块入口
- [ ] 创建 `src-tauri/src/plugins/finance/models.rs` - 数据模型
- [ ] 创建 `src-tauri/src/plugins/finance/errors.rs` - 错误定义

### 任务5: 创建模拟数据生成器
- [ ] 创建 `src-tauri/src/plugins/finance/mock_data.rs`
- [ ] 实现生成模拟发票数据（至少10条）
- [ ] 实现生成模拟台账数据（至少50条）
- [ ] 实现生成模拟应收数据（至少10条）
- [ ] 实现生成模拟应付数据（至少10条）
- [ ] 实现生成模拟会计科目（至少20个）

### 任务6: 创建Tauri命令接口
- [ ] 创建 `src-tauri/src/plugins/finance/commands.rs`
- [ ] 实现发票CRUD命令
- [ ] 实现台账查询命令
- [ ] 实现应收应付CRUD命令
- [ ] 实现OCR识别命令（模拟）
- [ ] 修改 `src-tauri/src/commands/mod.rs` 导出财务命令

### 任务7: 创建数据库表结构
- [ ] 创建invoices表和invoice_items表
- [ ] 创建ledger_accounts表
- [ ] 创建ledger_entries表
- [ ] 创建receivables表
- [ ] 创建payables表
- [ ] 创建finance_audit_logs表
- [ ] 创建必要的索引

### 任务8: 实现权限控制
- [ ] 实现基于角色的发票访问控制
- [ ] 实现基于角色的台账访问控制
- [ ] 实现敏感操作二次确认机制
- [ ] 添加审计日志记录

### 任务9: 集成测试
- [ ] 编写API单元测试
- [ ] 编写数据库操作测试
- [ ] 编写权限控制测试

## 验收标准详细说明

### 验收标准1: 定义财务模块数据模型
- [ ] Invoice模型包含所有必需字段（id, invoiceNumber, type, customerId, items, totalAmount等）
- [ ] Ledger模型支持借贷记账法
- [ ] Receivable模型包含客户信息和逾期天数计算
- [ ] Payable模型包含供应商信息和逾期天数计算
- [ ] 所有模型实现了JSON序列化/反序列化

### 验收标准2: 创建模拟数据API
- [ ] API返回模拟发票数据
- [ ] API返回模拟台账数据
- [ ] API返回模拟应收应付数据
- [ ] 模拟数据支持分页查询
- [ ] 模拟数据支持按条件筛选

### 验收标准3: 实现发票OCR数据解析接口
- [ ] 定义OcrResult类型结构
- [ ] 定义ocr_recognize_invoice命令
- [ ] 实现模拟OCR识别（返回预定义的解析结果）
- [ ] OCR结果可关联到发票创建

### 验收标准4: 实现台账数据结构
- [ ] 定义会计科目表（ledger_accounts）
- [ ] 支持多级科目（如1001-库存现金，1002-银行存款）
- [ ] 台账条目（ledger_entries）记录每笔业务
- [ ] 支持按日期、科目、金额范围查询

### 验收标准5: 添加财务数据权限控制
- [ ] 基于用户角色控制发票修改权限
- [ ] 基于用户角色控制台账查看权限
- [ ] 敏感操作（如删除发票）需要管理员权限
- [ ] 所有数据变更记录审计日志

## 测试要点

### 单元测试
- [ ] 数据模型序列化/反序列化测试
- [ ] 金额计算准确性测试
- [ ] 日期格式验证测试
- [ ] 分页逻辑测试

### 集成测试
- [ ] 前端API与后端命令集成测试
- [ ] 数据库CRUD操作测试
- [ ] 权限控制集成测试

### 性能测试
- [ ] 大数据量查询性能（1000+条记录）
- [ ] 分页加载性能

## 技术约束

- 遵循ADR-025业务模块数据层规范
- 遵循ADR-037模块集成规范
- 遵循NFR1/NFR16/NFR20性能和可靠性要求
- 财务数据使用AES-256加密存储
- 所有API遵循RESTful风格

## 依赖项

| 依赖项 | 类型 | 说明 |
|--------|------|------|
| Story 39.1 | 前置必需 | 基础数据模型定义 |
| Story 39.2 | 前置必需 | 通用API接口规范 |
| Story 54.7 | 后置依赖 | 发票OCR与台账生成（直接依赖本Story） |
| Story 101 | 前置必需 | Rust后端基础设施 |
