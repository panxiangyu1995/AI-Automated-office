# Visual Studio Code - Open Source 数据模型与存储

**Author:** Claude Code AI Assistant
**Date:** 2026-03-26
**Version:** 1.0
**Related PRD:** vscode-oss-prd.md

---

## 1. 数据存储概述

VSCode 采用**本地优先存储**架构，主要使用 JSON 文件存储用户数据，而非传统数据库。

### 1.1 存储类型

| 存储类型 | 技术 | 用途 |
|----------|------|------|
| **用户设置** | JSON 文件 | 全局配置、快捷键、主题 |
| **工作区状态** | JSON 文件 | 打开的文件、视图状态 |
| **扩展数据** | JSON 文件 | 扩展配置、状态 |
| **历史记录** | SQLite | 命令历史、文件修改历史 |
| **密钥存储** | OS Keychain | 认证令牌、密码 |
| **全球状态** | JSON 文件 | 全局应用状态 |
| **日志文件** | 文件系统 | 应用日志、扩展日志 |

### 1.2 数据目录结构

```
~/.vscode-oss/ (Linux/macOS)
%APPDATA%/Code-OSS/ (Windows)

├── Backups/                    # 崩溃恢复备份
│   └── workspaceFilters.json
├── Cache/                      # 缓存数据
│   ├── CacheData/
│   └── Chat/
├──CachedData/                  # 语言服务器缓存
├── Code Cache/                 # 代码缓存
├── code_500.log               # 崩溃日志
├── crashpad/                   # Crashpad 崩溃报告
├── logs/                       # 日志目录
│   ├── main.log
│   ├── renderer.log
│   ├── extensionHost.log
│   └── shared.log
├── UserDataPlist/              # macOS 特定数据
├── blob_storage/               # Blob 存储
├── GPUCache/                   # GPU 缓存
├── landingpage/                # 欢迎页
├── Local Storage/              # LocalStorage
├── logs/                       # 日志
├── serviceworker/              # Service Worker
├── ShaderCache/                # GPU Shader 缓存
├── User/                       # 用户数据
│   ├── globalStorage/          # 扩展全局存储
│   │   └── extensionId/
│   │       ├── storage.json    # 扩展特定数据
│   │       └── *.data
│   ├── History/                # 最近打开的文件
│   ├── keybindings.json        # 导出的快捷键
│   ├── snipperDrivers.json    # 代码片段
│   ├── storage.json           # 全局存储
│   ├── ui_state.json          # UI 状态
│   ├── workspace.json         # 工作区
│   └── workspaceStorage/      # 工作区特定存储
│       └── ${workspaceId}/
│           ├── driftDetected.json
│           ├── keybindings.json
│           ├── state.vscdb
│           ├── state.vscdb.backup
│           ├── storage.json
│           └── log/
└── workspaceStorage/           # 所有工作区的存储

# 扩展目录
~/.vscode-oss/extensions/
├── ms-vscode.js-debug-1.0.0/
│   ├── extension.js
│   ├── package.json
│   └── README.md
├── ms-python.python-2024.0.0/
│   └── ...
└── ...
```

---

## 2. 用户数据模型

### 2.1 用户设置 (settings.json)

**路径：** `User/settings.json`

