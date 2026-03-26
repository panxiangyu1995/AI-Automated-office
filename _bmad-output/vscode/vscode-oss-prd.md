# Visual Studio Code - Open Source (Code - OSS) 需求文档

**Author:** Claude Code AI Assistant
**Date:** 2026-03-26
**Version:** 1.0
**Project:** Code - OSS (VSCode 开源版本)
**Code Version Analyzed:** 1.113.0

---

## Executive Summary（执行摘要）

### 功能定位

Code - OSS 是 Microsoft Visual Studio Code 的开源版本，是一个**跨平台代码编辑器与集成开发环境（IDE）**。它融合了轻量级代码编辑器的简洁性与专业开发者所需的完整编辑-构建-调试循环能力，为开发者提供全面的代码编辑、导航、理解支持，以及轻量级调试功能、丰富的扩展性模型和与现有工具的轻量级集成。

### 业务价值

| 价值维度 | 描述 |
|----------|------|
| **降低开发成本** | 开源免费，减少企业软件采购成本 |
| **生态繁荣** | 拥有全球最大的开发者社区和扩展生态系统 |
| **跨平台支持** | Windows、macOS、Linux 全平台覆盖 |
| **高度可扩展** | 开放的扩展 API，支持自定义语言支持、调试器、主题 |
| **性能卓越** | 基于 Electron + Monaco Editor，响应速度快 |

### 目标用户

| 用户群体 | 使用场景 |
|----------|----------|
| **专业软件开发工程师** | 企业级应用开发、DevOps、云计算 |
| **全栈开发者** | 同时处理前端、后端、数据库 |
| **数据科学与机器学习工程师** | Python/Jupyter 支持 |
| **学生与教育工作者** | 编程教学、学习辅助 |
| **开源社区贡献者** | GitHub 集成、代码审查 |
| **DevOps 工程师** | 脚本编写、配置文件编辑 |
| **技术写作者** | Markdown 文档编写 |

### 问题与机遇

**当前痛点：**
- 传统 IDE 启动缓慢、资源消耗大
- 跨平台一致性问题
- 扩展生态碎片化
- 学习曲线陡峭

**市场机遇：**
- 远程开发与云端工作需求增长
- AI 辅助编程集成
- MCP (Model Context Protocol) 支持

### 解决方案

| 设计要点 | 解决的问题 |
|----------|------------|
| **分层架构** | 代码组织清晰，可维护性高 |
| **多进程模型** | 隔离崩溃，提升稳定性 |
| **服务化设计** | 90+ 独立服务，按需加载 |
| **扩展 API 抽象** | 统一的扩展开发接口 |
| ** Monaco Editor 内核** | 轻量级但功能强大的编辑器 |
| **RPC 通信协议** | 进程间高效通信 |

### What Makes This Special

- **微软背书**：Microsoft 官方维护，品质保证
- **功能完备**：内置 Git 集成、调试器、终端、Notebook 支持
- **现代化架构**：依赖注入、服务化设计、Registry 模式
- **AI 集成**：内置 GitHub Copilot 支持（可选）
- **国际化**：完整的 NLS 本地化支持

---

## Project Classification（项目分类）

| 维度 | 分类 |
|------|------|
| **项目类型** | Desktop Application (跨平台代码编辑器/IDE) |
| **领域** | 软件开发工具 / 代码编辑器 |
| **复杂度** | Extremely High（超过 100 万行代码，80+ 功能模块，90+ 内置扩展） |
| **项目上下文** | Brownfield（已有实现，属于微软开源项目） |
| **目标用户** | 全球开发者社区 |
| **技术栈** | TypeScript + Electron + Monaco Editor + Node.js + Rust (CLI) |
| **部署环境** | Windows 10/11, macOS 10.15+, Linux (x64, ARM64) |
| **许可证** | MIT |
| **代码版本** | 1.113.0 |

---

## Success Criteria（成功标准）

### User Success（用户成功）

**用户成功的"Aha时刻"：**

| 场景 | 成功表现 |
|------|----------|
| 首次打开编辑器 | 3 秒内显示编辑界面 |
| 打开大型代码文件 | 流畅滚动，无明显卡顿 |
| 安装扩展 | 一键安装，即时生效 |
| 使用 Git 功能 | 可视化提交、推送、拉取 |
| 调试程序 | 断点命中，变量查看直观 |
| 使用 AI 辅助 | 快速获得代码建议 |

**用户成功指标：**

| 指标 | 目标 |
|------|------|
| 编辑器启动时间 | < 3 秒 |
| 文件打开延迟 | < 500ms（小文件） |
| 扩展激活时间 | < 2 秒 |
| 搜索响应时间 | < 1 秒（1000 文件） |
| 内存占用（空闲） | < 200MB |
| 内存占用（典型使用） | < 500MB |

### Business Success（业务成功）

| 指标 | 目标 |
|------|------|
| GitHub Stars | 持续增长（当前 > 150k） |
| 社区扩展数量 | > 30,000 |
| 月活跃用户 | > 2000 万 |
| Stack Overflow 问题数 | > 100,000 相关问题 |
| 企业采用率 | Fortune 500 企业广泛使用 |

### Technical Success（技术成功）

| 指标 | 目标 |
|------|------|
| 系统可用性 | ≥ 99.9% |
| 页面响应时间 | < 100ms（UI 交互） |
| 扩展 API 兼容性 | 向前兼容 3 个主要版本 |
| 多进程稳定性 | 扩展崩溃不影响主进程 |
| 构建成功率 | CI/CD ≥ 95% |

