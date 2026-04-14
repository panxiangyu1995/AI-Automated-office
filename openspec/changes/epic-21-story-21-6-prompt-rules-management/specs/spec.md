# Specs: 系统提示词与Rules规则管理

## 功能规格

### 1. 版本列表 (prompt_version_list)

**输入：** promptId: string
**输出：** `PromptVersion[]`

### 2. 创建版本 (prompt_version_create)

**输入：** promptId, content, changeLog
**输出：** PromptVersion

### 3. 版本回滚 (prompt_version_rollback)

**输入：** promptId, version
**输出：** PromptVersion

### 4. 规则列表 (rules_list)

**输入：** void
**输出：** `BehaviorRule[]`

### 5. 创建规则 (rules_create)

**输入：** rule: BehaviorRule
**输出：** string (rule_id)

### 6. 规则开关 (rules_toggle)

**输入：** ruleId, enabled
**输出：** void

### 7. 调试会话 (prompt_debug_session)

**输入：** promptId, testInput
**输出：** DebugSession

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| prompt_version_list | promptId | PromptVersion[] |
| prompt_version_create | promptId, content, changeLog | PromptVersion |
| prompt_version_rollback | promptId, version | PromptVersion |
| rules_list | - | BehaviorRule[] |
| rules_create | rule | string |
| rules_toggle | ruleId, enabled | void |
| prompt_debug_session | promptId, testInput | DebugSession |

## 错误码

| 错误码 | 说明 |
|--------|------|
| PROMPT_NOT_FOUND | 提示词不存在 |
| VERSION_NOT_FOUND | 版本不存在 |
| RULE_NOT_FOUND | 规则不存在 |
| DEBUG_FAILED | 调试失败 |
