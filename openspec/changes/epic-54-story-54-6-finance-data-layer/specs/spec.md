# Specification: 财务模块数据层 - 数据模型与API

## 需求来源

### PRD 需求
- FR520: 定义发票数据模型
- FR521: 定义台账数据模型
- FR522: 定义应收应付数据模型

### 架构约束
- ADR-025: 业务模块数据层规范
- ADR-037: 模块集成规范

### UX 规范
- UX-01: 组件设计规范

## 功能规格

### 用户故事
As a 财务人员,
I want to 使用标准化的发票、台账、应收应付数据模型,
So that 我可以高效地进行财务数据管理和分析。

As an Agent,
I want to 调用财务模块的工具和API,
So that 我可以自动执行发票处理和台账生成任务。

### 验收场景

#### Scenario 1: 创建发票
- **GIVEN** 用户需要创建一张新发票
- **WHEN** 调用create_invoice API，传入客户信息和明细
- **THEN** 系统创建发票并返回完整的发票对象
- **AND** 发票状态为draft

#### Scenario 2: 查询发票列表
- **GIVEN** 用户需要查看发票列表
- **WHEN** 调用query_invoices API，传入分页和筛选条件
- **THEN** 系统返回符合条件的发票列表（分页）
- **AND** 每条记录包含客户名称、总金额、状态等信息

#### Scenario 3: 发票OCR识别
- **GIVEN** 用户上传了一张发票图片
- **WHEN** 调用ocr_recognize_invoice API
- **THEN** 系统返回OCR识别结果
- **AND** 结果包含发票号、金额、日期、买方卖方等信息
- **AND** 包含识别置信度

#### Scenario 4: 从OCR结果创建发票
- **GIVEN** OCR识别已完成，用户确认信息正确
- **WHEN** 调用create_invoice_from_ocr API
- **THEN** 系统根据OCR结果创建发票草稿
- **AND** 发票明细已填充

#### Scenario 5: 查询台账
- **GIVEN** 会计需要查看某科目的台账
- **WHEN** 调用query_ledger_entries API，传入科目ID和日期范围
- **THEN** 系统返回该科目的所有台账条目
- **AND** 包含借贷方金额和余额

#### Scenario 6: 查询应收
- **GIVEN** 财务人员需要查看所有逾期应收款
- **WHEN** 调用query_receivables API，设置overdueOnly=true
- **THEN** 系统返回所有status为overdue的应收款
- **AND** 包含逾期天数计算

#### Scenario 7: 权限控制
- **GIVEN** 普通财务人员尝试删除发票
- **WHEN** 调用delete_invoice API
- **THEN** 系统返回权限不足错误
- **AND** 不执行删除操作

#### Scenario 8: 审计日志
- **GIVEN** 管理员需要查看发票的修改历史
- **WHEN** 调用get_finance_audit_logs API，传入发票ID
- **THEN** 系统返回该发票的所有操作记录

## 实现规格

### 数据模型规格

#### Invoice（发票）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| invoiceNumber | string | 是 | 最大50字符，唯一 |
| type | InvoiceType | 是 | enum: normal, special |
| customerId | string | 是 | 必须存在 |
| customerName | string | 是 | 最大200字符 |
| items | InvoiceItem[] | 是 | 至少1项 |
| totalAmount | number | 是 | = sum(items.amount)，精确到分 |
| taxAmount | number | 是 | = sum(items.tax_amount) |
| netAmount | number | 是 | = totalAmount - taxAmount |
| status | InvoiceStatus | 是 | enum: draft, issued, verified, cancelled |
| issuedDate | string | 是 | ISO 8601日期 |
| dueDate | string | 是 | ISO 8601日期，必须晚于issuedDate |
| ocrData | OcrResult | 否 | OCR识别结果 |
| createdAt | string | 是 | ISO 8601日期时间 |
| updatedAt | string | 是 | ISO 8601日期时间 |
| createdBy | string | 是 | 用户ID |

#### InvoiceItem（发票明细）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| description | string | 是 | 最大500字符 |
| quantity | number | 是 | 正数，最多6位小数 |
| unitPrice | number | 是 | 正数，精确到分 |
| amount | number | 是 | = quantity * unitPrice |
| taxRate | number | 是 | 0-100%，如13%输入0.13 |
| taxAmount | number | 是 | = amount * taxRate |

#### LedgerAccount（会计科目）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| code | string | 是 | 最大20字符，唯一，数字编码 |
| name | string | 是 | 最大100字符 |
| type | AccountType | 是 | enum: asset, liability, equity, revenue, expense |
| parentId | string | 否 | 父级科目ID |
| level | number | 是 | 0, 1, 2...表示科目层级 |
| balance | number | 是 | 当前余额 |

#### LedgerEntry（台账条目）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| accountId | string | 是 | 有效的会计科目ID |
| date | string | 是 | ISO 8601日期 |
| description | string | 否 | 最大500字符 |
| debitAmount | number | 是 | >= 0，精确到分 |
| creditAmount | number | 是 | >= 0，精确到分 |
| balance | number | 是 | 计算得出 |
| invoiceId | string | 否 | 关联发票ID |
| receivableId | string | 否 | 关联应收ID |
| payableId | string | 否 | 关联应付ID |
| createdAt | string | 是 | ISO 8601日期时间 |
| createdBy | string | 是 | 用户ID |

