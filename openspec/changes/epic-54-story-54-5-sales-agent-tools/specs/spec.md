# Specification: 销售模块 - Agent工具集成

## 需求来源

### PRD 需求
- FR516: Agent可调用销售模块工具集
- FR517: 销售数据批量操作支持
- FR518: 销售场景智能推荐

### 架构约束
- ADR-025: 业务模块集成规范
- ADR-037: Agent Runtime集成规范

### UX 规范
- UX-01: 组件设计规范
- UX-04: 交互设计规范

## 功能规格

### 用户故事
As a 销售人员,
I want to 通过自然语言让Agent帮我完成客户查询、报价创建、合同生成等销售任务,
So that 我可以更高效地完成销售工作，减少重复操作。

### 验收场景

#### Scenario 1: 客户查询
- **GIVEN** 用户在Agent对话中询问客户信息
- **WHEN** 用户说"查询客户C001的信息"
- **THEN** Agent调用sales_customer_query工具，返回客户完整信息
- **AND** 在销售Pilot面板展示查询结果

#### Scenario 2: 创建报价单
- **GIVEN** 用户已完成客户查询，想要为该客户创建报价
- **WHEN** 用户说"为C001创建报价单，包含产品A x 10，产品B x 5"
- **THEN** Agent调用sales_quotation_create工具，创建报价单
- **AND** 返回报价单ID和总金额

#### Scenario 3: 生成合同
- **GIVEN** 用户已确认报价单，想要生成正式合同
- **WHEN** 用户说"根据报价单Q001生成合同"
- **THEN** Agent调用sales_contract_generate工具，生成合同草稿
- **AND** 返回合同ID和状态

#### Scenario 4: 批量更新状态
- **GIVEN** 销售人员需要批量更新多个报价单状态
- **WHEN** 用户说"将Q001、Q002、Q003的状态改为已发送"
- **THEN** Agent调用sales_batch_operation工具，批量更新状态
- **AND** 返回更新结果（成功数量、失败数量）

#### Scenario 5: 智能推荐
- **GIVEN** 用户持续查询客户信息
- **WHEN** 用户查询了3个不同客户
- **THEN** Agent主动推荐"您最近关注客户管理，是否需要创建报价单？"

#### Scenario 6: 批量导出
- **GIVEN** 销售人员需要导出客户数据
- **WHEN** 用户说"导出所有客户数据"
- **THEN** Agent调用sales_batch_operation工具，导出CSV文件
- **AND** 返回下载链接

#### Scenario 7: 权限不足
- **GIVEN** 用户尝试执行超越权限的操作（如删除合同）
- **WHEN** 用户说"删除合同CT001"
- **THEN** Agent返回权限不足提示，要求管理员授权

#### Scenario 8: 数据不存在
- **GIVEN** 用户查询不存在的客户
- **WHEN** 用户说"查询客户C999"
- **THEN** Agent返回"未找到客户C999"错误

## 实现规格

### 输入规格

#### sales_customer_query
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| customerId | string | 是 | 非空字符串，最大50字符 |
| fields | string[] | 否 | 数组，每项最大100字符 |

#### sales_quotation_create
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| customerId | string | 是 | 必须存在有效的客户ID |
| items | QuotationItem[] | 是 | 至少1项，最多100项 |
| items[].productId | string | 是 | 非空 |
| items[].quantity | number | 是 | 正整数，最大999999 |
| items[].unitPrice | number | 是 | 正数，精确到分 |
| validUntil | string | 是 | ISO 8601日期格式，必须晚于今天 |

#### sales_contract_generate
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| quotationId | string | 是 | 必须存在有效的报价单ID |
| terms.paymentTerms | string | 否 | 最大500字符 |
| terms.deliveryTerms | string | 否 | 最大500字符 |
| terms.warrantyTerms | string | 否 | 最大500字符 |

#### sales_batch_operation
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| operation | string | 是 | enum: update, delete, export |
| entityType | string | 是 | enum: customer, quotation, contract |
| ids | string[] | 是 | 至少1项，最多100项 |
| operation === update 时需要额外字段 |
| updateFields | object | 条件必填 | 要更新的字段键值对 |

### 输出规格

#### sales_customer_query
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | Customer | 客户信息对象 |
| data.id | string | 客户ID |
| data.name | string | 客户名称 |
| data.contact | string | 联系人 |
| data.phone | string | 联系电话 |
| data.email | string | 电子邮箱 |
| data.address | string | 地址 |
| data.creditLimit | number | 信用额度 |
| data.createdAt | string | 创建时间 |
| error | string | 错误信息（失败时） |

