# Specification: 主Agent协调器 - 流式事件总线集成

## 需求来源

### PRD 需求
- FR405: Agent思考过程可视化
- FR406: 工具调用状态实时展示
- FR407: 执行进度流式反馈

### 架构约束
- ADR-001: 微内核架构
- ADR-037: Tauri命令接口规范

### UX 规范
- UX-01: AI对话交互界面规范
- UX-04: 状态反馈与加载规范
- UX-05: 确认对话框规范

## 功能规格

### 用户故事
As a 用户,
I want to 实时看到AI的思考过程、工具调用状态和执行进度,
So that 我能了解AI正在做什么，感到交互透明可控。

### 验收场景

#### Scenario 1: 思考过程实时展示
- **GIVEN** 用户发送了消息
- **WHEN** AI开始处理请求
- **THEN** 前端显示"正在思考..."并逐字显示思考内容
- **AND** 思考内容带有打字机效果

#### Scenario 2: 工具调用状态展示
- **GIVEN** AI需要调用工具
- **WHEN** 工具开始执行
- **THEN** 显示工具名称和参数
- **AND** 工具执行完成后显示结果和耗时

#### Scenario 3: 需要用户确认
- **GIVEN** AI需要用户确认某个操作
- **WHEN** 确认事件触发
- **THEN** 弹出确认对话框，显示操作详情
- **AND** 用户可选择确认或取消

#### Scenario 4: 执行进度展示
- **GIVEN** AI执行多步骤任务
- **WHEN** 执行过程中
- **THEN** 显示当前步骤和总步骤数
- **AND** 显示进度百分比

## 数据规格

### 事件类型

#### ThinkingEvent
| 字段 | 类型 | 描述 |
|------|------|------|
| session_id | string | 会话ID |
| content | string | 思考内容 |
| delta | string | 增量内容（用于打字机效果） |

#### ToolCallingEvent
| 字段 | 类型 | 描述 |
|------|------|------|
| session_id | string | 会话ID |
| tool_name | string | 工具名称 |
| tool_args | object | 工具参数 |
| call_id | string | 调用ID |

#### ToolResultEvent
| 字段 | 类型 | 描述 |
|------|------|------|
| session_id | string | 会话ID |
| tool_name | string | 工具名称 |
| call_id | string | 调用ID |
| result | any | 工具返回结果 |
| duration_ms | number | 执行耗时(毫秒) |
| success | boolean | 是否成功 |

#### ConfirmationEvent
| 字段 | 类型 | 描述 |
|------|------|------|
| session_id | string | 会话ID |
| confirmation_id | string | 确认项ID |
| title | string | 确认标题 |
| message | string | 确认消息 |
| options | ConfirmationOption[] | 选项列表 |

## 边界条件

- **事件频率限制**: thinking 事件最多每 100ms 一个
- **事件缓冲**: 合并短时间内的多个事件
- **内存限制**: 单会话最多保留 1000 条事件
- **断线重连**: 自动重连并同步当前状态
- **事件丢失**: 使用确认机制确保关键事件不丢失

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| STREAM_001 | 连接失败 | 自动重连，最多3次 |
| STREAM_002 | 事件发送失败 | 记录日志，丢弃事件 |
| STREAM_003 | 会话不存在 | 返回错误，前端显示提示 |
| STREAM_004 | 事件频率超限 | 丢弃事件，记录警告 |

## 接口定义

### Tauri 命令

```rust
#[tauri::command]
async fn subscribe_events(
    session_id: String,
    window: Window,
) -> Result<(), String>;

#[tauri::command]
async fn unsubscribe_events(
    session_id: String,
) -> Result<(), String>;

#[tauri::command]
async fn send_confirmation(
    confirmation_id: String,
    choice: String,
) -> Result<(), String>;
```

### 前端事件订阅

```typescript
// 使用示例
const unsubscribe = window.runtimeEvents.subscribe(
  'session_123',
  (event) => {
    switch (event.type) {
      case 'thinking':
        thinkingDisplay.append(event.payload.delta);
        break;
      case 'tool_calling':
        toolCallDisplay.show(event.payload);
        break;
      // ...
    }
  }
);
```