### Measurable Outcomes（可衡量成果）

| 维度 | 关键指标 | 衡量方式 |
|------|----------|----------|
| **性能** | 启动时间 < 3s | 内部基准测试 |
| **内存** | 空闲 < 200MB | Chrome DevTools |
| **扩展生态** | 30,000+ 扩展 | Marketplace 统计 |
| **用户满意度** | NPS > 50 | 用户调查 |
| **Bug 解决率** | 30 天内 > 80% | GitHub Issues 统计 |

---

## Product Scope（产品范围）

### MVP - Minimum Viable Product（最小可行产品）

**核心功能模块：**

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **编辑器核心** | 文本编辑、多语言语法高亮、代码折叠、格式化 | P0 |
| **文件管理** | 文件树、打开/保存、多标签页 | P0 |
| **搜索系统** | 全局搜索、正则搜索、文件搜索 | P0 |
| **调试器** | 断点调试、变量查看、调用栈 | P0 |
| **终端** | 集成终端、多个终端实例 | P0 |
| **扩展系统** | 扩展安装、管理、API | P0 |
| **设置系统** | 用户设置、工作区设置、键盘快捷键 | P0 |
| **Git 集成** | 源代码控制 UI、提交/推送/拉取 | P0 |
| **主题系统** | 明暗主题、图标主题 | P0 |

### Growth Features（增长功能）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| **Notebook 支持** | Jupyter Notebook 集成 | P1 |
| **Remote Development** | 远程容器、SSH、WSL | P1 |
| **Chat AI 集成** | GitHub Copilot 对话 | P1 |
| **Tasks & Launch** | 任务配置、调试启动配置 | P1 |
| **User Data Sync** | 设置同步到云端 | P2 |
| **MCP 支持** | Model Context Protocol 集成 | P2 |
| **语音输入** | 语音转文字代码输入 | P3 |

### Vision（未来愿景）

| 功能 | 说明 | 状态 |
|------|------|------|
| **AI Native** | 深度 AI 辅助编程集成 | Roadmap |
| **云开发** | Browser-based VSCode | vscode.dev |
| **协作编辑** | 实时多人协作 | 预览阶段 |
| **移动端支持** | iPad/平板适配 | 实验性 |

---

## User Journeys（用户旅程）

### Journey 1: 日常代码编辑

**人物档案**
- **姓名**：张开发
- **角色**：全栈工程师
- **现状**：每天需要在多个项目间切换，处理 JavaScript、Python、Go 代码
- **内心渴望**：统一的编辑体验，快速的启动速度，流畅的代码导航

**旅程叙事**

```
1. 早晨打开电脑 → 启动 VSCode（< 3秒） → 看到上次的工作区自动恢复
2. 打开 JavaScript 项目 → 文件资源管理器显示项目结构
3. 编辑 React 组件 → 语法高亮、智能提示正常工作
4. 需要调试 → F5 启动调试，查看变量值
5. 切换到 Python 后端 → 同一窗口，不同语言服务自动切换
6. 打开集成终端 → 运行测试命令
7. 提交代码 → Git UI 查看变更，提交并推送
```

**旅程需求**
- 快速启动和文件恢复
- 多语言混合项目支持
- 内置调试和终端
- Git 集成

---

### Journey 2: 扩展探索与安装

**人物档案**
- **姓名**：李同学
- **角色**：编程初学者
- **现状**：刚开始学习 Python，需要语法检查和格式化帮助
- **内心渴望**：简单的方式增强编辑器功能，不踩坑

**旅程叙事**

```
1. 初次使用 VSCode → 看到欢迎页面，了解快捷键
2. 打开 Python 文件 → 看到推荐安装 Python 扩展
3. 点击安装 → 一键安装，自动启用
4. 安装 Prettier 扩展 → 代码自动格式化
5. 尝试 Live Share 扩展 → 实时协作编程
6. 发现主题扩展 → 切换到喜欢的主题
```

**旅程需求**
- 智能的扩展推荐
- 一键安装和卸载
- 扩展启用/禁用的便捷管理

---

### Journey 3: Git 协作开发

**人物档案**
- **姓名**：王协作
- **角色**：开源项目贡献者
- **现状**：需要频繁处理 Pull Request，进行代码审查
- **内心渴望**：无缝的 GitHub 集成，减少命令行操作

**旅程叙事**

```
1. 克隆仓库 → 使用 VSCode 打开文件夹
2. 创建新分支 → Git UI 创建 feature 分支
3. 修改代码 → 编辑器内提交（查看差异）
4. 推送分支 → GitHub UI 提示创建 PR
5. 收到 Review → 查看文件变更，在编辑器内讨论
6. 合并冲突 → Merge Editor 可视化解决冲突
7. 合并后 → 删除分支，同步主分支
```

**旅程需求**
- 完整的 Git 工作流 UI
- GitHub PR 集成
- 合并冲突可视化解决

---

### Journey 4: 调试与测试

**人物档案**
- **姓名**：赵测试
- **角色**：测试工程师
- **现状**：需要调试复杂的 Node.js 微服务，查看调用链
- **内心渴望**：强大的调试能力，清晰的变量状态展示

**旅程叙事**

