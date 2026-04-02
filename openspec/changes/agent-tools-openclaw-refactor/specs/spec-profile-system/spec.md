# Spec: Profile-Driven Tool Selection System

## Overview

Profile 驱动的工具筛选机制，参考 OpenClaw `tool-catalog.ts` 实现。

## Motivation

当前工具系统没有 Profile 概念，所有工具一视同仁。引入 Profile 可以：
- 根据使用场景动态切换工具集
- 简化权限管理
- 提升 AI 工具选择的准确性

## Design

### ToolProfile 枚举

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ToolProfile {
    /// 仅基础工具 - session_status, system_*
    Minimal,
    /// 编码工具集 - 文件系统, Shell, Web, Browser, Memory, Sessions
    Coding,
    /// 消息工具集 - sessions, message
    Messaging,
    /// 全功能 - 无限制
    Full,
}
```

### 工具 → Profile 映射

| 工具 ID | Minimal | Coding | Messaging | Full |
|---------|:-------:|:------:|:---------:|:----:|
| system_get_app_version | ✅ | ✅ | ❌ | ✅ |
| system_get_platform | ✅ | ✅ | ❌ | ✅ |
| network_check_status | ✅ | ✅ | ❌ | ✅ |
| network_get_status | ✅ | ✅ | ❌ | ✅ |
| session_status | ✅ | ✅ | ✅ | ✅ |
| file_read | ❌ | ✅ | ❌ | ✅ |
| file_write | ❌ | ✅ | ❌ | ✅ |
| file_edit | ❌ | ✅ | ❌ | ✅ |
| dir_list | ❌ | ✅ | ❌ | ✅ |
| sandbox_execute | ❌ | ✅ | ❌ | ✅ |
| pattern_search | ❌ | ✅ | ❌ | ✅ |
| web_search | ❌ | ✅ | ❌ | ✅ |
| web_fetch | ❌ | ✅ | ❌ | ✅ |
| http_request | ❌ | ✅ | ❌ | ✅ |
| browser_interact | ❌ | ✅ | ❌ | ✅ |
| memory_search | ❌ | ✅ | ❌ | ✅ |
| memory_get | ❌ | ✅ | ❌ | ✅ |
| sessions_list | ❌ | ✅ | ✅ | ✅ |
| sessions_history | ❌ | ✅ | ✅ | ✅ |
| sessions_send | ❌ | ✅ | ✅ | ✅ |
| sessions_spawn | ❌ | ✅ | ❌ | ✅ |
| sessions_yield | ❌ | ✅ | ❌ | ✅ |
| message_send | ❌ | ❌ | ✅ | ✅ |
| image_understand | ❌ | ✅ | ❌ | ✅ |
| tts_speak | ❌ | ✅ | ❌ | ✅ |
| cron_schedule | ❌ | ✅ | ❌ | ✅ |
| cron_list | ❌ | ✅ | ❌ | ✅ |
| cron_cancel | ❌ | ✅ | ❌ | ✅ |

### 配置结构

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolsConfig {
    /// 默认 Profile
    #[serde(default = "default_profile")]
    pub default_profile: ToolProfile,
    
    /// Profile 配置覆盖
    #[serde(default)]
    pub profiles: HashMap<ToolProfile, ToolProfileConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolProfileConfig {
    /// 允许的工具 ID 列表
    #[serde(default)]
    pub allow: Vec<String>,
    
    /// 拒绝的工具 ID 列表
    #[serde(default)]
    pub deny: Vec<String>,
    
    /// 额外允许的工具 ID 列表（合并到 allow）
    #[serde(default)]
    pub also_allow: Vec<String>,
}
```

### 执行流程

```
ToolExecutionRequest
    │
    ▼
参数验证
    │
    ▼
Profile 过滤 ◄────── ToolExecutionRequest.profile
    │                (可选，None 则使用默认 Profile)
    │ 工具不在 Profile 允许列表？
    │     │
    │     ├─ YES ──► 返回 ToolErrorCode::NotAllowed
    │     │
    │     ▼
    │
权限检查
    │
    ▼
敏感度评估
    │
    ▼
执行器调用
```

### Tauri IPC 接口

```rust
#[tauri::command]
pub async fn tools_set_profile(
    profile: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn tools_get_profile() -> Result<String, String>;

#[tauri::command]
pub async fn tools_list_profiles() -> Result<Vec<ProfileInfo>, String>;
```

## Acceptance Criteria

1. Profile 过滤在参数验证后、权限检查前执行
2. 工具不在 Profile 允许列表时返回明确的错误信息
3. 配置支持 allow/deny/also_allow 合并逻辑
4. 支持通过 Tauri IPC 动态切换 Profile
5. 默认 Profile 为 Coding

## Open Questions

1. Profile 切换是否需要持久化？
2. 是否支持按 Agent 动态设置 Profile？
