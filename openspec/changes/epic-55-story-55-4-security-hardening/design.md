# Design: 安全检查强化

## 技术方案

### 实现类型
- **类型**: refactor（基于现有 sensitiveActionDetection 扩展）
- **优先级**: high
- **阶段**: Phase 5 - 治理与可靠性增强
- **后端必需**: true

### 前端实现

#### 技术选型
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **HTTP 客户端**: fetch API / Tauri IPC

#### 模块结构
```
src/
├── features/
│   ├── session/
│   │   └── tools/
│   │       └── sensitiveActionDetection.ts  # 已存在，需扩展
│   └── agent/
│       ├── components/
│       │   ├── SecurityConfig.tsx           # 安全配置
│       │   ├── BlacklistManager.tsx         # 黑名单管理
│       │   ├── FieldPermissionManager.tsx   # 字段权限管理
│       │   └── SecurityAlertPanel.tsx      # 安全告警面板
│       ├── hooks/
│       │   ├── useSecurityCheck.ts          # 安全检查 Hook
│       │   └── useSensitiveDataMask.ts     # 数据脱敏 Hook
│       └── stores/
│           └── securityStore.ts             # 安全状态
```

#### 核心接口

```typescript
// 敏感数据类型
interface SensitivePattern {
  id: string;
  name: string;
  patternType: PatternType;
  patternValue: string;
  category: SensitiveCategory;
  severity: Severity;
  enabled: boolean;
}

type PatternType = 'regex' | 'keyword' | 'builtin';
type SensitiveCategory = 'password' | 'key' | 'token' | 'personal' | 'financial';
type Severity = 'low' | 'medium' | 'high' | 'critical';

// 安全检查结果
interface SecurityCheckResult {
  passed: boolean;
  violations: SecurityViolation[];
  maskedData?: Record<string, unknown>;
}

interface SecurityViolation {
  type: ViolationType;
  category: SensitiveCategory;
  severity: Severity;
  field?: string;
  value?: string;
  message: string;
}

type ViolationType =
  | 'sensitive_data'    // 敏感数据
  | 'blacklist'         // 黑名单
  | 'injection'          // 注入攻击
  | 'permission_denied'; // 权限拒绝

// 黑名单项
interface BlacklistItem {
  id: string;
  value: string;
  category: string;
  reason?: string;
  enabled: boolean;
}

// 白名单项
interface WhitelistItem {
  id: string;
  value: string;
  category: string;
}

// 字段权限
interface FieldPermission {
  id: string;
  entityType: string;
  fieldName: string;
  requiredRole: string;
  maskType: MaskType;
}

type MaskType = 'none' | 'partial' | 'full' | 'hash';

// 安全告警
interface SecurityAlert {
  id: string;
  alertType: string;
  severity: Severity;
  message: string;
  context?: Record<string, unknown>;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  createdAt: number;
}

type AlertStatus = 'triggered' | 'acknowledged' | 'resolved';

// 数据脱敏
interface MaskingConfig {
  field: string;
  maskType: MaskType;
  maskChar?: string;     // 掩码字符，默认 '*'
  visibleStart?: number; // 前面可见字符数
  visibleEnd?: number;   // 后面可见字符数
}

// Hook 接口
interface UseSecurityCheck {
  check: (data: unknown) => Promise<SecurityCheckResult>;
  filterBlacklist: (content: string) => Promise<string>;
  checkPermission: (entityType: string, field: string) => Promise<boolean>;
  maskData: (data: unknown, config: MaskingConfig[]) => unknown;
}
```

### 后端实现

#### 技术选型
- **语言**: Rust
- **异步框架**: Tokio
- **正则引擎**: regex crate
- **数据库**: SQLite (本地存储)

#### 模块结构
```
src-tauri/src/
├── agent/
│   ├── security/
│   │   ├── mod.rs              # 模块入口
│   │   ├── sensitive_detector.rs  # 敏感数据检测
│   │   ├── blacklist_filter.rs    # 黑名单过滤
│   │   ├── permission_checker.rs # 权限校验
│   │   ├── data_masker.rs        # 数据脱敏
│   │   ├── alert_service.rs       # 告警服务
│   │   └── models.rs             # 数据模型
│   └── commands/
│       └── security_commands.rs   # Tauri 命令
```

