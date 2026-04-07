# Design: 工具权限沙箱实现

## 技术架构

### 1. 三层命令机制（ADR-022-1）

```
┌─────────────────────────────────────────┐
│           命令权限判断                   │
├─────────────────────────────────────────┤
│  1. 黑名单（DENY） - 最高优先级        │
│  2. 白名单（ALLOW） - 次优先级          │
│  3. 灰名单（ASK） - 需用户确认          │
└─────────────────────────────────────────┘
```

### 2. 匹配模式

```rust
pub enum MatchPattern {
    Exact(String),           // 精确匹配
    Prefix(String),          // 前缀匹配
    Suffix(String),          // 后缀匹配
    Contains(String),        // 包含匹配
    Regex(String),           // 正则匹配
    Group(String),           // 分组匹配
}
```

### 3. 沙箱执行

```rust
pub struct ToolSandbox {
    blacklist: Vec<MatchPattern>,
    whitelist: Vec<MatchPattern>,
    graylist: Vec<MatchPattern>,
}

impl ToolSandbox {
    pub async fn check_permission(
        &self,
        tool_name: &str,
    ) -> Result<PermissionResult, SandboxError> {
        // 1. 检查黑名单
        if self.matches(&self.blacklist, tool_name) {
            return Ok(PermissionResult::Denied {
                reason: "命令在黑名单中".to_string(),
            });
        }
        
        // 2. 检查灰名单
        if self.matches(&self.graylist, tool_name) {
            return Ok(PermissionResult::Ask {
                tool_name: tool_name.to_string(),
            });
        }
        
        // 3. 如果有白名单，检查是否在白名单中
        if !self.whitelist.is_empty() {
            if self.matches(&self.whitelist, tool_name) {
                return Ok(PermissionResult::Allowed);
            }
            return Ok(PermissionResult::Denied {
                reason: "命令不在白名单中".to_string(),
            });
        }
        
        Ok(PermissionResult::Allowed)
    }
}
```

### 4. Tauri命令

```rust
#[tauri::command]
pub async fn check_tool_permission(
    tool_name: String,
) -> Result<PermissionResult, String>;

#[tauri::command]
pub async fn add_to_blacklist(
    pattern: MatchPattern,
) -> Result<(), String>;

#[tauri::command]
pub async fn add_to_whitelist(
    pattern: MatchPattern,
) -> Result<(), String>;

#[tauri::command]
pub async fn add_to_graylist(
    pattern: MatchPattern,
) -> Result<(), String>;
```
