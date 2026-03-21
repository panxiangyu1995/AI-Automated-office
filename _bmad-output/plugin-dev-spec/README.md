# AI-Automated-office 插件开发规范 v2.0

> **版本：** 2.0.0  
> **最后更新：** 2026-03-21  
> **状态：** 正式发布

---

## 文档概述

本文档定义了 AI-Automated-office 平台的插件（部门模块）开发规范。所有插件必须遵循此规范，以确保：

- **一致性**：统一的开发模式和接口设计
- **可扩展性**：支持渐进式功能增强
- **可维护性**：清晰的架构边界和代码组织
- **安全性**：最小权限原则和数据隔离
- **高效性**：混合架构实现最优 Token 消耗

---

## 核心原则

### 1. 约定优于配置 (Convention over Configuration)

- 标准目录结构，减少决策成本
- 默认行为，按需覆盖
- 示例：默认路由自动注册，无需手动配置

### 2. 最小权限原则 (Principle of Least Privilege)

- 默认无权限，显式声明所需权限
- 权限分组：基础权限 / 敏感权限 / 管理权限
- 用户安装时确认权限

### 3. 隔离与通信 (Isolation & Communication)

- 插件间数据隔离（租户级 + 插件级）
- 通过暴露接口通信，不直接访问其他插件内部
- 事件总线解耦

### 4. 可观测性 (Observability)

- 工具调用全程记录
- 错误日志标准化
- 性能指标上报

### 5. 渐进增强 (Progressive Enhancement)

- MVP最小实现：manifest + 基础工具
- 按需添加：UI、Skill、MCP、CLI
- 不强制实现所有层

### 6. 混合架构 (Hybrid Architecture)

- 根据场景选择最优实现方式
- Native Tools 用于高频简单操作
- CLI Wrapper 用于复杂工具链
- MCP 用于外部服务集成

---

## 文档目录

| 文档 | 说明 |
|------|------|
| [01-manifest-spec.md](./01-manifest-spec.md) | 插件清单规范 - plugin.json 定义 |
| [02-ui-spec.md](./02-ui-spec.md) | UI层规范 - 路由、组件、样式 |
| [03-tools-spec.md](./03-tools-spec.md) | 工具层规范 - **混合架构 (Native + CLI + MCP)** |
| [04-data-spec.md](./04-data-spec.md) | 数据层规范 - 模型、迁移、同步 |
| [05-business-spec.md](./05-business-spec.md) | 业务层规范 - 服务、事件、定时任务 |
| [06-permission-spec.md](./06-permission-spec.md) | 权限层规范 - 角色、权限矩阵 |
| [07-lifecycle-spec.md](./07-lifecycle-spec.md) | 生命周期 - 安装、运行、更新、卸载 |
| [08-quality-spec.md](./08-quality-spec.md) | 质量规范 - 代码、测试、安全 |
| [09-examples.md](./09-examples.md) | 示例插件 - 最小/完整/扩展示例 |
| [10-appendix.md](./10-appendix.md) | 附录 - Schema、类型定义、错误码 |

---

## 插件架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    插件（部门模块）完整架构                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     1. 元数据层 (Manifest)                   │   │
│  │  ├── plugin.json                                            │   │
│  │  ├── 基本信息：id, name, version, author, description       │   │
│  │  ├── 依赖声明：dependencies, peerDependencies               │   │
│  │  ├── 权限声明：permissions, dataAccess                       │   │
│  │  └── 入口声明：main, ui, tools, routes, cli, mcp            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     2. UI层 (Presentation)                   │   │
│  │  ├── 路由配置：routes[]                                     │   │
│  │  ├── 组件入口：components[]                                 │   │
│  │  ├── 菜单配置：menu[]                                       │   │
│  │  ├── 侧边栏配置：sidebar[]                                  │   │
│  │  └── 样式资源：styles[]                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     3. 工具层 (Tools) - 混合架构             │   │
│  │  ├── Native Tools：高频简单操作                             │   │
│  │  │   ├── {plugin}_query                                     │   │
│  │  │   ├── {plugin}_aggregate                                 │   │
│  │  │   ├── {plugin}_mutate                                    │   │
│  │  │   ├── {plugin}_action                                    │   │
│  │  │   └── {plugin}_export                                    │   │
│  │  ├── CLI Wrappers：复杂工具链                               │   │
│  │  │   └── 媒体处理、文档转换、批量操作                       │   │
│  │  ├── MCP Adapters：外部服务接入                             │   │
│  │  │   └── 闲鱼API、钉钉集成、企业微信                        │   │
│  │  └── Skills：复杂技能封装                                   │   │
│  │      └── 多步骤组合 + AI推理                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     4. 数据层 (Data)                         │   │
│  │  ├── 数据模型：models[]                                     │   │
│  │  ├── 数据库迁移：migrations[]                               │   │
│  │  ├── 数据接口：repositories[]                               │   │
│  │  └── 数据同步：sync[]                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     5. 业务层 (Business)                     │   │
│  │  ├── 服务：services[]                                       │   │
│  │  ├── 事件处理：handlers[]                                   │   │
│  │  ├── 定时任务：schedules[]                                  │   │
│  │  └── 跨插件通信：exports/imports                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     6. 权限层 (Permission)                   │   │
│  │  ├── 角色定义：roles[]                                      │   │
│  │  ├── 权限矩阵：permissions[]                                │   │
│  │  └── 数据权限：dataScopes[]                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 工具层混合架构