```typescript
interface ISettings {
    // 编辑器
    'editor.fontSize': number;
    'editor.fontFamily': string;
    'editor.tabSize': number;
    'editor.insertSpaces': boolean;
    'editor.formatOnSave': boolean;
    'editor.minimap.enabled': boolean;
    'editor.lineNumbers': 'on' | 'off' | 'relative';
    'editor.renderWhitespace': 'none' | 'boundary' | 'all';
    'editor.wordWrap': 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    'editor.autoIndent': 'none' | 'keep' | 'advanced' | 'full';

    // 工作区
    'files.autoSave': 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
    'files.autoSaveDelay': number;
    'files.exclude': Record<string, boolean>;
    'files.associations': Record<string, string>;

    // 主题
    'workbench.colorTheme': string;
    'workbench.iconTheme': string;
    'workbench.productIconTheme': string;

    // 终端
    'terminal.integrated.shell.linux': string;
    'terminal.integrated.fontSize': number;

    // Git
    'git.autofetch': boolean;
    'git.confirmSync': boolean;

    // 扩展
    'extensions.autoUpdate': boolean;
    'extensions.ignoreRecommendations': boolean;

    // 语言
    'files.eol': '\n' | '\r\n' | 'auto';
    'files.encoding': string;

    // 窗口
    'window.zoomLevel': number;
    'window.newWindowDimensions': 'inherit' | 'offset' | 'maximized' | 'fullscreen';
}
```

### 2.2 快捷键绑定 (keybindings.json)

**路径：** `User/keybindings.json`

```typescript
interface IKeybinding {
    key: string;                    // 如: 'ctrl+shift+p'
    command: string;                // 命令 ID
    when?: string;                  // 条件表达式
    args?: any;                     // 命令参数
}

interface IKeybindings {
    keybindings: IKeybinding[];
}
```

### 2.3 工作区状态 (workspace.json)

**路径：** `User/workspace.json`

```typescript
interface IWorkspaceData {
    id: string;                      // 工作区唯一 ID
    name: string;                    // 工作区名称
    folders: IWorkspaceFolder[];     // 文件夹路径
    configuration: string | null;    // settings.json 路径
    isUntitled?: boolean;
    remoteAuthority?: string;
}

interface IWorkspaceFolder {
    uri: string;                     // 文件夹 URI
    name: string;                    // 显示名称
    index: number;                   // 顺序
}
```

### 2.4 UI 状态 (ui_state.json)

**路径：** `User/ui_state.json`

```typescript
interface IUIState {
    // 编辑器组状态
    editorGroupLayout?: IEditorGroupLayout;
    activeEditorGroupIndex?: number;

    // Parts 可见性
    sidebarVisibility?: 'hidden' | 'visible' | 'compact';
    panelVisibility?: 'hidden' | 'visible';
    panelPosition?: 'bottom' | 'right';
    auxiliaryBarVisibility?: 'hidden' | 'visible';

    // 编辑器状态
    openedEditors?: IEditorState[];

    // 视图状态
    views?: Record<string, IViewState>;

    // 窗口状态
    windowState?: IWindowState;
}

interface IEditorState {
    id: string;
    resource: string;
    groupId?: number;
    pinned?: boolean;
    order?: number;
}

interface IViewState {
    collapsed?: boolean;
    size?: number;
    when?: string;
}
```

---

## 3. 工作区存储

### 3.1 SQLite 数据库 (state.vscdb)

**路径：** `User/workspaceStorage/${workspaceId}/state.vscdb`

**数据库架构：**

```sql
-- items 表：通用键值存储
CREATE TABLE Items (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 索引
CREATE INDEX idx_items_key ON Items(key);
```

**存储内容：**

| 键 | 类型 | 说明 |
|----|------|------|
| `editor/state` | JSON | 编辑器状态 |
| `explorer/expandedFolders` | JSON | 展开的文件夹 |
| `terminal/terminals` | JSON | 终端实例 |
| `debug/components` | JSON | 调试视图状态 |
| `workbench.view.state` | JSON | 视图状态 |
| `nps/latest` | timestamp | 最新使用时间 |

### 3.2 工作区存储 JSON (storage.json)

**路径：** `User/workspaceStorage/${workspaceId}/storage.json`

```typescript
interface IWorkspaceStorage {
    // 扩展数据
    extensions?: Record<string, IExtensionData>;

    // 视图状态
    views?: Record<string, IViewState>;

    // 编辑器状态
    editorState?: IEditorState[];

    // 自定义数据
    [key: string]: any;
}

interface IExtensionData {
    id: string;
    version: string;
    state?: any;           // 扩展特定状态
    lastActivation?: number;
}
```