```
1. 配置调试 → launch.json 选择 Node.js
2. 设置断点 → 点击行号设置条件断点
3. 启动调试 → Debug Console 显示启动日志
4. 单步执行 → 查看变量值变化
5. 查看调用栈 → 切换不同的调用帧
6. 调试终端 → 在 Debug Console 执行表达式
7. 附加到进程 → 调试已运行的 Node 进程
```

**旅程需求**
- 丰富的调试配置
- 条件断点和日志断点
- 变量和监视面板

---

### Journey Requirements Summary（旅程需求汇总）

| 能力领域 | 涉及旅程 | 关键功能 |
|----------|----------|----------|
| **编辑体验** | 所有旅程 | 语法高亮、智能提示、代码格式化 |
| **文件管理** | Journey 1, 3 | 多标签页、资源管理器 |
| **调试能力** | Journey 1, 4 | 断点、变量查看、调用栈 |
| **Git 集成** | Journey 1, 3 | 提交、推送、拉取、冲突解决 |
| **扩展系统** | Journey 2 | 安装、管理、API |
| **终端集成** | Journey 1 | 集成终端、多实例 |
| **搜索替换** | Journey 1 | 全局搜索、正则、文件搜索 |

---

## Technical Requirements（技术需求）

### Technical Architecture（技术架构）

#### 多进程架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Process                              │
│  (main.ts - Electron Main)                                       │
│  - 窗口管理                                                       │
│  - 菜单栏                                                         │
│  - 原生对话框                                                     │
│  - 应用生命周期                                                   │
│  - IPC Handler 注册                                               │
└─────────────────────────────────────────────────────────────────┘
                              │ IPC
┌─────────────────────────────────────────────────────────────────┐
│                      Renderer Process                            │
│  (workbench.ts - Electron Renderer)                              │
│  - UI 渲染                                                       │
│  - Monaco Editor                                                 │
│  - 用户交互处理                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │ RPC
┌─────────────────────────────────────────────────────────────────┐
│                    Extension Host Process                        │
│  (extensionHostMain.ts)                                           │
│  - 扩展代码执行                                                   │
│  - 语言服务                                                       │
│  - 调试适配器                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Process                                 │
│  - GPU 进程                                                       │
│  - 日志服务                                                       │
│  - 更新检查                                                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 分层架构

| 层级 | 路径 | 说明 |
|------|------|------|
| **Base Layer** | `src/vs/base/` | 核心工具库：数组、异步、错误处理、事件、字符串、URI |
| **Platform Layer** | `src/vs/platform/` | 平台抽象：90+ 服务模块，提供统一接口 |
| **Workbench Layer** | `src/vs/workbench/` | 工作台：UI 组件、功能模块、服务 |
| **Editor Layer** | `src/vs/editor/` | Monaco Editor：代码编辑核心 |
| **Code Layer** | `src/vs/code/` | 应用入口：各平台特定代码 |
| **Extensions** | `extensions/` | 内置扩展：语言支持、主题、调试器 |

#### 技术选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **主语言** | TypeScript 6.0+ | 类型安全，现代 ES 特性 |
| **运行时** | Node.js + Electron 39 | 跨平台桌面应用框架 |
| **编辑器内核** | Monaco Editor | VS Code 自带编辑器 |
| **终端** | xterm.js + node-pty | 终端模拟器 |
| **构建系统** | Gulp + Vite + esbuild | 高效打包 |
| **测试框架** | Mocha + Playwright + Vitest | 单元测试、端到端测试 |
| **CLI 部分** | Rust | 高性能命令行工具 |
| **扩展 API** | vscode.d.ts (20K+ LOC) | 完整的 TypeScript 类型定义 |

### Performance Targets（性能指标）

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **冷启动时间** | < 3 秒 | 从点击图标到显示编辑界面 |
| **热启动时间** | < 500ms | 工作区已打开的情况下重启 |
| **文件打开延迟** | < 100ms | 小文件（< 100KB） |
| **大文件打开** | < 2 秒 | 1MB 文件 |
| **搜索响应** | < 1 秒 | 1000 文件内搜索 |
| **UI 响应** | < 16ms | 保持 60fps |
| **内存占用（空闲）** | < 200MB | 无打开文件 |
| **内存占用（典型）** | < 500MB | 打开多个文件和扩展 |
| **内存占用（大型）** | < 1GB | 处理大型工作区 |

### Security Requirements（安全要求）

| 安全措施 | 说明 | 实现位置 |
|----------|------|----------|
| **进程隔离** | 扩展在独立进程运行 | Extension Host |
| **Context Bridge** | 安全暴露 API 到渲染进程 | Electron contextBridge |
| **CSP 策略** | 限制脚本执行 | Webview |
| **HTTPS 强制** | Remote 连接使用加密 | remote module |
| **敏感数据保护** | 不记录敏感信息 | Telemetry |
| **扩展签名** | Marketplace 扩展验证 | Extension Gallery |

### Browser/Mobile Support（兼容性要求）

| 平台 | 版本要求 |
|------|----------|
| **Windows** | Windows 10 (1809+), Windows 11 |
| **macOS** | macOS 10.15 (Catalina)+ |
| **Linux** | Ubuntu 18.04+, Debian 10+, Fedora 30+ |
| **架构** | x64, ARM64 |

---

## Functional Requirements（功能需求）

