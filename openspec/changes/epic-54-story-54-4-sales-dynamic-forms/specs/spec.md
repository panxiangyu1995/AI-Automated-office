# Specification: 销售模块 - 动态表单与数据绑定

## 需求来源

### PRD 需求
| 需求编号 | 需求描述 |
|----------|----------|
| FR513 | 动态表单渲染器与数据绑定 |
| FR514 | 表单数据验证与自动保存 |
| FR515 | 字段级权限控制 |

### 架构约束
| ADR 编号 | 约束描述 |
|----------|----------|
| ADR-035 | 动态表单 Schema 规范 |
| ADR-036 | 动态表单渲染器设计 |
| ADR-037 | 权限系统集成 |

### UX 规范
| UX 编号 | 约束描述 |
|---------|----------|
| UX-01 | 应使用 Ant Design 组件 |
| UX-04 | 应遵循 VSCode 风格四栏布局 |

---

## 功能规格

### 用户故事

**As a** 销售人员,
**I want to** 通过动态表单管理客户、报价单、合同和订单,
**So that** 我可以高效完成销售业务的日常数据录入和修改。

---

## 输入输出规格

### DynamicSchema (动态 Schema)

```typescript
interface DynamicSchema {
  name: string;           // Schema 名称
  title: string;           // 显示标题
  fields: Field[];        // 字段列表
  permissions?: Permissions;  // 权限配置
  layout?: 'vertical' | 'horizontal' | 'grid';  // 布局方式
  sections?: FormSection[];  // 表单分区
}
```

### Field (字段定义)

```typescript
interface BaseField {
  name: string;           // 字段名称
  type: FieldType;        // 字段类型
  label: string;          // 显示标签
  placeholder?: string;   // 占位文本
  defaultValue?: any;    // 默认值
  disabled?: boolean;     // 是否禁用
  readonly?: boolean;    // 是否只读
  visible?: boolean;      // 是否可见
  required?: boolean;     // 是否必填
  validation?: ValidationRule[];  // 验证规则
  helpText?: string;     // 帮助文本
  width?: number;         // 表单栅格宽度（1-24）
}
```

### FieldType (字段类型枚举)

| 值 | 描述 | 对应组件 |
|----|------|----------|
| string | 单行文本 | Input |
| number | 数字 | InputNumber |
| boolean | 布尔值 | Switch |
| date | 日期 | DatePicker |
| datetime | 日期时间 | DatePicker |
| select | 单选下拉 | Select |
| multiselect | 多选下拉 | MultiSelect |
| ref | 关联引用 | SearchSelect |
| textarea | 多行文本 | TextArea |
| richtext | 富文本 | RichTextEditor |
| file | 文件上传 | Upload |
| table | 表格 | Table |

### Permissions (权限配置)

```typescript
interface Permissions {
  read?: string[];        // 允许读取的角色列表
  write?: string[];       // 允许写入的角色列表
  fields?: Record<string, string[]>;  // 字段级权限，key 为字段名，value 为允许编辑的角色列表
}
```

---

## Schema 字段规格

### CustomerSchema (客户 Schema)

| 字段名 | 类型 | 必填 | 默认值 | 校验规则 | 权限 | 说明 |
|--------|------|------|--------|----------|------|------|
| name | string | 是 | - | 非空, maxLength: 200 | 读写 | 客户名称 |
| contact_person | string | 是 | - | 非空, maxLength: 100 | 读写 | 联系人 |
| contact_phone | string | 是 | - | pattern: 手机号或座机 | 读写 | 联系电话 |
| contact_email | string | 否 | - | pattern: 邮箱格式 | 读写 | 邮箱 |
| customer_type | select | 是 | enterprise | 非空 | 读写 | 客户类型 |
| industry | string | 否 | - | maxLength: 100 | 读写 | 行业 |
| status | select | 否 | active | - | 只读(部分角色可写) | 客户状态 |
| credit_limit | number | 否 | 0 | min: 0 | 只读(部分角色可写) | 信用额度 |
| tax_number | string | 否 | - | maxLength: 50 | 读写 | 税号 |
| bank_account | string | 否 | - | maxLength: 50 | 读写 | 银行账号 |
| address | textarea | 否 | - | maxLength: 500 | 读写 | 地址 |
| notes | textarea | 否 | - | maxLength: 2000 | 读写 | 备注 |

**select 字段 options:**

