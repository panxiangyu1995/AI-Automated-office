## 1. Streaming Text Render Fix

- [ ] 1.1 Refactor part_delta event handling in useChatStore
- [ ] 1.2 Implement RAF batching for content updates
- [ ] 1.3 Add useRef for streaming content storage
- [ ] 1.4 Add blinking cursor animation for streaming state

## 2. Virtualized Message List

- [ ] 2.1 Install @tanstack/react-virtual dependency
- [ ] 2.2 Refactor MessageList to use useVirtualizer
- [ ] 2.3 Implement dynamic height estimation
- [ ] 2.4 Add scroll-to-top for loading older messages
- [ ] 2.5 Implement lazy loading from SQLite

## 3. Tool Call Status Display

- [ ] 3.1 Define ToolCallState interface with status types
- [ ] 3.2 Update ChatMessage to display tool call status
- [ ] 3.3 Implement pending/running/success/error UI states
- [ ] 3.4 Add progress text display for long-running tools
- [ ] 3.5 Verify tool_call_progress events work

## 4. Memory Optimization

- [ ] 4.1 Implement message count limit (100 in-memory)
- [ ] 4.2 Implement lazy loading when scrolling up
- [ ] 4.3 Add memory monitoring for message list

## 5. Performance Testing

- [ ] 5.1 Measure scroll FPS with 1000 messages
- [ ] 5.2 Measure streaming text latency
- [ ] 5.3 Measure memory usage with large history
- [ ] 5.4 Verify 60fps scroll target achieved
