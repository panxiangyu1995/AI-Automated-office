# KiloCode 参考实现目录

> 本目录存放 AI-Automated-office 项目参考 KiloCode 架构设计的相关文档

## 文档列表

| 文档 | 说明 |
|------|------|
| [SUBAGENT_ARCH_REFERENCE.md](./SUBAGENT_ARCH_REFERENCE.md) | SubAgent 架构完整参考实现文档 |

## 参考内容概览

### SubAgent 架构参考 (SUBAGENT_ARCH_REFERENCE.md)

**核心内容**：
1. **Agent Mode 分类** - primary / subagent / all 三种模式定义
2. **配置文件格式** - Markdown + YAML front matter 格式
3. **内置 Agent 定义** - code、plan、debug、orchestrator、ask 等
4. **权限系统** - PermissionNext.Ruleset 细粒度权限控制
5. **Agent 切换机制** - Per-session selection 和 model 处理
6. **UI 实现** - ModeSwitcher 组件和 Agent 设置界面
7. **配置合并机制** - 多层配置优先级和合并逻辑
8. **差距分析** - 与我们项目的详细对比
9. **改进建议** - 分阶段的改进方向

## 参考仓库

- **路径**：`i:/AI-Automated-office/开源库参考项目/kilocode`
- **关键包**：
  - `packages/opencode` - 核心 CLI 和 agent 实现
  - `packages/kilo-vscode` - VS Code 扩展
  - `.opencode/agent/` - Agent 配置文件

## 更新记录

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-03-30 | 1.0.0 | 初始版本，包含 SubAgent 架构完整参考 |
