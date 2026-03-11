# OpenClaw Channel 消息机制详解

## 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [Agent 消息接收机制](#agent-消息接收机制)
4. [Agent 消息发送机制](#agent-消息发送机制)
5. [功能效果](#功能效果)
6. [核心文件索引](#核心文件索引)

---

## 概述

OpenClaw 是一个多平台消息代理框架，支持 Telegram、Discord、Slack、WhatsApp、Signal、iMessage 等多个频道的集成。其 Channel 机制的核心设计目标是：

- **统一抽象**：为不同消息平台提供统一的接口
- **解耦**：Channel 与 Agent 之间通过适配器模式解耦
- **可扩展**：通过插件系统轻松添加新平台支持
- **可靠性**：消息队列持久化 + 重试机制确保消息不丢失

---

## 架构设计

### 1. 整体架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Layer                             │
│         (openclaw-agent / embedded-pi-agent)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Tool Layer                                 │
│              (message-tool.ts)                               │
│         runMessageAction() / runReplyAgent()                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               Outbound Layer (发送)                          │
│   message-action-runner.ts → outbound-send-service.ts       │
│   → deliver.ts → channel-adapter → platform-api              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Channel Layer                              │
│         (telegram / discord / slack / whatsapp ...)          │
│              ChannelPlugin 接口实现                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                Inbound Layer (接收)                          │
│   channel-monitor → normalize → route → agent-runner         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Platform Layer                             │
│            (WebSocket / Polling / Webhook)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Channel 核心类型

#### 2.1 ChannelPlugin 接口

位于 `src/channels/plugins/types.plugin.ts`:

```typescript
type ChannelPlugin<ResolvedAccount, Probe, Audit> = {
  id: ChannelId;
  meta: ChannelMeta;
  capabilities: ChannelCapabilities;
  config: ChannelConfigAdapter;
  outbound?: ChannelOutboundAdapter;    // 发送消息
  status?: ChannelStatusAdapter;        // 状态查询
  gateway?: ChannelGatewayAdapter;       // 账号管理
};
```

#### 2.2 Channel 适配器类型

位于 `src/channels/plugins/types.adapters.ts`:

| 适配器 | 职责 |
|--------|------|
| `ChannelSetupAdapter` | 初始化设置 |
| `ChannelConfigAdapter` | 配置管理 |
| `ChannelOutboundAdapter` | 消息发送 |
| `ChannelStatusAdapter` | 状态查询 |
| `ChannelGatewayAdapter` | 账号登录/登出 |

### 3. 内置 Channel 列表

定义在 `src/channels/registry.ts`:

```typescript
CHAT_CHANNEL_ORDER = [
  'telegram', 'whatsapp', 'discord', 'irc',
  'googlechat', 'slack', 'signal', 'imessage'
];
```

---

## Agent 消息接收机制

### 1. 消息接收流程图

```
[Platform WebSocket/Polling]
           │
           ▼
┌──────────────────────────┐
│   Channel Monitor        │  src/web/inbound/monitor.ts
│   (messages.upsert)      │  src/discord/monitor/message-handler.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   消息规范化              │  normalizeInboundMessage()
│   MsgContext 转换         │  src/web/inbound/extract.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   访问控制 & 门控         │  access-control.ts
│   去重处理               │  group-gating.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   路由解析               │  resolveAgentRoute()
│   目标 Agent 确定        │  src/routing/resolve-route.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   上下文构建             │  finalizeInboundContext()
│   (会话/用户信息)        │  src/auto-reply/reply/inbound-context.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Pre-Agent Hooks        │  message-preprocess-hooks.ts
│   (预处理)               │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Agent 执行             │  runReplyAgent()
│   AI 推理响应            │  src/auto-reply/reply/agent-runner.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   回复发送               │  deliverWebReply()
│   (Outbound 流程)        │  deliverDiscordReply()
└──────────────────────────┘
```

### 2. 关键处理阶段

#### 2.1 消息监听 (Monitor)

| Channel | 文件 | 函数 |
|---------|------|------|
| WhatsApp/Web | `src/web/inbound/monitor.ts` | `monitorWebInbox()` |
| Discord | `src/discord/monitor/message-handler.ts` | `createDiscordMessageHandler()` |
| Telegram | `src/telegram/bot-handlers.ts` | 消息处理函数 |
| Slack | `src/slack/monitor/message-handler/dispatch.ts` | 消息分发 |

#### 2.2 消息规范化

将各平台原始消息转换为统一的 `MsgContext` 格式：

- `src/web/inbound/extract.ts` - 提取文本、位置、媒体
- `src/web/inbound/media.ts` - 下载和处理入站媒体

#### 2.3 访问控制

- `src/web/inbound/access-control.ts` - 基于白名单/黑名单的访问控制
- `src/web/auto-reply/monitor/group-gating.ts` - 群组门控

#### 2.4 去重机制

- `src/web/inbound/dedupe.ts` - 消息去重
- `src/auto-reply/inbound-debounce.ts` - 请求去抖动

#### 2.5 路由解析

`src/routing/resolve-route.ts`:

```typescript
// 根据消息内容、会话信息确定处理该消息的 Agent
resolveAgentRoute({
  message,
  session,
  config
});
```

#### 2.6 Agent 执行

`src/auto-reply/reply/agent-runner.ts`:

```typescript
async function runReplyAgent(
  agentId: string,
  context: InboundMessageContext
): Promise<AgentResponse> {
  // 调用实际 Agent 执行
  return runEmbeddedPiAgent(context) || runCliAgent(context);
}
```

### 3. Hooks 系统

消息处理过程中支持 Hook 扩展：

```typescript
// dispatch-from-config.ts 中的 hook 触发
if (hookRunner?.hasHooks("message_received")) {
  fireAndForgetHook(hookRunner.runMessageReceived(...));
}
```

支持的 Hook 类型：
- `message_received` - 消息接收时
- `pre_agent` - 发送给 Agent 前
- `post_agent` - Agent 响应后

---

## Agent 消息发送机制

### 1. 消息发送流程图

```
[Agent Tool 调用]
           │
           ▼
┌──────────────────────────┐
│   runMessageAction()     │  src/agents/tools/message-tool.ts
│   (入口点)               │  src/infra/outbound/message-action-runner.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Action 解析            │  handleSendAction()
│   (send/poll/broadcast)  │  handlePollAction() / handleBroadcastAction()
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Channel 解析            │  resolveChannel()
│   目标选择               │  src/infra/outbound/channel-resolution.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   目标解析                │  resolveActionTarget()
│   (接收者/群组)          │  src/infra/outbound/targets.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   executeSendAction()    │  src/infra/outbound/outbound-send-service.ts
│   发送执行                │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   sendMessage()          │  src/infra/outbound/message.ts
│   消息组装               │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   deliverOutboundPayloads│  src/infra/outbound/deliver.ts
│   投递分发               │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Channel Adapter 加载   │  loadChannelOutboundAdapter()
│   (discord/telegram/...) │  src/channels/plugins/outbound/load.ts
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Adapter 实现            │  discord.ts / telegram.ts / slack.ts
│   sendText / sendMedia   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Platform API            │  Discord API / Telegram Bot API
│   实际发送                │  src/discord/send.outbound.ts
└──────────────────────────┘
```

### 2. 发送入口点

`src/agents/tools/message-tool.ts`:

```typescript
const result = await runMessageAction({
  cfg,
  action,           // send / poll / broadcast / plugin
  params,
  defaultAccountId,
  gateway,
  toolContext,
  sessionKey,
  agentId,
});
```

### 3. Channel Adapter 实现

每个 Channel 有独立的 Adapter 实现：

| Channel | Adapter 文件 | 关键函数 |
|---------|-------------|---------|
| Discord | `src/channels/plugins/outbound/discord.ts` | `sendText()`, `sendMedia()`, `sendPoll()` |
| Telegram | `src/channels/plugins/outbound/telegram.ts` | `sendText()`, `sendMedia()` |
| Slack | `src/channels/plugins/outbound/slack.ts` | `sendText()`, `sendMedia()` |
| WhatsApp | `src/channels/plugins/outbound/whatsapp.ts` | 发送实现 |

示例 (Discord):

```typescript
export const discordOutbound: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  textChunkLimit: 2000,
  resolveTarget: ({ to }) => normalizeDiscordOutboundTarget(to),
  sendText: async ({ to, text, accountId, deps, replyToId, threadId, identity, silent }) => {
    // 调用 Discord API 发送
    return await sendMessageDiscord(...);
  },
  sendMedia: async (...) => { ... },
  sendPoll: async (...) => { ... },
};
```

### 4. 失败重试机制

位于 `src/infra/outbound/delivery-queue.ts`:

#### 4.1 消息持久化队列

发送前将消息写入磁盘 (`{stateDir}/delivery-queue/`)：

```typescript
// enqueueDelivery() - 第 81-108 行
await enqueueDelivery(payload, stateDir);
```

#### 4.2 重试策略 (指数退避)

```typescript
const BACKOFF_MS = [
  5 * 1000,      // 重试 1: 5s
  25 * 1000,     // 重试 2: 25s
  2 * 60 * 1000, // 重试 3: 2m
  10 * 60 * 1000 // 重试 4: 10m
];
```

#### 4.3 最大重试次数

```typescript
const MAX_RETRIES = 5;
```

超过最大重试后移至 `failed/` 目录。

#### 4.4 永久错误检测

```typescript
const PERMANENT_ERROR_PATTERNS = [
  /no conversation reference found/i,
  /chat not found/i,
  /user not found/i,
  /bot was blocked by the user/i,
  /forbidden: bot was kicked/i,
  /chat_id is empty/i,
];
```

#### 4.5 投递恢复

Gateway 启动时自动恢复 pending 消息：

```typescript
recoverPendingDeliveries(); // 第 278-376 行
```

### 5. 发送模式

| 模式 | 说明 | 适配器 |
|------|------|--------|
| `direct` | 直接发送到目标平台 | Discord, Telegram |
| `gateway` | 通过中间网关 | - |
| `hybrid` | 混合模式 | Slack, WhatsApp |

---

## 功能效果

### 1. 消息接收功能

| 功能 | 描述 | 文件位置 |
|------|------|---------|
| **多平台支持** | 统一处理 Telegram/Discord/Slack/WhatsApp 等多平台消息 | 各 channel monitor |
| **消息规范化** | 统一转换为 MsgContext 格式 | `src/web/inbound/extract.ts` |
| **访问控制** | 白名单/黑名单用户过滤 | `src/web/inbound/access-control.ts` |
| **群组门控** | 验证用户群组身份 | `src/web/auto-reply/monitor/group-gating.ts` |
| **消息去重** | 防止重复处理同一消息 | `src/web/inbound/dedupe.ts` |
| **请求去抖** | 避免高频请求冲击 Agent | `src/auto-reply/inbound-debounce.ts` |
| **路由解析** | 自动选择处理 Agent | `src/routing/resolve-route.ts` |
| **Hooks 扩展** | 预处理/后处理钩子 | `src/auto-reply/reply/message-preprocess-hooks.ts` |
| **媒体处理** | 下载/处理图片/音频/视频 | `src/web/inbound/media.ts` |

### 2. 消息发送功能

| 功能 | 描述 | 文件位置 |
|------|------|---------|
| **多平台发送** | 统一接口发送至各平台 | 各 channel outbound adapter |
| **消息模板** | 支持变量替换的消息模板 | `src/auto-reply/templating.ts` |
| **媒体发送** | 支持图片/音频/视频/文件 | ChannelOutboundAdapter.sendMedia |
| **投票功能** | 创建投票/收集投票 | sendPoll() |
| **回复功能** | 支持引用回复/thread | replyToId / threadId |
| **静默发送** | 静默推送不触发通知 | silent 参数 |
| **广播** | 向多个目标批量发送 | handleBroadcastAction() |
| **消息分片** | 长文本自动拆分 | chunker 配置 |
| **队列持久化** | 发送前持久化到磁盘 | `src/infra/outbound/delivery-queue.ts` |
| **失败重试** | 指数退避重试机制 | failDelivery() |
| **永久错误检测** | 识别不可恢复错误 | isPermanentDeliveryError() |
| **投递恢复** | 启动时自动恢复pending消息 | recoverPendingDeliveries() |
| **最佳努力模式** | 部分失败不影响其他发送 | bestEffort 参数 |

### 3. 架构优势

1. **松耦合**：Channel 与 Agent 通过适配器解耦
2. **可扩展**：新增 Channel 只需实现接口
3. **可靠性**：消息持久化 + 重试确保不丢失
4. **一致性**：统一的消息格式和处理流程
5. **可观测**：完整的 Hook 机制支持监控和扩展

---

## 核心文件索引

### Channel 类型定义

| 文件 | 说明 |
|------|------|
| `src/channels/plugins/types.core.ts` | 核心类型 (ChannelId, ChannelMeta, ChannelCapabilities) |
| `src/channels/plugins/types.plugin.ts` | ChannelPlugin 接口 |
| `src/channels/plugins/types.adapters.ts` | 适配器接口定义 |
| `src/channels/registry.ts` | Channel 注册表 |

### Channel 实现

| 目录 | Channel |
|------|---------|
| `extensions/telegram/` | Telegram |
| `extensions/discord/` | Discord |
| `extensions/slack/` | Slack |
| `extensions/whatsapp/` | WhatsApp |
| `extensions/signal/` | Signal |

### Inbound 核心

| 文件 | 说明 |
|------|------|
| `src/web/inbound/monitor.ts` | WhatsApp 消息监听 |
| `src/web/inbound/extract.ts` | 消息提取 |
| `src/web/inbound/access-control.ts` | 访问控制 |
| `src/web/inbound/dedupe.ts` | 去重 |
| `src/web/auto-reply/monitor/on-message.ts` | 消息入口 |
| `src/web/auto-reply/monitor/process-message.ts` | 消息处理 |
| `src/auto-reply/dispatch.ts` | 分发入口 |
| `src/auto-reply/reply/dispatch-from-config.ts` | 配置驱动分发 |
| `src/auto-reply/reply/get-reply.ts` | 获取回复 |
| `src/auto-reply/reply/agent-runner.ts` | Agent 执行器 |
| `src/routing/resolve-route.ts` | 路由解析 |

### Outbound 核心

| 文件 | 说明 |
|------|------|
| `src/agents/tools/message-tool.ts` | 消息工具入口 |
| `src/infra/outbound/message-action-runner.ts` | Action 编排器 |
| `src/infra/outbound/outbound-send-service.ts` | 发送服务 |
| `src/infra/outbound/message.ts` | 消息 API |
| `src/infra/outbound/deliver.ts` | 投递核心 |
| `src/infra/outbound/targets.ts` | 目标解析 |
| `src/infra/outbound/channel-resolution.ts` | Channel 解析 |
| `src/infra/outbound/channel-selection.ts` | Channel 选择 |
| `src/infra/outbound/delivery-queue.ts` | 投递队列 |

### Outbound Adapter

| 文件 | 说明 |
|------|------|
| `src/channels/plugins/outbound/load.ts` | Adapter 加载器 |
| `src/channels/plugins/outbound/discord.ts` | Discord 适配器 |
| `src/channels/plugins/outbound/telegram.ts` | Telegram 适配器 |
| `src/channels/plugins/outbound/slack.ts` | Slack 适配器 |

---

*文档生成时间: 2026-03-11*
