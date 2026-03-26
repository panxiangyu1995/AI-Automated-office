# Specification: 安全检查强化

## 需求来源

### PRD 需求
- **FR609**: 敏感数据保护 - 系统应检测和保护敏感数据
- **FR610**: 访问控制 - 系统应实施字段级访问控制
- **FR611**: 安全监控 - 系统应提供安全事件监控和告警

### 架构约束
- **ADR-018**: 安全设计
- **ADR-041**: 数据保护设计

### UX 规范
- **UX-01**: 核心交互设计原则

### NFR 约束
- **NFR20**: 安全性 - 敏感数据保护、访问控制
- **NFR21**: 隐私性 - 符合数据保护法规

---

## 功能规格

### 用户故事

**As an** Security Administrator,
**I want to** 强化 Agent 安全检查，保护敏感数据，实施访问控制，
**So that** 我可以满足合规要求，防止数据泄露和安全威胁。

### 验收场景

#### Scenario 1: 检测敏感数据 - 邮箱
- **GIVEN** 用户输入包含邮箱地址
- **WHEN** 安全检查执行
- **THEN** 系统检测到邮箱并标记为敏感数据：
  - 类别：personal
  - 严重级别：medium
  - 可选择脱敏或拦截

#### Scenario 2: 检测敏感数据 - 手机号
- **GIVEN** 用户输入包含手机号码
- **WHEN** 安全检查执行
- **THEN** 系统检测到手机号并标记为敏感数据：
  - 类别：personal
  - 严重级别：medium
  - 可选择脱敏或拦截

#### Scenario 3: 检测敏感数据 - 身份证
- **GIVEN** 用户输入包含身份证号码
- **WHEN** 安全检查执行
- **THEN** 系统检测到身份证并标记为敏感数据：
  - 类别：personal
  - 严重级别：high
  - 可选择脱敏或拦截

#### Scenario 4: 检测敏感数据 - 银行卡
- **GIVEN** 用户输入包含银行卡号
- **WHEN** 安全检查执行
- **THEN** 系统检测到银行卡并标记为敏感数据：
  - 类别：financial
  - 严重级别：critical
  - 自动拦截或强制脱敏

#### Scenario 5: 检测敏感数据 - 密码
- **GIVEN** 用户输入包含密码字段
- **WHEN** 安全检查执行
- **THEN** 系统检测到密码并标记为敏感数据：
  - 类别：password
  - 严重级别：critical
  - 自动拦截或强制脱敏

#### Scenario 6: 黑名单过滤
- **GIVEN** 用户输入包含黑名单关键词
- **WHEN** 黑名单过滤执行
- **THEN** 系统过滤掉黑名单内容：
  - 记录过滤日志
  - 返回过滤后的内容
  - 触发告警（如配置）

#### Scenario 7: 白名单豁免
- **GIVEN** 用户输入同时包含黑名单和白名单内容
- **WHEN** 黑名单过滤执行
- **THEN** 白名单内容被豁免：
  - 仅过滤非白名单的黑名单内容
  - 白名单内容保留

#### Scenario 8: 字段权限检查
- **GIVEN** 用户尝试访问受保护字段
- **WHEN** 权限检查执行
- **THEN** 系统根据用户角色决定访问权限：
  - 有权限用户：允许访问
  - 无权限用户：拒绝访问或返回脱敏数据

#### Scenario 9: 数据脱敏 - 全脱敏
- **GIVEN** 需要对敏感数据进行全脱敏
- **WHEN** 脱敏配置为 full
- **THEN** 所有字符被替换为掩码字符：
  - 例：1234567890 -> **********

#### Scenario 10: 数据脱敏 - 部分脱敏
- **GIVEN** 需要对敏感数据进行部分脱敏
- **WHEN** 脱敏配置为 partial (visibleStart=3, visibleEnd=2)
- **THEN** 部分字符保留，其余被掩码：
  - 例：13812345678 -> 138****5678

