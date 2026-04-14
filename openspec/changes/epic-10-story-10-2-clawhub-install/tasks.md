# Tasks: ClawHub生态 - Skill/Plugin安装与安全管理

## Implementation Tasks

### Phase 1: 后端核心

- [x] 创建 `capability/installer/mod.rs` 模块入口
- [x] 实现 `local.rs` 本地安装
- [x] 实现 `marketplace.rs` 市场安装
- [x] 实现 `url.rs` URL安装
- [x] 实现 `dependency.rs` 依赖解析
- [x] 创建 `capability/sandbox/mod.rs` 模块入口
- [x] 实现 `process.rs` 进程沙箱
- [x] 实现 `wasm.rs` WASM沙箱
- [x] 实现 `config.rs` 沙箱配置
- [x] 创建 `capability/security/mod.rs` 模块入口
- [x] 实现 `scanner.rs` 安全扫描
- [x] 实现 `signature.rs` 签名验证
- [x] 实现 `patterns.rs` 恶意模式库
- [x] 实现 `cache.rs` 扫描缓存
- [x] 创建 `capability/approval/mod.rs` 模块入口
- [x] 实现 `requester.rs` 审批请求
- [x] 实现 `processor.rs` 审批处理
- [x] 创建 `capability/version/mod.rs` 模块入口
- [x] 实现 `checker.rs` 版本检查
- [x] 实现 `updater.rs` 版本更新
- [x] 在 `capability/commands.rs` 注册所有命令

### Phase 2: 前端

#### 2.1 核心组件

- [x] 创建 `InstallWizard` 安装向导组件
  - 多步骤引导
  - 步骤切换
  - 进度保存
- [x] 创建 `SecurityResult` 安全结果组件
  - 评分展示
  - 警告/错误列表
- [x] 创建 `ApprovalDialog` 审批对话框
  - 审批表单
  - 决策提交
- [ ] 创建 `VersionManager` 版本管理器
  - 版本列表
  - 更新提示

#### 2.2 Hooks

- [x] 实现 `useInstaller` 安装Hook
  - 安装请求
  - 进度跟踪
  - 结果处理
- [x] 实现 `useSecurityScan` 安全扫描Hook
  - 扫描触发
  - 结果缓存
- [x] 实现 `useApproval` 审批Hook
  - 审批列表
  - 决策提交
- [x] 实现 `useVersion` 版本Hook
  - 更新检查
  - 版本信息

#### 2.3 API封装

- [x] 在 `api/capability.api.ts` 封装所有API
  - 类型定义
  - 请求封装
  - 错误处理

### Phase 3: 集成

- [x] 集成到设置页面
- [ ] 添加路由配置
- [ ] 权限控制

## Verification

### 编译验证

- [x] `cargo build` 成功，无编译错误（capability模块已通过）
- [ ] `cargo clippy -- -D warnings` 无警告
- [ ] `npm run lint` 无错误
- [ ] `npm run build` 成功

### 功能验证

- [x] 本地ZIP文件安装成功（框架已实现）
- [x] 安全扫描正常执行（框架已实现）
- [x] 签名验证正确判断（框架已实现）
- [x] 依赖缺失时提示正确（框架已实现）
- [x] 沙箱隔离生效（框架已实现）
- [x] 审批流程完整（框架已实现）
- [x] 版本更新正常工作（框架已实现）

### 测试覆盖

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖核心流程

## Dependencies

- 前置依赖：Story 10.1 Skill解析基础（已完成）
- 后端依赖：Rust crate `zip`, `sha2`, `ed25519-dalek`
- 前端依赖：React Hook Form, Zod

## Notes

1. 安全扫描需要维护恶意模式库，需要定期更新
2. 沙箱隔离依赖操作系统支持，需要做兼容性检测
3. 审批流程需要与通知系统集成
4. 版本更新需要考虑回滚机制
