# 六、前端架构

## 6.1 技术栈

### 6.1.1 核心技术

| 技术 | 用途 | 版本 |
|-----|------|------|
| **SolidJS** | UI 框架 | 1.9.10 |
| **Vite** | 构建工具 | 7.1.4 |
| **TailwindCSS** | 样式系统 | 4.1.11 |
| **Solid Router** | 路由 | 0.15.4 |
| **Kobalte** | UI 组件库 | 0.13.11 |

### 6.1.2 为什么选择 SolidJS？

1. **性能** - 细粒度响应式，无虚拟 DOM 开销
2. **心智模型** - 类似 React，学习成本低
3. **编译优化** - 编译时优化，运行时体积小
4. **服务端支持** - 支持 SSR

## 6.2 项目结构

```
packages/app/src/
├── app.tsx              # 应用入口
├── entry.tsx            # 渲染入口
├── index.css            # 全局样式
├── components/          # UI 组件
│   ├── prompt-input.tsx    # 输入框
│   ├── session-context-usage.tsx  # 上下文使用
│   ├── file-tree.tsx       # 文件树
│   ├── terminal.tsx        # 终端组件
│   ├── dialog-*.tsx        # 各种对话框
│   ├── settings-*.tsx      # 设置页面
│   ├── titlebar.tsx        # 标题栏
│   └── session/            # 会话相关组件
├── context/             # 状态管理
│   ├── sdk.tsx             # SDK 客户端
│   ├── server.tsx          # 服务器连接
│   ├── session.tsx         # 会话状态
│   ├── models.tsx          # 模型状态
│   ├── permission.tsx      # 权限状态
│   ├── layout.tsx          # 布局状态
│   └── ...
├── pages/               # 页面组件
│   ├── home.tsx            # 首页
│   ├── session.tsx         # 会话页
│   ├── layout.tsx          # 布局
│   └── error.tsx           # 错误页
├── hooks/               # 自定义 Hooks
├── utils/               # 工具函数
└── i18n/                # 国际化
    ├── en.ts
    ├── zh.ts
    └── ...
```

## 6.3 状态管理

### 6.3.1 Context 设计

OpenCode 使用 SolidJS 的 Context 进行状态管理：

```typescript
// SDK Context
const SdkContext = createContext<SdkClient>()

export function SdkProvider(props: { children: JSX.Element }) {
  const client = createSdkClient()
  
  return (
    <SdkContext.Provider value={client}>
      {props.children}
    </SdkContext.Provider>
  )
}

export function useSdk() {
  const client = useContext(SdkContext)
  if (!client) throw new Error("useSdk must be used within SdkProvider")
  return client
}
```

### 6.3.2 响应式状态

```typescript
// 使用 createSignal 管理状态
const [sessions, setSessions] = createSignal<Session[]>([])

// 使用 createMemo 计算派生状态
const activeSession = createMemo(() => {
  const id = activeSessionId()
  return sessions().find(s => s.id === id)
})

// 使用 createEffect 处理副作用
createEffect(() => {
  const session = activeSession()
  if (session) {
    // 订阅会话更新
    sdk.subscribe(session.id, (update) => {
      // 更新状态
    })
  }
})
```

### 6.3.3 全局同步

```typescript
// global-sync.tsx - 处理服务器状态同步
export function GlobalSync(props: { children: JSX.Element }) {
  const sdk = useSdk()
  
  // 同步会话列表
  createEffect(() => {
    const unsubscribe = sdk.sessions.subscribe((sessions) => {
      setSessions(sessions)
    })
    onCleanup(unsubscribe)
  })
  
  // 同步模型列表
  createEffect(() => {
    const unsubscribe = sdk.models.subscribe((models) => {
      setModels(models)
    })
    onCleanup(unsubscribe)
  })
  
  return props.children
}
```

## 6.4 组件设计

### 6.4.1 PromptInput 组件

```typescript
export function PromptInput(props: {
  onSubmit: (message: string, attachments: Attachment[]) => void
  disabled?: boolean
}) {
  const [text, setText] = createSignal("")
  const [attachments, setAttachments] = createSignal<Attachment[]>([])
  
  // 处理文件拖放
  const handleDrop = (e: DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? [])
    // 处理文件
  }
  
  // 处理粘贴
  const handlePaste = (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    // 处理粘贴内容
  }
  
  // 提交消息
  const handleSubmit = () => {
    if (text().trim() || attachments().length > 0) {
      props.onSubmit(text(), attachments())
      setText("")
      setAttachments([])
    }
  }
  
  return (
    <div class="prompt-input" onDrop={handleDrop} onPaste={handlePaste}>
      {/* 附件预览 */}
      <For each={attachments()}>
        {(attachment) => <AttachmentPreview attachment={attachment} />}
      </For>
      
      {/* 输入框 */}
      <textarea
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        disabled={props.disabled}
      />
      
      {/* 工具栏 */}
      <div class="toolbar">
        <button onClick={() => fileInput.click()}>📎</button>
        <button onClick={handleSubmit} disabled={props.disabled}>
          发送
        </button>
      </div>
    </div>
  )
}
```

### 6.4.2 Session 组件

