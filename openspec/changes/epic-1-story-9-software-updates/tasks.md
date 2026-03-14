# Tasks: 软件更新机制

## 任务列表

### 任务 1: 添加 Tauri Updater 插件
- **描述**: 在 Cargo.toml 和 tauri.conf.json 中配置 Updater
- **文件**: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`
- **验收**: 插件正确加载

### 任务 2: 实现更新检查命令
- **描述**: 创建 Tauri 命令检查更新
- **文件**: `src-tauri/src/commands/update.rs`
- **验收**: 可检查更新

### 任务 3: 实现下载安装命令
- **描述**: 创建下载和安装更新命令
- **文件**: `src-tauri/src/commands/update.rs`
- **验收**: 可下载和安装更新

### 任务 4: 创建更新 Hook
- **描述**: 创建 useUpdate Hook
- **文件**: `src/hooks/useUpdate.ts`
- **验收**: Hook 可用

### 任务 5: 创建更新提醒组件
- **描述**: 创建 UpdateDialog 组件
- **文件**: `src/components/common/UpdateDialog.tsx`
- **验收**: 更新提醒正常显示

### 任务 6: 实现启动时检查更新
- **描述**: 应用启动时自动检查更新
- **文件**: `src/App.tsx`
- **验收**: 启动时自动检查

### 任务 7: 配置更新服务器
- **描述**: 配置更新服务器端点
- **文件**: `src-tauri/tauri.conf.json`
- **验收**: 可连接更新服务器

## 执行顺序

1. 任务 1（插件配置）
2. 任务 2 → 任务 3（后端命令）
3. 任务 4 → 任务 5（前端组件）
4. 任务 6 → 任务 7（集成）

## 测试要点

- [ ] 启动时自动检查更新
- [ ] 有新版本时显示提醒
- [ ] 显示更新日志
- [ ] 下载进度正常显示
- [ ] 下载完成后可安装
- [ ] 稍后提醒功能正常