#### Scenario 11: 数据脱敏 - Hash
- **GIVEN** 需要对敏感数据进行 Hash 脱敏
- **WHEN** 脱敏配置为 hash
- **THEN** 数据被替换为 MD5 Hash 值：
  - 例：password123 -> 482c811da5d5b4bc6d497ff9849657dc

#### Scenario 12: 安全告警触发
- **GIVEN** 安全检查发现严重违规
- **WHEN** 违规严重级别为 critical
- **THEN** 系统触发安全告警：
  - 记录告警历史
  - 通知管理员
  - 记录上下文信息

#### Scenario 13: 安全告警确认
- **GIVEN** 管理员收到安全告警
- **WHEN** 管理员确认告警
- **THEN** 系统更新告警状态：
  - 记录确认人
  - 记录确认时间
  - 更新状态为 acknowledged

---

## 实现规格

### 输入规格

#### check_sensitive_data 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| content | string | 是 | 非空 | 待检查内容 |
| categories | string[] | 否 | 敏感类别数组 | 检查的敏感类别 |

#### filter_blacklist 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| content | string | 是 | 非空 | 待过滤内容 |

#### check_field_permission 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| user_id | string | 是 | UUID 格式 | 用户 ID |
| entity_type | string | 是 | 非空 | 实体类型 |
| field | string | 是 | 非空 | 字段名 |

#### mask_sensitive_data 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| data | object | 是 | JSON 对象 | 待脱敏数据 |
| mask_configs | array | 是 | MaskConfig 数组 | 脱敏配置 |
| exempt | boolean | 否 | 默认 false | 是否豁免 |

#### add_sensitive_pattern 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| name | string | 是 | 非空 | 模式名称 |
| pattern_type | string | 是 | enum | regex, keyword, builtin |
| pattern_value | string | 是 | 非空 | 模式值 |
| category | string | 是 | enum | password, key, token, personal, financial |
| severity | string | 是 | enum | low, medium, high, critical |
| enabled | boolean | 否 | 默认 true | 是否启用 |

### 输出规格

#### SecurityCheckResult 响应

```json
{
  "success": true,
  "data": {
    "passed": false,
    "violations": [
      {
        "type": "sensitive_data",
        "category": "personal",
        "severity": "medium",
        "field": "email",
        "value": "user@example.com",
        "message": "检测到邮箱地址"
      }
    ],
    "maskedData": {
      "email": "u***@example.com"
    }
  }
}
```

#### FilterResult 响应

```json
{
  "success": true,
  "data": {
    "original": "原始内容包含黑名单词",
    "filtered": "原始内容***",
    "matchedItems": ["黑名单词"],
    "filterCount": 1
  }
}
```

