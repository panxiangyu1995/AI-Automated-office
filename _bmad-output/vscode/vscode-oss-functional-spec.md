# Visual Studio Code - Open Source 功能需求详述

**Author:** Claude Code AI Assistant
**Date:** 2026-03-26
**Version:** 1.0
**Related PRD:** vscode-oss-prd.md

---

## FR-001: 编辑器核心功能

### FR-001.1 多语言语法高亮

**描述：** 支持 100+ 编程语言的语法高亮

**实现方式：**
- TextMate 语法定义（`.tmLanguage.json`）
- Tree-sitter 高性能语法解析（部分语言）

**支持的语言类别：**

| 类别 | 语言数量 | 示例 |
|------|----------|------|
| 主流编程语言 | 20+ | JavaScript, TypeScript, Python, Java, C#, Go, Rust |
| Web 技术 | 10+ | HTML, CSS, SCSS, Less, SASS |
| 系统语言 | 15+ | C, C++, Objective-C, Swift, Kotlin |
| 脚本语言 | 15+ | Bash, PowerShell, Ruby, Perl, PHP |
| 函数式语言 | 10+ | Haskell, Clojure, F#, Elixir, Erlang |
| 数据格式 | 10+ | JSON, XML, YAML, TOML, INI |
| 科学计算 | 5+ | R, Julia, MATLAB, Scala |
| 其他 | 20+ | Makefile, Docker, Git, SQL, LaTeX |

---

### FR-001.2 智能代码补全（IntelliSense）

**描述：** 提供上下文感知的代码补全建议

**功能规格：**

| 功能 | 说明 | 触发方式 |
|------|------|----------|
| 基本补全 | 单词、标识符补全 | 自动 |
| 片段补全 | 代码片段模板 | Tab |
| 方法签名 | 函数签名和参数提示 | Ctrl+Space |
| 类型推断 | 基于 TypeScript 引擎的类型推断 | 自动 |
| 模块补全 | import/require 自动完成 | 自动 |
| 路径补全 | 文件路径自动完成 | 自动 |
| 建议模式 | 仅显示建议，不自动插入 | 手动选择 |

---

### FR-001.3 代码折叠

**描述：** 支持可折叠的代码区域

**折叠区域类型：**

| 区域类型 | 说明 | 触发 |
|----------|------|------|
| 缩进区域 | 基于缩进级别的折叠 | 自动 |
| 注释块 | `/* */` 和 `///` 注释 | 自动 |
| #region | 预处理器区域标记 | 自动 |
| 函数/方法 | 函数定义折叠 | 自动 |
| 类定义 | 类定义折叠 | 自动 |
| Import 区域 | import 语句折叠 | 自动 |
| 控制流 | if/switch/for 等块 | 自动 |

---

### FR-001.4 代码格式化

**支持的语言格式化器：**

| 语言 | 默认格式化器 | 格式化命令 |
|------|-------------|------------|
| JavaScript/TypeScript | TypeScript | Shift+Alt+F |
| Python | pylint 或 Black | Alt+Shift+F |
| HTML | 内置 | Shift+Alt+F |
| CSS | 内置 | Shift+Alt+F |
| JSON | 内置 | Shift+Alt+F |
| Go | gofmt | Shift+Alt+F |
| Rust | rustfmt | Shift+Alt+F |
| C# | OmniSharp | Shift+Alt+F |

---

### FR-001.5 跳转到定义/引用

**功能列表：**

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 转到定义 | F12 | 跳转到符号定义 |
| 预览定义 | Alt+F12 | 在当前文件中预览定义 |
| 查找所有引用 | Shift+F12 | 查找符号的所有引用 |
| 转到符号 | Ctrl+Shift+O | 转到当前文件的符号 |
| 转到工作区符号 | Ctrl+T | 全局搜索符号 |
| 返回 | Alt+← | 返回上一个光标位置 |
| 前进 | Alt+→ | 前进到下一个光标位置 |

---

## FR-002: 文件管理

### FR-002.1 文件资源管理器

**功能规格：**

| 功能 | 说明 |
|------|------|
| 目录树 | 显示工作区文件结构 |
| 多选操作 | 支持 Ctrl/Shift 多选 |
| 拖拽移动 | 拖拽移动文件和文件夹 |
| 上下文菜单 | 右键菜单操作 |
| 文件过滤 | 输入过滤文件 |
| 折叠/展开 | 目录折叠和展开 |
| 复制路径 | 复制文件完整路径 |
| 新建文件/文件夹 | 在资源管理器中创建 |
| 重命名/删除 | 文件操作 |
| 排雷预览 | 悬停预览文件内容 |

---

### FR-002.2 多标签编辑器

**标签功能：**

