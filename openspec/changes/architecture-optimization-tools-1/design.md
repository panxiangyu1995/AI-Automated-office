# Design: Agent Tools 架构优化

## 优化前架构

```
src/agent/tools/
├── mod.rs              # 20+ 子模块导出
├── descriptor.rs       # 工具描述符定义
├── registry.rs         # 工具注册表
├── pipeline.rs        # 执行管道
├── core.rs            # 核心工具（重复helper）
├── web.rs             # Web工具（重复helper）
├── shell.rs           # Shell工具（重复helper）
├── filesystem.rs       # 文件系统工具（helper）
├── browser.rs         # ⚠️ 1867行过胖模块
├── memory/
│   ├── mod.rs
│   ├── memory_get.rs
│   └── memory_search.rs
├── sessions/
│   ├── mod.rs
│   └── ... (多个子模块)
├── media/
│   ├── mod.rs
│   └── ... (多个子模块)
└── ... (其他模块)
```

### 问题详情

1. **重复代码**
   - `base_metadata()` 在 core.rs, web.rs, shell.rs, browser.rs 重复定义
   - `base_capabilities()` 在上述文件重复定义
   - 每个模块都有自己的 `get_or_init_config()` 函数

2. **Browser 模块过胖**
   - 单文件 1867 行
   - 40+ 个 action handler 函数
   - 所有状态管理、CDP 客户端、结果类型都在同一文件

3. **配置管理分散**
   - `WEB_SEARCH_CONFIG: RwLock<Option<WebSearchConfig>>`
   - `SHELL_CONFIG: RwLock<Option<ShellConfig>>`
   - `FS_CONFIG: RwLock<Option<FilesystemConfig>>`
   - `BROWSER_STATE: RwLock<Option<BrowserState>>`

## 优化后架构

```
src/agent/tools/
├── mod.rs              # 更新后的导出
├── common/
│   ├── mod.rs          # 模块导出
│   ├── builder.rs       # ToolDescriptor Builder
│   ├── helpers.rs       # 公共辅助函数
│   ├── config.rs       # 统一配置管理器
│   └── errors.rs        # 统一错误类型
├── descriptor.rs       # 工具描述符定义
├── registry.rs         # 工具注册表
├── pipeline.rs        # 执行管道
├── core.rs            # 核心工具（使用 common）
├── web.rs             # Web工具（使用 common）
├── shell.rs           # Shell工具（使用 common）
├── filesystem.rs       # 文件系统工具（使用 common）
├── browser/
│   ├── mod.rs          # 状态和导出
│   ├── control.rs       # 控制操作
│   ├── navigation.rs    # 导航操作
│   ├── snapshot.rs      # 快照操作
│   ├── interaction.rs    # 交互操作
│   ├── state.rs         # 状态操作
│   ├── storage.rs        # 存储操作
│   ├── network.rs        # 网络操作
│   └── download.rs       # 下载操作
├── memory/
│   └── ... (保持不变)
├── sessions/
│   └── ... (保持不变)
└── ... (其他模块)
```

## 详细设计

### 1. common/builder.rs

```rust
/// 工具描述符构建器
pub struct ToolDescriptorBuilder {
    id: String,
    name: String,
    description: String,
    category: ToolCategory,
    parameters: Vec<ToolParameter>,
    return_type: Option<ToolReturnType>,
    execution_mode: ToolExecutionMode,
    capabilities: ToolCapabilities,
    permissions: Option<Vec<ToolPermissionRequirement>>,
    dependencies: Option<Vec<ToolDependency>>,
    context_requirements: Option<ToolContextRequirements>,
    metadata: ToolMetadata,
    enabled: bool,
    deprecated: Option<bool>,
    deprecation_message: Option<String>,
    handler_module: Option<String>,
    handler_function: Option<String>,
}

impl ToolDescriptorBuilder {
    pub fn new(id: &str, name: &str, description: &str) -> Self { ... }
    pub fn category(mut self, category: ToolCategory) -> Self { ... }
    pub fn parameters(mut self, params: Vec<ToolParameter>) -> Self { ... }
    pub fn with_permissions(mut self, perms: Vec<ToolPermissionRequirement>) -> Self { ... }
    pub fn read_only(mut self) -> Self { ... }
    pub fn requires_permission(mut self) -> Self { ... }
    pub fn build(self) -> ToolDescriptor { ... }
}
```