#### 核心数据结构

```rust
// 敏感数据模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensitivePattern {
    pub id: String,
    pub name: String,
    pub pattern_type: String,
    pub pattern_value: String,
    pub category: String,
    pub severity: String,
    pub enabled: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

// 安全检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityCheckResult {
    pub passed: bool,
    pub violations: Vec<SecurityViolation>,
    pub masked_data: Option<Value>,
}

// 安全违规
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityViolation {
    pub violation_type: String,
    pub category: String,
    pub severity: String,
    pub field: Option<String>,
    pub value: Option<String>,
    pub message: String,
}

// 字段权限
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldPermission {
    pub id: String,
    pub entity_type: String,
    pub field_name: String,
    pub required_role: String,
    pub mask_type: String,
    pub created_at: i64,
    pub updated_at: i64,
}

// 安全告警
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAlert {
    pub id: String,
    pub alert_type: String,
    pub severity: String,
    pub message: String,
    pub context: Option<Value>,
    pub status: String,
    pub acknowledged_by: Option<String>,
    pub acknowledged_at: Option<i64>,
    pub resolved_at: Option<i64>,
    pub created_at: i64,
}
```

#### 核心服务实现

```rust
// 敏感数据检测器
pub struct SensitiveDetector {
    patterns: Vec<SensitivePattern>,
    regex_cache: HashMap<String, Regex>,
}

impl SensitiveDetector {
    // 检测敏感数据
    pub fn detect(&self, content: &str) -> Vec<SecurityViolation> {
        let mut violations = Vec::new();

        for pattern in &self.patterns {
            if !pattern.enabled {
                continue;
            }

            if let Some(violation) = self.match_pattern(content, pattern) {
                violations.push(violation);
            }
        }

        violations
    }

    fn match_pattern(&self, content: &str, pattern: &SensitivePattern) -> Option<SecurityViolation> {
        match pattern.pattern_type.as_str() {
            "builtin" => self.match_builtin(content, pattern),
            "keyword" => self.match_keyword(content, pattern),
            "regex" => self.match_regex(content, pattern),
            _ => None,
        }
    }

    fn match_builtin(&self, content: &str, pattern: &SensitivePattern) -> Option<SecurityViolation> {
        // 内置模式检测
        match pattern.pattern_value.as_str() {
            "email" => self.detect_email(content),
            "phone" => self.detect_phone(content),
            "id_card" => self.detect_id_card(content),
            "credit_card" => self.detect_credit_card(content),
            "password" => self.detect_password(content),
            _ => None,
        }
    }

    fn match_keyword(&self, content: &str, pattern: &SensitivePattern) -> Option<SecurityViolation> {
        if content.contains(&pattern.pattern_value) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: pattern.category.clone(),
                severity: pattern.severity.clone(),
                field: None,
                value: Some(pattern.pattern_value.clone()),
                message: format!("检测到敏感关键词: {}", pattern.name),
            })
        } else {
            None
        }
    }

    fn match_regex(&self, content: &str, pattern: &SensitivePattern) -> Option<SecurityViolation> {
        let regex = self.regex_cache
            .entry(pattern.pattern_value.clone())
            .or_insert_with(|| Regex::new(&pattern.pattern_value).ok()?);

        if let Some(matched) = regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: pattern.category.clone(),
                severity: pattern.severity.clone(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: format!("检测到敏感数据: {}", pattern.name),
            })
        } else {
            None
        }
    }
}

// 内置模式检测方法
impl SensitiveDetector {
    fn detect_email(&self, content: &str) -> Option<SecurityViolation> {
        let email_regex = Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").ok()?;
        if let Some(matched) = email_regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: "personal".to_string(),
                severity: "medium".to_string(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: "检测到邮箱地址".to_string(),
            })
        } else {
            None
        }
    }

    fn detect_phone(&self, content: &str) -> Option<SecurityViolation> {
        let phone_regex = Regex::new(r"1[3-9]\d{9}").ok()?;
        if let Some(matched) = phone_regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: "personal".to_string(),
                severity: "medium".to_string(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: "检测到手机号码".to_string(),
            })
        } else {
            None
        }
    }

    fn detect_id_card(&self, content: &str) -> Option<SecurityViolation> {
        let id_regex = Regex::new(r"\d{17}[\dXx]").ok()?;
        if let Some(matched) = id_regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: "personal".to_string(),
                severity: "high".to_string(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: "检测到身份证号码".to_string(),
            })
        } else {
            None
        }
    }

    fn detect_credit_card(&self, content: &str) -> Option<SecurityViolation> {
        let card_regex = Regex::new(r"\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}").ok()?;
        if let Some(matched) = card_regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: "financial".to_string(),
                severity: "critical".to_string(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: "检测到银行卡号".to_string(),
            })
        } else {
            None
        }
    }

    fn detect_password(&self, content: &str) -> Option<SecurityViolation> {
        // 检测 password= 或 "password": 格式的值
        let password_regex = Regex::new(r#"(?i)(?:password|pwd|passwd|secret)\s*[=:]\s*["']?([^"'\s]+)["']?"#).ok()?;
        if let Some(matched) = password_regex.find(content) {
            Some(SecurityViolation {
                violation_type: "sensitive_data".to_string(),
                category: "password".to_string(),
                severity: "critical".to_string(),
                field: None,
                value: Some(matched.as_str().to_string()),
                message: "检测到密码字段".to_string(),
            })
        } else {
            None
        }
    }
}

// 数据脱敏器
pub struct DataMasker {
    mask_configs: HashMap<String, MaskConfig>,
}

#[derive(Debug, Clone)]
pub struct MaskConfig {
    pub mask_type: String,
    pub mask_char: char,
    pub visible_start: usize,
    pub visible_end: usize,
}

impl DataMasker {
    pub fn mask_value(&self, value: &str, config: &MaskConfig) -> String {
        match config.mask_type.as_str() {
            "full" => config.mask_char.to_string().repeat(value.len()),
            "partial" => {
                let len = value.len();
                if len <= config.visible_start + config.visible_end {
                    config.mask_char.to_string().repeat(len)
                } else {
                    let start = &value[..config.visible_start];
                    let end = &value[len - config.visible_end..];
                    let middle_len = len - config.visible_start - config.visible_end;
                    format!("{}{}{}", start, config.mask_char.to_string().repeat(middle_len), end)
                }
            }
            "hash" => format!("{:x}", md5::compute(value.as_bytes())),
            _ => value.to_string(),
        }
    }

    pub fn mask_object(&self, data: &Value, configs: &HashMap<String, MaskConfig>) -> Value {
        // 实现对象的递归脱敏
    }
}

// 权限检查器
pub struct PermissionChecker {
    permissions: Vec<FieldPermission>,
    user_roles: HashMap<String, Vec<String>>,
}

impl PermissionChecker {
    pub fn check_field_permission(
        &self,
        user_id: &str,
        entity_type: &str,
        field: &str,
    ) -> Result<bool, SecurityError> {
        // 获取用户角色
        let roles = self.user_roles.get(user_id)
            .ok_or(SecurityError::UserNotFound)?;

        // 查找字段权限配置
        for permission in &self.permissions {
            if permission.entity_type == entity_type && permission.field_name == field {
                // 检查用户是否有权限
                if roles.contains(&permission.required_role) {
                    return Ok(true);
                } else {
                    return Ok(false);
                }
            }
        }

        // 默认拒绝
        Ok(false)
    }
}
```