工具层采用**三层混合架构**，根据操作特性选择最优实现：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    工具层混合架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   统一工具接口 (Unified Interface)            │   │
│  │  - name, description, parameters                            │   │
│  │  - handler: Native | CLI | MCP                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                     │
│         ┌─────────────────────┼─────────────────────┐              │
│         ▼                     ▼                     ▼              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐      │
│  │ Native Tools│       │ CLI Wrapper │       │MCP Adapters │      │
│  │  (高频/简单) │       │ (低频/复杂)  │       │ (外部服务)   │      │
│  ├─────────────┤       ├─────────────┤       ├─────────────┤      │
│  │ • 数据查询   │       │ • 媒体处理   │       │ • 闲鱼API   │      │
│  │ • 数据变更   │       │ • 文档转换   │       │ • 钉钉集成   │      │
│  │ • 业务操作   │       │ • 批量处理   │       │ • 企业微信   │      │
│  │ • 权限验证   │       │ • 工具链组合 │       │ • 第三方服务 │      │
│  └─────────────┘       └─────────────┘       └─────────────┘      │
│                                                                     │
│  Token 消耗：低          Token 消耗：极低        Token 消耗：中      │
│  执行速度：快            执行速度：中            执行速度：取决于网络 │
│  调试难度：低            调试难度：中            调试难度：中        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 选择决策矩阵

| 操作类型 | 推荐方案 | 理由 |
|---------|---------|------|
| 数据查询 (query) | Native Tool | 高频、简单、需要类型安全 |
| 数据变更 (mutate) | Native Tool | 需要事务、权限检查 |
| 业务操作 (action) | Native Tool | 需要复杂验证和事件发布 |
| 统计聚合 (aggregate) | Native Tool | 高频、需要实时响应 |
| 数据导出 (export) | Native Tool | 需要权限控制和审计 |
| 图像处理 | CLI Wrapper | 复杂工具链、低频、已有成熟 CLI |
| 音频处理 | CLI Wrapper | 复杂工具链、低频 |
| 视频处理 | CLI Wrapper | 复杂工具链、低频 |
| 文档转换 | CLI Wrapper | 低频、复杂格式处理 |
| 批量处理 | CLI Wrapper | 适合命令行批处理 |
| 闲鱼 API | MCP Adapter | 外部服务、OAuth认证 |
| 钉钉集成 | MCP Adapter | 外部服务、Webhook |

---

## 目录结构规范

```
plugins/
├── {plugin-id}/                    # 插件ID（如 sales, hr, finance）
│   ├── plugin.json                 # 【必需】插件清单
│   │
│   ├── ui/                         # UI层
│   │   ├── index.tsx               # UI入口
│   │   ├── routes/                 # 路由组件
│   │   ├── components/             # 共享组件
│   │   ├── sidebar/                # 侧边栏配置
│   │   └── styles/                 # 样式文件
│   │
│   ├── tools/                      # 工具层
│   │   ├── index.ts                # 工具注册入口
│   │   ├── query.ts                # {plugin}_query (Native)
│   │   ├── aggregate.ts            # {plugin}_aggregate (Native)
│   │   ├── mutate.ts               # {plugin}_mutate (Native)
│   │   ├── action.ts               # {plugin}_action (Native)
│   │   ├── export.ts               # {plugin}_export (Native)
│   │   └── cli/                    # CLI Wrappers (可选)
│   │       └── image-process.ts
│   │
│   ├── skills/                     # Skills层（可选）
│   │   └── index.ts                # Skill注册入口
│   │
│   ├── mcp/                        # MCP层（可选）
│   │   └── index.ts                # MCP服务注册
│   │
│   ├── data/                       # 数据层
│   │   ├── models/                 # 数据模型
│   │   ├── migrations/             # 数据库迁移
│   │   └── repositories/           # 数据访问层
│   │
│   ├── services/                   # 业务层
│   │   └── *.service.ts
│   │
│   ├── handlers/                   # 事件处理
│   │   └── *.handler.ts
│   │
│   ├── permissions/                # 权限定义
│   │   └── index.ts
│   │
│   └── tests/                      # 测试
│       └── *.test.ts
```

---

## 快速开始

### 最小插件示例

创建一个最小插件只需要两个文件：

**1. plugin.json**
```json
{
  "id": "example",
  "name": "示例插件",
  "version": "1.0.0",
  "description": "最小插件示例"
}
```

**2. tools/index.ts**
```typescript
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'example_query',
  type: 'native',
  description: '查询示例数据',
  parameters: { ... },
  handler: async (params) => { ... }
});
```

---

## 插件类型定义

| 类型 | 说明 | 示例 |
|------|------|------|
| **core** | 核心插件，内置不可卸载 | hr, sales, finance, warehouse, approval |
| **standard** | 标准插件，按需安装 | afterSales, bidding, marketing |
| **extension** | 扩展插件，第三方开发 | custom-integration, report-advanced |

---

## 版本兼容性

| 平台版本 | 插件API版本 | 说明 |
|---------|------------|------|
| 1.0.x | 1.0 | 初始版本 |
| 1.1.x | 1.0-1.1 | 向后兼容 |
| 2.0.x | 2.0 | 重大变更 - 引入混合架构 |

---

## 相关文档

- [架构设计文档](../planning-artifacts/architecture.md)
- [PRD文档](../planning-artifacts/prd.md)
- [UX设计规范](../planning-artifacts/ux-design-specification.md)
- [Epic文档](../planning-artifacts/epics.md)
- [CLI-Anything 集成研究](../cli-anything/README.md)

---

## 更新日志

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 2.0.0 | 2026-03-21 | 引入混合架构 (Native + CLI + MCP)，优化 Token 消耗 |
| 1.0.0 | 2026-03-13 | 初始版本发布 |