### FR-001: 编辑器核心

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-001.1 | 多语言语法高亮 | P0 |
| FR-001.2 | 智能代码补全（IntelliSense） | P0 |
| FR-001.3 | 代码折叠 | P0 |
| FR-001.4 | 代码格式化（语言特定） | P0 |
| FR-001.5 | 跳转到定义/引用 | P0 |
| FR-001.6 | 查找和替换（支持正则） | P0 |
| FR-001.7 | 多光标编辑 | P0 |
| FR-001.8 | 代码片段（Snippets） | P0 |
| FR-001.9 | 括号匹配和编辑 | P0 |
| FR-001.10 | 缩进 guides | P0 |
| FR-001.11 | 最小地图（Minimap） | P1 |
| FR-001.12 | 渲染行号 | P0 |
| FR-001.13 | 代码操作（Code Actions） | P0 |
| FR-001.14 | 悬停信息（Hover） | P0 |
| FR-001.15 | 参数提示 | P0 |

### FR-002: 文件管理

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-002.1 | 文件资源管理器 | P0 |
| FR-002.2 | 多标签编辑器 | P0 |
| FR-002.3 | 拆分编辑器 | P0 |
| FR-002.4 | 编辑器组（列布局） | P0 |
| FR-002.5 | 拖拽标签页移动 | P0 |
| FR-002.6 | 打开文件/文件夹 | P0 |
| FR-002.7 | 最近打开文件 | P0 |
| FR-002.8 | 文件比较（Diff View） | P0 |
| FR-002.9 | 自动保存 | P1 |
| FR-002.10 | 文件监视（File Watcher） | P0 |
| FR-002.11 | 本地历史（Local History） | P1 |

### FR-003: 工作区与配置

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-003.1 | 工作区（Workspace）概念 | P0 |
| FR-003.2 | 用户设置（settings.json） | P0 |
| FR-003.3 | 工作区设置覆盖 | P0 |
| FR-003.4 | 键盘快捷键自定义 | P0 |
| FR-003.5 | 任务配置（tasks.json） | P0 |
| FR-003.6 | 调试配置（launch.json） | P0 |
| FR-003.7 | 扩展推荐 | P1 |
| FR-003.8 | 用户数据存储 | P0 |
| FR-003.9 | 多工作区切换 | P1 |

### FR-004: 搜索系统

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-004.1 | 全局搜索（Ctrl+Shift+F） | P0 |
| FR-004.2 | 文件搜索（Ctrl+P） | P0 |
| FR-004.3 | 命令面板（Ctrl+Shift+P） | P0 |
| FR-004.4 | 符号搜索（Ctrl+Shift+O） | P0 |
| FR-004.5 | 正则表达式搜索 | P0 |
| FR-004.6 | 搜索结果高亮 | P0 |
| FR-004.7 | 搜索替换 | P0 |
| FR-004.8 | 搜索范围限定 | P1 |
| FR-004.9 | 搜索历史 | P1 |

### FR-005: 调试功能

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-005.1 | 断点（行、条件、函数） | P0 |
| FR-005.2 | 变量检查面板 | P0 |
| FR-005.3 | 调用堆栈面板 | P0 |
| FR-005.4 | 监视（Watch）表达式 | P0 |
| FR-005.5 | 调试控制台 | P0 |
| FR-005.6 | 多线程调试 | P0 |
| FR-005.7 | 远程调试 | P0 |
| FR-005.8 | 调试启动配置 | P0 |
| FR-005.9 | 断点命中计数 | P1 |
| FR-005.10 | 数据断点 | P1 |

### FR-006: 集成终端

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-006.1 | 集成终端面板 | P0 |
| FR-006.2 | 多终端实例 | P0 |
| FR-006.3 | 终端分组 | P1 |
| FR-006.4 | 终端查找 | P1 |
| FR-006.5 | 环境变量配置 | P0 |
| FR-006.6 | 终端外观定制 | P1 |
| FR-006.7 | 连接到远程 | P0 |
| FR-006.8 | 任务中使用终端 | P1 |

### FR-007: Git 集成

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-007.1 | Git 状态显示（源代码管理视图） | P0 |
| FR-007.2 | 变更差异查看 | P0 |
| FR-007.3 | 提交（Commit） | P0 |
| FR-007.4 | 推送/拉取 | P0 |
| FR-007.5 | 分支管理 | P0 |
| FR-007.6 | 远程仓库管理 | P0 |
| FR-007.7 | 合并冲突解决（Merge Editor） | P0 |
| FR-007.8 | Git 历史查看 | P1 |
| FR-007.9 | GitHub PR 集成 | P1 |
| FR-007.10 | 暂存区支持 | P0 |

### FR-008: 扩展系统

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-008.1 | 扩展市场浏览 | P0 |
| FR-008.2 | 扩展安装/卸载 | P0 |
| FR-008.3 | 扩展启用/禁用 | P0 |
| FR-008.4 | 扩展更新检查 | P0 |
| FR-008.5 | 扩展设置 | P0 |
| FR-008.6 | 扩展 API | P0 |
| FR-008.7 | 内置扩展管理 | P0 |
| FR-008.8 | 扩展建议 | P1 |

### FR-009: 主题系统

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-009.1 | 明/暗主题切换 | P0 |
| FR-009.2 | 颜色主题 | P0 |
| FR-009.3 | 文件图标主题 | P1 |
| FR-009.4 | 产品图标主题 | P1 |
| FR-009.5 | 主题同步 | P2 |