#### sales_quotation_create
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | Quotation | 报价单对象 |
| data.id | string | 报价单ID |
| data.customerId | string | 客户ID |
| data.items | QuotationItem[] | 项目列表 |
| data.totalAmount | number | 总金额 |
| data.status | string | 状态 |
| data.validUntil | string | 有效期至 |
| data.createdAt | string | 创建时间 |
| error | string | 错误信息（失败时） |

#### sales_contract_generate
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | Contract | 合同对象 |
| data.id | string | 合同ID |
| data.quotationId | string | 关联报价单ID |
| data.customerId | string | 客户ID |
| data.terms | ContractTerms | 合同条款 |
| data.totalAmount | number | 合同总金额 |
| data.status | string | 状态 |
| data.createdAt | string | 创建时间 |
| error | string | 错误信息（失败时） |

#### sales_batch_operation
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | BatchResult | 批量操作结果 |
| data.total | number | 总数 |
| data.succeeded | number | 成功数 |
| data.failed | number | 失败数 |
| data.results | OperationResult[] | 每项操作结果 |
| data.downloadUrl | string | 导出文件URL（仅export操作） |
| error | string | 错误信息（失败时） |

## 边界条件

### 客户查询边界
- customerId为空或不存在：返回ERROR_CUSTOMER_NOT_FOUND
- fields指定不存在的字段：忽略该字段，只返回存在的字段
- 查询超时（5s）：返回ERROR_TIMEOUT

### 报价创建边界
- customerId不存在：返回ERROR_CUSTOMER_NOT_FOUND
- items为空：返回ERROR_ITEMS_REQUIRED
- items数量超过100：返回ERROR_ITEMS_LIMIT_EXCEEDED
- validUntil早于今天：返回ERROR_INVALID_DATE
- 单价或数量超限：返回ERROR_INVALID_AMOUNT

### 合同生成边界
- quotationId不存在：返回ERROR_QUOTATION_NOT_FOUND
- quotation状态不是accepted：返回ERROR_QUOTATION_NOT_ACCEPTED
- terms字段超长：自动截断并警告

### 批量操作边界
- ids为空数组：返回ERROR_IDS_REQUIRED
- ids数量超过100：返回ERROR_BATCH_LIMIT_EXCEEDED
- 部分成功：返回succeeded和failed计数，继续执行
- 并发操作：使用乐观锁防止冲突

## 错误处理

### 错误码定义
| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| ERROR_CUSTOMER_NOT_FOUND | 客户不存在 | 提示用户检查客户ID |
| ERROR_QUOTATION_NOT_FOUND | 报价单不存在 | 提示用户检查报价单ID |
| ERROR_QUOTATION_NOT_ACCEPTED | 报价单尚未被接受 | 提示用户先接受报价单 |
| ERROR_CONTRACT_NOT_FOUND | 合同不存在 | 提示用户检查合同ID |
| ERROR_ITEMS_REQUIRED | 报价项目不能为空 | 提示用户添加至少一个项目 |
| ERROR_ITEMS_LIMIT_EXCEEDED | 报价项目数量超限（最多100项） | 提示用户分批创建 |
| ERROR_INVALID_DATE | 无效的日期 | 提示用户使用正确的日期格式 |
| ERROR_INVALID_AMOUNT | 无效的金额 | 提示用户检查单价和数量 |
| ERROR_IDS_REQUIRED | ID列表不能为空 | 提示用户提供有效的ID列表 |
| ERROR_BATCH_LIMIT_EXCEEDED | 批量操作数量超限（最多100项） | 提示用户分批操作 |
| ERROR_PERMISSION_DENIED | 权限不足 | 提示用户联系管理员 |
| ERROR_TIMEOUT | 操作超时 | 提示用户重试 |
| ERROR_INTERNAL | 内部错误 | 记录日志，提示用户联系技术支持 |

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CUSTOMER_NOT_FOUND",
    "message": "客户C001不存在",
    "details": {}
  }
}
```

## 性能要求

- 客户查询：< 500ms
- 报价创建：< 1s
- 合同生成：< 2s
- 批量操作（100项）：< 5s

## 监控指标

- 工具调用成功率
- 工具平均响应时间
- 各工具调用频次
- 错误类型分布