| 功能 | 说明 |
|------|------|
| 标签栏 | 显示打开的文件 |
| 标签排序 | 可拖拽排序 |
| 标签关闭 | 点击 X 或 Ctrl+W |
| 关闭其他 | 右键关闭其他/所有 |
| 固定标签 | 固定标签不被关闭 |
| 标签预览 | 悬停预览文件 |
| 多组编辑 | 多个编辑器组 |

---

### FR-002.3 编辑器组（列布局）

**支持的布局：**

```
单列:          两列:          三列:
┌─────┐        ┌────┬────┐    ┌───┬───┬───┐
│     │        │    │    │    │   │   │   │
│     │        │    │    │    │   │   │   │
│     │        │    │    │    │   │   │   │
└─────┘        └────┴────┘    └───┴───┴───┘

两行:          网格 (2x2):
┌─────┐        ┌────┬────┐
│     │        │    │    │
├─────┤        ├────┼────┤
│     │        │    │    │
└─────┘        └────┴────┘
```

**快捷键：**
| 操作 | 快捷键 |
|------|--------|
| 左编辑器组 | Ctrl+1 |
| 中编辑器组 | Ctrl+2 |
| 右编辑器组 | Ctrl+3 |
| 上/下编辑器组 | Ctrl+K Ctrl+↑/↓ |
| 移动编辑器 | Ctrl+Alt+←/→ |
| 复制编辑器 | Ctrl+K Ctrl+Shift+←/→ |

---

## FR-003: 工作区与配置

### FR-003.1 工作区（Workspace）概念

**工作区结构：**
```
my-project/
├── .vscode/
│   ├── settings.json       # 工作区设置
│   ├── tasks.json          # 任务定义
│   ├── launch.json         # 调试配置
│   ├── extensions.json     # 推荐扩展
│   └── vscodecrash.info    # 崩溃报告
├── src/
├── tests/
└── package.json
```

### FR-003.2 设置系统

**设置分类：**

| 类别 | 说明 | 位置 |
|------|------|------|
| 用户设置 | 全局生效 | `settings.json` |
| 工作区设置 | 仅当前工作区 | `.vscode/settings.json` |
| 远程设置 | Remote SSH/Container | 远程 `.vscode/settings.json` |
| 扩展设置 | 扩展特定 | 各扩展的设置 |

**设置类型：**

| 类型 | 示例 |
|------|------|
| 布尔值 | `"editor.formatOnSave": true` |
| 数值 | `"editor.fontSize": 14` |
| 字符串 | `"editor.fontFamily": "Consolas"` |
| 数组 | `"files.exclude": ["**/.git"]` |
| 对象 | `"editor.tabSize": { "editor.tabSize": 4 }` |
| 枚举 | `"editor.theme": ["dark", "light"]` |

---

## FR-004: 搜索系统

### FR-004.1 全局搜索（Ctrl+Shift+F）

**搜索功能：**

| 功能 | 说明 |
|------|------|
| 文本搜索 | 在文件中搜索文本 |
| 正则表达式 | 支持正则模式 |
| 大小写敏感 | 可选大小写敏感 |
| 全词匹配 | 可选全词匹配 |
| 搜索范围 | 指定文件夹/文件类型 |
| 排除规则 | 基于 `.gitignore` 模式 |
| 搜索结果 | 显示匹配行和预览 |
| 搜索历史 | 记住最近搜索 |

### FR-004.2 文件搜索（Ctrl+P）

**快速打开：**

| 功能 | 说明 |
|------|------|
| 文件名搜索 | 部分匹配文件名 |
| 符号搜索 | @ 开头搜索符号 |
| 行号跳转 | : 开头跳转行号 |
| 最近文件 | 优先显示最近文件 |
| 修改的文件 | 过滤已修改文件 |
| 扩展过滤 | 末尾加扩展名过滤 |

---

## FR-005: 调试功能

### FR-005.1 断点类型

| 断点类型 | 说明 | 设置方式 |
|----------|------|----------|
| 行断点 | 在指定行暂停 | 单击行号 |
| 条件断点 | 满足条件时暂停 | 右键行号 → 条件 |
| 命中计数 | 执行 N 次后暂停 | 右键行号 → 命中计数 |
| 日志点 | 输出日志不暂停 | 右键行号 → 日志点 |
| 函数断点 | 在函数入口暂停 | Ctrl+Shift+F9 |
| 数据断点 | 变量改变时暂停 | 变量窗口右键 |
| 异常断点 | 异常发生时暂停 | 断点窗口配置 |

### FR-005.2 调试面板