### FR-010: 辅助功能

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-010.1 | 屏幕阅读器支持 | P0 |
| FR-010.2 | 键盘导航 | P0 |
| FR-010.3 | 高对比度主题 | P0 |
| FR-010.4 | 语音输入 | P3 |
| FR-010.5 | 辅助功能信号 | P1 |

### FR-011: Remote Development

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-011.1 | Remote - SSH | P1 |
| FR-011.2 | Remote - Containers | P1 |
| FR-011.3 | Remote - WSL | P1 |
| FR-011.4 | Remote Tunnel | P2 |

### FR-012: Notebook 支持

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-012.1 | Notebook 编辑器 | P1 |
| FR-012.2 | Jupyter 集成 | P1 |
| FR-012.3 | Notebook 输出渲染 | P1 |
| FR-012.4 | Notebook 调试 | P2 |

### FR-013: AI 集成

| 编号 | 功能描述 | 优先级 |
|------|----------|--------|
| FR-013.1 | GitHub Copilot 补全 | P1 |
| FR-013.2 | Inline Chat | P1 |
| FR-013.3 | Chat View | P1 |
| FR-013.4 | MCP 支持 | P2 |

---

## Non-Functional Requirements（非功能需求）

### Performance（性能）

| 编号 | 需求 | 指标 | 优先级 |
|------|------|------|--------|
| NFR-001 | 冷启动时间 | < 3 秒 | P0 |
| NFR-002 | 热启动时间 | < 500ms | P0 |
| NFR-003 | 文件打开延迟 | < 100ms（小文件） | P0 |
| NFR-004 | 搜索响应时间 | < 1 秒 | P0 |
| NFR-005 | UI 响应帧率 | ≥ 60fps | P0 |
| NFR-006 | 内存占用（空闲） | < 200MB | P0 |
| NFR-007 | 内存占用（典型） | < 500MB | P1 |
| NFR-008 | 扩展激活时间 | < 2 秒 | P1 |

### Security（安全）

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| NFR-009 | 进程隔离 | 扩展崩溃不影响主进程 | P0 |
| NFR-010 | Context Bridge | 安全 IPC 通信 | P0 |
| NFR-011 | CSP 策略 | 限制 XSS 攻击 | P0 |
| NFR-012 | 敏感数据保护 | 不记录令牌等敏感信息 | P0 |
| NFR-013 | 扩展签名验证 | Marketplace 扩展验证 | P1 |

### Reliability（可靠性）

| 编号 | 需求 | 指标 | 优先级 |
|------|------|------|--------|
| NFR-014 | 系统可用性 | ≥ 99.9% | P0 |
| NFR-015 | 崩溃恢复 | 自动恢复工作区 | P0 |
| NFR-016 | 文件自动保存 | 防止数据丢失 | P1 |
| NFR-017 | 扩展兼容性 | 向前兼容 3 个版本 | P0 |

### Accessibility（无障碍）

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| NFR-018 | WCAG 合规 | 符合 WCAG 2.1 AA | P0 |
| NFR-019 | 屏幕阅读器支持 | NVDA、JAWS、VoiceOver | P0 |
| NFR-020 | 键盘完全可操作 | 无鼠标操作 | P0 |
| NFR-021 | 高对比度主题 | 辅助视力用户 | P0 |

### Maintainability（可维护性）

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| NFR-022 | 代码模块化 | 分层清晰，依赖注入 | P0 |
| NFR-023 | 扩展 API 版本管理 | 语义化版本控制 | P0 |
| NFR-024 | 日志系统 | 完整日志记录 | P0 |
| NFR-025 | 更新机制 | 自动检查和应用更新 | P0 |

### Compatibility（兼容性）

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| NFR-026 | 扩展 API 兼容 | 旧扩展在新版本可运行 | P0 |
| NFR-027 | 设置迁移 | 从旧版本迁移设置 | P0 |
| NFR-028 | 键盘快捷键冲突检测 | 提示快捷键冲突 | P1 |

### Localization（国际化）

| 编号 | 需求 | 说明 | 优先级 |
|------|------|------|--------|
| NFR-029 | NLS 支持 | 完整的国际化资源 | P0 |
| NFR-030 | 语言切换 | 运行时切换界面语言 | P0 |
| NFR-031 | RTL 支持 | 从右到左语言支持 | P2 |

---

## Appendix（附录）

### A. 相关文件列表

#### 核心源代码

| 文件路径 | 说明 | 行数 |
|----------|------|------|
| `src/main.ts` | Electron 主进程入口 | ~200 |
| `src/vs/workbench/browser/layout.ts` | 工作台布局管理 | ~2700 |
| `src/vs/workbench/workbench.ts` | 工作台主类 | ~350 |
| `src/vs/workbench/workbench.common.main.ts` | 工作台通用模块 | - |
| `src/vs/workbench/workbench.desktop.main.ts` | 桌面工作台入口 | - |
| `src/vs/editor/editor.main.ts` | Monaco 编辑器入口 | - |
| `src/vs/platform/instantiation/instantiationService.ts` | 依赖注入服务 | ~400 |
| `src/vs/workbench/api/common/extensionHostMain.ts` | 扩展主机入口 | ~240 |

#### 平台服务（部分）

