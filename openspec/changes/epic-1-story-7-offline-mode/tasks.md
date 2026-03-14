# Tasks: 离线模式支持

## 任务列表

### 任务 1: 创建网络状态 Hook
- **描述**: 创建 useNetworkStatus Hook
- **文件**: `src/hooks/useNetworkStatus.ts`
- **验收**: 可检测网络状态变化

### 任务 2: 创建离线提示组件
- **描述**: 创建 OfflineIndicator 组件
- **文件**: `src/components/common/OfflineIndicator.tsx`
- **验收**: 离线时显示提示

### 任务 3: 实现同步队列
- **描述**: 创建同步队列管理模块
- **文件**: `src-tauri/src/sync/queue.rs`
- **验收**: 可管理待同步数据

### 任务 4: 创建同步数据库表
- **描述**: 创建 sync_queue 表
- **文件**: `src-tauri/src/storage/migrations/`
- **验收**: 数据库迁移成功

### 任务 5: 实现网络状态检测命令
- **描述**: 创建 Tauri 命令检测网络状态
- **文件**: `src-tauri/src/commands/network.rs`
- **验收**: 可检测网络状态

### 任务 6: 创建同步状态组件
- **描述**: 创建同步状态显示组件
- **文件**: `src/components/common/SyncStatus.tsx`
- **验收**: 显示同步进度

### 任务 7: 集成到应用
- **描述**: 在 App.tsx 中集成离线提示
- **文件**: `src/App.tsx`
- **验收**: 离线提示正常显示

## 执行顺序

1. 任务 1 → 任务 5（网络检测）
2. 任务 3 → 任务 4（同步队列）
3. 任务 2 → 任务 6（UI 组件）
4. 任务 7（集成）

## 测试要点

- [ ] 离线时显示提示
- [ ] 网络恢复后提示消失
- [ ] 待同步数据加入队列
- [ ] 同步状态正确显示