#### SecurityAlert 响应

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "alertType": "sensitive_data",
        "severity": "critical",
        "message": "检测到敏感数据：银行卡号",
        "context": {
          "userId": "user-001",
          "field": "bankCard",
          "value": "****"
        },
        "status": "triggered",
        "createdAt": 1711545600000
      }
    ],
    "total": 1
  }
}
```

---

## 边界条件

### 输入边界

| 场景 | 输入 | 预期行为 |
|------|------|----------|
| 空 content | `""` | 返回 passed: true |
| 超大 content | > 1MB | 返回错误：CONTENT_TOO_LARGE |
| 无效 category | `"invalid"` | 返回错误：INVALID_CATEGORY |
| 无效 pattern_type | `"invalid"` | 返回错误：INVALID_PATTERN_TYPE |
| 无效 severity | `"invalid"` | 返回错误：INVALID_SEVERITY |
| 无效 mask_type | `"invalid"` | 返回错误：INVALID_MASK_TYPE |
| user_id 不存在 | `"invalid"` | 返回错误：USER_NOT_FOUND |

### 场景边界

| 场景 | 条件 | 预期行为 |
|------|------|----------|
| 无违规 | 没有任何违规 | 返回 passed: true |
| 白名单匹配 | 内容在白名单中 | 跳过黑名单检查 |
| 权限豁免 | exempt=true | 返回原始数据 |
| 多重违规 | 多个敏感数据 | 返回所有违规 |

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | HTTP 状态码 | 处理方式 |
|--------|----------|-------------|----------|
| INVALID_CATEGORY | 无效的敏感类别 | 400 | 返回支持的类别 |
| INVALID_PATTERN_TYPE | 无效的模式类型 | 400 | 返回支持的类型 |
| INVALID_SEVERITY | 无效的严重级别 | 400 | 返回支持的级别 |
| INVALID_MASK_TYPE | 无效的脱敏类型 | 400 | 返回支持的类型 |
| CONTENT_TOO_LARGE | 内容过大 | 400 | 提示最大限制 |
| USER_NOT_FOUND | 用户不存在 | 404 | 检查用户 ID |
| PATTERN_NOT_FOUND | 模式不存在 | 404 | 检查模式 ID |
| ALERT_NOT_FOUND | 告警不存在 | 404 | 检查告警 ID |
| DATABASE_ERROR | 数据库错误 | 500 | 记录错误日志 |
| DETECTION_ERROR | 检测错误 | 500 | 记录错误日志 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CATEGORY",
    "message": "无效的敏感类别：invalid",
    "details": {
      "supportedCategories": ["password", "key", "token", "personal", "financial"]
    }
  }
}
```

---

## 数据模型

### SensitivePattern

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| name | string | 模式名称 |
| pattern_type | string | 模式类型 |
| pattern_value | string | 模式值 |
| category | string | 敏感类别 |
| severity | string | 严重级别 |
| enabled | boolean | 是否启用 |
| created_at | number | 创建时间 |
| updated_at | number | 更新时间 |

### SecurityViolation

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 违规类型 |
| category | string | 敏感类别 |
| severity | string | 严重级别 |
| field | string | 字段名 |
| value | string | 违规值 |
| message | string | 违规信息 |

### FieldPermission

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| entity_type | string | 实体类型 |
| field_name | string | 字段名 |
| required_role | string | 所需角色 |
| mask_type | string | 脱敏类型 |
| created_at | number | 创建时间 |
| updated_at | number | 更新时间 |

### SecurityAlert

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| alert_type | string | 告警类型 |
| severity | string | 严重级别 |
| message | string | 告警消息 |
| context | JSON | 上下文 |
| status | string | 状态 |
| acknowledged_by | string | 确认人 |
| acknowledged_at | number | 确认时间 |
| created_at | number | 创建时间 |

### MaskConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| field | string | 字段名 |
| mask_type | string | 脱敏类型 |
| mask_char | string | 掩码字符 |
| visible_start | number | 前面可见字符数 |
| visible_end | number | 后面可见字符数 |

---

## 内置敏感模式

| 模式名称 | 类型 | 类别 | 严重级别 | 正则表达式 |
|---------|------|------|----------|------------|
| Email | builtin | personal | medium | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` |
| Phone (CN) | builtin | personal | medium | `1[3-9]\d{9}` |
| ID Card (CN) | builtin | personal | high | `\d{17}[\dXx]` |
| Credit Card | builtin | financial | critical | `\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}` |
| Password Field | builtin | password | critical | `(?i)(?:password\|pwd\|passwd\|secret)\s*[=:]\s*["']?([^"'\s]+)["']?` |
| API Key | builtin | key | high | `[a-zA-Z0-9]{32,}` |
| Bearer Token | builtin | token | critical | `Bearer\s+[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+` |

---

## 性能要求

| 指标 | 要求 |
|------|------|
| 敏感数据检测延迟 | < 10ms |
| 黑名单过滤延迟 | < 5ms |
| 权限检查延迟 | < 5ms |
| 数据脱敏延迟 | < 10ms |
| 告警触发延迟 | < 1s |