| 文件路径 | 说明 |
|----------|------|
| `src/vs/platform/commands/common/commands.ts` | 命令服务 |
| `src/vs/platform/configuration/common/configuration.ts` | 配置服务 |
| `src/vs/platform/files/common/files.ts` | 文件服务 |
| `src/vs/platform/contextkey/common/contextkeys.ts` | 上下文键服务 |
| `src/vs/platform/keybinding/common/keybinding.ts` | 键绑定服务 |
| `src/vs/platform/notification/common/notification.ts` | 通知服务 |
| `src/vs/platform/extensionManagement/common/extensionManagement.ts` | 扩展管理服务 |
| `src/vs/platform/telemetry/common/telemetry.ts` | 遥测服务 |
| `src/vs/platform/theme/common/theme.ts` | 主题服务 |
| `src/vs/platform/window/common/window.ts` | 窗口服务 |
| `src/vs/platform/workspace/common/workspace.ts` | 工作区服务 |

#### 工作台贡献（部分）

| 文件路径 | 说明 |
|----------|------|
| `src/vs/workbench/contrib/files/browser/fileActions.ts` | 文件操作 |
| `src/vs/workbench/contrib/files/browser/fileExplorer.ts` | 文件资源管理器 |
| `src/vs/workbench/contrib/debug/browser/debugView.ts` | 调试视图 |
| `src/vs/workbench/contrib/git/browser/gitView.ts` | Git 视图 |
| `src/vs/workbench/contrib/search/browser/searchView.ts` | 搜索视图 |
| `src/vs/workbench/contrib/terminal/browser/terminal.ts` | 终端 |
| `src/vs/workbench/contrib/chat/browser/chatView.ts` | 聊天视图 |
| `src/vs/workbench/contrib/notebook/browser/notebook.ts` | Notebook |
| `src/vs/workbench/contrib/preferences/browser/settings.ts` | 设置 |

#### UI Parts

| 文件路径 | 说明 |
|----------|------|
| `src/vs/workbench/browser/parts/sidebar/sidebarPart.ts` | 侧边栏 |
| `src/vs/workbench/browser/parts/panel/panelPart.ts` | 面板 |
| `src/vs/workbench/browser/parts/editor/editorPart.ts` | 编辑器区 |
| `src/vs/workbench/browser/parts/activitybar/activityBarPart.ts` | 活动栏 |
| `src/vs/workbench/browser/parts/statusbar/statusBarPart.ts` | 状态栏 |
| `src/vs/workbench/browser/parts/titlebar/titleBarPart.ts` | 标题栏 |

#### 扩展 API

| 文件路径 | 说明 | 行数 |
|----------|------|------|
| `src/vscode-dts/vscode.d.ts` | 扩展 API 类型定义 | ~20000 |
| `src/vs/workbench/api/common/extHost.api.impl.ts` | 扩展 API 实现 | ~2500 |
| `src/vs/workbench/api/common/extHost.protocol.ts` | 扩展通信协议 | ~4000 |

---

### B. 扩展 API 命名空间

```typescript
// 核心命名空间
namespace vscode {
    namespace workspace {
        // 工作区、文档、文件夹
    }
    namespace window {
        // 编辑器、快速拾取、对话框
    }
    namespace commands {
        // 命令注册和执行
    }
    namespace extensions {
        // 扩展管理
    }
    namespace languages {
        // 语言服务
    }
    namespace debug {
        // 调试
    }
    namespace scm {
        // 源代码管理
    }
    namespace chat {
        // AI 聊天
    }
    namespace notebooks {
        // Notebook
    }
    namespace tasks {
        // 任务
    }
    namespace terminal {
        // 终端
    }
    namespace.workspace.onDidOpenTextDocument
    namespace.workspace.onDidChangeTextDocument
    namespace.workspace.onDidSaveTextDocument
    namespace.workspace.onDidCloseTextDocument
}
```

---

### C. 内置扩展列表

#### 语言扩展（40+）

| 扩展名 | 语言 | 说明 |
|--------|------|------|
| `typescript` | TypeScript/JavaScript | TypeScript 语言支持 |
| `javascript` | JavaScript | JavaScript 基础支持 |
| `python` | Python | Python 语言支持 |
| `java` | Java | Java 语言支持 |
| `cpp` | C/C++ | C/C++ 语言支持 |
| `csharp` | C# | C# 语言支持 |
| `rust` | Rust | Rust 语言支持 |
| `go` | Go | Go 语言支持 |
| `php` | PHP | PHP 语言支持 |
| `ruby` | Ruby | Ruby 语言支持 |
| `swift` | Swift | Swift 语言支持 |
| `kotlin` | Kotlin | Kotlin 语言支持 |
| `scala` | Scala | Scala 语言支持 |
| `html` | HTML | HTML 语言支持 |
| `css` | CSS/LESS/SCSS | 样式表支持 |
| `json` | JSON | JSON 语言支持 |
| `xml` | XML | XML 语言支持 |
| `yaml` | YAML | YAML 语言支持 |
| `markdown` | Markdown | Markdown 支持 |
| `latex` | LaTeX | LaTeX 支持 |
| `lua` | Lua | Lua 语言支持 |
| `perl` | Perl | Perl 语言支持 |
| `powershell` | PowerShell | PowerShell 支持 |
| `r` | R | R 语言支持 |
| `clojure` | Clojure | Clojure 语言支持 |
| `coffeescript` | CoffeeScript | CoffeeScript 支持 |
| `fsharp` | F# | F# 语言支持 |
| `go` | Go | Go 语言支持 |
| `groovy` | Groovy | Groovy 语言支持 |
| `haskell` | Haskell | Haskell 语言支持 |
| `ini` | INI | INI 文件支持 |
| `julia` | Julia | Julia 语言支持 |
| `less` | Less | Less CSS 支持 |
| `log` | Log | 日志文件支持 |
| `make` | Makefile | Makefile 支持 |
| `objective-c` | Objective-C | Objective-C 支持 |
| `sql` | SQL | SQL 语言支持 |
| `shell` | Shell | Bash/Shell 支持 |
| `bat` | Batch | Batch 文件支持 |
| `docker` | Dockerfile | Docker 支持 |
| `npm` | package.json | NPM 支持 |

