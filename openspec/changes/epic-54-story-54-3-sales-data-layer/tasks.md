# Tasks: 销售模块数据层 - 数据模型与API

## 任务列表

### Task 126: 销售模块数据层 - 数据模型与API

| 属性 | 值 |
|------|-----|
| **ID** | 126 |
| **Epic** | Epic 54 - 业务模块动态化 |
| **Story** | Story 54.3 |
| **Title** | 销售模块数据层 - 数据模型与API |
| **implementationType** | `new` (全新开发) |
| **优先级** | `high` |
| **阶段** | Phase 4 - 业务模块动态化 |
| **后端必需** | `true` |

#### 描述
创建销售模块的完整数据层，包括客户、报价单、合同、订单的数据模型和API。

#### 现有代码状态
- **前端**: 无现有代码（需要全新创建）
- **后端**: 无现有代码（需要全新创建）
- **数据库**: 无现有表结构（需要创建销售相关表）

---

## 详细任务列表

### Phase 1: 后端数据模型

#### Task 1.1: 创建后端模块结构
- [ ] 创建 `src-tauri/src/agent/sales/` 目录
- [ ] 创建 `sales/mod.rs` 模块入口
- [ ] 更新 `src-tauri/src/agent/mod.rs` 添加 sales 子模块
- [ ] 更新 `src-tauri/Cargo.toml` 添加依赖

#### Task 1.2: 定义数据模型
- [ ] 创建 `sales/models.rs`
- [ ] 定义 `Customer` 结构体
- [ ] 定义 `Quotation` 结构体
- [ ] 定义 `QuotationItem` 结构体
- [ ] 定义 `Contract` 结构体
- [ ] 定义 `Order` 结构体
- [ ] 定义 `OrderItem` 结构体
- [ ] 定义枚举类型（CustomerType, CustomerStatus, QuotationStatus, ContractStatus, OrderStatus）

#### Task 1.3: 实现错误处理
- [ ] 创建 `sales/error.rs`
- [ ] 定义 `SalesError` 错误枚举
- [ ] 实现错误转换和显示 trait

#### Task 1.4: 实现数据验证
- [ ] 创建 `sales/validators.rs`
- [ ] 实现客户数据验证规则
- [ ] 实现报价单数据验证规则
- [ ] 实现合同数据验证规则
- [ ] 实现订单数据验证规则

---

### Phase 2: 数据访问层

#### Task 2.1: 实现客户数据访问
- [ ] 创建 `sales/repository.rs`
- [ ] 实现 `create_customer` 方法
- [ ] 实现 `get_customer` 方法
- [ ] 实现 `update_customer` 方法
- [ ] 实现 `delete_customer` 方法
- [ ] 实现 `list_customers` 方法（支持分页和过滤）

#### Task 2.2: 实现报价单数据访问
- [ ] 实现 `create_quotation` 方法
- [ ] 实现 `get_quotation` 方法（含明细）
- [ ] 实现 `update_quotation` 方法
- [ ] 实现 `delete_quotation` 方法
- [ ] 实现 `list_quotations` 方法
- [ ] 实现报价单明细的 CRUD

#### Task 2.3: 实现合同数据访问
- [ ] 实现 `create_contract` 方法
- [ ] 实现 `get_contract` 方法
- [ ] 实现 `update_contract` 方法
- [ ] 实现 `delete_contract` 方法
- [ ] 实现 `list_contracts` 方法

#### Task 2.4: 实现订单数据访问
- [ ] 实现 `create_order` 方法
- [ ] 实现 `get_order` 方法（含明细）
- [ ] 实现 `update_order` 方法
- [ ] 实现 `delete_order` 方法
- [ ] 实现 `list_orders` 方法
- [ ] 实现订单明细的 CRUD

#### Task 2.5: 实现变更历史
- [ ] 实现 `record_change` 方法
- [ ] 实现 `get_change_history` 方法

---

### Phase 3: Tauri 命令

#### Task 3.1: 实现客户命令
- [ ] 创建 `sales/commands.rs`
- [ ] 实现 `sales_customer_create` 命令
- [ ] 实现 `sales_customer_get` 命令
- [ ] 实现 `sales_customer_update` 命令
- [ ] 实现 `sales_customer_delete` 命令
- [ ] 实现 `sales_customer_list` 命令

#### Task 3.2: 实现报价单命令
- [ ] 实现 `sales_quotation_create` 命令
- [ ] 实现 `sales_quotation_get` 命令
- [ ] 实现 `sales_quotation_update` 命令
- [ ] 实现 `sales_quotation_delete` 命令
- [ ] 实现 `sales_quotation_list` 命令
- [ ] 实现 `sales_quotation_send` 命令
- [ ] 实现 `sales_quotation_accept` 命令
- [ ] 实现 `sales_quotation_reject` 命令

#### Task 3.3: 实现合同命令
- [ ] 实现 `sales_contract_create` 命令
- [ ] 实现 `sales_contract_get` 命令
- [ ] 实现 `sales_contract_update` 命令
- [ ] 实现 `sales_contract_delete` 命令
- [ ] 实现 `sales_contract_list` 命令
- [ ] 实现 `sales_contract_sign` 命令
- [ ] 实现 `sales_contract_terminate` 命令

#### Task 3.4: 实现订单命令
- [ ] 实现 `sales_order_create` 命令
- [ ] 实现 `sales_order_get` 命令
- [ ] 实现 `sales_order_update` 命令
- [ ] 实现 `sales_order_delete` 命令
- [ ] 实现 `sales_order_list` 命令
- [ ] 实现 `sales_order_confirm` 命令
- [ ] 实现 `sales_order_cancel` 命令
- [ ] 实现 `sales_order_update_status` 命令