```
┌─────────────────────────────────────────────────────┐
│ Debug Console                               [Clear]│
├─────────────────────────────────────────────────────┤
│ > variable 'x' = 10                                │
│ > function called with args: (1, 2, 3)             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ VARIABLES              WATCH                        │
├─────────────────────────────────────────────────────┤
│ ▼ x = 10              + Add Expression              │
│ ▼ obj                  x * 2                       │
│   ├─ a = 1                                         │
│   └─ b = 2                                         │
│ ▶ arr = [1,2,3]                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CALL STACK                                         │
├─────────────────────────────────────────────────────┤
│ ▶ myFunction      app.js:42                    │
│   helper          utils.js:15                   │
│   main            index.js:8                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ BREAKPOINTS                                        │
├─────────────────────────────────────────────────────┤
│ ☑ app.js:42          Conditional                   │
│ ☑ app.js:58          Log: 'x changed'            │
│ ☐ utils.js:15        Function Breakpoint         │
│ ☑ Uncaught Exceptions                              │
│ ☑ Caught Exceptions                                │
└─────────────────────────────────────────────────────┘
```

---

## FR-006: 集成终端

### FR-006.1 终端功能

| 功能 | 说明 |
|------|------|
| 多终端 | 创建多个终端实例 |
| 终端分组 | 水平/垂直分组 |
| 终端重命名 | 自定义终端名称 |
| 快速切换 | 下拉菜单切换 |
| 复制粘贴 | Ctrl+C/V 复制粘贴 |
| 超链接检测 | 自动检测 URL |
| 查找 | Ctrl+F 搜索终端输出 |
| 清空 | Ctrl+K 清空 |
| 字体大小 | 可调整字体 |
| 配色方案 | 支持主题配色 |

### FR-006.2 终端配置文件

```json
{
    "terminal.integrated.shell.linux": "/bin/bash",
    "terminal.integrated.shell.windows": "powershell.exe",
    "terminal.integrated.fontSize": 14,
    "terminal.integrated.cursorBlinking": true,
    "terminal.integrated.env.linux": { "TERM": "xterm-256color" }
}
```

---

## FR-007: Git 集成

### FR-007.1 Git 源代码管理视图

**视图布局：**

```
┌─────────────────────────────────────────────────────┐
│ SOURCE CONTROL (Git)                          [•••]│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ COMMIT MESSAGE                                   │ │
│ │ _______________________________________________ │ │
│ │                                                  │ │
│ │ [Commit] [Commit & Push]                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ CHANGES                                             │
│  M src/main.js      │ staged: 2 │ unstaged: 5       │
│  M src/utils.ts     │                                  │
│  A src/newfile.ts   │  [+ - ~]                        │
│  D src/deleted.ts   │  ↻ Refresh │ ⚙ Settings         │
│                                                      │
│ STAGED CHANGES                                      │
│  ✓ src/main.js                                     │
│  ✓ src/utils.ts                                    │
└─────────────────────────────────────────────────────┘
```

### FR-007.2 差异查看器

| 功能 | 说明 |
|------|------|
| 并排视图 | 左右对比两个版本 |
| 内联视图 | 内联显示差异 |
| 语法高亮 | 代码语法高亮 |
| 导航 | 跳转上一个/下一个差异 |
| 合并 | 接受左侧/右侧/两者 |
| 忽略空白 | 可选忽略空白差异 |

---

## FR-008: 扩展系统

### FR-008.1 扩展市场

**扩展属性：**

| 属性 | 说明 |
|------|------|
| 名称 | 扩展显示名称 |
| 标识符 | 唯一标识 (publisher.extension) |
| 版本 | 语义化版本 |
| 描述 | 简短描述 |
| 发布者 | 扩展发布者 |
| 分类 | 扩展分类（编程语言、主题等） |
| 评分 | 用户评分 |
| 下载量 | 下载次数 |
| 价格 | 免费/付费 |
| 标签 | 扩展标签 |
| 资源 | Logo、截图、视频 |

### FR-008.2 扩展 API

**扩展可以访问的 API：**

```typescript
// 工作区 API
workspace.fs.readFile(uri);
workspace.textDocuments;
workspace.workspaceFolders;

// 窗口 API
vscode.window.showQuickPick();
vscode.window.createTerminal();
vscode.window.createWebviewPanel();

// 命令 API
vscode.commands.registerCommand();
vscode.commands.executeCommand();

// 语言 API
languages.registerCompletionItemProvider();
languages.registerDefinitionProvider();
languages.registerDocumentFormattingEditProvider();

// 调试 API
debug.startDebugging();
debug.registerDebugConfigurationProvider();

// SCM API
scm.createSourceControl();
```

---

## FR-009: 主题系统

### FR-009.1 主题贡献点

