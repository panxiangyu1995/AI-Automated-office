# Design: command-palette-upgrade

## 上下文

UX 规范明确要求：

> "Command Palette / Quick Ask 是固定壳层中的一级入口，不只是'查命令'，还要承担跨模块资产访问。"

当前实现只是 Quick Search 搜索框，没有命令执行能力。

## 目标

将 QuickSearch 升级为真正的 Command Palette，支持：
- 命令注册与执行
- 插件命令注册
- 分类过滤
- 快捷键显示

## 决策

### Command 注册接口

```typescript
interface Command {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
  category: 'file' | 'edit' | 'view' | 'plugin' | 'tool' | 'settings'
  shortcut?: string
  action: () => void | Promise<void>
  pluginId?: string
}

interface CommandRegistry {
  register(cmd: Command): void
  unregister(id: string): void
  getByCategory(category: string): Command[]
  search(query: string): Command[]
}
```

### Command Palette 组件结构

```
CommandPalette
├── Input (搜索框)
├── FilterBar (分类过滤)
├── CommandList (命令列表)
│   ├── CommandItem (x N)
│   │   ├── CommandIcon
│   │   ├── CommandLabel
│   │   ├── CommandDescription
│   │   └── CommandShortcut
│   └── EmptyState (无结果)
└── Footer (快捷键提示: ↑↓导航/Enter执行/Esc关闭)
```

### TopBar 菜单迁移

| 原菜单 | 命令 ID | 分类 |
|--------|---------|------|
| 文件 > 新建 | `file.new` | file |
| 文件 > 打开 | `file.open` | file |
| 视图 > 切换侧边栏 | `view.toggle-sidebar` | view |
| 工具 > 数据同步 | `tool.sync` | tool |
| 硬件 > 扫描文档 | `hardware.scan` | tool |

## 实现步骤

1. 创建 CommandRegistry（单例模式）
2. 注册系统内置命令
3. 实现 CommandPalette 组件
4. 实现分类过滤
5. 实现键盘导航
6. 注册 TopBar 菜单命令

## 风险

[Risk] 命令过多导致搜索结果混乱
→ [Mitigation] 分层展示，插件命令排在系统命令之后

## 开放问题

1. 是否需要命令历史？
2. 是否需要 fuzzy search？
