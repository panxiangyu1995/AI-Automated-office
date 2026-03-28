# 部门能力包系统 - 变更提案

## 问题陈述

当前部门能力包系统缺少核心功能实现：

1. **注册机制缺失**: 没有能力包的注册、发现、管理机制
2. **市场系统缺失**: 无法从官方市场或私有市场安装能力包
3. **版本管理缺失**: 没有版本发布、更新、回滚机制
4. **权限控制缺失**: 能力包的访问权限和操作权限未实现
5. **依赖管理缺失**: 能力包之间的依赖关系和冲突解决未实现

## 提议方案

### 核心组件

1. **CapabilityPackageRegistry** - 能力包注册表
   - 包注册与发现
   - 元数据管理
   - 生命周期管理
   - 状态同步

2. **CloudMarketClient** - 企业云端市场客户端
   - 企业云端市场（主市场）
   - 搜索与浏览
   - 下载与发布
   - ClawHub格式插件兼容

3. **ClawHubFormatAdapter** - ClawHub格式适配器
   - 导入ClawHub格式插件
   - 格式转换
   - 兼容性处理

4. **DependencyResolver** - 依赖解析器
   - 依赖图构建
   - 版本约束解析
   - 冲突检测
   - 自动解决

5. **PackagePermissionController** - 权限控制器
   - 安装权限检查
   - 运行时权限
   - 操作审计

### 文件结构

```
src-tauri/src/
├── capability/
│   ├── mod.rs              # 模块入口
│   ├── registry.rs         # 能力包注册表
│   ├── marketplace.rs      # 企业云端市场客户端
│   ├── clawhub_adapter.rs  # ClawHub格式兼容适配器
│   ├── dependency.rs       # 依赖解析
│   ├── permission.rs       # 权限控制
│   ├── version.rs          # 版本管理
│   ├── loader.rs           # 包加载器
│   └── commands.rs         # Tauri命令
└── agent/
    └── skill/              # 已存在的Skill系统
```

### 前端集成

```
src/features/capability/
├── components/
│   ├── PackageMarketplace.tsx
│   ├── InstalledPackages.tsx
│   ├── PackageDetail.tsx
│   └── PackageUpdatePanel.tsx
├── hooks/
│   ├── usePackageInstall.ts
│   ├── useMarketplaceSearch.ts
│   └── usePackageUpdates.ts
└── types/
    └── capability.ts
```

### 核心部门能力包

| 部门 | 能力包ID | 工具数 | Skills数 |
|------|----------|--------|----------|
| 人事部 | hr-capability | 5 | 4 |
| 审批中心 | approval-capability | 3 | 3 |
| 销售部 | sales-capability | 5 | 4 |
| 财务部 | finance-capability | 4 | 3 |
| 仓储部 | warehouse-capability | 4 | 3 |
| 管理层 | management-capability | 3 | 2 |

## 实现计划

### Phase 1: 注册机制基础
- 创建capability模块结构
- 实现CapabilityPackageRegistry核心
- 实现包元数据管理
- 实现基础Tauri命令

### Phase 2: 市场系统
- 实现MarketplaceClient trait
- 实现ClawHub市场客户端
- 实现私有市场客户端
- 实现搜索与下载

### Phase 3: 版本与依赖
- 实现语义版本解析
- 实现依赖解析器
- 实现冲突检测
- 实现更新机制

### Phase 4: 权限与审计
- 实现权限控制器
- 实现操作审计
- 实现部门级权限
- 前端集成

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 市场服务不可用 | 高 | 实现本地缓存和离线模式 |
| 依赖冲突 | 中 | 自动解决策略，用户确认 |
| 权限绕过 | 高 | 后端强制权限检查 |
| 包签名验证失败 | 高 | 拒绝安装，记录审计 |

## 验收标准

- [ ] 支持能力包注册与发现
- [ ] 支持从ClawHub市场安装
- [ ] 支持从私有市场安装
- [ ] 支持版本管理与更新
- [ ] 支持依赖解析
- [ ] 支持权限控制
- [ ] 支持操作审计
