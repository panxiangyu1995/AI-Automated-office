# Specification: 销售模块数据层 - 数据模型与API

## 需求来源

### PRD 需求
| 需求编号 | 需求描述 |
|----------|----------|
| FR510 | 销售模块应支持客户信息管理 |
| FR511 | 销售模块应支持报价单管理 |
| FR512 | 销售模块应支持合同和订单管理 |

### 架构约束
| ADR 编号 | 约束描述 |
|----------|----------|
| ADR-025 | 业务模块应遵循分层微内核架构 |
| ADR-037 | 工具命名应遵循 `{plugin}_{entity}_{action}` 格式 |

### UX 规范
| UX 编号 | 约束描述 |
|---------|----------|
| UX-01 | 应使用 Ant Design 组件 |

---

## 数据模型规格

### Customer (客户)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式，长度 36 |
| name | string | 是 | 客户名称 | 长度 1-200，非空 |
| contact_person | string | 是 | 联系人 | 长度 1-100 |
| contact_phone | string | 是 | 联系电话 | 手机号或座机格式 |
| contact_email | string | 否 | 联系邮箱 | 邮箱格式 |
| address | string | 否 | 地址 | 长度 0-500 |
| customer_type | CustomerType | 是 | 客户类型 | enum |
| industry | string | 否 | 行业 | 长度 0-100 |
| status | CustomerStatus | 是 | 状态 | enum |
| credit_limit | number | 否 | 信用额度 | >= 0 |
| tax_number | string | 否 | 税号 | 长度 0-50 |
| bank_account | string | 否 | 银行账号 | 长度 0-50 |
| notes | string | 否 | 备注 | 长度 0-2000 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |
| created_by | string | 是 | 创建人 ID | 非空 |

#### CustomerType 枚举

| 值 | 描述 |
|----|------|
| enterprise | 企业客户 |
| individual | 个人客户 |
| government | 政府客户 |

#### CustomerStatus 枚举

| 值 | 描述 |
|----|------|
| active | 活跃 |
| potential | 潜在 |
| inactive | 已流失 |

---

### Quotation (报价单)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| quotation_no | string | 是 | 报价单编号 | 格式：QT-YYYYMMDD-XXXX |
| customer_id | string | 是 | 客户 ID | 必须对应存在的客户 |
| sales_person_id | string | 是 | 业务员 ID | 非空 |
| title | string | 是 | 报价标题 | 长度 1-200 |
| subtotal | number | 是 | 小计金额 | >= 0 |
| discount | number | 是 | 折扣金额 | >= 0 |
| tax_rate | number | 是 | 税率 | 0-100 |
| tax_amount | number | 是 | 税额 | >= 0 |
| total_amount | number | 是 | 总金额 | >= 0 |
| valid_from | string | 是 | 有效期开始 | ISO 8601 日期 |
| valid_until | string | 是 | 有效期结束 | 必须 >= valid_from |
| status | QuotationStatus | 是 | 状态 | enum |
| notes | string | 否 | 备注 | 长度 0-2000 |
| items | QuotationItem[] | 是 | 报价明细 | 至少包含一项 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |
| created_by | string | 是 | 创建人 ID | 非空 |

#### QuotationStatus 枚举

| 值 | 描述 |
|----|------|
| draft | 草稿 |
| sent | 已发送 |
| accepted | 已接受 |
| rejected | 已拒绝 |
| expired | 已过期 |

---

### QuotationItem (报价明细)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| quotation_id | string | 是 | 报价单 ID | 必须对应存在的报价单 |
| product_id | string | 是 | 产品 ID | 非空 |
| product_name | string | 是 | 产品名称 | 长度 1-200 |
| specification | string | 否 | 规格 | 长度 0-500 |
| unit | string | 是 | 单位 | 长度 1-20 |
| quantity | number | 是 | 数量 | > 0 |
| unit_price | number | 是 | 单价 | >= 0 |
| discount_rate | number | 是 | 折扣率 | 0-1 |
| amount | number | 是 | 金额 | >= 0 |
| notes | string | 否 | 备注 | 长度 0-500 |

---

