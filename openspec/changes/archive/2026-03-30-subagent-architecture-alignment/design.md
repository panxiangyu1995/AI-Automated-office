## Context

### 现状分析

当前 AI-Automated-office 的 SubAgent 架构存在以下问题：

1. **配置管理**：Agent 配置硬编码在代码中，缺乏灵活的外部配置能力
2. **权限模型**：仅支持 tool 级别的 allowed/denied，粒度粗糙
3. **Agent 分类**：无明确的 primary/subagent 区分，概念模糊
4. **切换 UI**：切换 Agent 需要进入注册表，流程繁琐

### KiloCode 参考

KiloCode 提供了成熟的参考实现：
- 文件系统 + Markdown 配置格式
- PermissionNext.Ruleset 细粒度权限
- 明确的 mode 分类（primary/subagent/all）
- 轻量级 ModeSwitcher 组件

### 约束条件

- **项目定位**：我们是 **AI 赋能的 ERP 办公系统**，而非代码开发工具
- 保持与现有 PRD 和架构文档的兼容性
- 前端使用 React + TypeScript + Shadcn/ui
- 后端使用 Rust + Tauri
- 配置格式参考 KiloCode 但适配办公场景
- **精简策略**：先实现 1-2 个核心 Agent（office-general + office-specialist），后续按需扩展

## Goals / Non-Goals

**Goals:**
- 引入 Markdown + YAML front matter 配置格式
- 实现 PermissionRuleset 细粒度权限控制
- 明确 Agent Mode 分类（primary/subagent）
- 提供轻量级 ModeSwitcher 组件
- 实现多层配置合并机制
- 重构 Agent 注册表 UI
- 定义适合办公场景的 Agent 类型

**Non-Goals:**
- 不修改现有的 Session 管理机制
- 不改变 SubAgent 执行引擎的核心逻辑
- 不引入新的存储后端（继续使用 SQLite）
- 不实现云端同步功能
- 不做代码开发类 Agent（code/plan/debug 等）

## Decisions

### Decision 1: 配置格式采用 Markdown + YAML Front Matter

**选择**：采用与 KiloCode 相似的 `.opencode/agent/*.md` 格式

**理由**：
- 人类可读、易于编辑和版本控制
- 支持在配置文件中直接写 prompt 模板
- 便于用户共享和导入 agent 配置

**Alternatives Considered**:
- JSON 格式：机器友好但人类不友好
- TOML 格式：不支持在配置中嵌入长文本
- 纯 YAML：无法存储复杂的 prompt 模板

### Decision 2: 权限模型采用 Ruleset 结构

**选择**：实现 `PermissionRuleset`，支持操作级别权限

```rust
pub struct PermissionRule {
    pub operation: String,      // department, approval, document, etc.
    pub pattern: String,        // glob pattern for resources
    pub action: PermissionAction,  // allow, ask, deny
}
```

**理由**：
- 与 KiloCode 对齐，便于参考其最佳实践
- 支持细粒度控制，如 `approval: {"expense_*": "ask"}`
- 支持通配符匹配

**办公场景操作类型**：
- `department` - 部门数据访问
- `approval` - 审批操作
- `document` - 文档操作
- `employee` - 员工信息操作
- `finance` - 财务数据操作
- `warehouse` - 仓储操作

### Decision 3: Agent Mode 二分类

**选择**：引入 `primary` / `subagent` 两种模式（精简版）

| Mode | 说明 | 可作为默认 |
|------|------|-----------|
| primary | 主 Agent，处理通用办公任务 | Yes |
| subagent | 子 Agent，被主 Agent 委托处理特定业务 | No |

**理由**：
- 语义清晰，便于用户理解
- 适配办公场景：通用助手 + 领域专家模式
- 便于实现权限隔离

### Decision 4: 办公场景 Agent 定义（精简版）

**选择**：先实现两个核心 Agent

#### 1. office-general (通用助手)
```yaml
name: office-general
mode: primary
description: 通用办公助手，处理日常办公咨询和跨部门协调
permission:
  department: "ask"
  document: "allow"
  approval: "ask"
```

**职责**：
- 日常办公咨询（天气、日程等）
- 跨部门信息查询
- 通用文档处理
- 简单任务分解和协调

#### 2. office-specialist (领域专家)
```yaml
name: office-specialist
mode: subagent
description: 专注特定业务领域的高级 Agent
permission:
  department: "allow"
  approval: "allow"
  document: "allow"
  employee: "allow"
  finance: "allow"
  warehouse: "allow"
```

**职责**：
- 处理特定领域（HR/财务/销售等）复杂任务
- 执行需要更高权限的操作
- 提供专业领域知识和建议

**扩展计划**（后续按需实现）：
- `hr-specialist` - 人事专员
- `finance-specialist` - 财务专员
- `sales-specialist` - 销售专员
- `warehouse-specialist` - 仓储专员

### Decision 5: 前端 ModeSwitcher 组件

**选择**：实现轻量级 ModeSwitcher，集成在聊天输入框旁

**UI 交互**：
- 点击展开下拉选择器
- 键盘 ↑↓ 导航，Enter 确认
- 切换后自动聚焦回输入框
- 仅当存在多个可用 agent 时显示

**理由**：
- 减少操作步骤，提升体验
- 复用现有 Shadcn/ui 组件
- 与 KiloCode UX 对齐

### Decision 6: 配置合并策略

**选择**：实现三层配置合并

```
Native Agent Config (内置默认值)
  ↓ merge
User Config (config.agent.{name})
  ↓ merge
Agent Specific (运行时覆盖)
```

**理由**：
- 支持用户自定义而不破坏内置行为
- 便于实现 per-agent 配置覆盖
- 与 KiloCode 的 merge 逻辑对齐

## Risks / Trade-offs

### Risk 1: 配置文件格式不兼容
**风险**：用户可能期望完全兼容 KiloCode 格式，但我们的模型/权限结构不同
**缓解**：明确标注为"参考 KiloCode 格式"，不完全照搬

### Risk 2: 权限模型复杂度增加
**风险**：细粒度权限可能增加配置复杂度
**缓解**：提供合理的默认值，UI 提供简化视图

### Risk 3: 迁移成本
**风险**：现有 agent 配置需要迁移到新格式
**缓解**：提供迁移脚本，支持从旧格式导入

### Risk 4: 性能影响
**风险**：每次启动扫描配置文件可能影响启动速度
**缓解**：配置加载后缓存到内存，支持热重载

## Migration Plan

### Phase 1: 基础设施
1. 创建 `permission.rs` 模块，定义 Ruleset 结构
2. 创建 `config_loader.rs` 模块，实现配置文件解析
3. 更新 `routing.rs`，支持从文件加载 agent

### Phase 2: UI 组件
1. 实现 `ModeSwitcher` 组件
2. 重构 `SubAgentRegistry` UI
3. 新增 `SubAgentPermissionConfig` 组件

### Phase 3: 功能完善
1. 实现配置合并逻辑
2. 实现 Agent 模板系统
3. 提供导入/导出功能

### Rollback Strategy
- 配置格式变更：保留旧格式兼容层
- UI 变更：提供 feature flag 控制
- 核心逻辑：Git revert 即可

## Open Questions

1. **配置文件存放位置**：`.ai-automated-office/agents/*.md`？
2. **权限默认值**：办公场景默认权限应该开放还是保守？（建议保守，默认 ask）
3. **模板数量**：精简版只做 general/specialist 两种？
4. **配置热重载**：是否需要支持运行时配置文件变更？
5. **领域专家路由**：office-specialist 如何路由到具体领域（HR/财务/销售）？
