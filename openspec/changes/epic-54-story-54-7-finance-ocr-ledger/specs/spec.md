# Specification: 财务模块 - 发票OCR与台账生成

## 需求来源

### PRD 需求
- FR523: 发票OCR识别功能
- FR524: 自动台账生成功能
- FR525: 应收应付自动计算

### 架构约束
- ADR-025: 业务模块集成规范
- ADR-037: Agent Runtime集成规范

### UX 规范
- UX-01: 组件设计规范
- UX-04: 交互设计规范

## 功能规格

### 用户故事
As a 财务人员,
I want to 通过拍照上传发票，让系统自动识别发票信息并生成台账,
So that 我可以省去手动录入的繁琐工作，提高工作效率。

As an Agent,
I want to 自动处理发票OCR识别和台账生成,
So that 我可以自动完成财务数据的录入工作。

### 验收场景

#### Scenario 1: 发票OCR识别
- **GIVEN** 用户有一张发票图片
- **WHEN** 用户上传发票图片进行OCR识别
- **THEN** 系统返回识别结果，包含发票号码、金额、日期、买方、卖方等字段
- **AND** 系统显示识别置信度

#### Scenario 2: OCR结果确认
- **GIVEN** OCR识别完成，显示识别结果
- **WHEN** 用户检查并修正识别错误的字段，点击确认
- **THEN** 系统根据确认的数据创建发票草稿
- **AND** 发票状态为draft

#### Scenario 3: 发票审核通过自动生成台账
- **GIVEN** 发票草稿已创建，财务人员审核通过
- **WHEN** 发票状态从draft变为verified
- **THEN** 系统自动生成台账条目
- **AND** 台账状态为pending_confirmation

#### Scenario 4: 台账条目确认
- **GIVEN** 有待确认的台账条目
- **WHEN** 会计人员检查台账条目，确认无误后点击确认
- **THEN** 台账条目状态变为confirmed
- **AND** 台账正式入账

#### Scenario 5: 台账条目驳回
- **GIVEN** 有待确认的台账条目
- **WHEN** 会计人员发现条目有误，选择驳回并填写原因
- **THEN** 台账条目状态变为rejected
- **AND** 系统记录驳回原因

#### Scenario 6: 台账借贷平衡检查
- **GIVEN** 系统尝试生成台账条目
- **WHEN** 借方合计不等于贷方合计
- **THEN** 系统拒绝生成台账条目
- **AND** 显示借贷不平衡错误

#### Scenario 7: 应收自动计算
- **GIVEN** 销售发票已审核通过
- **WHEN** 系统自动生成台账
- **THEN** 同时创建应收记录
- **AND** 应收金额等于发票总金额
- **AND** 状态为pending

#### Scenario 8: 收款后更新应收状态
- **GIVEN** 有一笔pending状态的应收
- **WHEN** 用户记录收款1000元（部分收款）
- **THEN** 应收的paid_amount增加1000
- **AND** pending_amount减少1000
- **AND** 状态变为partial（如未全额）或paid（如全额）

#### Scenario 9: 逾期计算
- **GIVEN** 有一笔pending状态的应收，到期日为2024-01-15
- **WHEN** 当前日期为2024-01-20
- **THEN** 逾期天数 = 5天
- **AND** 状态自动变为overdue

#### Scenario 10: Agent调用OCR工具
- **GIVEN** 用户让Agent处理发票
- **WHEN** 用户说"帮我识别这张发票"
- **THEN** Agent调用finance_invoice_ocr工具
- **AND** 返回识别结果

## 实现规格

### 输入规格

#### OCR识别 (finance_invoice_ocr)
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| imageUrl | string | 是 | 有效的图片URL或base64编码 |

#### 创建发票并生成台账
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| customerId | string | 是 | 有效的客户ID |
| ocrData | OcrResult | 是 | OCR识别结果 |
| issuedDate | string | 是 | ISO 8601日期格式 |
| dueDate | string | 是 | ISO 8601日期，晚于issuedDate |

#### 台账确认
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| ledgerEntryIds | string[] | 是 | 至少1项 |
| action | string | 是 | enum: confirm, reject |
| rejectReason | string | 条件必填 | action=reject时必填 |

