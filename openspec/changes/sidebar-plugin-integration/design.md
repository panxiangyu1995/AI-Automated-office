# Design: sidebar-plugin-integration

## 上下文

UX 规范明确要求：

> "Sidebar 动态资源：根据工作区/项目注册的资源列表"

当前 Sidebar 只有固定导航，插件安装后没有自动出现入口。

## 目标

实现插件在 Sidebar 中的动态注册：
- 插件安装后在其所属模块下自动出现
- ActivityBar Badge 通知机制
- 与三层插件发现体系整合

## 决策

### 插件 Sidebar 入口注册

```typescript
interface PluginSidebarEntry {
  id: string
  label: string
  icon?: LucideIcon
  description?: string
  target: {
    path: string
    mode: 'static'
    activityItem?: ActivityBarItem
  }
}

interface PluginRegistration {
  pluginId: string
  sidebarEntries: PluginSidebarEntry[]
  activityBarBadge?: {
    targetId: string
    badge: number | string
    color?: string
  }
}
```

### DynamicPluginEntries 组件

```typescript
function DynamicPluginEntries() {
  const installedPlugins = usePluginStore(s => s.installedPlugins)
  
  return (
    <>
      {installedPlugins.map(plugin => (
        <SidebarSection
          title={plugin.name}
          icon={plugin.icon}
          entries={plugin.sidebarEntries}
        />
      ))}
    </>
  )
}
```

### ActivityBar Badge

```typescript
// 插件可以向 ActivityBar 项注册通知徽章
plugin.registerActivityBadge({
  targetId: 'approval',
  badge: pendingCount,
  color: '#F59E0B'
})
```

## 实现步骤

1. 扩展 SidebarResourceEntry 类型
2. 实现插件入口注册接口
3. 实现 DynamicPluginEntries 组件
4. 在 Sidebar 中集成动态入口渲染
5. 实现 ActivityBar Badge 机制

## 风险

[Risk] 插件注册过多，Sidebar 拥挤
→ [Mitigation] 每个插件最多注册 3 个入口

## 开放问题

1. Badge 数量上限？
2. 是否需要插件入口排序？
