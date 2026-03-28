# 部门能力包系统 - 任务清单

## Phase 1: 注册机制基础

### Task 1.1: 创建capability模块结构
- 创建 `src-tauri/src/capability/mod.rs`
- 定义核心数据结构（CapabilityPackageMeta, RegistryEntry等）
- 定义错误类型和结果类型
- 添加模块导出到 `lib.rs`

### Task 1.2: 实现CapabilityPackageRegistry核心
- 创建 `src-tauri/src/capability/registry.rs`
- 实现注册表状态管理
- 实现register/unregister方法
- 实现持久化存储

### Task 1.3: 实现包元数据管理
- 实现CapabilityPackageManifest解析
- 实现元数据验证
- 实现图标和截图管理
- 实现关键词和分类索引

### Task 1.4: 实现基础Tauri命令
- 创建 `src-tauri/src/capability/commands.rs`
- 实现list_installed_packages命令
- 实现enable/disable命令
- 注册命令到invoke_handler

## Phase 2: 企业云端市场

### Task 2.1: 实现MarketplaceClient trait
- 创建 `src-tauri/src/capability/marketplace.rs`
- 定义MarketplaceClient trait
- 定义搜索和下载接口
- 定义发布接口

### Task 2.2: 实现企业云端市场客户端
- 实现CloudMarketClient
- 实现API调用（企业云端市场）
- 实现响应解析
- 实现错误处理

### Task 2.3: 实现ClawHub格式兼容适配器
- 创建 `src-tauri/src/capability/clawhub_adapter.rs`
- 实现ClawHub格式解析
- 实现格式转换为企业能力包格式
- 实现兼容性验证

### Task 2.4: 实现搜索与下载
- 实现search_marketplace命令
- 实现install_capability_package命令
- 实现下载进度回调
- 实现安装后验证

## Phase 3: 版本与依赖

### Task 3.1: 实现语义版本解析
- 创建 `src-tauri/src/capability/version.rs`
- 实现SemanticVersion解析
- 实现版本比较
- 实现版本约束解析

### Task 3.2: 实现依赖解析器
- 创建 `src-tauri/src/capability/dependency.rs`
- 实现DependencyResolver
- 实现依赖图构建
- 实现拓扑排序

### Task 3.3: 实现冲突检测
- 实现版本冲突检测
- 实现资源冲突检测
- 实现依赖循环检测
- 实现冲突解决策略

### Task 3.4: 实现更新机制
- 实现check_package_updates命令
- 实现update_capability_package命令
- 实现自动更新检查
- 实现更新回滚

## Phase 4: 权限与审计

### Task 4.1: 实现权限控制器
- 创建 `src-tauri/src/capability/permission.rs`
- 实现PackagePermissionController
- 实现安装权限检查
- 实现运行时权限检查

### Task 4.2: 实现操作审计
- 集成审计日志系统
- 记录安装/卸载事件
- 记录启用/禁用事件
- 记录权限变更事件

### Task 4.3: 实现部门级权限
- 实现部门能力包隔离
- 实现跨部门访问控制
- 实现部门管理员权限
- 实现租户级权限

### Task 4.4: 前端集成
- 创建PackageMarketplace组件
- 创建InstalledPackages组件
- 创建PackageDetail组件
- 实现搜索和安装流程

## 依赖关系

```
Task 1.1 ─┬─> Task 1.2 ─> Task 1.3 ─> Task 1.4
          │
          └─> Task 2.1 ─┬─> Task 2.2 ─> Task 2.4
                        │
                        └─> Task 2.3 ─> Task 2.4
                                        │
          ┌─────────────────────────────┘
          │
          └─> Task 3.1 ─> Task 3.2 ─> Task 3.3 ─> Task 3.4
                                                    │
          ┌─────────────────────────────────────────┘
          │
          └─> Task 4.1 ─> Task 4.2 ─> Task 4.3 ─> Task 4.4
```

## 估算

| Phase | 任务数 | 预估工时 |
|-------|--------|----------|
| Phase 1 | 4 | 3天 |
| Phase 2 | 4 | 4天 |
| Phase 3 | 4 | 4天 |
| Phase 4 | 4 | 3天 |
| **总计** | **16** | **14天** |
