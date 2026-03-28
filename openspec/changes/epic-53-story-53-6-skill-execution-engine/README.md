# Epic 53, Story 53.6: Skill执行引擎

## 概述

实现完整的Skill执行引擎，支持SKILL.md格式解析、渐进式加载、工具转换、触发器转换、执行控制（超时/重试）、审计日志记录、版本管理和多源加载机制。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Skill Execution Engine                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Skill Discovery Layer                   │    │
│  │  • 多源加载（Bundled/Managed/Workspace/External）    │    │
│  │  • 优先级合并                                        │    │
│  │  • 安全限制                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Skill Parsing Layer                     │    │
│  │  • SKILL.md 解析                                     │    │
│  │  • Frontmatter 元数据提取                            │    │
│  │  • 工具/触发器转换                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Skill Loading Layer                     │    │
│  │  • 渐进式加载                                        │    │
│  │  • 提示预算控制                                      │    │
│  │  • 紧凑格式降级                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Skill Execution Layer                   │    │
│  │  • 执行调度                                          │    │
│  │  • 超时控制                                          │    │
│  │  • 重试机制                                          │    │
│  │  • 审计日志                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 需求映射

| FR编号 | 需求描述 | 实现模块 |
|--------|----------|----------|
| FR700 | 解析SKILL.md格式的技能文件 | `parser.rs` |
| FR701 | 将Skill中的Tools转换为内部工具 | `converter.rs` |
| FR702 | 将Skill中的Triggers转换为触发器规则 | `converter.rs` |
| FR703 | 从本地导入Skill文件 | `discovery.rs` |
| FR704 | 从私有市场安装Skill | `marketplace.rs` |
| FR705 | 从ClawHub市场安装Skill | `marketplace.rs` |
| FR706 | Skill执行时自动记录审计日志 | `executor.rs` |
| FR707 | Skill执行支持超时和重试机制 | `executor.rs` |
| FR708 | 查看已安装Skill的状态和版本 | `registry.rs` |
| FR709 | 卸载已安装的Skill | `registry.rs` |
| FR710 | Skill版本更新检查和升级 | `version.rs` |
| FR835 | 查看已安装的Skill列表 | `registry.rs` |
| FR836 | 启用/禁用已安装的Skill | `registry.rs` |
| FR837 | 配置Skill的参数和选项 | `config.rs` |
| FR838 | 查看Skill提供的工具和触发器 | `registry.rs` |
| FR839 | 测试Skill是否正常工作 | `executor.rs` |
| FR840 | 设置Skill的访问权限 | `permission.rs` |

## 现有代码

### 后端（Rust）
- `src-tauri/src/agent/tools/` - 工具系统基础架构
- `src-tauri/src/agent/audit.rs` - 审计日志系统

### 前端（React/TypeScript）
- `src/features/settings/components/SkillConfiguration.tsx` - Skill配置组件
- `src/features/settings/components/SkillMdParsing.tsx` - Skill解析组件

### 缺失功能
- 后端 `src-tauri/src/agent/skill/` 模块 - **需要创建**
- SKILL.md解析器
- 渐进式加载机制
- 工具/触发器转换器
- 执行引擎
- 版本管理

## 验收标准

1. SKILL.md格式100%兼容OpenClaw规范
2. 渐进式加载正确控制提示预算
3. 执行超时和重试机制正常工作
4. 审计日志完整记录所有Skill执行
5. 版本管理和更新检查功能正常
6. 多源加载优先级正确

## 依赖关系

- 依赖 Story 51.1（Agent Runtime基础）
- 依赖 Story 53.1（工具系统基础）
- 与 Story 53.5（记忆系统）协同工作
