# Tasks: 销售模块 - 动态表单与数据绑定

## 任务列表

### Task 127: 销售模块 - 动态表单与数据绑定

| 属性 | 值 |
|------|-----|
| **ID** | 127 |
| **Epic** | Epic 54 - 业务模块动态化 |
| **Story** | Story 54.4 |
| **Title** | 销售模块 - 动态表单与数据绑定 |
| **implementationType** | `refactor` (基于现有代码重构扩展) |
| **优先级** | `high` |
| **阶段** | Phase 4 - 业务模块动态化 |
| **后端必需** | `false` (主要前端任务) |

#### 描述
实现销售模块的动态表单与真实业务数据的绑定，支持 CRUD 操作。

#### 现有代码状态
- **前端**: `src/features/dynamic-ui/components/DynamicFormRenderer.tsx` 组件已有
- **后端**: Story 54.3 定义的 API 接口
- **数据库**: Story 54.3 定义的表结构

---

## 详细任务列表

### Phase 1: Schema 定义

#### Task 1.1: 创建基础 Schema 类型定义
- [ ] 创建 `src/features/dynamic-ui/types/schema.types.ts`
- [ ] 定义 `BaseField` 接口
- [ ] 定义 `StringField`, `NumberField`, `SelectField`, `RefField`, `TableField` 接口
- [ ] 定义 `DynamicSchema` 接口
- [ ] 定义 `FieldPermission` 接口

#### Task 1.2: 创建客户 Schema
- [ ] 创建 `src/features/sales/schemas/customerSchema.ts`
- [ ] 定义 `customerSchema` 对象
- [ ] 包含所有客户字段定义
- [ ] 配置字段验证规则
- [ ] 配置字段级权限

#### Task 1.3: 创建报价单 Schema
- [ ] 创建 `src/features/sales/schemas/quotationSchema.ts`
- [ ] 定义 `quotationSchema` 对象
- [ ] 包含报价明细表格字段
- [ ] 配置自动计算字段（金额小计、税额、总金额）
- [ ] 配置字段级权限

#### Task 1.4: 创建合同 Schema
- [ ] 创建 `src/features/sales/schemas/contractSchema.ts`
- [ ] 定义 `contractSchema` 对象
- [ ] 包含所有合同字段定义
- [ ] 配置字段级权限

#### Task 1.5: 创建订单 Schema
- [ ] 创建 `src/features/sales/schemas/orderSchema.ts`
- [ ] 定义 `orderSchema` 对象
- [ ] 包含订单明细表格字段
- [ ] 配置自动计算字段
- [ ] 配置字段级权限

#### Task 1.6: 创建 Schema 导出
- [ ] 创建 `src/features/sales/schemas/index.ts`
- [ ] 导出所有 Schema
- [ ] 创建 `getSchemaByName` 工具函数

---

### Phase 2: Hooks 实现

#### Task 2.1: 实现 useSalesEntity Hook
- [ ] 创建 `src/features/sales/hooks/useSalesEntity.ts`
- [ ] 实现 `load` 加载数据方法
- [ ] 实现 `save` 保存数据方法
- [ ] 实现 `create` 创建数据方法
- [ ] 实现错误处理和加载状态

#### Task 2.2: 实现 useAutoSave Hook
- [ ] 创建 `src/features/sales/hooks/useAutoSave.ts`
- [ ] 实现定时自动保存（默认 30 秒）
- [ ] 实现离开页面提示
- [ ] 实现脏数据检测
- [ ] 提供 `saveIfDirty` 手动触发方法

#### Task 2.3: 实现 useFieldPermissions Hook
- [ ] 创建 `src/features/sales/hooks/useFieldPermissions.ts`
- [ ] 读取当前用户角色
- [ ] 根据 Schema 权限配置计算字段权限
- [ ] 返回字段级的 read/write/hide 权限

#### Task 2.4: 实现 useAuditLog Hook
- [ ] 创建 `src/features/sales/hooks/useAuditLog.ts`
- [ ] 实现字段变更检测
- [ ] 实现变更日志记录
- [ ] 调用审计 API 记录变更

---

### Phase 3: 组件实现

#### Task 3.1: 创建 CustomerForm 组件
- [ ] 创建 `src/features/sales/components/CustomerForm.tsx`
- [ ] 集成 DynamicFormRenderer
- [ ] 集成 useSalesEntity Hook
- [ ] 集成 useAutoSave Hook
- [ ] 集成 useFieldPermissions Hook
- [ ] 实现表单提交和取消逻辑

#### Task 3.2: 创建 QuotationForm 组件
- [ ] 创建 `src/features/sales/components/QuotationForm.tsx`
- [ ] 集成 DynamicFormRenderer
- [ ] 实现明细表格的增删改
- [ ] 实现金额自动计算
- [ ] 集成 useAutoSave Hook

#### Task 3.3: 创建 ContractForm 组件
- [ ] 创建 `src/features/sales/components/ContractForm.tsx`
- [ ] 集成 DynamicFormRenderer
- [ ] 实现日期联动验证
- [ ] 集成 useAutoSave Hook

#### Task 3.4: 创建 OrderForm 组件
- [ ] 创建 `src/features/sales/components/OrderForm.tsx`
- [ ] 集成 DynamicFormRenderer
- [ ] 实现明细表格的增删改
- [ ] 实现金额自动计算
- [ ] 集成 useAutoSave Hook

#### Task 3.5: 创建 SalesTable 组件
- [ ] 创建 `src/features/sales/components/SalesTable.tsx`
- [ ] 实现通用列表展示
- [ ] 实现分页功能
- [ ] 实现行点击事件
- [ ] 实现状态标签展示