#### 主题扩展（10+）

| 扩展名 | 说明 |
|--------|------|
| `theme-defaults` | 默认明暗主题 |
| `theme-abyss` | Abyss 主题 |
| `theme-monokai` | Monokai 主题 |
| `theme-quietlight` | Quiet Light 主题 |
| `theme-solarized-dark` | Solarized Dark 主题 |
| `theme-solarized-light` | Solarized Light 主题 |
| `theme-kimbie-dark` | Kimbie Dark 主题 |

#### 调试扩展

| 扩展名 | 说明 |
|--------|------|
| `debug-auto-launch` | 自动启动调试适配器 |
| `debug-server-ready` | 服务器就绪时自动附加调试器 |

#### 工具扩展

| 扩展名 | 说明 |
|--------|------|
| `git` | Git 集成 |
| `git-base` | Git 基础功能 |
| `github` | GitHub 集成 |
| `github-authentication` | GitHub 认证 |
| `merge-conflict` | 合并冲突标记 |
| `emmet` | Emmet 缩写支持 |
| `json-language-features` | JSON 语言功能 |
| `typescript-language-features` | TypeScript 语言功能 |
| `html-language-features` | HTML 语言功能 |
| `css-language-features` | CSS 语言功能 |
| `markdown-language-features` | Markdown 语言功能 |

---

### D. UI 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Title Bar                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [File] [Edit] [View] [Go] [Run] [Terminal] [Help]           ││
│  └─────────────────────────────────────────────────────────────┘│
├──────┬───────────────────────────────────────────────┬──────────┤
│      │                                               │          │
│  A   │              Editor Area                      │Auxiliary │
│  c   │  ┌─────────────────────────────────────────┐  │  Bar     │
│  t   │  │ Tab1 │ Tab2 │ Tab3 │                    │  │          │
│  i   │  ├─────────────────────────────────────────┤  │ (Git     │
│  v   │  │                                         │  │  Graph,  │
│  i   │  │         Monaco Editor                   │  │  Outline,│
│  t   │  │                                         │  │  History)│
│  y   │  │                                         │  │          │
│      │  │                                         │  │          │
│  B   │  └─────────────────────────────────────────┘  │          │
│  a   │  ┌─────────────────────────────────────────┐  │          │
│  r   │  │ Minimap                                 │  │          │
│      │  └─────────────────────────────────────────┘  │          │
├──────┼───────────────────────────────────────────────┼──────────┤
│      │              Panel                            │          │
│  S   │  ┌─────────────────────────────────────────┐  │          │
│  i   │  │ [Terminal] [Problems] [Output] [Debug]  │  │          │
│  d   │  ├─────────────────────────────────────────┤  │          │
│  e   │  │                                         │  │          │
│  b   │  │  Terminal / Problems / Output          │  │          │
│  a   │  │                                         │  │          │
│  r   │  └─────────────────────────────────────────┘  │          │
├──────┴───────────────────────────────────────────────┴──────────┤
│                        Status Bar                                │
│  [branch: main] [Ln 42, Col 8] [Spaces: 4] [UTF-8] [Markdown]  │
└─────────────────────────────────────────────────────────────────┘
```

---

### E. 工作台 Parts（UI 区域）

```typescript
enum Parts {
    TITLEBAR_PART = 'workbench.parts.titlebar',      // 标题栏
    BANNER_PART = 'workbench.parts.banner',          // 横幅
    ACTIVITYBAR_PART = 'workbench.parts.activitybar', // 活动栏
    SIDEBAR_PART = 'workbench.parts.sidebar',       // 侧边栏
    PANEL_PART = 'workbench.parts.panel',           // 面板
    AUXILIARYBAR_PART = 'workbench.parts.auxiliarybar', // 辅助栏
    CHATBAR_PART = 'workbench.parts.chatbar',       // 聊天栏
    EDITOR_PART = 'workbench.parts.editor',         // 编辑器
    STATUSBAR_PART = 'workbench.parts.statusbar',   // 状态栏
}
```

---

### F. IPC 通信协议

```typescript
// MainContext - 主进程暴露的 API
interface MainContext {
    MainThreadCommands: IMainThreadCommands;
    MainThreadConfiguration: IMainThreadConfiguration;
    MainThreadDiagnostics: IMainThreadDiagnostics;
    MainThreadDialogOpen: IMainThreadDialogOpen;
    MainThreadEditor: IMainThreadEditor;
    MainThreadEditorTabs: IMainThreadEditorTabs;
    MainThreadEnvironment: IMainThreadEnvironment;
    MainThreadErrorReporting: IMainThreadErrorReporting;
    MainThreadEval: IMainThreadEval;
    MainThreadExtensionService: IMainThreadExtensionService;
    MainThreadExtensionHostDebugBroadcast: IMainThreadExtensionHostDebugBroadcast;
    MainThreadFileSystem: IMainThreadFileSystem;
    MainThreadFileSystemEventService: IMainThreadFileSystemEventService;
    MainThreadLanguages: IMainThreadLanguages;
    MainThreadLog: IMainThreadLog;
    MainThreadQuickDiff: IMainThreadQuickDiff;
    MainThreadSCM: IMainThreadSCM;
    MainThreadSearch: IMainThreadSearch;
    MainThreadStorage: IMainThreadStorage;
    MainThreadTask: IMainThreadTask;
    MainThreadTerminalService: IMainThreadTerminalService;
    MainThreadThreadService: IMainThreadThreadService;
    MainThreadTimeline: IMainThreadTimeline;
    MainThreadWindow: IMainThreadWindow;
    MainThreadWindowProgress: IMainThreadWindowProgress;
    MainThreadWorkspace: IMainThreadWorkspace;
    // ... 80+ main thread 接口
}
```

---

### G. 服务注册与依赖注入

```typescript
// 注册服务
export const IFileService = createDecorator<IFileService>('fileService');
export const IEditorService = createDecorator<IEditorService>('editorService');
export const IConfigurationService = createDecorator<IConfigurationService>('configurationService');
export const IExtensionService = createDecorator<IExtensionService>('extensionService');
export const IWorkspaceService = createDecorator<IWorkspaceService>('workspaceService');
// ... 90+ 服务装饰器

