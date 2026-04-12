# Design: ai-plugin-recommendation

## 上下文

UX 规范明确要求：

> "AI 即入口：AI 对话必须能触发任务、导航、解释、纠偏"

当前 AI Chat Panel 只是问答，没有主动推荐插件能力。用户需要主动去插件市场查找插件。

## 目标

在 AI Chat Panel 中实现主动推荐机制：
- 根据对话上下文匹配插件能力
- 推荐卡片内联展示在对话中
- 支持安装/试用/不再提示

## 决策

### 插件能力描述

```typescript
interface PluginCapabilityDescriptor {
  pluginId: string
  pluginName: string
  description: string          // 自然语言描述
  keywords: string[]           // 关键词匹配
  icon?: LucideIcon
  actions: {
    name: string
    description: string
  }[]
}
```

### 推荐触发逻辑

```
用户输入 → 关键词提取 → 匹配插件 keywords → 展示推荐卡片
                                                    ↓
                                              "财务插件可以自动识别发票，要不要试试？"
```

### 推荐卡片组件

```typescript
interface PluginRecommendationCardProps {
  plugin: PluginCapabilityDescriptor
  matchedAction?: string
  onInstall: () => void
  onTry: () => void
  onDismiss: () => void
}
```

### 与 Command Palette 集成

推荐卡片中"试用"触发 Command Palette 注册的命令执行。

## 实现步骤

1. 定义 PluginCapabilityDescriptor 类型
2. 实现关键词匹配推荐引擎
3. 实现 PluginRecommendationCard 组件
4. 在 AgentChatPanel 中集成推荐渲染
5. 定义插件注册接口
6. 注册财务/销售等内置插件的能力描述

## 风险

[Risk] 推荐过于激进，用户反感
→ [Mitigation] "不再提示"选项，推荐频率可配置

## 开放问题

1. 推荐触发频率？
2. 是否需要基于用户角色个性化推荐？