### Contract (合同)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| contract_no | string | 是 | 合同编号 | 格式：CT-YYYYMMDD-XXXX |
| title | string | 是 | 合同标题 | 长度 1-200 |
| customer_id | string | 是 | 客户 ID | 必须对应存在的客户 |
| party_a | string | 是 | 甲方名称 | 长度 1-200 |
| party_b | string | 是 | 乙方名称 | 长度 1-200 |
| sign_date | string | 是 | 签订日期 | ISO 8601 日期 |
| effective_date | string | 是 | 生效日期 | ISO 8601 日期 |
| expiry_date | string | 是 | 到期日期 | 必须 > effective_date |
| total_amount | number | 是 | 合同金额 | >= 0 |
| payment_terms | string | 否 | 付款条款 | 长度 0-1000 |
| status | ContractStatus | 是 | 状态 | enum |
| quotation_id | string | 否 | 关联报价单 ID | 可为空 |
| notes | string | 否 | 备注 | 长度 0-2000 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |
| created_by | string | 是 | 创建人 ID | 非空 |

#### ContractStatus 枚举

| 值 | 描述 |
|----|------|
| draft | 草稿 |
| signed | 已签订 |
| in_progress | 已执行 |
| terminated | 已终止 |
| completed | 已完成 |

---

### Order (订单)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| order_no | string | 是 | 订单编号 | 格式：SO-YYYYMMDD-XXXX |
| customer_id | string | 是 | 客户 ID | 必须对应存在的客户 |
| contract_id | string | 否 | 关联合同 ID | 可为空 |
| sales_person_id | string | 是 | 业务员 ID | 非空 |
| title | string | 是 | 订单标题 | 长度 1-200 |
| subtotal | number | 是 | 小计金额 | >= 0 |
| discount | number | 是 | 折扣金额 | >= 0 |
| tax_rate | number | 是 | 税率 | 0-100 |
| tax_amount | number | 是 | 税额 | >= 0 |
| total_amount | number | 是 | 总金额 | >= 0 |
| status | OrderStatus | 是 | 状态 | enum |
| delivery_address | string | 否 | 交货地址 | 长度 0-500 |
| expected_delivery_date | string | 否 | 预计交货日期 | ISO 8601 日期 |
| actual_delivery_date | string | 否 | 实际交货日期 | ISO 8601 日期 |
| notes | string | 否 | 备注 | 长度 0-2000 |
| items | OrderItem[] | 是 | 订单明细 | 至少包含一项 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |
| created_by | string | 是 | 创建人 ID | 非空 |

#### OrderStatus 枚举

| 值 | 描述 |
|----|------|
| pending | 待确认 |
| confirmed | 已确认 |
| in_production | 生产中 |
| shipped | 已发货 |
| completed | 已完成 |
| cancelled | 已取消 |

---

### OrderItem (订单明细)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| order_id | string | 是 | 订单 ID | 必须对应存在的订单 |
| product_id | string | 是 | 产品 ID | 非空 |
| product_name | string | 是 | 产品名称 | 长度 1-200 |
| specification | string | 否 | 规格 | 长度 0-500 |
| unit | string | 是 | 单位 | 长度 1-20 |
| quantity | number | 是 | 数量 | > 0 |
| unit_price | number | 是 | 单价 | >= 0 |
| amount | number | 是 | 金额 | >= 0 |
| delivered_quantity | number | 是 | 已交货数量 | 0 <= x <= quantity |
| notes | string | 否 | 备注 | 长度 0-500 |

---

## API 规格

### Customer API

#### 创建客户
**命令**: `sales_customer_create`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| customer | Customer | 是 | 客户信息（不含 id, created_at, updated_at） |

**返回值**: `Customer`

#### 获取客户
**命令**: `sales_customer_get`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 客户 ID |

**返回值**: `Customer`

#### 更新客户
**命令**: `sales_customer_update`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 客户 ID |
| customer | Partial\<Customer\> | 是 | 要更新的字段 |

**返回值**: `Customer`

#### 删除客户
**命令**: `sales_customer_delete`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 客户 ID |

**返回值**: `void`

#### 查询客户列表
**命令**: `sales_customer_list`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| params | object | 否 | 查询参数 |

**params 参数**:
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | string | 否 | 状态过滤 |
| customer_type | string | 否 | 客户类型过滤 |
| keyword | string | 否 | 关键字搜索（名称、联系人） |
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 20 |

**返回值**: `{ items: Customer[], total: number }`

---

### Quotation API

#### 创建报价单
**命令**: `sales_quotation_create`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| quotation | Quotation | 是 | 报价单信息 |

