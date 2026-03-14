# Proposal: Tauri桌面应用初始化

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

AI-Automated-office 是一款 AI 赋能的 ERP 系统，需要作为桌面应用运行以提供本地硬件设备调用、离线功能等能力。选择 Tauri 作为桌面应用框架，因为它相比 Electron 具有更小的包体积、更低的内存占用和更好的安全性。

## 目标

创建一个可运行的 Tauri 2.0 项目脚手架，包含：
- 完整的前端框架（React + TypeScript + Vite）
- Rust 后端核心结构
- 基础配置文件
- 开发环境脚本

## 范围

### 包含
- Tauri 2.0 项目初始化
- React 18 + TypeScript 前端框架
- Vite 构建工具配置
- Tailwind CSS 样式框架
- Shadcn/ui 组件库集成
- Rust 后端目录结构
- 基础 Tauri 配置（窗口、安全策略）
- 开发环境脚本（init.sh）

### 不包含
- 用户界面开发（后续 Story）
- 业务逻辑实现
- 数据库集成
- AI Agent 功能

## 影响范围

### 前端
- 创建完整的前端项目结构
- 配置 Vite + React + TypeScript
- 集成 Shadcn/ui 和 Tailwind CSS

### 后端（Tauri/Rust）
- 创建 Rust 项目结构
- 配置 Tauri 命令和事件
- 设置模块化架构基础

### 数据库
- 无（本 Story 不涉及数据库）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Tauri 2.0 API 变更 | 中 | 高 | 锁定版本，关注官方迁移指南 |
| Windows/macOS 兼容性问题 | 低 | 高 | CI/CD 中配置双平台测试 |
| 依赖版本冲突 | 中 | 中 | 使用 pnpm 锁定依赖版本 |

## 依赖

- **前置依赖**: 无
- **后置依赖**: Story 1.2-1.9 均依赖此 Story

## 技术决策

1. **Tauri 版本**: 使用 Tauri 2.0（最新稳定版）
2. **前端框架**: React 18 + TypeScript
3. **构建工具**: Vite（快速 HMR）
4. **包管理器**: pnpm（节省磁盘空间）
5. **组件库**: Shadcn/ui（可复制、可修改）
6. **样式方案**: Tailwind CSS