```typescript
// package.json 贡献点
{
    "contributes": {
        "themes": [{
            "id": "my-theme",
            "label": "My Theme",
            "uiTheme": "vs-dark",
            "path": "./themes/my-theme.json"
        }],
        "iconThemes": [{
            "id": "my-icons",
            "label": "My Icons",
            "path": "./icons/my-icons-theme.json"
        }],
        "productIconThemes": [{
            "id": "my-product-icons",
            "label": "My Product Icons",
            "path": "./icons/my-product-icons.json"
        }]
    }
}
```

### FR-009.2 主题颜色定义

```json
{
    "colors": {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2d2e",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "activityBar.background": "#333333",
        "statusBar.background": "#007acc"
    }
}
```

---

## FR-010: 辅助功能

### FR-010.1 屏幕阅读器支持

| 功能 | 说明 |
|------|------|
| 模式 | 完全优化/屏幕阅读器优化 |
| 语音反馈 | 焦点移动语音反馈 |
| 超链接描述 | 链接有描述文本 |
| 编辑器访问 | 行号、内容、缩进 |
| 表格导航 | 表格单元格导航 |
| 进度通知 | 屏幕阅读器读出进度 |

### FR-010.2 键盘导航

| 区域 | 快捷键 | 说明 |
|------|--------|------|
| 全局 | Tab | 移动焦点 |
| 全局 | Escape | 关闭/返回 |
| 资源管理器 | Enter | 打开文件 |
| 标签页 | Ctrl+PageUp/Down | 切换标签 |
| 面板 | Ctrl+1/2/3 | 聚焦面板 |
| 快速打开 | Ctrl+R | 最近文件 |
| 命令面板 | F1 | 打开命令面板 |

---

## FR-011: Remote Development

### FR-011.1 Remote - SSH

**功能：**

| 功能 | 说明 |
|------|------|
| SSH 连接 | 连接到远程 SSH 服务器 |
| 文件系统 | 远程文件本地编辑 |
| 终端 | 远程终端本地使用 |
| 扩展 | 本地扩展在远程运行 |
| 调试 | 远程调试 |
| 端口转发 | 本地访问远程端口 |
| 密钥认证 | SSH 密钥支持 |

### FR-011.2 Remote - Containers

**功能：**

| 功能 | 说明 |
|------|------|
| Docker 支持 | 连接到 Docker 容器 |
| Docker Compose | 多容器支持 |
| Dockerfile | 自动构建开发容器 |
| 卷挂载 | 源代码目录挂载 |
| 端口映射 | 端口转发配置 |
| 扩展 | 在容器中运行扩展 |

---

## FR-012: Notebook 支持

### FR-012.1 Notebook 编辑器

**Notebook 类型：**

| 类型 | 文件扩展名 | 说明 |
|------|------------|------|
| Jupyter | `.ipynb` | Jupyter Notebook |
| 未来笔记 | 自定义 | 扩展可注册新类型 |

### FR-012.2 Notebook 单元格

**单元格类型：**

| 类型 | 说明 |
|------|------|
| Code | 可执行代码 |
| Markdown | 格式化文本 |
| Raw | 原始内容 |

**单元格操作：**

| 操作 | 快捷键 |
|------|--------|
| 运行 | Shift+Enter |
| 运行上方 | Ctrl+Enter |
| 添加代码 | Ctrl+Enter |
| 添加 Markdown | Ctrl+M |
| 删除 | Ctrl+Shift+K |
| 上移 | Alt+↑ |
| 下移 | Alt+↓ |
| 切换 | Ctrl+K Ctrl+C |

---

## FR-013: AI 集成

### FR-013.1 GitHub Copilot

**功能：**

| 功能 | 说明 |
|------|------|
| Inline Suggestions | 内联代码建议 |
| Suggestions Menu | 建议菜单 |
| Ghost Text | 半透明建议文本 |
| Chat View | 对话界面 |
| Inline Chat | 编辑器内聊天 |
| Commit Messages | 自动生成提交信息 |
| PR Descriptions | 自动生成 PR 描述 |

### FR-013.2 Chat View

**布局：**

```
┌─────────────────────────────────────────────────────┐
│ CHAT                                               │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☺ Assistant                                     │ │
│ │                                                  │ │
│ │ I can help you with:                            │ │
│ │ • Writing code                                   │ │
│ │ • Explaining code                               │ │
│ │ • Debugging issues                              │ │
│ │ • Refactoring                                   │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Type a message...                    [Send]    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## FR-014: 远程隧道

### FR-014.1 VSCode Tunnel

**功能：**

| 功能 | 说明 |
|------|------|
| 隧道创建 | 创建安全的 vscode 隧道 |
| Web 访问 | 通过浏览器访问 |
| HTTPS | 自动 HTTPS 配置 |
| 认证 | GitHub 账号认证 |
| 端口转发 | 转发本地端口 |

---

*本文档为 vscode-oss-prd.md 的功能需求详述补充*