```typescript
// customer_type
[
  { label: '企业客户', value: 'enterprise' },
  { label: '个人客户', value: 'individual' },
  { label: '政府客户', value: 'government' }
]

// status
[
  { label: '活跃', value: 'active' },
  { label: '潜在', value: 'potential' },
  { label: '已流失', value: 'inactive' }
]
```

### QuotationSchema (报价单 Schema)

| 字段名 | 类型 | 必填 | 默认值 | 校验规则 | 权限 | 说明 |
|--------|------|------|--------|----------|------|------|
| quotation_no | string | - | 自动生成 | - | 只读 | 报价单编号 |
| customer_id | ref | 是 | - | 非空 | 读写 | 客户 |
| sales_person_id | string | - | 当前用户 | - | 只读 | 业务员 |
| title | string | 是 | - | 非空, maxLength: 200 | 读写 | 报价标题 |
| valid_from | date | 是 | 今天 | 非空 | 读写 | 有效期开始 |
| valid_until | date | 是 | - | 非空, >= valid_from | 读写 | 有效期结束 |
| items | table | 是 | [] | 至少一项 | 读写 | 报价明细 |
| subtotal | number | - | 0 | - | 只读 | 小计金额 |
| discount | number | 否 | 0 | min: 0 | 读写 | 折扣金额 |
| tax_rate | number | 否 | 0 | 0-100 | 读写 | 税率(%) |
| tax_amount | number | - | 计算值 | - | 只读 | 税额 |
| total_amount | number | - | 计算值 | - | 只读 | 总金额 |
| status | select | 否 | draft | - | 只读(部分角色可写) | 状态 |
| notes | textarea | 否 | - | maxLength: 2000 | 读写 | 备注 |

**table 字段 columns:**

| 列名 | 类型 | 必填 | 可编辑 | 说明 |
|------|------|------|--------|------|
| product_name | string | 是 | 是 | 产品名称 |
| specification | string | 否 | 是 | 规格 |
| unit | string | 是 | 是 | 单位 |
| quantity | number | 是 | 是 | 数量 |
| unit_price | number | 是 | 是 | 单价 |
| discount_rate | number | 否 | 是 | 折扣率(0-1) |
| amount | number | - | 只读 | 金额 |
| notes | string | 否 | 是 | 备注 |

**select 字段 options:**

```typescript
// status
[
  { label: '草稿', value: 'draft' },
  { label: '已发送', value: 'sent' },
  { label: '已接受', value: 'accepted' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已过期', value: 'expired' }
]
```

### ContractSchema (合同 Schema)

| 字段名 | 类型 | 必填 | 默认值 | 校验规则 | 权限 | 说明 |
|--------|------|------|--------|----------|------|------|
| contract_no | string | - | 自动生成 | - | 只读 | 合同编号 |
| title | string | 是 | - | 非空, maxLength: 200 | 读写 | 合同标题 |
| customer_id | ref | 是 | - | 非空 | 读写 | 客户 |
| party_a | string | 是 | - | 非空, maxLength: 200 | 读写 | 甲方 |
| party_b | string | 是 | - | 非空, maxLength: 200 | 读写 | 乙方 |
| sign_date | date | 是 | - | 非空 | 读写 | 签订日期 |
| effective_date | date | 是 | - | 非空 | 读写 | 生效日期 |
| expiry_date | date | 是 | - | 非空, > effective_date | 读写 | 到期日期 |
| total_amount | number | 是 | - | min: 0 | 只读(部分角色可写) | 合同金额 |
| payment_terms | textarea | 否 | - | maxLength: 1000 | 读写 | 付款条款 |
| quotation_id | ref | 否 | - | - | 读写 | 关联报价单 |
| status | select | 否 | draft | - | 只读(部分角色可写) | 状态 |
| notes | textarea | 否 | - | maxLength: 2000 | 读写 | 备注 |

**select 字段 options:**

```typescript
// status
[
  { label: '草稿', value: 'draft' },
  { label: '已签订', value: 'signed' },
  { label: '执行中', value: 'in_progress' },
  { label: '已终止', value: 'terminated' },
  { label: '已完成', value: 'completed' }
]
```

### OrderSchema (订单 Schema)

