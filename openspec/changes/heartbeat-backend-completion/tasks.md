# Tasks: 心跳机制后端完善

## 实现类型
- **类型**: enhancement
- **优先级**: high (P1)
- **阶段**: Phase 3 - P1核心

## 任务列表

### Task 1: 创建HEARTBEAT.md解析器
- **描述**: 实现YAML解析和验证
- **文件**:
  - `src-tauri/src/agent/heartbeat/parser.rs` (新建)
- **验收**: 能够正确解析HEARTBEAT.md文件

### Task 2: 实现预检机制
- **描述**: 实现网络/服务/条件预检
- **文件**:
  - `src-tauri/src/agent/heartbeat/precheck.rs` (新建)
- **验收**: 预检失败时任务不执行

### Task 3: 实现隔离执行器
- **描述**: 实现超时控制和隔离执行
- **文件**:
  - `src-tauri/src/agent/heartbeat/executor.rs` (新建)
- **验收**: 执行过程隔离

### Task 4: 实现重试机制
- **描述**: 实现静默重试和超时通知
- **文件**:
  - `src-tauri/src/agent/heartbeat/executor.rs`
- **验收**: 符合retry配置

### Task 5: 实现事件通知
- **描述**: 实现心跳事件通知
- **文件**:
  - `src-tauri/src/agent/heartbeat/notification.rs` (新建)
- **验收**: 失败时发送通知

### Task 6: 与前端集成
- **描述**: 前端HeartbeatChecklist调用后端
- **文件**:
  - `src/features/agent/components/HeartbeatChecklist.tsx`
- **验收**: UI正常显示心跳状态
