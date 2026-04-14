# Ralph Prompt Expert - 测试套件

## 概述

本目录包含用于测试 `ralph-prompt-expert` skill 生成的 `/ralph-loop` 命令格式是否正确的测试用例和工具。

## 文件结构

```
evals/
├── evals.json              # 测试用例定义
├── test_ralph_prompt.py   # 格式验证脚本
├── grader_instructions.md  # Grader 子代理说明
├── test_results.json       # 测试结果 (运行时生成)
└── README.md               # 本文档
```

## 测试用例 (evals.json)

定义了 8 个测试场景：

| ID | 描述 | 输入 |
|----|------|------|
| 1 | 覆盖率提升 | RL='提高 src/utils 的测试覆盖率到 90%' |
| 2 | 安全漏洞修复 | RL='修复 SonarCloud 扫描出的 SQL 注入风险' |
| 3 | 批量重构 | RL='将所有回调函数转换为 async/await' |
| 4 | 依赖升级 | RL='升级 React 到最新版本并修复破坏性变更' |
| 5 | 文档生成 | RL='为所有 API 接口生成 OpenAPI 文档' |
| 6 | 类型错误修复 | RL='修复 src/components 下的 TypeScript 类型错误' |
| 7 | Lint 警告消除 | RL='消除所有 ESLint 警告' |
| 8 | 批量重命名 | RL='批量重命名 src/api 下的所有 camelCase 函数为 snake_case' |

## 运行测试

### 格式验证测试

```bash
cd evals
python test_ralph_prompt.py
```

这将验证示例命令的格式是否正确，包括：
- 命令是否以 `/ralph-loop` 开头
- 是否包含 `--completion-promise` 参数
- 是否包含 `--max-iterations` 参数
- 引号是否正确配对
- 括号是否正确配对
- 是否有 `<promise>` 标签

### 手动测试 Skill 输出

要测试 skill 实际生成的命令，可以使用 grader：

1. 运行 skill，获得输出的 `/ralph-loop` 命令
2. 将命令保存到文件或直接评估
3. 使用 `validate_from_skill_output()` 函数验证

## 验证规则

详见 [grader_instructions.md](grader_instructions.md)

## 常见错误

### 1. 引号不匹配
错误示例：
```
/ralph-loop "任务：升级\n- 安装新版本\n完成后 <promise>REACT_DONE" \
--completion-promise "REACT_DONE" \
--max-iterations 30
```
问题：`</promise>` 后面缺少 `"`

### 2. 缺少 --completion-promise
错误示例：
```
/ralph-loop "任务：修复SQL注入" \
--max-iterations 10
```

### 3. 括号不配对
错误示例：
```
/ralph-loop "任务：重构(\n### 步骤\n- 重构代码[" \
--completion-promise "REFACTOR" \
--max-iterations 50
```

### 4. 空任务描述
错误示例：
```
/ralph-loop "" \
--completion-promise "DONE" \
--max-iterations 5
```

## 输出格式要求

正确的 `/ralph-loop` 命令格式：

```bash
/ralph-loop "任务：[描述]

### 1. 初始准备
- [步骤]

### 2. 开发与验证循环
1. [实现]
2. [验证]
3. [纠错]
4. [提交]

### 3. 完成标准
- [ ] [标准1]
- [ ] [标准2]

完成后输出 <promise>[PROMISE_TEXT]</promise>" \
--completion-promise "[PROMISE_TEXT]" \
--max-iterations [N]
```

可选参数：
- `--allowed-tools "Tool1,Tool2"` - 限制使用的工具
- `--worktree [name]` - 使用 git worktree