| 字段名 | 类型 | 必填 | 默认值 | 校验规则 | 权限 | 说明 |
|--------|------|------|--------|----------|------|------|
| order_no | string | - | 自动生成 | - | 只读 | 订单编号 |
| customer_id | ref | 是 | - | 非空 | 读写 | 客户 |
| contract_id | ref | 否 | - | - | 读写 | 关联合同 |
| sales_person_id | string | - | 当前用户 | - | 只读 | 业务员 |
| title | string | 是 | - | 非空, maxLength: 200 | 读写 | 订单标题 |
| items | table | 是 | [] | 至少一项 | 读写 | 订单明细 |
| subtotal | number | - | 0 | - | 只读 | 小计金额 |
| discount | number | 否 | 0 | min: 0 | 读写 | 折扣金额 |
| tax_rate | number | 否 | 0 | 0-100 | 读写 | 税率(%) |
| tax_amount | number | - | 计算值 | - | 只读 | 税额 |
| total_amount | number | - | 计算值 | - | 只读 | 总金额 |
| delivery_address | textarea | 否 | - | maxLength: 500 | 读写 | 交货地址 |
| expected_delivery_date | date | 否 | - | - | 读写 | 预计交货日期 |
| actual_delivery_date | date | 否 | - | - | 只读 | 实际交货日期 |
| status | select | 否 | pending | - | 只读(部分角色可写) | 状态 |
| notes | textarea | 否 | - | maxLength: 2000 | 读写 | 备注 |

**select 字段 options:**

```typescript
// status
[
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '生产中', value: 'in_production' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]
```

---

## 验收场景 (Given-When-Then 格式)

### Scenario 1: 创建客户

**Given** 销售人员进入客户创建页面
**And** 当前用户角色为 `sales`
**When** 填写客户信息：
- name: "测试客户有限公司"
- contact_person: "张三"
- contact_phone: "13800138000"
- customer_type: "enterprise"
**And** 点击"保存"按钮
**Then** 系统验证数据格式正确
**And** 系统调用 `customerApi.create` 创建客户
**And** 系统显示成功提示："客户创建成功"
**And** 页面跳转到客户详情页

### Scenario 2: 编辑客户

**Given** 销售人员进入客户编辑页面
**And** 客户 ID 为 "cust-001"
**When** 修改客户信息：
- contact_phone: "13900139000"
**And** 点击"保存"按钮
**Then** 系统验证数据格式正确
**And** 系统调用 `customerApi.update` 更新客户
**And** 系统记录变更日志：
- field: "contact_phone"
- old_value: "13800138000"
- new_value: "13900139000"
**And** 系统显示成功提示："客户信息已更新"

### Scenario 3: 字段级权限控制

**Given** 当前用户角色为 `sales`
**And** 销售人员进入客户编辑页面
**When** 查看表单字段
**Then** 以下字段为只读：
- status（只有 admin/sales_manager 可编辑）
- credit_limit（只有 admin/sales_manager 可编辑）
**And** 以下字段可编辑：
- name, contact_person, contact_phone 等其他字段

**Given** 当前用户角色为 `admin`
**When** 查看表单字段
**Then** 所有字段均可编辑

### Scenario 4: 自动保存草稿

**Given** 销售人员填写客户信息
**And** 修改了以下字段：
- contact_person: "李四"
- contact_phone: "13700137000"
**And** 30 秒内没有手动点击保存
**When** 自动保存定时器触发
**Then** 系统调用 `customerApi.update` 保存当前数据
**And** 系统显示提示："草稿已自动保存"
**And** 最后保存时间更新

### Scenario 5: 离开页面提示

**Given** 销售人员填写客户信息
**And** 有未保存的更改
**When** 尝试关闭浏览器标签页或点击其他菜单
**Then** 浏览器弹出确认对话框："有未保存的更改，确定要离开吗？"
**And** 如果用户点击"留在此页"，页面保持不变
**And** 如果用户点击"离开"，则离开并丢失未保存的更改

### Scenario 6: 报价单明细表格编辑

**Given** 销售人员进入报价单编辑页面
**When** 在明细表格中：
- 添加一行新产品
- 填写产品信息：名称"产品A"、数量 10、单价 100
- 设置折扣率 0.9
**Then** 系统自动计算：
- amount = 10 * 100 * 0.9 = 900
- subtotal = 900
**And** 如果折扣或数量变化，金额自动重新计算

### Scenario 7: 表单验证 - 空必填字段

**Given** 销售人员进入客户创建页面
**When** 直接点击"保存"按钮而不填写任何字段
**Then** 系统显示验证错误：
- name: "请输入客户名称"
- contact_person: "请输入联系人"
- contact_phone: "请输入联系电话"
- customer_type: "请选择客户类型"
**And** 高亮显示错误字段
**And** 阻止表单提交

