# Specs: 自定义字段基础系统

## 功能规格

### 1. 字段列表 (field_define_list)

**输入：** entityType
**输出：** `CustomField[]`

### 2. 创建字段 (field_define_create)

**输入：** field: CustomField
**输出：** string (field_id)

### 3. 场景配置 (field_scene_config)

**输入：** entityType, scene
**输出：** `SceneDisplayRule[]`

### 4. 获取值 (field_values_get)

**输入：** entityId, entityType
**输出：** Record<string, string>

### 5. 设置值 (field_values_set)

**输入：** entityId, entityType, values
**输出：** void

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| field_define_list | entityType | CustomField[] |
| field_define_create | field | string |
| field_scene_config | entityType, scene | SceneDisplayRule[] |
| field_values_get | entityId, entityType | Record |
| field_values_set | entityId, entityType, values | void |

## 错误码

| 错误码 | 说明 |
|--------|------|
| FIELD_NOT_FOUND | 字段不存在 |
| ENTITY_NOT_FOUND | 实体不存在 |
| VALIDATION_FAILED | 验证失败 |
