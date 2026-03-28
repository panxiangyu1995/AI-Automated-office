# Tasks: Skill执行引擎

## 任务概览

| ID | 任务 | 优先级 | 状态 |
|----|------|--------|------|
| T1 | 创建Skill模块骨架 | Critical | Pending |
| T2 | 实现SKILL.md解析器 | Critical | Pending |
| T3 | 实现Skill注册表 | Critical | Pending |
| T4 | 实现多源发现机制 | High | Pending |
| T5 | 实现渐进式加载器 | High | Pending |
| T6 | 实现工具/触发器转换器 | High | Pending |
| T7 | 实现执行引擎 | Critical | Pending |
| T8 | 实现超时和重试机制 | High | Pending |
| T9 | 实现审计集成 | High | Pending |
| T10 | 实现版本管理 | Medium | Pending |
| T11 | 注册Tauri命令 | High | Pending |
| T12 | 前端集成 | Medium | Pending |

## 详细任务

### T1: 创建Skill模块骨架

**描述**: 创建 `src-tauri/src/agent/skill/` 模块骨架，包含所有子模块目录结构。

**验收标准**:
- 模块目录结构正确创建
- `mod.rs` 正确导出所有子模块
- 类型定义完整

**实现步骤**:
1. 创建 `src-tauri/src/agent/skill/` 目录
2. 创建子模块目录：`discovery/`, `parser/`, `converter/`, `loader/`, `executor/`, `registry/`, `version/`
3. 创建 `types.rs` 定义核心类型
4. 创建 `config.rs` 定义配置结构
5. 更新 `src-tauri/src/agent/mod.rs` 添加 `pub mod skill;`

**产出文件**:
- `src-tauri/src/agent/skill/mod.rs`
- `src-tauri/src/agent/skill/types.rs`
- `src-tauri/src/agent/skill/config.rs`

---

### T2: 实现SKILL.md解析器

**描述**: 实现SKILL.md格式解析器，支持Frontmatter和正文解析。

**验收标准**:
- 正确解析Frontmatter（YAML格式）
- 正确提取元数据（name, version, description, tags等）
- 正确解析正文中的工具和触发器定义
- 兼容OpenClaw SKILL.md格式

**实现步骤**:
1. 实现 `frontmatter.rs` - Frontmatter提取和解析
2. 实现 `skill_md.rs` - SKILL.md完整解析
3. 实现 `validator.rs` - 格式验证
4. 添加单元测试

**产出文件**:
- `src-tauri/src/agent/skill/parser/mod.rs`
- `src-tauri/src/agent/skill/parser/frontmatter.rs`
- `src-tauri/src/agent/skill/parser/skill_md.rs`
- `src-tauri/src/agent/skill/parser/validator.rs`

**依赖**: T1

---

### T3: 实现Skill注册表

**描述**: 实现Skill注册表，支持Skill的存储、查询、启用/禁用操作。

**验收标准**:
- 支持Skill的CRUD操作
- 支持启用/禁用状态管理
- 支持持久化存储（SQLite）
- 支持内存缓存

**实现步骤**:
1. 实现 `store.rs` - SQLite存储后端
2. 实现 `cache.rs` - 内存缓存层
3. 实现注册表主逻辑
4. 添加数据库迁移脚本

**产出文件**:
- `src-tauri/src/agent/skill/registry/mod.rs`
- `src-tauri/src/agent/skill/registry/store.rs`
- `src-tauri/src/agent/skill/registry/cache.rs`

**依赖**: T1, T2

---

### T4: 实现多源发现机制

**描述**: 实现从多个来源发现和加载Skill的机制。

**验收标准**:
- 支持Bundled、Managed、Workspace、External四种来源
- 正确实现优先级合并（后者覆盖前者）
- 支持安全限制（文件大小、数量限制）

**实现步骤**:
1. 实现 `loader.rs` - 多源加载器
2. 实现 `scanner.rs` - 目录扫描器
3. 实现 `merger.rs` - 优先级合并器
4. 添加配置支持

**产出文件**:
- `src-tauri/src/agent/skill/discovery/mod.rs`
- `src-tauri/src/agent/skill/discovery/loader.rs`
- `src-tauri/src/agent/skill/discovery/scanner.rs`
- `src-tauri/src/agent/skill/discovery/merger.rs`

**依赖**: T1, T2, T3

---

### T5: 实现渐进式加载器

**描述**: 实现渐进式加载机制，控制提示预算。

**验收标准**:
- 支持按数量截断
- 支持按字符预算调整
- 支持紧凑格式降级
- 支持二分查找最大可容纳前缀

**实现步骤**:
1. 实现 `progressive.rs` - 渐进式加载器
2. 实现 `budget.rs` - 提示预算控制
3. 实现 `format.rs` - 格式化输出（完整格式/紧凑格式）
4. 添加性能测试

**产出文件**:
- `src-tauri/src/agent/skill/loader/mod.rs`
- `src-tauri/src/agent/skill/loader/progressive.rs`
- `src-tauri/src/agent/skill/loader/budget.rs`
- `src-tauri/src/agent/skill/loader/format.rs`

**依赖**: T1, T4

---

### T6: 实现工具/触发器转换器

**描述**: 实现将Skill中的Tools和Triggers转换为内部格式。

