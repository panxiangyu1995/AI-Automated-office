# Tasks: 本地硬件设备调用 (Story 1.13)

> **依赖**: Story 1.1 (Tauri项目初始化)

## 任务列表

- [x] 任务 1: 创建硬件模块结构
- [x] 任务 2: 实现扫描仪枚举
- [x] 任务 3: 实现扫描功能
- [x] 任务 4: 实现打印机枚举
- [x] 任务 5: 实现打印功能
- [x] 任务 6: 创建 Tauri 命令
- [x] 任务 7: 创建前端 Hook
- [x] 任务 8: 创建设备选择组件

### 任务 1: 创建硬件模块结构
- **描述**: 创建 Rust 硬件模块目录结构
- **文件**: `src-tauri/src/hardware/mod.rs`
- **验收**: 模块结构正确

### 任务 2: 实现扫描仪枚举
- **描述**: 实现跨平台扫描仪设备枚举
- **文件**: `src-tauri/src/hardware/scanner.rs`
- **验收**: 可列出扫描仪设备

### 任务 3: 实现扫描功能
- **描述**: 实现扫描文档功能
- **文件**: `src-tauri/src/hardware/scanner.rs`
- **验收**: 可执行扫描

### 任务 4: 实现打印机枚举
- **描述**: 实现跨平台打印机设备枚举
- **文件**: `src-tauri/src/hardware/printer.rs`
- **验收**: 可列出打印机设备

### 任务 5: 实现打印功能
- **描述**: 实现打印文档功能
- **文件**: `src-tauri/src/hardware/printer.rs`
- **验收**: 可执行打印

### 任务 6: 创建 Tauri 命令
- **描述**: 创建硬件相关的 Tauri 命令
- **文件**: `src-tauri/src/commands/hardware.rs`
- **验收**: 前端可调用命令

### 任务 7: 创建前端 Hook
- **描述**: 创建 useHardware Hook
- **文件**: `src/hooks/useHardware.ts`
- **验收**: Hook 可用

### 任务 8: 创建设备选择组件
- **描述**: 创建 DeviceSelector 组件
- **文件**: `src/components/common/DeviceSelector.tsx`
- **验收**: 可选择设备

## 执行顺序

1. 任务 1（模块结构）
2. 任务 2 → 任务 3（扫描功能）
3. 任务 4 → 任务 5（打印功能）
4. 任务 6 → 任务 7 → 任务 8（前端集成）

## 测试要点

- [ ] 可列出扫描仪设备
- [ ] 可执行扫描
- [ ] 可列出打印机设备
- [ ] 可执行打印
- [ ] Windows/macOS 双平台兼容
