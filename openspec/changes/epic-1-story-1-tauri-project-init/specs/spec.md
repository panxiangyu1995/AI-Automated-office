# Specification: Tauri桌面应用初始化

## 需求来源

### PRD 需求
- **FR1**: 用户可以通过桌面应用登录系统
- **FR5**: 用户可以在离线状态下使用本地功能
- **FR8**: 用户可以在后台运行时保持应用活动状态

### 架构约束
- **ADR-001**: 采用分层微内核架构
- **ADR-002**: 插件作为模块化组件同进程运行，通过依赖注入和事件总线通信

### UX 规范
- **UX-01**: 核心框架使用 React + TypeScript
- **UX-04**: 即时价值原则 - 打开就有用，第一眼就震撼

## 功能规格

### 用户故事
As a 开发者,
I want 创建基于 Tauri 的桌面应用基础框架,
So that 应用可以在 Windows 和 macOS 上运行。

### 验收场景

#### Scenario 1: 项目初始化成功
- **GIVEN** 开发环境已配置（Node.js 18+, Rust 1.70+）
- **WHEN** 执行 `pnpm create tauri-app` 或运行 `init.sh`
- **THEN** 生成标准的项目结构
- **AND** 包含 React + TypeScript 前端框架
- **AND** 包含 Rust 后端核心
- **AND** 包含所有必要的配置文件

#### Scenario 2: 应用启动成功
- **GIVEN** 项目已初始化
- **WHEN** 用户执行 `pnpm tauri dev`
- **THEN** 应用启动并显示窗口
- **AND** 窗口标题为 "AI-Automated-office"
- **AND** 窗口尺寸为 1280x800
- **AND** 加载时间 < 3 秒

#### Scenario 3: 内存占用符合要求
- **GIVEN** 应用已启动并处于空闲状态
- **WHEN** 检查内存占用
- **THEN** 内存占用 < 500MB
- **AND** CPU 占用 < 10%

#### Scenario 4: 前端开发服务器正常
- **GIVEN** 执行 `pnpm dev`
- **WHEN** 开发服务器启动
- **THEN** 服务器运行在 localhost:1420
- **AND** HMR 正常工作
- **AND** TypeScript 编译无错误

#### Scenario 5: Rust 后端编译成功
- **GIVEN** Rust 工具链已安装
- **WHEN** 执行 `cargo build`
- **THEN** Rust 后端编译成功
- **AND** 无编译警告（除第三方库）
- **AND** 生成可执行文件

## 数据规格

### 输入
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| 应用名称 | string | 是 | 非空，仅字母数字 |
| 应用版本 | string | 是 | 语义化版本格式 |
| 开发端口 | number | 否 | 1024-65535，默认 1420 |

### 输出
| 字段 | 类型 | 描述 |
|------|------|------|
| 项目目录 | directory | 完整的项目结构 |
| 配置文件 | file | 所有必要的配置文件 |
| 可执行文件 | binary | 编译后的应用 |

## 边界条件

- Windows 10/11（64位）
- macOS 11.0+（Intel/M系列芯片）
- 最低 4GB RAM
- 最低双核 CPU
- 最低 10GB 存储空间

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| E001 | Node.js 版本过低 | 提示用户升级到 Node.js 18+ |
| E002 | Rust 未安装 | 提示用户安装 Rust 工具链 |
| E003 | pnpm 未安装 | 提示用户安装 pnpm |
| E004 | 端口被占用 | 自动尝试下一个可用端口 |
| E005 | 依赖安装失败 | 提示用户检查网络连接 |

## 依赖要求

### 开发环境
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Rust >= 1.70.0
- Windows: Visual Studio Build Tools
- macOS: Xcode Command Line Tools

### 运行时
- 无额外运行时依赖（Tauri 自包含）
