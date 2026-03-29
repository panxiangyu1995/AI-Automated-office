## Context

**背景**: 当前 Agent Tools 系统仅有 5 个基础系统工具，远未达到铁律文档定义的 16 个 Layer 1 核心工具标准。缺乏文件系统、Shell 执行、Web 搜索和浏览器交互等关键能力。

**现有架构**:
- `ToolExecutionPipeline`: 工具执行管道，负责工具的调度和执行
- `ToolRegistry`: 工具注册表，存储工具描述符
- `ToolExecutor` trait: 工具执行器接口
- `ToolDescriptor`: 工具描述元数据

**参考实现**: OpenClaw 项目提供了完整的 browser-tool 和 web-search-tool 实现，其架构模式值得借鉴。

## Goals / Non-Goals

**Goals:**
- 实现 16 个 Layer 1 核心工具，分为 4 组
- 复用现有 ToolExecutionPipeline 和权限系统
- 保持与 OpenClaw 类似的工具工厂模式，但使用 Rust 实现
- 工具注册到 ToolRegistry，支持权限检查和敏感性评估

**Non-Goals:**
- 不实现 Layer 3 部门工具（由单独 change 处理）
- 不实现 MCP 协议外部工具（Phase 2 范畴）
- 不修改现有 ToolExecutionPipeline 核心架构

## Decisions

### Decision 1: 工具模块组织结构

**选择**: 按功能分组而非按工具逐一实现

```
src-tauri/src/agent/tools/
├── core/                    # Layer 1 核心工具
│   ├── mod.rs              # 模块入口，register_core_tools()
│   ├── filesystem.rs        # 文件系统工具 (file_read/write/edit/list)
│   ├── shell.rs            # Shell 工具 (sandbox_execute/pattern_search)
│   ├── web.rs              # Web 工具 (web_search/fetch/http_request)
│   ├── browser.rs          # 浏览器工具 (browser_interact)
│   └── document.rs         # 文档工具 (parse/convert)
└── enterprise/              # Layer 2 企业工具 (单独 change)
```

**理由**: 按功能模块分组便于维护和扩展，每个模块可独立测试。

### Decision 2: Web Search Provider 架构

**选择**: 采用 Provider 抽象模式，支持多 Provider 切换

```rust
trait WebSearchProvider: Send + Sync {
    async fn search(&self, query: &str, params: SearchParams) -> Result<SearchResult>;
    fn provider_name(&self) -> &'static str;
}

// 内置 Providers: Brave, Google (Gemini), Perplexity, Tavily
// 通过配置选择 Provider，支持 API Key 配置
```

**替代方案**: 硬编码单一 Provider → 缺点：不够灵活，无法切换

### Decision 3: Browser Tool 实现

**选择**: 基于 CDP (Chrome DevTools Protocol) 通过 HTTP 调用

架构参考 OpenClaw:
```
Agent → ToolExecutionPipeline → browser_interact →
  → HTTP Client → Playwright CDP Server → Chrome
```

**关键考量**:
- Playwright 需要独立进程运行（browser-server）
- 支持 profile 隔离
- 支持 screenshot、snapshot、act 等操作

### Decision 4: 文件系统工具安全模型

**选择**: 限定工作目录，禁止越界访问

```rust
struct FilesystemToolConfig {
    allowed_dirs: Vec<PathBuf>,  // 允许访问的目录白名单
    max_file_size: u64,        // 最大文件大小
    read_only_by_default: bool, // 默认只读
}
```

**理由**: 防止 Agent 通过工具访问敏感系统文件。

### Decision 5: Shell 执行沙盒模型

**选择**: 仅允许预定义命令，拒绝任意 shell

```rust
// 允许的命令白名单
const ALLOWED_COMMANDS: &[&str] = &[
    "grep", "find", "ls", "cat", "echo",
    "wc", "sort", "uniq", "head", "tail"
];
```

**理由**: 安全性优先，避免命令注入攻击。

## Risks / Trade-offs

| 风险 | 描述 | 缓解措施 |
|------|------|---------|
| Playwright 依赖 | 需要独立安装 Playwright 和 Chrome | 提供环境检测和安装指引 |
| Web Search API 成本 | 搜索 API 有调用成本 | 通过配置控制 Provider，按需启用 |
| 文件系统安全 | 错误配置可能导致越权访问 | 严格白名单，测试覆盖边界情况 |
| Shell 注入 | 恶意命令注入 | 命令白名单 + 参数验证 |

## Open Questions

1. **Browser Server 进程管理**: Playwright CDP server 是内嵌启动还是独立进程？需要 Tauri 命令封装
2. **Web Search Provider 配置 UI**: 是否需要在设置页面配置 API Key？
3. **工具超时策略**: 各工具的默认超时如何设定？是否需要分类配置？
