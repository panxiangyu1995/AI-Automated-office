# Proposal: 销售模块 - 动态表单与数据绑定

## 变更类型
- [x] **refactor** - 基于现有代码重构扩展

> **implementationType**: `refactor`
> 本功能为重构扩展，需要在 Story 54.3 销售数据层的基础上，将 DynamicFormRenderer 组件与销售数据 API 绑定，实现销售模块的 CRUD 操作界面。

## 背景

### 业务背景
销售模块需要支持完整的 CRUD 操作界面，包括客户管理、报价单管理、合同管理和订单管理。当前的 AI-Automated-office 系统需要：
- 基于动态表单框架实现销售数据的增删改查
- 支持复杂表单（嵌套明细表、动态行）
- 字段级权限控制
- 表单变更的审计日志

### 技术背景
根据 PRD 文档（FR513-FR515）和架构设计（ADR-035、ADR-036、ADR-037），动态表单集成需要：
- 复用现有的 `DynamicFormRenderer` 组件
- 创建销售模块的 Schema 定义
- 实现与销售数据 API 的绑定
- 支持字段级权限控制

### 现有代码状态
- **前端**: `src/features/dynamic-ui/components/DynamicFormRenderer.tsx` 组件已有
- **后端**: Story 54.3 定义的 API 接口
- **数据库**: Story 54.3 定义的表结构

## 目标

### 核心目标
实现销售模块的动态表单与真实业务数据的绑定，实现：
1. 客户管理表单
2. 报价单管理表单（含明细行）
3. 合同管理表单
4. 订单管理表单（含明细行）
5. 表单数据的自动保存与验证
6. 字段级权限控制
7. 表单变更的审计日志

### 验收标准（来自 task.json）
- [x] 创建销售模块的 Schema 定义（客户、报价单、合同、订单）
- [x] 实现 DynamicFormRenderer 与销售数据 API 的绑定
- [x] 实现表单数据的自动保存与验证
- [x] 添加字段级权限控制
- [x] 实现表单变更的审计日志

## 范围

### 包含
1. **Schema 定义**
   - 客户 Schema（CustomerSchema）
   - 报价单 Schema（QuotationSchema，含明细）
   - 合同 Schema（ContractSchema）
   - 订单 Schema（OrderSchema，含明细）

2. **动态表单绑定**
   - DynamicFormRenderer 与 customerApi 绑定
   - DynamicFormRenderer 与 quotationApi 绑定
   - DynamicFormRenderer 与 contractApi 绑定
   - DynamicFormRenderer 与 orderApi 绑定

3. **自动保存功能**
   - 草稿自动保存
   - 定时自动保存
   - 离开页面时保存提示

4. **实时验证**
   - 必填字段验证
   - 数据格式验证
   - 业务规则验证
   - 跨字段联动验证

5. **权限控制**
   - 字段级可见性控制
   - 字段级编辑控制
   - 基于角色的权限配置

6. **审计日志**
   - 记录表单变更内容
   - 记录变更人和变更时间
   - 支持变更历史查看

### 不包含
- 销售报表和统计分析（后续迭代）
- 销售流程审批集成（后续迭代）
- 销售数据分析可视化（后续迭代）

## 影响范围

### 前端影响
- **新增文件**:
  - `src/features/sales/schemas/customerSchema.ts` - 客户 Schema
  - `src/features/sales/schemas/quotationSchema.ts` - 报价单 Schema
  - `src/features/sales/schemas/contractSchema.ts` - 合同 Schema
  - `src/features/sales/schemas/orderSchema.ts` - 订单 Schema
  - `src/features/sales/components/CustomerForm.tsx` - 客户表单组件
  - `src/features/sales/components/QuotationForm.tsx` - 报价单表单组件
  - `src/features/sales/components/ContractForm.tsx` - 合同表单组件
  - `src/features/sales/components/OrderForm.tsx` - 订单表单组件
  - `src/features/sales/components/SalesTable.tsx` - 销售列表组件

- **修改文件**:
  - `src/features/dynamic-ui/components/DynamicFormRenderer.tsx` - 可能需要扩展

### 后端影响
- **新增文件**:
  - `src-tauri/src/sales/audit.rs` - 审计日志接口

- **修改文件**: 暂无（复用 Story 54.3 的接口）

### 数据库影响
- **新增表**:
  - `sales_form_draft` - 表单草稿表
  - `sales_form_audit` - 表单审计日志表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| DynamicFormRenderer 接口不兼容 | 中 | 中 | 预先研究现有组件接口；必要时使用 Adapter |
| Story 54.3 未完成 | **高** | **高** | 本 Story 依赖 Story 54.3 完成 |
| 复杂表单性能问题 | 中 | 中 | 使用虚拟化渲染；分页加载明细 |
| 权限配置复杂度 | 中 | 中 | 设计清晰的权限模型；提供默认配置 |

## 依赖

### 前置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.3 | 销售模块数据层 - 数据模型与API | 提供数据层 API |
| Story 40.1 | 动态表单基础框架 | 提供 DynamicFormRenderer |
| Story 40.2 | 动态表单组件 | 提供表单组件库 |

### 后置依赖
| Story | 名称 | 依赖说明 |
|-------|------|----------|
| Story 54.5 | 销售模块 - Agent 工具集成 | 依赖本 Story 的表单组件 |

### 依赖关系图
```
Story 40.1, 40.2 (动态表单基础)
         ↓
Story 54.3 (销售数据层)
         ↓
Story 54.4 (本 Story - 动态表单绑定)
         ↓
Story 54.5 (Agent 工具集成)
```

## 实现约束

### Schema 命名约定
- Schema 文件: `{entity}Schema.ts`
- Schema 对象: `{entity}Schema` (如 `customerSchema`)

### 组件命名约定
- 表单组件: `{Entity}Form.tsx` (如 `CustomerForm.tsx`)
- 列表组件: `{Entity}Table.tsx` (如 `CustomerTable.tsx`)

### 安全约束
- 字段级权限遵循 ADR-035 规范
- 表单变更遵循审计日志要求
- 敏感数据需要脱敏展示

## 附录

### 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR513-FR515)
- 架构: `_bmad-output/planning-artifacts/architecture.md` (ADR-035, ADR-036, ADR-037)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (UX-01, UX-04)
- 现有组件: `src/features/dynamic-ui/components/DynamicFormRenderer.tsx`