#### Receivable（应收）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| customerId | string | 是 | 有效的客户ID |
| customerName | string | 是 | 最大200字符 |
| invoiceId | string | 是 | 有效的发票ID |
| invoiceNumber | string | 是 | 最大50字符 |
| amount | number | 是 | 正数，精确到分 |
| paidAmount | number | 是 | >= 0，精确到分 |
| pendingAmount | number | 是 | = amount - paidAmount |
| status | ReceivableStatus | 是 | enum: pending, partial, paid, overdue, cancelled |
| dueDate | string | 是 | ISO 8601日期 |
| issuedDate | string | 是 | ISO 8601日期 |
| overdueDays | number | 是 | 计算得出（当前日期 - dueDate，如果pending/partial且dueDate < 今天） |
| lastPaymentDate | string | 否 | ISO 8601日期 |
| createdAt | string | 是 | ISO 8601日期时间 |
| updatedAt | string | 是 | ISO 8601日期时间 |

#### Payable（应付）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式 |
| supplierId | string | 是 | 有效的供应商ID |
| supplierName | string | 是 | 最大200字符 |
| invoiceId | string | 是 | 有效的发票ID |
| invoiceNumber | string | 是 | 最大50字符 |
| amount | number | 是 | 正数，精确到分 |
| paidAmount | number | 是 | >= 0，精确到分 |
| pendingAmount | number | 是 | = amount - paidAmount |
| status | PayableStatus | 是 | enum: pending, partial, paid, overdue, cancelled |
| dueDate | string | 是 | ISO 8601日期 |
| issuedDate | string | 是 | ISO 8601日期 |
| overdueDays | number | 是 | 计算得出 |
| lastPaymentDate | string | 否 | ISO 8601日期 |
| createdAt | string | 是 | ISO 8601日期时间 |
| updatedAt | string | 是 | ISO 8601日期时间 |

### API规格

#### 发票API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /finance/invoices | 创建发票 |
| GET | /finance/invoices | 查询发票列表 |
| GET | /finance/invoices/:id | 获取发票详情 |
| PATCH | /finance/invoices/:id/status | 更新发票状态 |
| DELETE | /finance/invoices/:id | 删除发票 |
| POST | /finance/invoices/ocr | OCR识别发票 |
| POST | /finance/invoices/from-ocr | 从OCR创建发票 |

#### 台账API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /finance/ledger/accounts | 查询会计科目 |
| GET | /finance/ledger/entries | 查询台账条目 |
| POST | /finance/ledger/entries | 创建台账条目 |

#### 应收应付API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /finance/receivables | 查询应收 |
| GET | /finance/receivables/:id | 获取应收详情 |
| PATCH | /finance/receivables/:id/payment | 记录还款 |
| GET | /finance/payables | 查询应付 |
| GET | /finance/payables/:id | 获取应付详情 |
| PATCH | /finance/payables/:id/payment | 记录付款 |

### 错误码定义

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| FIN001 | 发票不存在 | 提示用户检查发票ID |
| FIN002 | 无效的发票类型 | 提示用户选择normal或special |
| FIN003 | 发票号码已存在 | 提示用户使用不同的发票号 |
| FIN004 | 客户不存在 | 提示用户先创建客户 |
| FIN005 | 发票项目不能为空 | 提示用户添加至少一个项目 |
| FIN006 | 无效的税率 | 提示税率必须在0-1之间 |
| FIN007 | 金额计算错误 | 系统自动重新计算 |
| FIN008 | 无法取消已审核的发票 | 提示用户先取消审核 |
| FIN009 | 权限不足 | 提示用户联系管理员 |
| FIN010 | 台账科目不存在 | 提示用户检查科目ID |
| FIN011 | 借贷不平衡 | 提示借方金额必须等于贷方金额 |
| FIN012 | 应收不存在 | 提示用户检查应收ID |
| FIN013 | 应付不存在 | 提示用户检查应付ID |
| FIN014 | 逾期天数计算错误 | 系统自动重新计算 |
| FIN015 | OCR识别失败 | 提示用户手动输入或重试 |
| FIN016 | 审计日志写入失败 | 记录错误日志，继续执行 |

## 边界条件

### 发票边界
- 发票号码重复：返回FIN003错误
- 税率超出0-1范围：返回FIN006错误
- dueDate早于issuedDate：返回参数校验错误
- 删除已审核发票：返回FIN008错误

### 台账边界
- 借贷金额不平衡：返回FIN011错误
- 科目不存在：返回FIN010错误
- 科目余额为负数：允许（资产类科目负数表示贷方余额）

### 应收应付边界
- 还款金额大于待收金额：自动截断
- 逾期天数计算：只计算status为pending/partial且dueDate < today的记录

### OCR边界
- 图片格式不支持：返回错误
- 图片过小（< 10KB）：返回识别失败
- 网络超时：返回FIN015错误

## 性能要求

- 发票列表查询（100条）：< 200ms
- 发票详情查询：< 100ms
- OCR识别（模拟）：< 500ms
- 台账查询（1000条）：< 500ms
- 应收应付列表（100条）：< 200ms

## 监控指标

- API调用成功率
- API平均响应时间
- OCR识别成功率
- 各模块调用频次
- 错误类型分布