**验收标准**:
- 正确转换工具定义
- 正确转换触发器定义
- 支持MCP、Builtin、Custom三种工具类型
- 支持Event、Schedule、Manual、Condition四种触发器类型

**实现步骤**:
1. 实现 `tool.rs` - 工具转换器
2. 实现 `trigger.rs` - 触发器转换器
3. 集成到工具系统
4. 添加转换测试

**产出文件**:
- `src-tauri/src/agent/skill/converter/mod.rs`
- `src-tauri/src/agent/skill/converter/tool.rs`
- `src-tauri/src/agent/skill/converter/trigger.rs`

**依赖**: T1, T2

---

### T7: 实现执行引擎

**描述**: 实现Skill执行引擎核心逻辑。

**验收标准**:
- 支持Skill执行
- 支持执行上下文管理
- 支持并发控制
- 支持执行状态跟踪

**实现步骤**:
1. 实现 `runner.rs` - 执行运行器
2. 实现 `context.rs` - 执行上下文
3. 实现并发控制
4. 添加执行测试

**产出文件**:
- `src-tauri/src/agent/skill/executor/mod.rs`
- `src-tauri/src/agent/skill/executor/runner.rs`
- `src-tauri/src/agent/skill/executor/context.rs`

**依赖**: T1, T2, T3, T6

---

### T8: 实现超时和重试机制

**描述**: 实现Skill执行的超时控制和重试机制。

**验收标准**:
- 支持可配置超时时间
- 支持指数退避重试
- 支持最大重试次数限制
- 超时和重试事件正确记录

**实现步骤**:
1. 实现 `timeout.rs` - 超时控制
2. 实现 `retry.rs` - 重试机制
3. 集成到执行器
4. 添加边界测试

**产出文件**:
- `src-tauri/src/agent/skill/executor/timeout.rs`
- `src-tauri/src/agent/skill/executor/retry.rs`

**依赖**: T7

---

### T9: 实现审计集成

**描述**: 集成现有审计系统，记录Skill执行日志。

**验收标准**:
- 记录执行开始事件
- 记录执行结束事件（成功/失败）
- 记录执行时长
- 记录重试和超时事件

**实现步骤**:
1. 实现 `audit.rs` - 审计集成
2. 定义审计事件类型
3. 集成到执行器
4. 添加审计查询API

**产出文件**:
- `src-tauri/src/agent/skill/audit.rs`

**依赖**: T7, T8

---

### T10: 实现版本管理

**描述**: 实现Skill版本检查、更新和回滚功能。

**验收标准**:
- 支持版本检查
- 支持更新下载和安装
- 支持版本回滚
- 支持更新通知

**实现步骤**:
1. 实现 `checker.rs` - 版本检查器
2. 实现 `updater.rs` - 更新管理器
3. 实现 `rollback.rs` - 回滚管理器
4. 添加版本管理测试

**产出文件**:
- `src-tauri/src/agent/skill/version/mod.rs`
- `src-tauri/src/agent/skill/version/checker.rs`
- `src-tauri/src/agent/skill/version/updater.rs`
- `src-tauri/src/agent/skill/version/rollback.rs`

**依赖**: T3

---

### T11: 注册Tauri命令

**描述**: 注册所有Skill相关的Tauri命令。

**验收标准**:
- 所有命令正确注册
- 命令参数正确传递
- 返回值正确序列化
- 错误正确处理

**实现步骤**:
1. 创建 `src-tauri/src/commands/skill.rs`
2. 实现所有命令函数
3. 在 `main.rs` 中注册命令
4. 添加命令测试

**产出文件**:
- `src-tauri/src/commands/skill.rs`
- 更新 `src-tauri/src/main.rs`

**依赖**: T3, T5, T7, T10

---

### T12: 前端集成

**描述**: 集成前端SkillConfiguration.tsx组件，连接后端API。

**验收标准**:
- Skill列表正确显示
- 启用/禁用功能正常
- 配置参数可编辑
- 测试功能正常

**实现步骤**:
1. 更新 `SkillConfiguration.tsx` 连接后端API
2. 实现状态管理
3. 实现错误处理
4. 添加E2E测试

**产出文件**:
- 更新 `src/features/settings/components/SkillConfiguration.tsx`
- 更新 `src/features/settings/components/SkillMdParsing.tsx`

**依赖**: T11

---

## 任务依赖图

```
T1 (模块骨架)
├── T2 (SKILL.md解析) ──┬── T3 (注册表) ──┬── T4 (多源发现) ── T5 (渐进式加载)
│                       │                  │
│                       │                  └── T10 (版本管理)
│                       │
│                       ├── T6 (工具转换) ──┬── T7 (执行引擎) ── T8 (超时重试) ── T9 (审计)
│                       │                   │
│                       │                   └── T11 (Tauri命令) ── T12 (前端集成)
│                       │
│                       └── T11 (Tauri命令)
```

## 里程碑

| 里程碑 | 任务 | 预期产出 |
|--------|------|----------|
| M1: 解析基础 | T1, T2 | SKILL.md解析可用 |
| M2: 注册与发现 | T3, T4 | 多源加载可用 |
| M3: 加载优化 | T5, T6 | 渐进式加载和转换可用 |
| M4: 执行引擎 | T7, T8, T9 | 执行、超时、审计可用 |
| M5: 完整集成 | T10, T11, T12 | 版本管理、前后端集成完成 |
