# Tasks: 全局快捷键支持

## 任务列表

### 任务 1: 添加 Global Shortcut 插件
- **描述**: 在 Cargo.toml 中添加 tauri-plugin-global-shortcut 依赖
- **文件**: `src-tauri/Cargo.toml`
- **验收**: 插件正确加载

### 任务 2: 创建快捷键模块
- **描述**: 创建 Rust 快捷键管理模块
- **文件**: `src-tauri/src/shortcuts.rs`
- **验收**: 模块编译成功

### 任务 3: 实现默认快捷键注册
- **描述**: 实现应用启动时注册默认快捷键
- **文件**: `src-tauri/src/shortcuts.rs`
- **验收**: 默认快捷键生效

### 任务 4: 实现快捷键更新命令
- **描述**: 实现 Tauri 命令用于更新快捷键配置
- **文件**: `src-tauri/src/commands/shortcuts.rs`
- **验收**: 可通过前端更新快捷键

### 任务 5: 实现快捷键冲突检测
- **描述**: 检测快捷键是否与系统或其他应用冲突
- **文件**: `src-tauri/src/shortcuts.rs`
- **验收**: 冲突时提示用户

### 任务 6: 创建快捷键设置组件
- **描述**: 创建前端快捷键配置 UI
- **文件**: `src/features/settings/components/ShortcutSettings.tsx`
- **验收**: 可在设置中配置快捷键

### 任务 7: 实现快捷键持久化
- **描述**: 快捷键配置保存到本地存储
- **文件**: `src/stores/settingsStore.ts`, `src-tauri/src/storage/`
- **验收**: 重启后快捷键配置保留

### 任务 8: 创建快捷键 Hook
- **描述**: 创建 useGlobalShortcuts Hook
- **文件**: `src/hooks/useGlobalShortcuts.ts`
- **验收**: 前端可管理快捷键

## 执行顺序

1. 任务 1 → 任务 2（准备依赖和模块）
2. 任务 3 → 任务 4 → 任务 5（核心功能）
3. 任务 6 → 任务 7 → 任务 8（前端集成）

## 测试要点

- [ ] 默认快捷键正常工作
- [ ] 后台时快捷键仍能响应
- [ ] 快捷键配置可保存和恢复
- [ ] 快捷键冲突检测正常
- [ ] Windows/macOS 双平台兼容
- [ ] 快捷键响应时间 < 100ms
