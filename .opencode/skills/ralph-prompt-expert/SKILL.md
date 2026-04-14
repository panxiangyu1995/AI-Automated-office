---
name: ralph-prompt-expert
description: 为 Claude Code 的 ralph-loop 插件创建高效提示词的专家。将模糊的开发任务转化为适用于自动迭代循环的结构化指令。使用场景：(1) 用户需要无人值守完成多步骤开发任务 (2) 需要自愈逻辑的自动化修复（如修复测试、lint错误、安全漏洞） (3) 需要增量式迭代的大任务（提升覆盖率、批量重构） (4) 需要验证驱动的开发任务 (5) 任何需要明确完成标准和自动重试的开发工作
---

# Ralph Prompt Expert

## 如何调用

使用以下格式触发本skill：

```
RL='你的开发任务描述'
```

**示例：**
- `RL='修复 SonarCloud 扫描出的 SQL 注入风险'`
- `RL='提高 src/utils 的测试覆盖率到 90%'`
- `RL='将所有回调函数转换为 async/await'`
- `RL='为所有 API 接口生成 OpenAPI 文档'`

Claude将根据你的描述生成完整的 `/ralph-loop:ralph-loop` 命令。

**重要：输出格式要求**
- 只输出可执行的 `/ralph-loop:ralph-loop` 命令
- 不要生成文件或markdown文档
- 命令可直接复制到终端执行

## 核心原则

每个提示词必须包含：

1. **明确的完成标准** - 可客观验证的终点
2. **增量式计划** - 大任务拆分，维护 `.plan/fix_plan_{YYYYMMDD}_{HHMMSS}.md`（时间戳确保多任务不冲突）
3. **自愈逻辑** - 验证 → 读错 → 修复 → 重试
4. **上下文管理** - 指定工具范围，决定是否保留会话历史
5. **Git工作流** - 建议独立分支 + 阶段性原子提交
6. **安全退出** - `--completion-promise` + 合理的 `--max-iterations`

## 提示词模板

生成如下的 `/ralph-loop:ralph-loop` 命令（**重要：输出时命令主体在一行内完成，不要拆成多行**）：

```bash
/ralph-loop:ralph-loop "任务：[一句话描述核心目标]

### 1. 初始准备
- 检查当前分支，确保在 `feature/xxx` 分支上工作
- 生成时间戳（如 `20250124_143052`）
- 创建或更新 `.plan/fix_plan_{timestamp}.md` 记录执行步骤

### 2. 开发与验证循环
1. **实现/修改**：根据需求编写或修改代码
2. **验证**：运行 `[测试/构建/扫描命令]`
3. **纠错**：
   - 若验证失败，分析最新错误日志
   - 严禁忽略任何类型错误或lint警告
   - 修复后立即重新验证，直到成功
4. **提交**：验证通过后，git commit 并注明当前进度

### 3. 完成标准（必须全部满足）
- [ ] 所有功能点 [A, B, C] 已实现
- [ ] 没有任何 `TODO` 或调试代码遗留
- [ ] 运行 `[验证命令]` 结果为绿色
- [ ] [可选] 测试覆盖率不低于 X%

### 4. 退出信号
满足上述所有条件后，务必输出：`<promise>[PROMISE_TEXT]</promise>`" --completion-promise "[PROMISE_TEXT]" --max-iterations [N]
```

**格式要求：**
- 命令主体（从 `/ralph-loop:ralph-loop` 到最后的引号）必须在一行内完整输出
- `--completion-promise` 和 `--max-iterations` 参数紧跟在主体后面，用空格分隔
- **禁止在命令主体内使用反斜杠 `\` 换行**，这会导致命令解析失败

## 进阶技巧

**计划先行**：要求AI先生成 `.plan/fix_plan_{timestamp}.md`（使用当前时间戳），每步完成后用 `[x]` 标记，便于中断后恢复

**隔离开发**：使用 `git worktree` 或独立分支，防止自动修改干扰当前开发

**工具限制**：使用 `--allowed-tools "Write,Bash(git *),Read"` 限制权限，增加安全性

## 示例

详细示例见 [examples.md](references/examples.md)：
- 测试覆盖率提升（TDD模式）
- 安全漏洞修复
- 文档自动化生成

## 提示建议

- **避免模糊词**：不用"优化"、"改进"，使用"将响应时间降低到200ms以下"、"消除所有TSLint警告"
- **强化验证**：鼓励使用 `grep` 或 `find` 确认清理工作彻底
- **阶段性提交**：建议每个阶段完成后进行git commit