**返回值**: `Quotation`

#### 其他报价单 API
| 命令 | 功能 |
|------|------|
| `sales_quotation_get` | 获取报价单详情 |
| `sales_quotation_update` | 更新报价单 |
| `sales_quotation_delete` | 删除报价单 |
| `sales_quotation_list` | 查询报价单列表 |
| `sales_quotation_send` | 发送报价单 |
| `sales_quotation_accept` | 接受报价单 |
| `sales_quotation_reject` | 拒绝报价单 |

---

### Contract API

#### 创建合同
**命令**: `sales_contract_create`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| contract | Contract | 是 | 合同信息 |

**返回值**: `Contract`

#### 其他合同 API
| 命令 | 功能 |
|------|------|
| `sales_contract_get` | 获取合同详情 |
| `sales_contract_update` | 更新合同 |
| `sales_contract_delete` | 删除合同 |
| `sales_contract_list` | 查询合同列表 |
| `sales_contract_sign` | 签订合同 |
| `sales_contract_terminate` | 终止合同 |

---

### Order API

#### 创建订单
**命令**: `sales_order_create`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| order | Order | 是 | 订单信息 |

**返回值**: `Order`

#### 其他订单 API
| 命令 | 功能 |
|------|------|
| `sales_order_get` | 获取订单详情 |
| `sales_order_update` | 更新订单 |
| `sales_order_delete` | 删除订单 |
| `sales_order_list` | 查询订单列表 |
| `sales_order_confirm` | 确认订单 |
| `sales_order_cancel` | 取消订单 |
| `sales_order_update_status` | 更新订单状态 |

---

## 验收场景 (Given-When-Then 格式)

### Scenario 1: 创建客户

**Given** 用户已登录并具有客户管理权限
**When** 用户调用 `sales_customer_create` 创建新客户
**Then** 系统验证客户数据格式
**And** 系统检查必填字段
**And** 系统生成 UUID 作为客户 ID
**And** 系统记录创建时间和创建人
**And** 数据库新增客户记录
**And** 返回完整的客户信息

### Scenario 2: 创建报价单（含明细）

**Given** 存在已创建的客户
**When** 用户调用 `sales_quotation_create` 创建报价单
**And** 报价单包含多个报价明细
**Then** 系统验证报价单数据
**And** 系统验证每个明细的数据
**And** 系统计算小计、税额、总金额
**And** 系统生成报价单编号
**And** 数据库新增报价单和明细记录
**And** 返回完整的报价单信息（含明细）

### Scenario 3: 报价单状态流转

**Given** 存在状态为 `draft` 的报价单
**When** 用户调用 `sales_quotation_send` 发送报价单
**Then** 系统更新报价单状态为 `sent`
**And** 系统记录变更历史
**And** 返回更新后的报价单

**Given** 客户接受了报价
**When** 用户调用 `sales_quotation_accept`
**Then** 系统更新报价单状态为 `accepted`
**And** 系统记录变更历史
**And** 返回更新后的报价单

### Scenario 4: 创建合同（关联报价单）

**Given** 存在已接受的报价单
**When** 用户调用 `sales_contract_create` 创建合同
**And** 合同关联该报价单
**Then** 系统验证合同数据
**And** 系统从报价单复制相关信息
**And** 系统生成合同编号
**And** 数据库新增合同记录
**And** 返回完整的合同信息

### Scenario 5: 创建订单（关联合同）

**Given** 存在已签订的合同
**When** 用户调用 `sales_order_create` 创建订单
**And** 订单关联该合同
**Then** 系统验证订单数据
**And** 系统从合同复制相关信息
**And** 系统生成订单编号
**And** 数据库新增订单记录
**And** 返回完整的订单信息

### Scenario 6: 数据验证 - 无效邮箱

**Given** 用户尝试创建客户
**And** contact_email 字段格式无效
**When** 用户调用 `sales_customer_create`
**Then** 系统返回验证错误
**And** 错误信息指出 email 格式不正确
**And** 数据不被创建

### Scenario 7: 数据验证 - 报价单有效期

**Given** 用户尝试创建报价单
**And** valid_until < valid_from
**When** 用户调用 `sales_quotation_create`
**Then** 系统返回验证错误
**And** 错误信息指出有效期结束日期必须大于开始日期
**And** 数据不被创建

### Scenario 8: 查询客户列表（分页）