### API 设计

#### Tauri 命令

```rust
// 检查敏感数据
#[tauri::command]
pub async fn check_sensitive_data(
    content: String,
    categories: Option<Vec<String>>,
) -> Result<SecurityCheckResult, String>;

// 黑名单过滤
#[tauri::command]
pub async fn filter_blacklist(
    content: String,
) -> Result<FilterResult, String>;

// 检查字段权限
#[tauri::command]
pub async fn check_field_permission(
    user_id: String,
    entity_type: String,
    field: String,
) -> Result<bool, String>;

// 脱敏数据
#[tauri::command]
pub async fn mask_sensitive_data(
    data: Value,
    mask_configs: Vec<MaskConfig>,
    exempt: bool,  // 是否豁免（管理员可查看原始数据）
) -> Result<Value, String>;

// 获取安全告警
#[tauri::command]
pub async fn get_security_alerts(
    status: Option<String>,
    severity: Option<String>,
    start_time: Option<i64>,
    end_time: Option<i64>,
) -> Result<Vec<SecurityAlert>, String>;

// 确认安全告警
#[tauri::command]
pub async fn acknowledge_security_alert(
    alert_id: String,
    user_id: String,
) -> Result<bool, String>;

// 添加敏感模式
#[tauri::command]
pub async fn add_sensitive_pattern(
    pattern: SensitivePattern,
) -> Result<String, String>;

// 获取敏感模式列表
#[tauri::command]
pub async fn get_sensitive_patterns(
    category: Option<String>,
) -> Result<Vec<SensitivePattern>, String>;
```

