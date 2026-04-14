# Proposal: Agent Tools 架构优化

## 变更类型
- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

当前 Agent Tools 模块存在以下架构问题：

1. **代码重复严重**：`base_metadata()` 和 `base_capabilities()` 在 4+ 个模块中重复定义
2. **Browser 模块过胖**：单文件 1867 行，40+ 个 action handler，违反单一职责原则
3. **配置管理不统一**：5 个模块使用不同的 `RwLock<Option<T>>` 模式
4. **Builder 模式缺失**：工具描述符创建分散，参数多时难以维护
5. **Executor 实现风格不一致**：有些用 `struct Name;` + `Default`，有些用 `struct Name {}` + `new()`

## 优化目标

1. **消除代码重复**：提取公共的 Builder 和 Helper 到 `tools/common` 模块
2. **拆分 Browser 模块**：将 1867 行的 `browser.rs` 拆分为 `browser/control.rs`、`browser/navigation.rs` 等子模块
3. **统一配置管理**：创建 `ConfigManager` 统一管理所有工具配置
4. **统一 Executor 风格**：采用一致的 Builder + new() 模式
5. **保持功能不变**：所有现有工具功能完全保持不变

## 功能不变性保证

### 必须保持的功能
1. 所有现有工具（web_search, web_fetch, sandbox_execute, pattern_search, file_read, file_write, file_edit, dir_list, browser_interact 等）
2. 工具的参数和返回值结构
3. 权限检查和安全验证
4. 执行管道的生命周期（验证 → 权限检查 → 敏感度评估 → 执行 → 结果）
5. 工具注册和发现机制

### API 兼容性
- ToolRegistry 接口不变
- ToolExecutor trait 不变
- ToolExecutionPipeline 接口不变

## 优化方案

### 1. 创建 `tools/common` 模块

```
src/agent/tools/common/
├── mod.rs                 # 模块导出
├── builder.rs             # ToolDescriptor Builder
├── helpers.rs             # base_metadata, base_capabilities 等辅助函数
├── config_manager.rs      # 统一配置管理器
└── errors.rs              # 统一错误类型
```

**Builder 模式示例：**
```rust
pub struct ToolDescriptorBuilder {
    id: String,
    name: String,
    description: String,
    category: ToolCategory,
    // ... 更多字段
}

impl ToolDescriptorBuilder {
    pub fn new(id: &str, name: &str) -> Self { ... }
    pub fn parameters(mut self, params: Vec<ToolParameter>) -> Self { ... }
    pub fn permissions(mut self, perms: Vec<ToolPermissionRequirement>) -> Self { ... }
    pub fn build(self) -> ToolDescriptor { ... }
}
```

### 2. 拆分 Browser 模块

```
src/agent/tools/browser/
├── mod.rs                 # 模块导出，状态管理
├── control.rs             # status, start, stop, profiles, tabs
├── navigation.rs           # navigate, back, forward, refresh
├── snapshot.rs            # snapshot, screenshot
├── interaction.rs         # act, file_chooser, dialog
├── state.rs               # offline, headers, geolocation
├── storage.rs             # cookies, local_storage, session_storage
├── network.rs             # network_requests, response_body
└── download.rs            # arm_download, wait_for_download
```

### 3. 统一配置管理器

```rust
pub struct ToolConfigManager {
    web: RwLock<Option<WebSearchConfig>>,
    shell: RwLock<Option<ShellConfig>>,
    filesystem: RwLock<Option<FilesystemConfig>>,
    browser: RwLock<Option<BrowserConfig>>,
}

impl ToolConfigManager {
    pub fn global() -> &'static ToolConfigManager { ... }
    pub fn web(&self) -> WebSearchConfig { ... }
    pub fn set_web(&self, config: WebSearchConfig) { ... }
    // ... 其他配置
}
```

## 影响范围

### 修改的文件
- 新增：`src/agent/tools/common/` 目录及文件
- 拆分：`src/agent/tools/browser.rs` → `src/agent/tools/browser/` 目录
- 重构：`core.rs`, `web.rs`, `shell.rs`, `filesystem.rs` 使用 common 模块
- 修改：`src/agent/tools/mod.rs` 更新导出

### 保持不变的文件
- `descriptor.rs` - 仅添加 Builder
- `registry.rs` - 接口不变
- `pipeline.rs` - 执行管道不变
- `memory/mod.rs`, `sessions/mod.rs` 等子模块

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 拆分过程引入编译错误 | 中 | 高 | 分步骤实施，每步验证编译 |
| 改变 Builder 破坏向后兼容 | 低 | 高 | Builder 新增，不修改现有构造方式 |
| 配置管理器重构影响运行时行为 | 低 | 高 | 仅改变初始化方式，不改变配置结构 |

## 依赖

- **前置依赖**: 无
- **后置依赖**: 无

## 验收标准

1. [ ] 所有现有工具功能测试通过
2. [ ] `cargo build` 编译成功
3. [ ] `cargo clippy -- -D warnings` 无警告
4. [ ] 工具注册和执行流程正常工作
5. [ ] Browser 模块拆分后功能完整