### Scenario 8: 表单验证 - 无效格式

**Given** 销售人员进入客户编辑页面
**When** 在 contact_email 字段输入："invalid-email"
**And** 焦点离开该字段
**Then** 系统显示验证错误："请输入正确的邮箱地址"
**And** 字段边框变红

### Scenario 9: 变更审计历史

**Given** 销售人员修改了客户信息
**When** 保存后点击"查看变更历史"
**Then** 系统显示变更历史列表：
| 变更字段 | 变更前 | 变更后 | 变更人 | 变更时间 |
|----------|--------|--------|--------|----------|
| contact_phone | 13800138000 | 13900139000 | 张三 | 2024-03-27 10:30:00 |
| status | potential | active | 李四 | 2024-03-27 11:00:00 |

### Scenario 10: 引用数据不存在

**Given** 销售人员创建报价单
**When** 在 customer_id 字段选择一个已删除的客户
**And** 点击"保存"
**Then** 系统显示错误："引用的客户不存在，请重新选择"
**And** 阻止表单提交

---

## 错误码定义

| 错误码 | 错误信息 | 错误类型 | 处理方式 |
|--------|----------|----------|----------|
| FORM_001 | 必填字段不能为空 | ValidationError | 高亮字段，显示错误提示 |
| FORM_002 | 数据格式不正确 | ValidationError | 显示具体格式要求 |
| FORM_003 | 引用数据不存在 | ValidationError | 提示用户检查引用 |
| FORM_004 | 保存失败 | SystemError | 显示错误，保留用户输入 |
| FORM_005 | 会话已过期 | AuthError | 跳转登录页 |
| FORM_006 | 金额必须大于等于零 | ValidationError | 高亮字段，显示错误提示 |
| FORM_007 | 日期范围无效 | ValidationError | 提示开始日期必须早于结束日期 |
| FORM_008 | 表格至少需要一行数据 | ValidationError | 提示用户添加明细 |
| FORM_009 | 编号已存在 | BusinessError | 提示用户使用其他编号 |
| FORM_010 | 无权限执行此操作 | AuthError | 提示用户联系管理员 |
| FORM_011 | 网络连接失败 | NetworkError | 提示用户检查网络 |
| FORM_012 | 自动保存失败 | SystemError | 显示警告，提示用户手动保存 |

---

## 边界条件

### 数据边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 空表单提交 | 所有必填字段为空 | 显示所有验证错误，阻止提交 |
| 超长文本 | 文本超过 maxLength | 前端截断，后端返回错误 |
| 无效数字 | 数字超出范围 | 显示验证错误 |
| 空表格 | items 数组为空 | 显示验证错误：至少需要一项 |
| 超大数字 | 数字超过 Number.MAX_SAFE_INTEGER | 返回错误：数字超出安全范围 |

### 状态边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 并发编辑 | 两个用户同时编辑同一记录 | 后者提交时显示冲突警告 |
| 会话超时 | 用户操作中途会话过期 | 保存草稿到本地，跳转登录 |
| 网络中断 | 保存时网络断开 | 显示错误，保留数据在表单中 |

### 权限边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 字段无读权限 | 用户对某字段无读权限 | 字段不在表单中渲染 |
| 字段无写权限 | 用户对某字段无写权限 | 字段渲染为只读 |
| 整个 Schema 无权限 | 用户对整个实体无权限 | 显示"无权限访问" |

### 性能边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 表格行数过多 | 明细表格超过 100 行 | 分页加载，虚拟滚动 |
| 自动保存过于频繁 | 用户快速连续输入 | 使用 debounce 防抖 |
| 变更历史过多 | 变更记录超过 1000 条 | 分页加载 |

---

## Hooks 接口定义

### useSalesEntity

```typescript
// src/features/sales/hooks/useSalesEntity.ts

interface UseSalesEntityOptions<T extends EntityType> {
  entityType: T;
  entityId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;  // 默认 30000ms
}

interface UseSalesEntityReturn<T extends EntityType> {
  // 数据状态
  data: Entity<T> | null;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;

  // 操作方法
  load: () => Promise<void>;
  save: (data: Partial<Entity<T>>) => Promise<Entity<T>>;
  create: (data: Partial<Entity<T>>) => Promise<Entity<T>>;
  validate: (data: Partial<Entity<T>>) => ValidationResult;
  reset: () => void;
}

function useSalesEntity<T extends EntityType>(
  options: UseSalesEntityOptions<T>
): UseSalesEntityReturn<T>;
```

