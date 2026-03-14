# Epic 1, Story 1.1: Tauri桌面应用初始化

## 概述

创建基于 Tauri 的桌面应用基础框架，使应用可以在 Windows 和 macOS 上运行。这是整个项目的基础设施 Story，所有后续功能都依赖此框架。

## 铁律映射

### PRD 需求
- **FRs**: FR1（用户可以通过桌面应用登录系统）, FR5（用户可以在离线状态下使用本地功能）, FR8（用户可以在后台运行时保持应用活动状态）
- **NFRs**: NFR1（本地操作响应时间<100ms）, NFR5（客户端内存占用<500MB）, NFR6（客户端CPU占用<10%）, NFR36（Windows 10/11支持）, NFR37（macOS 11.0+支持）, NFR38（最低硬件配置）

### 架构需求
- **ADR-001**: 采用分层微内核架构
- **ADR-002**: 插件作为模块化组件同进程运行，通过依赖注入和事件总线通信

### UX 需求
- **UX-01**: React + TypeScript 核心框架
- **UX-04**: 即时价值原则 - 打开就有用

## 验收标准

### AC1: 项目结构生成
- **Given** 开发环境已配置
- **When** 初始化 Tauri 项目
- **Then** 生成标准的项目结构
- **And** 支持 React + TypeScript 前端框架
- **And** 集成 Rust 后端核心

### AC2: 应用启动性能
- **Given** 应用启动
- **When** 用户双击应用图标
- **Then** 显示应用启动界面
- **And** 加载时间 < 3秒
- **And** 内存占用 < 500MB（空闲状态）

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic: `_bmad-output/planning-artifacts/epics.md`