---

### Phase 4: 状态管理

#### Task 4.1: 扩展 Sales Store
- [ ] 修改 `src/features/sales/stores/salesStore.ts`
- [ ] 添加列表数据状态
- [ ] 添加当前实体状态
- [ ] 实现 `loadEntity` 方法
- [ ] 实现 `saveEntity` 方法
- [ ] 实现 `createEntity` 方法
- [ ] 实现 `deleteEntity` 方法
- [ ] 实现 `loadList` 方法

#### Task 4.2: 创建表单状态 Store
- [ ] 创建 `src/features/sales/stores/formStore.ts`
- [ ] 管理当前表单的脏状态
- [ ] 管理验证错误
- [ ] 管理最后保存时间

---

### Phase 5: 集成与测试

#### Task 5.1: 与 DynamicFormRenderer 集成
- [ ] 研究 DynamicFormRenderer 现有接口
- [ ] 必要时创建 Adapter 模式
- [ ] 测试 Schema 正确渲染

#### Task 5.2: 权限集成测试
- [ ] 测试 admin 角色的完整权限
- [ ] 测试 sales_manager 角色的受限字段
- [ ] 测试 sales 角色的只读字段

#### Task 5.3: 自动保存测试
- [ ] 测试定时保存触发
- [ ] 测试离开页面提示
- [ ] 测试脏数据检测

#### Task 5.4: 审计日志测试
- [ ] 测试字段变更记录
- [ ] 测试变更历史查询

---

## 验收标准

### 功能验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| AC-1 | 创建销售模块的 Schema 定义（客户、报价单、合同、订单） | Schema 文件审查 |
| AC-2 | 实现 DynamicFormRenderer 与销售数据 API 的绑定 | 表单提交测试 |
| AC-3 | 实现表单数据的自动保存与验证 | 自动保存功能测试 |
| AC-4 | 添加字段级权限控制 | 权限配置测试 |
| AC-5 | 实现表单变更的审计日志 | 变更历史测试 |

### 技术验收

| # | 验收标准 | 验证方法 |
|---|----------|----------|
| TC-1 | 代码编译通过，无 TypeScript 错误 | `npm run build` |
| TC-2 | Schema 定义符合规范 | Schema 审查 |
| TC-3 | Hook 正确实现状态管理 | 代码审查 |
| TC-4 | 组件正确集成 DynamicFormRenderer | 组件测试 |

---

## 测试要点

### 单元测试
- [ ] Schema 字段定义完整性测试
- [ ] useSalesEntity Hook 测试
- [ ] useAutoSave Hook 测试（定时、脏检测）
- [ ] useFieldPermissions Hook 测试

### 集成测试
- [ ] 客户表单 CRUD 完整流程
- [ ] 报价单表单（含明细）完整流程
- [ ] 合同表单完整流程
- [ ] 订单表单完整流程
- [ ] 权限控制集成测试

### 浏览器测试
- [ ] 客户表单页面渲染和交互
- [ ] 报价单表单明细表格交互
- [ ] 权限控制的字段显隐
- [ ] 自动保存提示

---

## 执行顺序

```
1. Phase 0: 完成前置依赖
   └─ Story 54.3 (销售数据层)
   └─ Story 40.1, 40.2 (动态表单基础)

2. Phase 1: Schema 定义
   ├─ Task 1.1 - 创建基础 Schema 类型定义
   ├─ Task 1.2 - 创建客户 Schema
   ├─ Task 1.3 - 创建报价单 Schema
   ├─ Task 1.4 - 创建合同 Schema
   ├─ Task 1.5 - 创建订单 Schema
   └─ Task 1.6 - 创建 Schema 导出

3. Phase 2: Hooks 实现
   ├─ Task 2.1 - 实现 useSalesEntity Hook
   ├─ Task 2.2 - 实现 useAutoSave Hook
   ├─ Task 2.3 - 实现 useFieldPermissions Hook
   └─ Task 2.4 - 实现 useAuditLog Hook

4. Phase 3: 组件实现
   ├─ Task 3.1 - 创建 CustomerForm 组件
   ├─ Task 3.2 - 创建 QuotationForm 组件
   ├─ Task 3.3 - 创建 ContractForm 组件
   ├─ Task 3.4 - 创建 OrderForm 组件
   └─ Task 3.5 - 创建 SalesTable 组件

5. Phase 4: 状态管理
   ├─ Task 4.1 - 扩展 Sales Store
   └─ Task 4.2 - 创建表单状态 Store

6. Phase 5: 集成与测试
   ├─ Task 5.1 - 与 DynamicFormRenderer 集成
   ├─ Task 5.2 - 权限集成测试
   ├─ Task 5.3 - 自动保存测试
   └─ Task 5.4 - 审计日志测试
```

---

## 依赖关系

### 前置依赖
- Story 54.3 (销售模块数据层 - 数据模型与API)
- Story 40.1 (动态表单基础框架)
- Story 40.2 (动态表单组件)

### 被依赖
- Story 54.5 (销售模块 - Agent 工具集成)

---

## 估算工作量

| Phase | 任务 | 估算时间 |
|-------|------|----------|
| Phase 1 | Schema 定义 | 6 小时 |
| Phase 2 | Hooks 实现 | 8 小时 |
| Phase 3 | 组件实现 | 8 小时 |
| Phase 4 | 状态管理 | 4 小时 |
| Phase 5 | 集成与测试 | 6 小时 |
| **总计** | | **32 小时** |