### 2. common/helpers.rs

```rust
/// 创建基础元数据
pub fn base_metadata(category: &str, tags: Vec<&str>) -> ToolMetadata { ... }

/// 创建基础能力（只读）
pub fn base_readonly_capabilities() -> ToolCapabilities { ... }

/// 创建基础能力（可写）
pub fn base_writable_capabilities() -> ToolCapabilities { ... }

/// 创建基础能力（带权限）
pub fn base_permission_capabilities() -> ToolCapabilities { ... }

/// 创建字符串参数
pub fn string_param(name: &str, desc: &str, required: bool) -> ToolParameter { ... }

/// 创建数字参数
pub fn number_param(name: &str, desc: &str, required: bool) -> ToolParameter { ... }

/// 创建布尔参数
pub fn bool_param(name: &str, desc: &str, required: bool) -> ToolParameter { ... }

/// 创建数组参数
pub fn array_param(name: &str, desc: &str, required: bool) -> ToolParameter { ... }
```

### 3. common/config.rs

```rust
/// 工具配置管理器（单例）
pub struct ToolConfigManager {
    web: RwLock<Option<WebSearchConfig>>,
    shell: RwLock<Option<ShellConfig>>,
    filesystem: RwLock<Option<FilesystemConfig>>,
    browser: RwLock<Option<BrowserConfig>>,
}

impl ToolConfigManager {
    /// 获取全局实例
    pub fn global() -> &'static ToolConfigManager { ... }

    /// 获取或初始化 Web 配置
    pub fn web(&self) -> WebSearchConfig { ... }
    pub fn set_web(&self, config: WebSearchConfig) { ... }

    /// 获取或初始化 Shell 配置
    pub fn shell(&self) -> ShellConfig { ... }
    pub fn set_shell(&self, config: ShellConfig) { ... }

    /// 获取或初始化文件系统配置
    pub fn filesystem(&self) -> FilesystemConfig { ... }
    pub fn set_filesystem(&self, config: FilesystemConfig) { ... }

    /// 获取或初始化浏览器配置
    pub fn browser(&self) -> BrowserConfig { ... }
    pub fn set_browser(&self, config: BrowserConfig) { ... }
}
```

### 4. browser/ 模块拆分

```
browser/mod.rs:
- BrowserState 结构体
- BrowserTab, DialogArm, Cookie 等相关类型
- 模块导出
- get_state(), update_state() 函数

browser/control.rs:
- execute_status()
- execute_start()
- execute_stop()
- execute_profiles()
- execute_tabs()

browser/navigation.rs:
- execute_open()
- execute_close()
- execute_focus()
- execute_navigate()
- execute_back()
- execute_forward()
- execute_refresh()

browser/snapshot.rs:
- execute_snapshot()
- execute_screenshot()

browser/interaction.rs:
- execute_act()
- execute_arm_file_chooser()
- execute_disarm_file_chooser()
- execute_arm_dialog()
- execute_accept_dialog()
- execute_dismiss_dialog()

browser/state.rs:
- execute_set_offline()
- execute_set_extra_headers()
- execute_set_geolocation()

browser/storage.rs:
- execute_get_cookies()
- execute_set_cookies()
- execute_get_local_storage()
- execute_get_session_storage()

browser/network.rs:
- execute_get_network_requests()
- execute_get_response_body()

browser/download.rs:
- execute_arm_download()
- execute_wait_for_download()
```

## 实现要点

### 阶段一：创建 common 模块
1. 创建 `tools/common/` 目录结构
2. 实现 `builder.rs` - ToolDescriptorBuilder
3. 实现 `helpers.rs` - 公共辅助函数
4. 实现 `config.rs` - 统一配置管理器
5. 实现 `errors.rs` - 统一错误类型

### 阶段二：重构现有模块
1. 更新 `core.rs` 使用 common helpers
2. 更新 `web.rs` 使用 common helpers 和 config
3. 更新 `shell.rs` 使用 common helpers 和 config
4. 更新 `filesystem.rs` 使用 common helpers

### 阶段三：拆分 browser 模块
1. 创建 `tools/browser/` 目录
2. 迁移 `browser/mod.rs` 状态管理代码
3. 拆分各个 action 处理文件
4. 更新 `tools/mod.rs` 导出
5. 删除旧的 `browser.rs`

### 阶段四：验证
1. 编译检查
2. 单元测试
3. 功能验证
