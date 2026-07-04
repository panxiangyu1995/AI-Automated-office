## ADDED Requirements

### Requirement: CLI 多平台构建与后台服务模式

As a 用户，I want CLI 工具可以在 Windows/macOS/Linux 上运行，并支持开机自启为后台服务，So that 我可以在不同操作系统上使用 CLI 并持续接收消息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行交叉编译构建，生成 Windows（.exe）、macOS、Linux 三个平台的可执行文件

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** CLI 以后台服务模式运行时，支持 ao-cli service install/start/stop/uninstall 命令