### useAutoSave

```typescript
// src/features/sales/hooks/useAutoSave.ts

interface UseAutoSaveOptions {
  interval?: number;         // 自动保存间隔，默认 30000ms
  enabled?: boolean;          // 是否启用，默认 true
  debounce?: number;         // 防抖时间，默认 1000ms
  onSave?: () => void;       // 保存成功回调
  onError?: (error: Error) => void;  // 保存失败回调
}

interface UseAutoSaveReturn {
  isDirty: boolean;          // 是否有未保存的更改
  isSaving: boolean;         // 是否正在保存
  lastSaved: Date | null;    // 最后保存时间
  saveNow: () => Promise<void>;  // 手动触发保存
}

function useAutoSave(
  data: any,
  save: (data: any) => Promise<any>,
  options?: UseAutoSaveOptions
): UseAutoSaveReturn;
```

### useFieldPermissions

```typescript
// src/features/sales/hooks/useFieldPermissions.ts

interface FieldPermission {
  read: boolean;     // 是否可读
  write: boolean;     // 是否可写
  hide: boolean;      // 是否隐藏
}

interface UseFieldPermissionsReturn {
  permissions: Record<string, FieldPermission>;  // 字段权限映射
  canRead: (fieldName: string) => boolean;
  canWrite: (fieldName: string) => boolean;
  isHidden: (fieldName: string) => boolean;
}

function useFieldPermissions(
  schema: DynamicSchema
): UseFieldPermissionsReturn;
```

### useAuditLog

```typescript
// src/features/sales/hooks/useAuditLog.ts

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface ChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: string;
}

interface UseAuditLogReturn {
  logChanges: (changes: FieldChange[]) => Promise<void>;
  getHistory: (params?: { page?: number; pageSize?: number }) => Promise<ChangeHistory[]>;
  getFieldHistory: (fieldName: string) => Promise<ChangeHistory[]>;
}

function useAuditLog(
  entityType: string,
  entityId: string
): UseAuditLogReturn;
```

---

## 后端命令接口

### 获取实体

**命令**: `get_sales_entity`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| entity_type | string | 是 | 实体类型：customer/quotation/contract/order |
| id | string | 是 | 实体 ID |

**返回值**: `SalesEntity`

**错误码**:
| 错误码 | 描述 |
|--------|------|
| ERR_ENTITY_NOT_FOUND | 实体不存在 |
| ERR_INVALID_ENTITY_TYPE | 无效的实体类型 |
| ERR_DATABASE_ERROR | 数据库错误 |

### 保存实体

**命令**: `save_sales_entity`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| entity_type | string | 是 | 实体类型 |
| id | string | 是 | 实体 ID |
| data | SalesEntity | 是 | 要保存的数据 |
| change_log | ChangeLog[] | 否 | 变更日志 |

**返回值**: `SalesEntity`

**错误码**:
| 错误码 | 描述 |
|--------|------|
| ERR_ENTITY_NOT_FOUND | 实体不存在 |
| ERR_VALIDATION_FAILED | 验证失败 |
| ERR_CONFLICT | 并发冲突 |

### 创建实体

**命令**: `create_sales_entity`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| entity_type | string | 是 | 实体类型 |
| data | SalesEntity | 是 | 要创建的数据 |

**返回值**: `SalesEntity`

### 获取变更历史

**命令**: `get_sales_change_history`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| entity_type | string | 是 | 实体类型 |
| entity_id | string | 是 | 实体 ID |
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 20 |

**返回值**: `{ items: ChangeHistory[], total: number }`

---

## 自动计算规则

### 报价单/订单金额计算

```
subtotal = SUM(item.quantity * item.unit_price * item.discount_rate) for each item
tax_amount = subtotal * (tax_rate / 100)
total_amount = subtotal - discount + tax_amount
```

### 日期校验

```
valid_until >= valid_from
expiry_date > effective_date
expected_delivery_date >= order_date (订单场景)
```

---

## 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 表单加载时间 | < 500ms | 从 API 获取数据到表单渲染完成 |
| 字段验证响应时间 | < 100ms | 实时验证 |
| 自动保存触发延迟 | < 1s | 防抖后执行 |
| 表格渲染（100行） | < 200ms | 使用虚拟滚动 |
