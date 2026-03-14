# Tasks: Tauri桌面应用初始化

## 任务列表

### 任务 1: 创建 Tauri 项目
- **描述**: 使用 `pnpm create tauri-app` 创建基础项目结构
- **文件**: 根目录所有配置文件
- **验收**: 项目可以通过 `pnpm tauri dev` 启动
- **状态**: ✅ 已完成

### 任务 2: 配置前端框架
- **描述**: 安装并配置 React + TypeScript + Vite
- **文件**: `package.json`, `tsconfig.json`, `vite.config.ts`
- **验收**: TypeScript 编译无错误，Vite HMR 正常工作
- **状态**: ✅ 已完成

### 任务 3: 集成 Tailwind CSS
- **描述**: 安装并配置 Tailwind CSS 和 PostCSS
- **文件**: `tailwind.config.js`, `postcss.config.js`, `src/styles/globals.css`
- **验收**: Tailwind 类名正常生效
- **状态**: ✅ 已完成

### 任务 4: 集成 Shadcn/ui
- **描述**: 安装并初始化 Shadcn/ui 组件库
- **文件**: `components.json`, `src/lib/utils.ts`, `src/components/ui/`
- **验收**: 可以添加和使用 Shadcn/ui 组件
- **状态**: ✅ 已完成

### 任务 5: 创建 Rust 后端结构
- **描述**: 创建模块化的 Rust 项目结构
- **文件**: `src-tauri/src/` 下各模块目录
- **验收**: Rust 编译无错误，项目结构清晰
- **状态**: ✅ 已完成

### 任务 6: 配置 Tauri 窗口
- **描述**: 配置应用窗口属性（尺寸、标题、图标等）
- **文件**: `src-tauri/tauri.conf.json`
- **验收**: 应用窗口按配置显示
- **状态**: ✅ 已完成

### 任务 7: 创建初始化脚本
- **描述**: 创建 `init.sh` 脚本自动安装依赖和启动开发服务器
- **文件**: `init.sh`
- **验收**: 执行脚本后项目可正常运行
- **状态**: ✅ 已完成

### 任务 8: 创建基础组件
- **描述**: 创建根组件和应用入口
- **文件**: `src/App.tsx`, `src/main.tsx`
- **验收**: 应用正常渲染
- **状态**: ✅ 已完成

### 任务 9: 配置环境变量
- **描述**: 创建环境变量模板文件
- **文件**: `.env.example`
- **验收**: 环境变量可正常读取
- **状态**: ✅ 已完成

### 任务 10: 创建基础文档
- **描述**: 创建 README.md 和开发指南
- **文件**: `README.md`
- **验收**: 文档清晰说明项目启动方式
- **状态**: ✅ 已完成

## 执行顺序

1. 任务 1（创建 Tauri 项目）
2. 任务 2（配置前端框架）→ 任务 3（集成 Tailwind CSS）
3. 任务 4（集成 Shadcn/ui）
4. 任务 5（创建 Rust 后端结构）
5. 任务 6（配置 Tauri 窗口）
6. 任务 7（创建初始化脚本）
7. 任务 8（创建基础组件）
8. 任务 9（配置环境变量）
9. 任务 10（创建基础文档）

## 测试要点

- [x] `pnpm install` 安装依赖成功
- [x] `pnpm dev` 前端开发服务器启动成功
- [x] `pnpm tauri dev` Tauri 开发模式启动成功
- [x] 应用窗口正常显示
- [x] TypeScript 编译无错误
- [x] Rust 编译无错误
- [x] Tailwind CSS 样式正常生效
- [x] Shadcn/ui 组件可正常使用
- [x] 启动时间 < 3 秒（Vite 451ms）
- [x] 空闲状态内存占用 < 500MB（约 28MB）