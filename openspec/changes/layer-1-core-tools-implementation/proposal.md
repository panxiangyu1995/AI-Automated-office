## Why

当前 Agent Tools 系统仅有 5 个基础系统工具（system_get_app_version、system_get_platform、network_check_status、network_get_status、http_request），远未达到铁律文档（architecture.md ADR-025）中定义的 16 个 Layer 1 核心工具标准。缺乏文件系统、Shell 执行、Web 搜索和浏览器交互等关键能力，严重限制了 Agent 的自动化能力。

## What Changes

实现铁律文档定义的 Layer 1 核心工具，共 4 组 16 个工具：

**Filesystem 工具组 (4个)**
- `file_read`: 读取文件内容
- `file_write`: 写入文件内容
- `file_edit`: 编辑文件（局部修改）
- `dir_list`: 列出目录内容

**Shell 工具组 (2个)**
- `sandbox_execute`: 沙盒命令执行
- `pattern_search`: 模式匹配搜索

**Web 工具组 (4个)**
- `web_search`: Web 搜索
- `web_fetch`: Web 内容抓取
- `http_request`: HTTP 请求（扩展现有 http_request）
- `browser_interact`: 浏览器交互控制

**System 工具组 (3个)**
- `sys_time`: 获取系统时间
- `document_parse`: 文档解析
- `document_convert`: 文档格式转换

## Capabilities

### New Capabilities

- `core-tools-filesystem`: 文件系统操作工具集，提供安全可控的文件读写、编辑和目录遍历能力
- `core-tools-shell`: 沙盒化 Shell 执行工具，用于安全的命令执行和模式搜索
- `core-tools-web`: Web 交互工具集，支持搜索、内容抓取和 HTTP 请求
- `core-tools-browser`: 基于 Playwright 的浏览器自动化控制工具
- `core-tools-document`: 文档处理工具，支持解析和格式转换

### Modified Capabilities

- `http-request-tool`: 扩展现有 http_request 工具，增强参数验证和错误处理

## Impact

**后端 (Rust/Tauri)**
- 新增 `src-tauri/src/agent/tools/core/` 目录
- 实现 filesystem、shell、web、browser、document 工具模块
- 复用现有 `ToolExecutor` trait 和 `ToolExecutionPipeline`

**前端**
- 无直接变更（工具通过 Agent 对话调用）

**配置**
- 工具注册到 `ToolRegistry`
- 敏感操作权限检查配置

**依赖**
- Playwright (browser_interact)
- reqwest (http_request)