#### 收款记录
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| receivableId | string | 是 | 有效的应收ID |
| amount | number | 是 | 正数，精确到分，不超过pending_amount |
| paymentDate | string | 是 | ISO 8601日期 |
| paymentMethod | string | 是 | enum: cash, bank_transfer, other |

### 输出规格

#### OCR识别结果
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | OcrResult | OCR识别结果 |
| data.rawText | string | 原始识别文本 |
| data.parsedData | OcrParsedData | 解析后的数据 |
| data.parsedData.invoiceNumber | string | 发票号码 |
| data.parsedData.invoiceDate | string | 发票日期 |
| data.parsedData.sellerName | string | 卖方名称 |
| data.parsedData.buyerName | string | 买方名称 |
| data.parsedData.totalAmount | number | 总金额 |
| data.parsedData.taxAmount | number | 税额 |
| data.confidence | number | 置信度0-1 |
| error | FinanceError | 错误信息（失败时） |

#### 台账生成结果
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | LedgerGenerationResult | 生成结果 |
| data.entries | LedgerEntry[] | 生成的台账条目 |
| data.totalDebit | number | 借方合计 |
| data.totalCredit | number | 贷方合计 |
| data.isBalanced | boolean | 是否借贷平衡 |
| error | FinanceError | 错误信息（失败时） |

#### 应收应付计算结果
| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 操作是否成功 |
| data | ReceivablePayableResult | 计算结果 |
| data.receivable | Receivable | 应收记录 |
| data.receivable.amount | number | 应收总额 |
| data.receivable.paidAmount | number | 已收金额 |
| data.receivable.pendingAmount | number | 待收金额 |
| data.receivable.status | ReceivableStatus | 状态 |
| data.receivable.overdueDays | number | 逾期天数 |
| error | FinanceError | 错误信息（失败时） |

## 边界条件

### OCR识别边界
- 图片格式不支持：返回错误，支持JPG/PNG/BMP
- 图片大小超过5MB：返回错误
- 图片模糊导致识别失败：返回识别失败，允许重试
- 识别置信度 < 0.7：显示警告，建议用户核对

### 台账生成边界
- 借贷不平衡：拒绝生成，返回错误
- 发票金额为0：允许生成台账（零金额发票）
- 发票项目为空：不允许生成台账

### 应收应付边界
- 还款金额超过待收金额：自动截断为待收金额
- 还款日期早于发票日期：允许，但显示警告
- 部分还款后再次全额还款：第二次还款金额 = pending_amount

### 逾期计算边界
- status为paid或cancelled：overdue_days = 0
- due_date为空：overdue_days = 0，不计算逾期

## 错误处理

### 错误码定义
| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| FIN101 | OCR识别失败 | 提示用户重试或手动输入 |
| FIN102 | OCR识别结果无效 | 提示用户核对并修正 |
| FIN103 | 发票金额与OCR金额不符 | 提示用户确认 |
| FIN104 | 台账借贷不平衡 | 系统拒绝生成，检查会计分录 |
| FIN105 | 无法生成台账：发票项目为空 | 提示用户先添加发票项目 |
| FIN106 | 台账条目不存在 | 提示用户检查ID |
| FIN107 | 台账条目已确认，无法修改 | 提示用户 |
| FIN108 | 应收记录不存在 | 提示用户检查ID |
| FIN109 | 还款金额超限 | 自动截断，提示用户 |
| FIN110 | 逾期天数计算失败 | 使用0作为默认值 |
| FIN111 | 权限不足 | 提示用户联系管理员 |

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "FIN104",
    "message": "台账借贷不平衡：借方1000.00，贷方900.00",
    "details": {
      "debit": 1000.00,
      "credit": 900.00,
      "difference": 100.00
    }
  }
}
```

## 性能要求

- OCR识别（模拟）：< 500ms
- OCR识别（真实API）：< 3s
- 台账生成：< 100ms
- 应收应付计算：< 50ms
- 批量台账生成（100条）：< 1s

## 监控指标

- OCR识别成功率
- OCR识别平均置信度
- 台账生成成功率
- 借贷不平衡出现次数
- 应收应付计算准确率
- 各工具调用频次
