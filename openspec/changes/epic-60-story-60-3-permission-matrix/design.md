# Design: 权限矩阵基础

## 1. 权限计算引擎

```rust
/// 权限计算引擎
pub struct PermissionEngine {
    config_store: Arc<ConfigStore>,
    cache: Arc<PermissionCache>,
}

impl PermissionEngine {
    /// 计算用户可用权限
    pub async fn calculate_permissions(
        &self,
        user_id: &str,
        context: &ExecutionContext,
    ) -> Result<UserPermissions, PermissionError> {
        // 1. 获取用户基础信息
        let user = self.get_user(user_id).await?;
        
        // 2. Platform Base 权限
        let platform = self.get_platform_permissions(&user);
        
        // 3. Department Capability
        let department = self.get_department_permissions(&user, context.department_id)?;
        
        // 4. Role Enhancement
        let role = self.get_role_permissions(&user.role)?;
        
        // 5. 合并权限
        let merged = self.merge_permissions(platform, department, role);
        
        // 6. 应用黑名单
        let final_perms = self.apply_blacklist(merged, &user.blacklist);
        
        Ok(final_perms)
    }
}

/// 用户权限
pub struct UserPermissions {
    pub allowed_tools: Vec<String>,
    pub denied_tools: Vec<String>,
    pub tool_constraints: HashMap<String, ToolConstraint>,
    pub data_scope: HashMap<String, DataScope>,
    pub field_permissions: HashMap<String, Vec<String>>,
}
```

## 2. 字段级权限

```rust
/// 字段权限检查器
pub struct FieldPermissionChecker {
    field_configs: Arc<FieldPermissionConfig>,
}

impl FieldPermissionChecker {
    /// 过滤字段
    pub fn filter_fields<T: Serialize>(
        &self,
        data: &T,
        allowed_fields: &[String],
    ) -> Result<serde_json::Value, PermissionError> {
        let json = serde_json::to_value(data)?;
        let mut filtered = serde_json::Map::new();
        
        for (key, value) in json.as_object().unwrap() {
            if allowed_fields.contains(key) {
                filtered.insert(key.clone(), value.clone());
            }
        }
        
        Ok(serde_json::Value::Object(filtered))
    }
}

/// 字段权限配置
pub struct FieldPermissionConfig {
    // tool_name -> role -> allowed_fields
    permissions: HashMap<String, HashMap<Role, Vec<String>>>,
}
```

## 3. 数据范围过滤

```rust
/// 数据范围过滤
pub enum DataScopeFilter {
    /// 仅本人数据
    Personal {
        user_field: String,
        current_user_id: String,
    },
    /// 本部门数据
    Department {
        dept_field: String,
        current_user_dept_id: String,
    },
    /// 全部数据
    All,
    /// 高管数据范围
    Executive {
        include_sensitive: bool,
    },
}

impl DataScopeFilter {
    /// 构建 SQL WHERE 子句
    pub fn to_sql_filter(&self) -> String {
        match self {
            DataScopeFilter::Personal { user_field, current_user_id } => {
                format!("{} = '{}'", user_field, current_user_id)
            }
            DataScopeFilter::Department { dept_field, current_user_dept_id } => {
                format!("{} = '{}'", dept_field, current_user_dept_id)
            }
            DataScopeFilter::All => "1=1".to_string(),
            DataScopeFilter::Executive { .. } => "1=1".to_string(),
        }
    }
}
```

## 4. 权限决策流程

```
用户请求: finance_query({ amount: ..., date_range: ... })
     │
     ▼
Step 1: 基础权限检查
     │
     ├── 用户角色 = staff
     ├── 可用工具: [finance_query, finance_ocr]
     └── ✗ finance_mutate → 直接拒绝
     │
     ▼
Step 2: 字段权限检查
     │
     ├── staff 可用字段: [id, amount, status, date, description]
     ├── 请求字段: [amount, bank_account]
     └── ✗ bank_account → 移除
     │
     ▼
Step 3: 数据范围检查
     │
     ├── staff 数据范围: personal_only
     └── 自动注入: WHERE applicant_id = current_user.id
     │
     ▼
Step 4: 执行并返回结果
```
