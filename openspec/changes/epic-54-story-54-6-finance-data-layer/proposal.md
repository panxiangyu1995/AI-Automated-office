# Proposal: 财务模块数据层 - 数据模型与API

## 变更类型
- [x] 新功能 (new)

## 背景

财务模块是ERP系统的核心模块之一，包含发票管理、台账管理、应收应付管理等功能。当前财务模块的数据层尚未建立，无法支撑发票OCR识别、自动台账生成等高级功能。

本Story将创建完整的财务模块数据层，定义发票(Invoice)、台账(Ledger)、应收(Receivable)、应付(Payable)四个核心数据模型，并提供模拟数据API供开发和测试使用。

## 目标

实现财务模块数据层 - 数据模型与API，满足以下验收标准：
- 定义财务模块数据模型（Invoice、Ledger、Receivable、Payable）
- 创建模拟数据API
- 实现发票OCR数据解析接口
- 实现台账数据结构
- 添加财务数据权限控制

## 范围

### 包含
- 定义财务模块数据模型（Invoice、Ledger、Receivable、Payable）
- 创建模拟数据API（Mock APIs）
- 实现发票OCR数据解析接口
- 实现台账数据结构（按日期/科目/金额组织）
- 添加财务数据权限控制（基于用户角色）
- 创建数据变更历史记录

### 不包含
- 发票OCR识别的真实算法实现（仅提供接口和模拟实现）
- 财务模块的UI界面开发
- 财务数据的真实云端同步
- 财务报表分析功能

## 影响范围

### 前端
- 创建 `src/features/finance/types/` 目录及类型定义
- 创建 `src/features/finance/api/` 目录及API接口
- 创建 `src/features/finance/stores/financeStore.ts` 状态管理
- 修改 `src/features/agent/components/FinancePilotIntegration.tsx` 连接数据层

### 后端
- 创建 `src-tauri/src/plugins/finance/mod.rs` 模块入口
- 创建 `src-tauri/src/plugins/finance/models.rs` 数据模型
- 创建 `src-tauri/src/plugins/finance/commands.rs` Tauri命令
- 创建 `src-tauri/src/plugins/finance/mock_data.rs` 模拟数据生成器

### 数据库
- 使用SQLite本地存储
- 创建表：invoices, ledgers, receivables, payables, finance_audit_logs
- 设计索引优化查询性能

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 数据模型设计不合理导致后续重构 | 中 | 高 | 充分参考PRD数据字典，与Story 54.7需求对齐 |
| OCR接口与实际OCR服务不兼容 | 低 | 中 | 定义抽象接口，使用适配器模式 |
| 财务数据权限控制复杂度高 | 中 | 中 | 使用基于角色的权限模型，简化初始版本 |
| Mock数据与真实数据差异导致集成问题 | 中 | 中 | 定义清晰的数据契约文档 |

## 依赖

### 前置依赖
- **Story 39.1**: 基础数据模型定义（必需）
- **Story 39.2**: 通用API接口规范（必需）

### 后置依赖
- **Story 54.7**: 财务模块 - 发票OCR与台账生成（直接依赖）
- **Story 54.8**: AI暂存写回与审阅机制（可选依赖）

## 实现步骤

1. 定义财务模块数据模型（Invoice、Ledger、Receivable、Payable）
2. 创建模拟数据生成器和种子数据
3. 创建Tauri命令接口
4. 实现发票OCR数据解析接口
5. 实现台账数据结构
6. 添加财务数据权限控制
7. 创建数据变更历史记录

## 技术约束

- 遵循ADR-025关于业务模块数据层的规范
- 遵循ADR-037关于模块集成的要求
- 遵循NFR1、NFR16、NFR20性能和可靠性要求
- 财务数据使用AES-256加密存储
- 所有API遵循RESTful风格

## 财务模块数据模型概述

```
Invoice (发票)
├── id: string
├── invoiceNumber: string  # 发票号
├── type: InvoiceType  # 增值税普通发票/专用发票
├── customerId: string
├── items: InvoiceItem[]
├── totalAmount: number
├── taxAmount: number
├── status: InvoiceStatus
├── issuedDate: string
├── createdAt: string
└── ocrData: OcrResult | null

Ledger (台账)
├── id: string
├── accountId: string  # 会计科目ID
├── date: string
├── description: string
├── debitAmount: number
├── creditAmount: number
├── balance: number
├── invoiceId: string | null
├── receivableId: string | null
├── payableId: string | null
└── createdAt: string

Receivable (应收)
├── id: string
├── customerId: string
├── invoiceId: string
├── amount: number
├── paidAmount: number
├── status: ReceivableStatus
├── dueDate: string
├── overdueDays: number  # 计算字段
└── createdAt: string

Payable (应付)
├── id: string
├── supplierId: string
├── invoiceId: string
├── amount: number
├── paidAmount: number
├── status: PayableStatus
├── dueDate: string
├── overdueDays: number  # 计算字段
└── createdAt: string
```
