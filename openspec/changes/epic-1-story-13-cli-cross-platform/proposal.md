## Why

As a 用户，我需要 CLI 工具可以在 Windows/macOS/Linux 上运行，并支持开机自启为后台服务，以便 我可以在不同操作系统上使用 CLI 并持续接收消息。这是 Epic 1 的关键功能点。

## What Changes

- 执行交叉编译构建，生成 Windows（.exe）、macOS、Linux 三个平台的可执行文件
- CLI 以后台服务模式运行时，支持 ao-cli service install/start/stop/uninstall 命令

## Capabilities

### New Capabilities
- `cli-cross-platform`: CLI 多平台构建与后台服务模式的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