## 组件设计

### 前端组件

#### SecurityConfig
- **职责**: 安全配置管理
- **Props**: 无
- **状态**: 敏感模式列表、黑名单、白名单

#### BlacklistManager
- **职责**: 黑名单词库管理
- **Props**: 无
- **状态**: 黑名单列表

#### FieldPermissionManager
- **职责**: 字段权限配置
- **Props**: 无
- **状态**: 权限配置列表

#### SecurityAlertPanel
- **职责**: 安全告警面板
- **Props**:
  - `alerts: SecurityAlert[]`
  - `onAcknowledge?: (alertId: string) => void`
- **状态**: 告警列表

### 后端模块

#### SensitiveDetector
- **职责**: 敏感数据检测
- **方法**:
  - `detect()` - 检测敏感数据
  - `match_pattern()` - 匹配模式

#### BlacklistFilter
- **职责**: 黑名单过滤
- **方法**:
  - `filter()` - 过滤内容

#### PermissionChecker
- **职责**: 权限校验
- **方法**:
  - `check_field_permission()` - 检查字段权限

#### DataMasker
- **职责**: 数据脱敏
- **方法**:
  - `mask_value()` - 脱敏单个值
  - `mask_object()` - 脱敏对象

## 状态管理

### Zustand Store

```typescript
interface SecurityState {
  patterns: SensitivePattern[];
  blacklist: BlacklistItem[];
  whitelist: WhitelistItem[];
  permissions: FieldPermission[];
  alerts: SecurityAlert[];
  loading: boolean;

  // Actions
  fetchPatterns: () => Promise<void>;
  addPattern: (pattern: SensitivePattern) => Promise<void>;
  fetchBlacklist: () => Promise<void>;
  addBlacklistItem: (item: BlacklistItem) => Promise<void>;
  fetchAlerts: (params: AlertQuery) => Promise<void>;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
}
```

## 安全考虑

- 遵循 ADR-018 和 ADR-041 安全设计
- 实现多层安全检查（输入层、处理层、输出层）
- 实现安全事件的完整审计
- 实现敏感数据的加密存储
- 实现权限的最小权限原则

## 性能考虑

- 使用正则缓存提高匹配性能
- 实现异步安全检查避免阻塞
- 使用布隆过滤器优化大规模检测
- 实现检查结果缓存

## 测试策略

### 单元测试
- SensitiveDetector 各模式检测测试
- BlacklistFilter 过滤测试
- DataMasker 脱敏测试
- PermissionChecker 权限测试

### 集成测试
- 安全检查流程测试
- 告警触发和通知测试
- 权限校验流程测试

### E2E 测试
- 完整安全检查流程测试
- 敏感数据检测测试
- 黑名单拦截测试