---

### Phase 4: 数据库迁移

#### Task 4.1: 创建数据库表
- [ ] 创建 `sales_customer` 客户表
- [ ] 创建 `sales_quotation` 报价单表
- [ ] 创建 `sales_quotation_item` 报价明细表
- [ ] 创建 `sales_contract` 合同表
- [ ] 创建 `sales_order` 订单表
- [ ] 创建 `sales_order_item` 订单明细表
- [ ] 创建 `sales_change_history` 变更历史表

#### Task 4.2: 创建索引
- [ ] 为各表创建必要的索引

---

### Phase 5: 前端类型和 API

#### Task 5.1: 创建前端类型定义
- [ ] 创建 `src/features/sales/types/customer.types.ts`
- [ ] 创建 `src/features/sales/types/quotation.types.ts`
- [ ] 创建 `src/features/sales/types/contract.types.ts`
- [ ] 创建 `src/features/sales/types/order.types.ts`
- [ ] 创建 `src/features/sales/types/index.ts`

#### Task 5.2: 创建前端 API 封装
- [ ] 创建 `src/features/sales/api/customerApi.ts`
- [ ] 创建 `src/features/sales/api/quotationApi.ts`
- [ ] 创建 `src/features/sales/api/contractApi.ts`
- [ ] 创建 `src/features/sales/api/orderApi.ts`
- [ ] 创建 `src/features/sales/api/index.ts`

#### Task 5.3: 创建前端状态管理
- [ ] 创建 `src/features/sales/stores/salesStore.ts`
- [ ] 创建 `src/features/sales/stores/customerStore.ts`
- [ ] 创建 `src/features/sales/stores/quotationStore.ts`
- [ ] 创建 `src/features/sales/stores/contractStore.ts`
- [ ] 创建 `src/features/sales/stores/orderStore.ts`

#### Task 5.4: 创建模块入口
- [ ] 创建 `src/features/sales/index.ts`

---

## 验收标准

### 功能验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| AC-1 | 定义销售模块数据模型（Customer、Quotation、Contract、Order） | 代码审查 |
| AC-2 | 创建模拟数据 API（mock APIs）用于开发和测试 | API 调用测试 |
| AC-3 | 实现数据验证规则 | 边界值测试 |
| AC-4 | 添加数据权限控制 | 权限测试 |
| AC-5 | 创建数据变更历史记录 | 历史查询测试 |

### 技术验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| TC-1 | 代码编译通过，无 TypeScript/Rust 错误 | `npm run build` + `cargo build` |
| TC-2 | 数据库表创建成功 | 数据库迁移脚本执行 |
| TC-3 | 所有 CRUD API 正确实现 | API 测试 |
| TC-4 | 前端类型定义完整 | TypeScript 编译检查 |

---

## 测试要点

### 单元测试

#### 后端单元测试
- [ ] 数据模型序列化/反序列化测试
- [ ] 数据验证规则测试
- [ ] 各 CRUD 方法测试
- [ ] 关联数据验证测试

#### 前端单元测试
- [ ] 类型定义正确性测试
- [ ] API 封装测试
- [ ] Store 状态管理测试

### 集成测试
- [ ] 客户 → 报价单 → 合同 → 订单 完整流程测试
- [ ] 数据验证集成测试
- [ ] 变更历史记录测试

### 浏览器测试
- [ ] UI 组件渲染测试（后续 Story 实现 UI 后）

---

## 执行顺序

```
1. Phase 0: 完成前置依赖
   └─ Story 39.1, 39.2 (基础数据模型和权限)

2. Phase 1: 后端数据模型
   ├─ Task 1.1 - 创建后端模块结构
   ├─ Task 1.2 - 定义数据模型
   ├─ Task 1.3 - 实现错误处理
   └─ Task 1.4 - 实现数据验证

3. Phase 2: 数据访问层
   ├─ Task 2.1 - 实现客户数据访问
   ├─ Task 2.2 - 实现报价单数据访问
   ├─ Task 2.3 - 实现合同数据访问
   ├─ Task 2.4 - 实现订单数据访问
   └─ Task 2.5 - 实现变更历史

4. Phase 3: Tauri 命令
   ├─ Task 3.1 - 实现客户命令
   ├─ Task 3.2 - 实现报价单命令
   ├─ Task 3.3 - 实现合同命令
   └─ Task 3.4 - 实现订单命令

5. Phase 4: 数据库迁移
   ├─ Task 4.1 - 创建数据库表
   └─ Task 4.2 - 创建索引

6. Phase 5: 前端类型和 API
   ├─ Task 5.1 - 创建前端类型定义
   ├─ Task 5.2 - 创建前端 API 封装
   ├─ Task 5.3 - 创建前端状态管理
   └─ Task 5.4 - 创建模块入口

7. Phase 6: 测试与验证
   └─ 执行验收标准测试
```

---

## 依赖关系

### 前置依赖
- Story 39.1 (基础数据模型定义)
- Story 39.2 (基础权限系统)

### 被依赖
- Story 54.4 (销售模块 - 动态表单与数据绑定)
- Story 54.5 (销售模块 - Agent 工具集成)

---

## 估算工作量

| Phase | 任务 | 估算时间 |
|-------|------|----------|
| Phase 1 | 后端数据模型 | 6 小时 |
| Phase 2 | 数据访问层 | 8 小时 |
| Phase 3 | Tauri 命令 | 6 小时 |
| Phase 4 | 数据库迁移 | 2 小时 |
| Phase 5 | 前端类型和 API | 6 小时 |
| Phase 6 | 测试与验证 | 4 小时 |
| **总计** | | **32 小时** |
