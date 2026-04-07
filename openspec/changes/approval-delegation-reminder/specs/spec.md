# Specification: 审批增强功能-委托与催办

## 需求来源

### PRD 需求
- FR143: 审批人可以设置审批委托人（休假/出差时）
- FR144: 用户可以选择委托类型（全权委托、分类委托、金额委托）
- FR145: 用户可以设置委托有效期（固定期限或单次委托）
- FR146: 被委托人收到委托审批时显示委托来源和原因
- FR147: 管理员可以在紧急情况下代为设置委托
- FR148: 委托期间原审批人仍可查看审批记录
- FR154: 发起人可以对待审批项发起催办
- FR155: 单条审批每天最多催办3次
- FR156: 两次催办间隔至少2小时
- FR157: 催办仅允许在工作时间内（默认9:00-18:00，可配置）
- FR158: 催办支持紧急程度分级（普通、紧急、超紧急）
- FR159: 第2次催办自动抄送审批人上级
- FR160: 第3次催办自动抄送部门负责人并系统标记
- FR161: 同一审批人当天被催办总次数上限为10次
- FR162: 审批人可设置"免打扰"时段
- FR163: 周末/节假日默认不催办（可配置）

## 功能规格

### 用户故事

As an **审批人**,
I want **设置审批委托人**,
So that **休假或出差时审批工作不会延误**。

As an **发起人**,
I want **催办未处理的审批**,
So that **紧急审批能够及时处理**。

### 验收场景

#### Scenario 1: 设置委托（FR143-FR145）
- **GIVEN** 审批人准备休假
- **WHEN** 设置全权委托给同事
- **THEN** 同事收到委托审批，注明来源

#### Scenario 2: 催办频率限制（FR155-FR156）
- **GIVEN** 发起人已催办2次
- **WHEN** 再次发起催办（间隔1小时）
- **THEN** 系统拒绝，显示"催办间隔不足"

#### Scenario 3: 自动抄送上级（FR159-FR160）
- **GIVEN** 紧急审批，第2次催办
- **WHEN** 催办发送
- **THEN** 审批人上级收到抄送通知

#### Scenario 4: 免打扰时段（FR162）
- **GIVEN** 审批人设置了22:00-08:00为免打扰
- **WHEN** 发起人催办
- **THEN** 系统提示"审批人设置了免打扰时段"

## 数据规格

### ApprovalDelegation
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | String | 是 | UUID格式 |
| delegator_id | String | 是 | 用户ID |
| delegate_id | String | 是 | 用户ID |
| delegation_type | String | 是 | full/category/amount |
| category_list | Vec<String> | 否 | 分类委托时填写 |
| amount_limit | f64 | 否 | 金额委托时填写 |
| start_time | i64 | 是 | Unix时间戳 |
| end_time | Option<i64> | 否 | Unix时间戳 |
| is_active | bool | 是 | 默认true |
| reason | String | 否 | 委托原因 |

### ReminderRecord
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | String | 是 | UUID格式 |
| approval_id | String | 是 | 审批ID |
| reminder_id | String | 是 | 催办人ID |
| approver_id | String | 是 | 审批人ID |
| level | String | 是 | normal/urgent/critical |
| created_at | i64 | 是 | Unix时间戳 |
| cc_sent | bool | 是 | 是否已抄送 |

### ReminderSettings
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| user_id | String | 是 | 用户ID |
| quiet_hours_start | String | 否 | HH:MM格式 |
| quiet_hours_end | String | 否 | HH:MM格式 |
| working_hours_start | String | 否 | HH:MM格式 |
| working_hours_end | String | 否 | HH:MM格式 |
| weekend_enabled | bool | 否 | 默认false |

## 边界条件

- 委托人和被委托人不能是同一人
- 委托时间不能重叠
- 催办频率按每条审批独立计算
- 免打扰时段可跨越午夜
