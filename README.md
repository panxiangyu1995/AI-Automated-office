# AI-Automated-office

AI 赋能的企业 ERP 系统，采用部门化架构设计，每个部门都有专属 AI 助手。

## 技术栈

- **桌面端**: Tauri 2.0 + Rust
- **前端**: React 18 + TypeScript + Vite
- **UI**: Shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **图标**: Lucide React

## 开发环境要求

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.70
- Tauri CLI 2.0

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 或使用初始化脚本
./init.sh
```

### 开发模式

```bash
# 启动前端开发服务器
pnpm dev

# 启动 Tauri 开发模式（桌面应用）
pnpm tauri:dev
```

### 构建

```bash
# 构建前端
pnpm build

# 构建桌面应用
pnpm tauri:build
```

### 代码检查

```bash
# ESLint 检查
pnpm lint

# TypeScript 类型检查
npx tsc --noEmit
```

## 项目结构

```
ai-automated-office/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   ├── features/           # 功能模块
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand 状态管理
│   ├── lib/                # 工具函数和服务
│   ├── types/              # TypeScript 类型定义
│   └── styles/             # 全局样式
│
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令
│   │   └── utils/          # 工具函数
│   └── tauri.conf.json     # Tauri 配置
│
└── openspec/               # OpenSpec 变更管理
```

## 组件说明

- TopBar：顶部菜单栏与布局控制按钮
- ActivityBar：左侧活动栏入口
- Sidebar：可折叠侧边栏
- Workbench：主工作区内容容器
- AiChatPanel：AI 对话辅助侧栏
- StatusBar：底部状态栏

## 快捷键

- Ctrl+Shift+M / Cmd+Shift+M：切换顶部菜单栏
- Ctrl+B / Cmd+B：切换左侧栏
- Ctrl+Shift+I / Cmd+Shift+I：切换 AI Chat Panel

## 环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
VITE_APP_ENV=development
```

## 许可证

MIT