---

## 4. 扩展数据模型

### 4.1 扩展清单 (package.json)

**每个扩展的根目录：** `extensions/${publisher}.${name}/package.json`

```typescript
interface IExtensionManifest {
    name: string;                    // 扩展名
    displayName?: string;            // 显示名
    version: string;                 // 版本
    publisher: string;               // 发布者
    description?: string;            // 描述
    main?: string;                   // 入口文件
    browser?: string;                // 浏览器入口
   engines?: Record<string, string>; // 兼容引擎
    categories?: string[];            // 分类
    keywords?: string[];              // 关键词
    activationEvents?: string[];      // 激活事件
    contributes?: IContributes;       // 贡献点
    extensionPack?: string[];        // 扩展包
    dependencies?: Record<string, string>; // 依赖
    extensionDependencies?: string[];     // 扩展依赖
    bundledDependencies?: string[];         // 打包依赖
}
```

### 4.2 扩展贡献点

```typescript
interface IContributes {
    // 命令
    commands?: ICommand[];
    menus?: IMenus;

    // 编辑器
    languages?: ILanguage[];
    grammars?: IGrammar[];
    themes?: ITheme[];
    iconThemes?: IIconTheme[];

    // 设置
    configuration?: IConfiguration | IConfiguration[];
    configurationDefaults?: IConfigurationDefaults;

    // 调试
    debuggers?: IDebugger[];
    breakpoints?: IBreakpoint[];

    // 视图
    views?: IViews;
    viewsContainers?: IViewsContainers;

    // 其他
    snippets?: ISnippet[];
    keybindings?: IKeybinding[];
    authentication?: IAuthentication[];
    webview?: IWebview[];
}

interface ICommand {
    command: string;
    title: string;
    category?: string;
    icon?: string;
    tooltip?: string;
    enablement?: string;
}

interface ILanguage {
    id: string;
    extensions?: string[];
    filenames?: string[];
    firstLine?: string;
    aliases?: string[];
    mimetypes?: string[];
    configuration?: string;
}
```

---

## 5. 历史记录

### 5.1 最近文件 (globalStorage)

**路径：** `User/globalStorage/globalStorage.json` 或 SQLite

```typescript
interface IRecentlyOpened {
    entries: IRecentlyOpenedEntry[];
}

interface IRecentlyOpenedEntry {
    folderUri?: string;
    fileUri?: string;
    label?: string;
    remoteAuthority?: string;
}
```

### 5.2 本地历史

**路径：** `User/Local\ History/` 或工作区内的 `. history`

```
.history/
├── file1.ts/
│   ├── 2024-01-15T10_30_00.000
│   ├── 2024-01-15T11_00_00.000
│   └── 2024-01-16T09_15_00.000
└── subdir/
    └── file2.json/
```

---

## 6. Git 相关数据

### 6.1 Source Control 状态

```typescript
interface ISCMProvider {
    id: string;
    label: string;
    count?: number;
    commitTemplate?: string;
    quickDiff?: string;
    rootUri?: string;
    inputBoxValue?: string;
    repositories?: ISCMRepository[];
}

interface ISCMRepository {
    provider: ISCMProvider;
    resourceGroups: ISCMResourceGroup[];
}

interface ISCMResourceGroup {
    id: string;
    label: string;
    resources: ISCMResource[];
}

interface ISCMResource {
    sourceUri: string;
    ruleGroup: 'merged' | 'workingTree' | 'index' | 'user' | 'untracked';
    decorations?: ISCMDecorations;
}
```

---

## 7. 调试配置

### 7.1 Launch 配置 (launch.json)

**路径：** `.vscode/launch.json`

