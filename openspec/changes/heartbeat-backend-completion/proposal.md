# Proposal: 心跳机制后端完善

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

心跳机制骨架已存在：
- `src-tauri/src/agent/heartbeat/` - 心跳模块
- `src/features/agent/components/HeartbeatChecklist.tsx` - 前端UI

**缺失部分**：HEARTBEAT.md解析器、预检机制、隔离执行。

## 目标

完善心跳机制（FR1127-FR1145）：
1. HEARTBEAT.md解析器
2. 心跳任务预检机制
3. 隔离执行环境
4. 静默确认与重试超时
5. 心跳事件通知

## 范围

### 包含
- HEARTBEAT.md解析
- 预检执行
- 隔离执行
- 事件通知

### 不包含
- 心跳UI（已有）

## 影响范围

### 后端
- `src-tauri/src/agent/heartbeat/parser.rs` - HEARTBEAT.md解析器
- `src-tauri/src/agent/heartbeat/precheck.rs` - 预检模块
- `src-tauri/src/agent/heartbeat/executor.rs` - 隔离执行器

## 依赖

- **前置依赖**: Task 160 (心跳机制后端)
- **后置依赖**: Task 176 (定时任务系统完善)

## 验收标准

1. 能够解析HEARTBEAT.md文件
2. 任务执行前进行预检
3. 执行过程隔离，不会互相影响
4. 失败时静默重试，超时通知
