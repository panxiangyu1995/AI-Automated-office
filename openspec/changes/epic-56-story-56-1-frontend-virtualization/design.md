# Design: 前端性能优化 - 大列表虚拟化

## 技术方案

### 实现类型
- **类型**: polish (优化完善)
- **优先级**: low
- **阶段**: 技术债务与优化
- **是否需要后端**: 否（纯前端优化）

### 技术选型

#### 虚拟化库对比
| 库 | 包大小 | 维护状态 | React 18兼容 | 推荐 |
|---|--------|----------|-------------|------|
| react-window | ~6KB | 活跃 | 是 | 首选 |
| @tanstack/react-virtual | ~14KB | 非常活跃 | 是 | 备选 |
| react-virtualized | ~24KB | 维护中 | 需要适配 | 不推荐 |

**选择理由**: react-window包体积小、API简洁、性能优秀，足以满足消息列表虚拟化需求。

### 核心实现

#### 1. MessageList虚拟化

```tsx
// src/features/agent/components/MessageList.tsx
import { FixedSizeList as List } from 'react-window';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  onMessageSelect?: (id: string) => void;
}

// 使用 @tanstack/react-virtual 实现动态高度支持
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMessageSelect
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 估算每条消息高度
    overscan: 5, // 视口外渲染数量
  });

  return (
    <div
      ref={parentRef}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          return (
            <div
              key={message.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
            >
              <MessageItem
                message={message}
                onClick={() => onMessageSelect?.(message.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### 2. 流式输出适配

```tsx
// 流式消息追加逻辑
const [streamingMessage, setStreamingMessage] = useState<string>('');

useEffect(() => {
  if (isStreaming) {
    // 防抖更新，避免频繁重绘
    const timeoutId = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `streaming-${Date.now()}`,
        role: 'assistant',
        content: streamingMessage,
        timestamp: Date.now(),
      }]);
    }, 16); // ~60fps

    return () => clearTimeout(timeoutId);
  }
}, [streamingMessage, isStreaming]);
```

#### 3. 组件懒加载

```tsx
// 路由级懒加载
const AgentPanel = lazy(() => import('./features/agent/AgentPanel'));
const SettingsPanel = lazy(() => import('./features/settings/SettingsPanel'));

// 组件级懒加载
const MessageChart = lazy(() => import('./components/MessageChart'));

// 使用示例
<Suspense fallback={<Skeleton />}>
  <MessageChart data={chartData} />
</Suspense>
```

#### 4. 大表单拆分

```tsx
// 复杂表单拆分策略
interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  collapsed?: boolean;
}

// 分步加载表单区块
const DynamicFormRenderer: React.FC<{ schema: FormSchema }> = ({ schema }) => {
  const [visibleSections, setVisibleSections] = useState<string[]>([schema.sections[0].id]);

  return (
    <div>
      {schema.sections.map((section) => (
        <Collapse
          key={section.id}
          in={visibleSections.includes(section.id)}
          onEntered={() => setVisibleSections(prev => [...prev, section.id])}
        >
          <FormSection fields={section.fields} />
        </Collapse>
      ))}
    </div>
  );
};
```

### 模块结构

```
src/
├── features/
│   └── agent/
│       └── components/
│           ├── MessageList.tsx          # 虚拟化消息列表
│           ├── VirtualizedMessageItem.tsx  # 虚拟化消息项
│           └── ChatPanel.tsx            # 聊天面板（优化后）
├── components/
│   └── ui/
│       └── LazySuspense.tsx            # 懒加载封装
├── hooks/
│   ├── useVirtualizedList.ts           # 虚拟化列表Hook
│   └── useStreamingOptimize.ts         # 流式输出优化Hook
└── utils/
    └── performance.ts                  # 性能工具函数
```

### 状态管理

使用Zustand进行状态管理，无需特殊变更：
- `appStore` - 应用状态
- `cacheStore` - 缓存状态（消息历史）

### 安全考虑

- 无安全相关变更（本Story为纯性能优化）

### 性能指标

| 指标 | 优化前 | 优化后 | 目标 |
|------|--------|--------|------|
| 消息列表滚动帧率 | ~30fps | 60fps | 60fps |
| 10000条消息内存占用 | ~200MB | <100MB | <100MB |
| 大表单首次渲染时间 | ~2000ms | <1000ms | <1000ms |
| 流式输出CPU占用 | 持续高 | 间歇性低 | 间歇性低 |