// 使用服务
class MyClass {
    constructor(
        @IFileService private readonly fileService: IFileService,
        @IEditorService private readonly editorService: IEditorService
    ) {}
}
```

---

### H. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2026-03-26 | 初始 PRD 文档创建 |
| - | - | 分析 Code - OSS v1.113.0 |
| - | - | 涵盖全部 80+ 工作台贡献模块 |
| - | - | 涵盖全部 90+ 内置扩展 |
| - | - | 完整功能需求、技术架构分析 |

---

### I. 数据流与业务流程

#### 文件打开流程

```
用户操作 (Ctrl+O)
    ↓
FileDialogService.pickFile()
    ↓
IFileService.resolveFile()
    ↓
ITextFileService.open()
    ↓
IEditorService.openEditor()
    ↓
EditorPart.createEditor()
    ↓
MonacoEditor.create()
    ↓
IInstantiationService.run()
```

#### 扩展激活流程

```
ExtensionHostMain.start()
    ↓
ExtensionService.activateByEvent()
    ↓
ExtensionHostManager.activateExtension()
    ↓
loadExtensionManifest()
    ↓
fork extension host process
    ↓
extension.main activate()
    ↓
extHostAPI.update()
```

---

### J. 配置设置示例

```json
{
    "editor.fontSize": 14,
    "editor.fontFamily": "Consolas, 'Courier New', monospace",
    "editor.tabSize": 4,
    "editor.insertSpaces": true,
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "terminal.integrated.fontSize": 14,
    "workbench.colorTheme": "Default Dark+",
    "git.autofetch": true,
    "extensions.autoUpdate": true
}
```

---

### K. 命令 Palette 示例

| 命令 ID | 说明 | 快捷键 |
|---------|------|--------|
| `workbench.action.files.newUntitledFile` | 新建文件 | Ctrl+N |
| `workbench.action.files.openFile` | 打开文件 | Ctrl+O |
| `workbench.action.files.save` | 保存 | Ctrl+S |
| `workbench.action.files.saveAll` | 全部保存 | Ctrl+Shift+S |
| `workbench.action.edit.undo` | 撤销 | Ctrl+Z |
| `workbench.action.edit.redo` | 重做 | Ctrl+Shift+Z |
| `workbench.action.find.run` | 查找 | Ctrl+F |
| `workbench.action.find.replace` | 替换 | Ctrl+H |
| `workbench.action.goto Symbol` | 转到符号 | Ctrl+Shift+O |
| `workbench.action.openSettings` | 打开设置 | Ctrl+, |
| `workbench.action.openCommandPalette` | 命令面板 | Ctrl+Shift+P |
| `workbench.action.debug.start` | 开始调试 | F5 |
| `workbench.action.debug.stop` | 停止调试 | Shift+F5 |
| `workbench.action.terminal.toggleTerminal` | 切换终端 | Ctrl+`` |

---

### L. 关键贡献者扩展点

```typescript
// 编辑器贡献
Extensions.EditorProgress;

// 命令贡献
MenuRegistryCommandsMenu;

// 编辑器贡献
EditorPaneRegistry.registerEditorPane();

// 语言贡献
LanguageServiceRegistry.registerLanguage();

// 调试贡献
DebugConfigurationRegistry.registerConfiguration();

// 主题贡献
ColorThemeRegistry.registerColorTheme();
IconThemeRegistry.registerIconTheme();

// 工作区贡献
ConfigurationRegistry.registerConfiguration();

// 视图贡献
ViewsRegistry.registerView;

// 扩展贡献
ExtensionViewletViewDescriptorRegistry.registerViewDescriptor;
```

---

*本文档由 Claude Code AI 辅助生成，基于 Code - OSS v1.113.0 源代码分析*

**文档版本：** 1.0
**生成日期：** 2026-03-26
