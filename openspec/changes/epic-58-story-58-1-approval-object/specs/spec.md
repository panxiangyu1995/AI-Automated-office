# Specs: 平台级审批对象模型

## 功能规格

### 1. 创建审批对象 (approval_object_create)

**输入：** object: ApprovalObject
**输出：** string (object_id)

### 2. 列表审批对象 (approval_object_list)

**输入：** objectType?, status?
**输出：** `ApprovalObject[]`

### 3. 审批决策 (approval_decide)

**输入：** approvalId, decision
**输出：** void

### 4. Resume触发 (approval_resume_trigger)

**输入：** approvalId
**输出：** void

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| approval_object_create | object | string |
| approval_object_list | objectType?, status? | ApprovalObject[] |
| approval_decide | approvalId, decision | void |
| approval_resume_trigger | approvalId | void |

## 错误码

| 错误码 | 说明 |
|--------|------|
| APPROVAL_NOT_FOUND | 审批对象不存在 |
| INVALID_STATUS | 无效状态转换 |
| ALREADY_DECIDED | 已审批 |
