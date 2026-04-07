# Tasks: 统一消息通知系统

## 实现类型
- **类型**: new
- **优先级**: critical
- **阶段**: Phase 2 - 平台能力

## 任务列表

### Task 1: 创建消息数据模型
- **描述**: 定义 Message、NotificationPreferences 类型
- **文件**: `src/features/message/types/message.types.ts`

### Task 2: 实现消息 CRUD API
- **描述**: 创建消息发送、查询、标记已读 API
- **文件**: `src-tauri/src/message/commands.rs`

### Task 3: 实现未读计数
- **描述**: 实现未读消息计数和实时更新
- **文件**: `src-tauri/src/message/unread.rs`

### Task 4: 实现免打扰模式
- **描述**: 实现通知偏好和免打扰设置
- **文件**: `src-tauri/src/message/preferences.rs`

### Task 5: 创建消息 Store
- **描述**: 创建消息 Zustand Store
- **文件**: `src/features/message/stores/messageStore.ts`

### Task 6: 创建通知铃铛组件
- **描述**: 创建通知铃铛图标和下拉列表
- **文件**: `src/features/message/components/NotificationBell.tsx`

### Task 7: 创建消息列表页面
- **描述**: 创建消息列表和详情页面
- **文件**: `src/features/message/components/MessageList.tsx`

## 测试要点

- [x] 单元测试 - 消息 CRUD、未读计数
- [x] 集成测试 - 消息 API
- [ ] E2E 测试 - 消息通知流程
- [x] 浏览器测试 - 页面交互
