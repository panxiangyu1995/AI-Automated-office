# Epic 10 Story 10.2: ClawHub生态 - Skill/Plugin安装与安全管理

## Why

ClawHub是平台的能力生态中心，Skill和Plugin是平台扩展的核心载体。当前平台缺少完整的能力安装和安全管控机制，存在以下痛点：

1. **安全风险**：无法验证安装包来源，存在恶意代码注入风险
2. **运维困难**：缺乏统一的版本管理和更新机制
3. **审计缺失**：安装/卸载操作无记录，无法追溯
4. **审批空白**：企业场景下无法对高风险能力进行审批控制

**量化收益**：
- 预计减少能力安装相关安全事件 90%
- 降低运维成本 40%（统一管理）
- 支持企业合规审计要求

## What Changes

### 新增功能

1. **本地文件导入**
   - 支持拖拽上传 .zip 包
   - 支持解析 Skill.md/Package.json
   - 自动提取元数据和依赖

2. **市场安装**
   - 对接 ClawHub 官方市场 API
   - 支持私有市场配置
   - 一键安装和版本锁定

3. **沙箱执行环境**
   - 进程级沙箱隔离
   - WASM 沙箱（可选）
   - 资源限制（CPU/内存/网络）

4. **安全扫描**
   - 病毒/恶意代码检测
   - 签名验证
   - 权限分析

5. **安装审批**
   - 三级审批策略
   - 审批历史记录
   - 紧急安装通道

### 修改功能

- 无

### 删除功能

- 无

## Capabilities

### New Capabilities

| Capability | 描述 | 触发场景 |
|-----------|------|----------|
| `clawhub-install-local` | 本地文件安装 | 用户拖拽上传 |
| `clawhub-install-market` | 市场资源安装 | 用户选择市场资源 |
| `clawhub-uninstall` | 卸载能力 | 用户主动卸载 |
| `clawhub-update-check` | 版本更新检查 | 定时/手动触发 |
| `clawhub-update-execute` | 执行版本更新 | 用户确认 |
| `clawhub-security-scan` | 安全扫描 | 安装前自动触发 |
| `clawhub-signature-verify` | 签名验证 | 安装前验证 |
| `clawhub-approve-submit` | 提交安装审批 | 高风险能力 |
| `clawhub-approve-process` | 审批处理 | 审批人操作 |

### Modified Capabilities

- 无

## Impact

### 前端影响

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/features/capability/components/InstallWizard.tsx` | 新增 | 安装向导 |
| `src/features/capability/components/SecurityResult.tsx` | 新增 | 安全扫描结果 |
| `src/features/capability/components/ApprovalDialog.tsx` | 新增 | 审批对话框 |
| `src/features/capability/components/VersionManager.tsx` | 新增 | 版本管理器 |
| `src/features/capability/hooks/useInstaller.ts` | 新增 | 安装Hook |
| `src/features/capability/hooks/useSecurity.ts` | 新增 | 安全扫描Hook |
| `src/features/settings/pages/CapabilitySettings.tsx` | 修改 | 集成能力管理入口 |

### 后端影响

| 模块 | 变更类型 | 说明 |
|------|----------|------|
| `src-tauri/src/capability/installer/` | 新增 | 安装器模块 |
| `src-tauri/src/capability/sandbox/` | 新增 | 沙箱模块 |
| `src-tauri/src/capability/security/` | 新增 | 安全模块 |
| `src-tauri/src/capability/approval/` | 新增 | 审批模块 |
| `src-tauri/src/commands/capability.rs` | 修改 | 新增命令 |

### 依赖

- 前置依赖：Story 10.1 Skill解析基础（FR700-FR703）
- 被依赖：无

### 数据库影响

| 表 | 操作 | 说明 |
|----|------|------|
| `capability_installs` | CREATE | 安装记录 |
| `install_approvals` | CREATE | 安装审批 |
| `capability_versions` | CREATE | 版本记录 |

## PRD对齐

### 功能需求（FR）

| FR编号 | 描述 | 实现方式 |
|--------|------|----------|
| FR704 | 能力资源安装 | installer模块 |
| FR705 | 能力资源卸载 | uninstall命令 |
| FR706 | 资源版本管理 | version表 |
| FR707 | 安装来源验证 | signature验证 |
| FR708 | 能力安装审批 | approval模块 |
| FR709 | 能力安装日志 | audit日志 |
| FR710 | 资源更新检查 | update-check命令 |
| FR713 | 本地文件导入 | local installer |
| FR746 | 签名验证 | signature模块 |
| FR747 | 安全扫描 | security模块 |
| FR748 | 沙箱执行 | sandbox模块 |

### 非功能需求（NFR）

| NFR编号 | 描述 | 约束 |
|----------|------|------|
| NFR1 | 性能 | 安装时间<5s |
| NFR16 | 安全 | TLS+签名验证 |
| NFR22 | 可审计 | 完整操作日志 |

### 架构约束（ARCH）

| ARCH编号 | 描述 |
|----------|------|
| ARCH-01 | 分层微内核架构 |
| ARCH-06 | 工具命名规范 |

## Risks

| 风险 | 影响 | 可能性 | 缓解措施 |
|------|------|--------|----------|
| 恶意能力执行 | 高 | 低 | 沙箱隔离+签名验证 |
| 安装包损坏 | 中 | 低 | 完整性校验 |
| 依赖冲突 | 中 | 中 | 依赖解析+提示 |
| 审批流程阻塞 | 中 | 中 | 紧急安装通道 |
| 卸载后数据丢失 | 低 | 低 | 备份机制 |