**Given** 系统存在多个客户
**When** 用户调用 `sales_customer_list` 并设置 page=2, page_size=10
**Then** 系统返回第 11-20 条客户记录
**And** 返回 total 字段表示总记录数

### Scenario 9: 变更历史记录

**Given** 存在已创建的客户
**When** 用户调用 `sales_customer_update` 修改客户信息
**Then** 数据库更新客户记录
**And** 数据库新增变更历史记录
**And** 历史记录包含 old_value, new_value, changed_fields
**And** 历史记录包含操作人和操作时间

---

## 错误码定义

| 错误码 | 错误信息 | 错误类型 | 处理方式 |
|--------|----------|----------|----------|
| ERR_CUSTOMER_NOT_FOUND | 客户不存在 | NotFoundError | 提示用户检查客户 ID |
| ERR_QUOTATION_NOT_FOUND | 报价单不存在 | NotFoundError | 提示用户检查报价单 ID |
| ERR_CONTRACT_NOT_FOUND | 合同不存在 | NotFoundError | 提示用户检查合同 ID |
| ERR_ORDER_NOT_FOUND | 订单不存在 | NotFoundError | 提示用户检查订单 ID |
| ERR_INVALID_EMAIL | 无效的邮箱格式 | ValidationError | 提示用户检查邮箱格式 |
| ERR_INVALID_PHONE | 无效的电话格式 | ValidationError | 提示用户检查电话格式 |
| ERR_INVALID_DATE_RANGE | 无效的日期范围 | ValidationError | 提示用户检查日期顺序 |
| ERR_REQUIRED_FIELD | 必填字段为空 | ValidationError | 提示用户填写必填字段 |
| ERR_INVALID_STATUS | 无效的状态值 | ValidationError | 提示用户选择有效的状态 |
| ERR_MIN_QUANTITY | 数量必须大于 0 | ValidationError | 提示用户输入正确的数量 |
| ERR_QUOTATION_EXPIRED | 报价单已过期 | BusinessError | 提示用户重新报价 |
| ERR_CUSTOMER_INACTIVE | 客户已流失 | BusinessError | 提示用户更新客户状态 |
| ERR_CONTRACT_EXPIRED | 合同已到期 | BusinessError | 提示用户处理合同 |
| ERR_DATABASE_ERROR | 数据库错误 | SystemError | 记录日志，返回通用错误 |

---

## 边界条件

### 数据边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 客户名称为空 | name 字段为空字符串 | 返回 ERR_REQUIRED_FIELD |
| 报价单无明细 | items 数组为空 | 返回 ERR_REQUIRED_FIELD |
| 订单数量为负 | quantity < 0 | 返回 ERR_MIN_QUANTITY |
| 折扣率超范围 | discount_rate < 0 或 > 1 | 返回 ERR_INVALID_FIELD |
| 日期格式错误 | 非 ISO 8601 格式 | 返回 ERR_INVALID_DATE |
| 关联客户不存在 | customer_id 无效 | 返回 ERR_CUSTOMER_NOT_FOUND |

### 业务规则边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 报价单已过期 | 当前日期 > valid_until | 返回 ERR_QUOTATION_EXPIRED |
| 客户已流失 | status = inactive | 返回 ERR_CUSTOMER_INACTIVE |
| 合同已到期 | 当前日期 > expiry_date | 返回 ERR_CONTRACT_EXPIRED |
| 删除有关联数据的客户 | 客户有报价单/合同/订单 | 拒绝删除或级联删除 |

### 性能边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 列表查询数据量大 | 超过 10000 条 | 分页查询，返回第一页 |
| 关联查询深度 | 超过 3 层 | 返回直接关联数据 |

---

## 编号生成规则

### 报价单编号
格式: `QT-YYYYMMDD-XXXX`
- QT: 固定前缀
- YYYYMMDD: 创建日期
- XXXX: 当日序号，从 0001 开始

示例: `QT-20240327-0001`

### 合同编号
格式: `CT-YYYYMMDD-XXXX`
- CT: 固定前缀
- YYYYMMDD: 签订日期
- XXXX: 当日序号

示例: `CT-20240327-0001`

### 订单编号
格式: `SO-YYYYMMDD-XXXX`
- SO: 固定前缀
- YYYYMMDD: 创建日期
- XXXX: 当日序号

示例: `SO-20240327-0001`