```typescript
export function SessionPage() {
  const params = useParams()
  const sdk = useSdk()
  const [messages, setMessages] = createSignal<Message[]>([])
  const [status, setStatus] = createSignal<"idle" | "busy">("idle")
  
  // 加载会话
  createEffect(() => {
    const sessionId = params.id
    if (sessionId) {
      sdk.session.get(sessionId).then(setMessages)
      
      // 订阅更新
      const unsubscribe = sdk.session.subscribe(sessionId, (update) => {
        if (update.type === "message") {
          setMessages(prev => [...prev, update.message])
        } else if (update.type === "part") {
          // 更新消息分片
        } else if (update.type === "status") {
          setStatus(update.status)
        }
      })
      
      onCleanup(unsubscribe)
    }
  })
  
  // 发送消息
  const handleSubmit = async (text: string, attachments: Attachment[]) => {
    await sdk.session.sendMessage(params.id, { text, attachments })
  }
  
  return (
    <div class="session-page">
      {/* 消息列表 */}
      <div class="messages">
        <For each={messages()}>
          {(message) => <MessageView message={message} />}
        </For>
      </div>
      
      {/* 输入框 */}
      <PromptInput onSubmit={handleSubmit} disabled={status() === "busy"} />
    </div>
  )
}
```

### 6.4.3 MessageView 组件

```typescript
export function MessageView(props: { message: Message }) {
  return (
    <div class={`message message-${props.message.type}`}>
      {/* 消息分片 */}
      <For each={props.message.parts}>
        {(part) => {
          switch (part.type) {
            case "text":
              return <TextPartView part={part} />
            case "tool":
              return <ToolPartView part={part} />
            case "file":
              return <FilePartView part={part} />
            case "reasoning":
              return <ReasoningPartView part={part} />
            default:
              return null
          }
        }}
      </For>
    </div>
  )
}

function TextPartView(props: { part: TextPart }) {
  return (
    <div class="text-part">
      <Markdown content={props.part.text} />
    </div>
  )
}

function ToolPartView(props: { part: ToolPart }) {
  const [expanded, setExpanded] = createSignal(false)
  
  return (
    <div class={`tool-part tool-${props.part.state.status}`}>
      <div class="tool-header" onClick={() => setExpanded(!expanded())}>
        <span class="tool-name">{props.part.tool}</span>
        <span class="tool-status">{props.part.state.status}</span>
      </div>
      <Show when={expanded()}>
        <div class="tool-content">
          <div class="tool-input">
            <pre>{JSON.stringify(props.part.state.input, null, 2)}</pre>
          </div>
          <Show when={props.part.state.output}>
            <div class="tool-output">
              <pre>{props.part.state.output}</pre>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
```

## 6.5 路由设计

### 6.5.1 路由配置

```typescript
// app.tsx
import { Router, Route } from "@solidjs/router"

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/session/:id" component={Session} />
      <Route path="/settings" component={Settings} />
    </Router>
  )
}
```

### 6.5.2 布局组件

```typescript
function Layout(props: { children: JSX.Element }) {
  return (
    <div class="app-layout">
      {/* 侧边栏 */}
      <aside class="sidebar">
        <nav>
          <A href="/">首页</A>
          <A href="/settings">设置</A>
        </nav>
        <SessionList />
      </aside>
      
      {/* 主内容区 */}
      <main class="main-content">
        {props.children}
      </main>
    </div>
  )
}
```

## 6.6 样式系统

### 6.6.1 TailwindCSS 配置

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin()
  ]
})
```

### 6.6.2 全局样式

```css
/* index.css */
@import "tailwindcss";

:root {
  --color-primary: #007bff;
  --color-background: #ffffff;
  --color-text: #333333;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-text: #e0e0e0;
  }
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
}
```

## 6.7 国际化

### 6.7.1 i18n 结构

```typescript
// i18n/en.ts
export default {
  common: {
    send: "Send",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete"
  },
  session: {
    new: "New Session",
    title: "Session"
  },
  settings: {
    title: "Settings",
    theme: "Theme",
    language: "Language"
  }
}

// i18n/zh.ts
export default {
  common: {
    send: "发送",
    cancel: "取消",
    save: "保存",
    delete: "删除"
  },
  session: {
    new: "新建会话",
    title: "会话"
  },
  settings: {
    title: "设置",
    theme: "主题",
    language: "语言"
  }
}
```

### 6.7.2 使用方式

```typescript
import { createI18nContext } from "@solid-primitives/i18n"
import en from "./i18n/en"
import zh from "./i18n/zh"

const [t, setLocale] = createI18nContext({ en, zh }, "en")

// 在组件中使用
function MyComponent() {
  return <button>{t("common.send")}</button>
}
```

## 6.8 对 AI-Automated-office 的参考价值

### 6.8.1 部门界面设计

```typescript
interface DepartmentUI {
  department: string
  layout: "sidebar" | "tabs" | "dashboard"
  components: {
    input: PromptInputConfig
    messages: MessageListConfig
    tools: ToolPanelConfig
    dashboard?: DashboardConfig
  }
  theme: {
    primary: string
    accent: string
  }
}

// 示例：财务部界面
const financeUI: DepartmentUI = {
  department: "finance",
  layout: "sidebar",
  components: {
    input: {
      placeholder: "描述您的财务需求...",
      features: ["ocr", "file-upload"]
    },
    messages: {
      showTimestamp: true,
      showCost: true
    },
    tools: {
      position: "right",
      tools: ["invoice_ocr", "ledger_generate", "report"]
    },
    dashboard: {
      widgets: ["receivable", "payable", "cashflow"]
    }
  },
  theme: {
    primary: "#10b981",
    accent: "#059669"
  }
}
```

### 6.8.2 关键借鉴点

1. **Context 状态管理** - 使用 SolidJS Context 管理全局状态
2. **响应式设计** - 利用 SolidJS 的细粒度响应式
3. **组件化** - 可复用的组件设计
4. **实时更新** - 通过 SSE 实现实时状态同步
5. **国际化** - 完整的 i18n 支持

---

*下一章节: [07-backend-api.md](./07-backend-api.md) - 后端 API 设计*
