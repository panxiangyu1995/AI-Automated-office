## Context

当前流式消息渲染存在以下问题：
1. `part_delta`事件存在但UI未正确响应
2. 工具调用卡片状态更新不完整
3. 大量消息时列表滚动卡顿

**现有代码问题：**
- `src/features/streaming/runtime/syncEngine.ts` 事件处理逻辑有问题
- `MessageList`未使用虚拟列表，大数据量时性能差
- `ChatMessage`流式渲染使用setState而非增量更新

**性能现状：**
- 100条消息时滚动帧率 < 30fps
- 流式文本更新延迟 > 200ms
- 内存占用过高（未及时释放旧消息）

## Goals / Non-Goals

**Goals:**
- 修复part_delta事件处理，实现流畅的流式文本渲染
- 实现虚拟化消息列表，支持1000+消息流畅滚动
- 实现工具调用卡片的实时状态展示
- 优化内存占用

**Non-Goals:**
- 不改变消息数据模型
- 不改变后端流式输出格式
- 不支持IE等旧浏览器

## Decisions

### Decision 1: 流式文本渲染

**选择：** 使用useRef存储流式内容 + requestAnimationFrame批量更新

**原有问题：**
```typescript
// 问题：每次delta都触发完整setState
const handlePartDelta = (delta: PartDelta) => {
  setContent(prev => prev + delta.text);  // ❌ 频繁setState
};
```

**优化方案：**
```typescript
// 优化：使用ref存储 + RAF批量更新
const contentRef = useRef('');
const pendingUpdates = useRef<PartDelta[]>([]);

const handlePartDelta = (delta: PartDelta) => {
  pendingUpdates.current.push(delta);
  flushPendingUpdates();
};

const flushPendingUpdates = () => {
  requestAnimationFrame(() => {
    if (pendingUpdates.current.length > 0) {
      contentRef.current += pendingUpdates.current.map(d => d.text).join('');
      pendingUpdates.current = [];
      setDisplayContent(contentRef.current);  // 单次setState
    }
  });
};
```

### Decision 2: 虚拟化消息列表

**选择：** 使用`@tanstack/react-virtual`实现虚拟列表

**实现要点：**
- 只渲染可视区域内的消息（上下各Buffer 5条）
- 固定消息高度估算，减少高度计算
- 支持动态高度（工具调用卡片等）

**配置：**
```typescript
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80,  // 预估高度
  overscan: 5,
});
```

### Decision 3: 工具调用状态展示

**选择：** 统一状态流转 + 实时UI更新

**状态定义：**
```typescript
type ToolCallStatus = 'pending' | 'running' | 'success' | 'error';

interface ToolCallState {
  tool_call_id: string;
  status: ToolCallStatus;
  progress?: string;      // 如 "Running... 3/5"
  result?: ToolResult;
  error?: string;
}
```

**事件驱动：**
```
tool_call_start → 显示pending状态
tool_call_progress → 更新progress
tool_call_result → 显示success + 结果
tool_call_error → 显示error + 错误信息
```

### Decision 4: 内存优化

**选择：** 限制内存中消息数量 + 懒加载历史

**策略：**
- 内存中最多保留100条消息
- 超出100条时将旧消息持久化到SQLite
- 滚动到顶部时懒加载历史
- 流式内容完成后立即压缩

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 虚拟列表复杂 | 开发周期长 | 使用成熟库，参考文档实现 |
| RAF时序问题 | 内容顺序错乱 | 确保delta按顺序处理 |
| 动态高度计算 | 滚动跳动 | 预估算高度 + 事后修正 |

## Migration Plan

**Phase 1: 流式渲染修复**
1. 重构part_delta事件处理
2. 实现RAF批量更新
3. 验证流式文本正确性

**Phase 2: 虚拟列表实现**
1. 引入@tanstack/react-virtual
2. MessageList虚拟化改造
3. 性能测试与调优

**Phase 3: 工具调用状态**
1. 定义ToolCallState类型
2. 事件系统添加tool_call_progress
3. ChatMessage组件状态展示

**Phase 4: 内存优化**
1. 实现消息数量限制
2. 实现懒加载历史
3. 内存监控

**Rollback:** 分支保护，旧版本MessageList保留备用

## Open Questions

1. 虚拟列表是否影响现有滚动行为？需确认UX是否接受
2. 工具调用progress事件后端是否支持？需确认events.rs
3. 消息数量限制是否需要用户可配置？
