# Proposal: 销售模块数据层 - 数据模型与API

## 变更类型
- [x] **new** - 全新功能开发

> **implementationType**: `new`
> 本功能为全新开发，需要从零创建销售模块的完整数据层，包括客户、报价单、合同、订单的数据模型定义和 API 接口。

## 背景

### 业务背景
销售模块是企业 ERP 系统的核心模块之一，承担着客户管理、报价管理、合同管理和订单管理的职责。当前的 AI-Automated-office 系统需要一套完整的销售数据层，支持：
- 客户信息管理（Customer）
- 报价单管理（Quotation）
- 合同管理（Contract）
- 订单管理（Order）
- 完整的数据验证和权限控制
- 数据变更历史的追溯

### 技术背景
根据 PRD 文档（FR510-FR512）和架构设计（ADR-025、ADR-037），销售数据层需要：
- 基于分层微内核架构实现
- 使用 SQLite 本地存储 + 增量同步策略
- 提供 RESTful 风格的 API 接口
- 支持模拟数据 API 用于开发和测试

### 现有代码状态
- **前端**: 无现有代码（需要全新创建）
- **后端**: 无现有代码（需要全新创建）
- **数据库**: 无现有表结构（需要创建销售相关表）

## 目标

### 核心目标
创建销售模块的完整数据层，实现：
1. 客户数据模型和 CRUD API
2. 报价单数据模型和 CRUD API
3. 合同数据模型和 CRUD API
4. 订单数据模型和 CRUD API
5. 数据验证规则
6. 数据权限控制
7. 数据变更历史记录

### 验收标准（来自 task.json）
- [x] 定义销售模块数据模型（Customer、Quotation、Contract、Order）
- [x] 创建模拟数据 API（mock APIs）用于开发和测试
- [x] 实现数据验证规则
- [x] 添加数据权限控制
- [x] 创建数据变更历史记录

## 范围

### 包含
1. **客户数据模型 (Customer)**
   - 客户基本信息（名称、联系人、联系方式、地址）
   - 客户分类（客户类型、行业）
   - 客户状态（活跃、潜在、已流失）
   - 客户关联的报价单、合同、订单

2. **报价单数据模型 (Quotation)**
   - 报价单基本信息（编号、日期、有效期）
   - 报价客户信息
   - 报价明细（产品、数量、单价、折扣）
   - 报价状态（草稿、已发送、已接受、已拒绝、已过期）
   - 关联的客户和合同

3. **合同数据模型 (Contract)**
   - 合同基本信息（编号、日期、生效日期、到期日期）
   - 合同甲方乙方信息
   - 合同金额和付款条款
   - 合同状态（草稿、已签订、已执行、已终止）
   - 关联的报价单和订单

4. **订单数据模型 (Order)**
   - 订单基本信息（编号、日期）
   - 订单客户信息
   - 订单明细（产品、数量、单价）
   - 订单状态（待确认、已确认、生产中、已发货、已完成、已取消）
   - 关联的合同

5. **数据验证规则**
   - 必填字段验证
   - 数据格式验证（邮箱、手机号、日期）
   - 业务规则验证（报价有效期、订单数量范围）
   - 关联数据验证

6. **数据权限控制**
   - 基于角色的数据访问控制
   - 字段级权限控制
   - 数据范围限制（部门、员工）

7. **数据变更历史**
   - 记录所有数据变更操作
   - 记录变更前后的值
   - 记录变更人和变更时间

### 不包含
- 销售报表和统计分析（后续迭代）
- 销售目标管理（后续迭代）
- 销售漏斗分析（后续迭代）
- 销售员业绩统计（后续迭代）

## 影响范围

### 前端影响
- **新增文件**:
  - `src/features/sales/types/sales.types.ts` - 销售类型定义
  - `src/features/sales/api/customerApi.ts` - 客户 API
  - `src/features/sales/api/quotationApi.ts` - 报价单 API
  - `src/features/sales/api/contractApi.ts` - 合同 API
  - `src/features/sales/api/orderApi.ts` - 订单 API
  - `src/features/sales/stores/salesStore.ts` - 销售状态管理

- **修改文件**: 暂无

### 后端影响
- **新增模块** (`src-tauri/src/sales/`):
  - `mod.rs` - 模块入口
  - `models.rs` - 数据模型
  - `repository.rs` - 数据访问层
  - `commands.rs` - Tauri 命令接口
  - `validators.rs` - 数据验证

- **修改文件**:
  - `src-tauri/src/agent/mod.rs` - 添加 sales 子模块

### 数据库影响
- **新建表**:
  - `sales_customer` - 客户表
  - `sales_quotation` - 报价单表
  - `sales_quotation_item` - 报价明细表
  - `sales_contract` - 合同表
  - `sales_order` - 订单表
  - `sales_order_item` - 订单明细表
  - `sales_change_history` - 变更历史表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 数据模型设计不合理 | 中 | 高 | 参照行业标准设计；预留扩展字段 |
| 关联关系复杂 | 高 | 中 | 先实现独立 CRUD，再实现关联操作 |
| 验证规则不完整 | 中 | 中 | 梳理所有业务规则；参考 PRD |
| 前端 UI 依赖未明确 | 低 | 中 | 本 Story 专注数据层，UI 集成在后续 Story |

## 依赖

### 前置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 39.1 | 基础数据模型定义 | 提供数据模型基础规范 |
| Story 39.2 | 基础权限系统 | 提供权限检查基础 |

### 后置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.4 | 销售模块 - 动态表单与数据绑定 | 依赖本 Story 的数据层 |
| Story 54.5 | 销售模块 - Agent 工具集成 | 依赖本 Story 的数据层 |

## 实现约束

### 命名约定
- 遵循 `{plugin}_{entity}_{action}` 格式
- 示例: `sales_customer_create`, `sales_quotation_query`

### 安全约束
- 所有数据操作需要权限校验
- 敏感数据需要审计日志
- 遵循 ADR-018 安全设计规范

## 附录

### 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR510-FR512)
- 架构: `_bmad-output/planning-artifacts/architecture.md` (ADR-025, ADR-037)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (UX-01)
