# Specs: 自定义字段AI感知能力

## 功能规格

### 1. 获取AI配置 (field_ai_config_get)

**输入：** fieldId
**输出：** AiFieldConfig

### 2. 设置AI配置 (field_ai_config_set)

**输入：** config: AiFieldConfig
**输出：** void

### 3. 构建AI上下文 (field_ai_context_build)

**输入：** entityId, entityType, taskType
**输出：** `AiFieldContext[]`

### 4. 值脱敏 (field_ai_value_mask)

**输入：** fieldId, value
**输出：** string

### 5. 生命周期日志 (field_lifecycle_log)

**输入：** fieldId, eventType, oldStatus?, newStatus
**输出：** void

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| field_ai_config_get | fieldId | AiFieldConfig |
| field_ai_config_set | config | void |
| field_ai_context_build | entityId, entityType, taskType | AiFieldContext[] |
| field_ai_value_mask | fieldId, value | string |
| field_lifecycle_log | fieldId, eventType, oldStatus?, newStatus | void |

## 错误码

| 错误码 | 说明 |
|--------|------|
| CONFIG_NOT_FOUND | AI配置不存在 |
| MASK_FAILED | 脱敏失败 |
| SCOPE_MISMATCH | 范围不匹配 |