```typescript
interface ILaunchConfig {
    version?: string;
    configurations?: IDebugConfiguration[];
    compounds?: ICompoundConfiguration[];
}

interface IDebugConfiguration {
    type: string;                      // 'node', 'python', 'cpp', etc.
    request: 'launch' | 'attach';     // 启动或附加
    name: string;                      // 配置名称
    program?: string;                  // 启动程序路径
    args?: string[];                   // 命令行参数
    cwd?: string;                      // 工作目录
    env?: Record<string, string>;      // 环境变量
    port?: number;                     // 调试端口
    preLaunchTask?: string;             // 启动前任务
    postDebugTask?: string;            // 调试后任务
    console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
}

interface ICompoundConfiguration {
    name: string;
    configurations: string[];           // 引用的配置名称
    stopAll?: boolean;
}
```

### 7.2 Tasks 配置 (tasks.json)

```typescript
interface ITasksConfig {
    version?: string;
    tasks?: ITaskDefinition[];
}

interface ITaskDefinition {
    type?: string;
    label: string;
    command?: string;
    args?: string[];
    options?: ITaskOptions;
    problemMatcher?: string | IProblemMatcher;
    group?: ITaskGroup;
    dependsOn?: string | ITaskDependency[];
    inputs?: ITaskInput[];
}

interface ITaskOptions {
    cwd?: string;
    env?: Record<string, string>;
    shell?: IShellConfiguration;
}

interface ITaskGroup {
    kind?: 'build' | 'test' | 'clean' | 'rebuild' | 'default';
    isDefault?: boolean;
}
```

---

## 8. 用户配置继承

### 8.1 设置继承链

```
默认设置
    ↓
扩展设置 (extensions.json)
    ↓
工作区设置 (.vscode/settings.json)
    ↓
文件夹设置 (.vscode/settings.json)
    ↓
用户设置 (settings.json)
    ↓
远程设置 (Remote SSH settings)
```

### 8.2 配置注册表

```typescript
interface IConfigurationRegistry {
    registerConfiguration(configuration: IConfiguration): IDisposable;
    registerConfigurations(configurations: IConfiguration[]): IDisposable;
    deregisterConfiguration(configuration: IConfiguration): void;
}

interface IConfiguration {
    id: string;
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean';
    title?: string;
    properties?: Record<string, IConfigurationProperty>;
}

interface IConfigurationProperty {
    type: string | string[];
    default?: any;
    description?: string;
    enum?: any[];
    markdownDescription?: string;
    scope?: ConfigurationScope;
}
```

---

## 9. 状态持久化

### 9.1 Storage 服务

```typescript
interface IStorageService {
    // 全局存储
    get<T>(key: string, fallback: T): T;
    get<T>(key: string, fallback?: T): T | undefined;
    store(key: string, value: any): void;
    remove(key: string): void;

    // 布尔值
    getBoolean(key: string, fallback: boolean): boolean;

    // 数值
    getNumber(key: string, fallback: number): number;

    // 事件
    onDidChangeValue: Event<IStorageValueChangeEvent>;

    // 工作区存储
    workspaceStorage: IStorageService | undefined;
}

interface IStorageValueChangeEvent {
    key: string;
    scope: 'GLOBAL' | 'WORKSPACE';
}
```

---

## 10. 备份与恢复

### 10.1 备份机制

| 备份类型 | 触发条件 | 存储位置 |
|----------|----------|----------|
| 编辑器状态 | 定时 | `workspaceStorage/` |
| 文件备份 | 编辑时 | `Backups/` |
| 崩溃恢复 | 崩溃后 | `Backups/` |
| 回退历史 | 手动/自动 | `. history/` |

### 10.2 恢复流程

```
启动 VSCode
    ↓
检查是否有未恢复的工作区
    ↓
显示恢复对话框
    ↓
用户选择:
    ├─ 恢复 → 恢复工作区状态
    └─ 不恢复 → 以干净状态启动
```

---

*本文档为 vscode-oss-prd.md 的数据模型补充*
