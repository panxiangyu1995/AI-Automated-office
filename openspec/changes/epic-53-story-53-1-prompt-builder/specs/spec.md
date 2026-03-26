# Specification: 提示词构建器 - 分层提示词整合

## 需求来源

### PRD 需求
- FR440: 提示词构建器必须支持分层加载策略
- FR441: 支持系统提示词与角色提示词的合并
- FR442: 支持记忆和知识库的上下文注入

### 架构约束
- ADR-038: 记忆系统分层架构
- ADR-039: 提示词工程规范
- ADR-043: Agent 核心模块设计

### UX 规范
- UX-01: AI 即入口，透明可控

## 功能规格

### 用户故事

**As an** Agent Runtime,
**I want to** 构建分层提示词上下文，整合系统提示词、角色提示词、记忆、知识库、错题集规则，
**So that** Agent 能够在完整的上下文环境中执行任务，提高执行准确性和效率。

### 核心能力

1. **分层提示词构建**: 支持 5 层提示词按优先级合并
2. **动态记忆注入**: 根据场景动态注入相关个人记忆
3. **知识库检索集成**: 自动检索并注入相关企业知识
4. **错题集规则应用**: 自动应用历史错误修正规则
5. **Token 预算控制**: 严格控制各层 Token 分配

## 输入输出规格

### 输入规格

#### invoke_build_prompt 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空，最小 8 字符 |
| user_input | string | 是 | 用户当前输入 | 非空，最大 10000 字符 |
| scene | string | 否 | 场景类型 | 默认 "general" |
| options | PromptOptions | 否 | 构建选项 | 可选配置 |

#### PromptOptions 结构

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| include_memory | boolean | 否 | 是否包含记忆 | 默认 true |
| include_knowledge | boolean | 否 | 是否包含知识库 | 默认 true |
| include_corrections | boolean | 否 | 是否包含错题集 | 默认 true |
| max_total_tokens | number | 否 | 最大 Token 数 | 默认 8000 |

### 输出规格

#### invoke_build_prompt 命令输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 构建是否成功 |
| prompt | string | 合并后的完整提示词 |
| token_count | number | 估算的 Token 数量 |
| layer_breakdown | object | 各层 Token 分布 |

#### layer_breakdown 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| system | number | 系统提示词 Token 数 |
| role | number | 角色提示词 Token 数 |
| memory_l1 | number | 个人记忆 Token 数 |
| knowledge_l2 | number | 知识库 Token 数 |
| correction_rules | number | 错题集 Token 数 |

## 验收场景

### 场景 1: 基础提示词构建

**Given** 用户在 general 场景下发送 "帮我创建一个销售合同"
**When** Agent 调用 `invoke_build_prompt` 命令
**Then** 系统应返回包含以下内容的提示词：
- 系统提示词：包含基础指令和安全规则
- 角色提示词：包含当前用户角色权限
- 个人记忆：最近相关的合同创建记忆
- 企业知识库：合同模板和相关法规知识
- 错题集规则：合同创建相关的历史错误修正

### 场景 2: 排除记忆的场景

**Given** 用户指定 `include_memory: false`
**When** Agent 调用 `invoke_build_prompt`
**Then** 返回的提示词不包含个人记忆层（L1）

### 场景 3: Token 超限处理

**Given** 用户要求构建的提示词超过 `max_total_tokens`
**When** 系统尝试构建提示词
**Then** 应按优先级逐层缩减内容，直至满足 Token 限制
**And** 应返回警告信息提示发生了缩减

### 场景 4: 空记忆和知识库

**Given** 用户没有个人记忆，企业知识库也无相关结果
**When** Agent 调用 `invoke_build_prompt`
**Then** 应返回仅包含系统提示词和角色提示词的提示词
**And** 不应报错

### 场景 5: 错题集规则注入

**Given** 用户创建合同场景触发了 "合同金额大写错误" 规则
**When** Agent 调用 `invoke_build_prompt`
**Then** 应在提示词中包含该规则的修正指令

### 场景 6: 多角色叠加

**Given** 用户同时拥有 "销售经理" 和 "合同审批员" 角色
**When** Agent 调用 `invoke_build_prompt`
**Then** 应叠加两个角色的提示词，能力和约束合并

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 处理方式 | 严重级别 |
|--------|----------|----------|----------|
| PB001 | Session not found | 返回错误，提示会话无效 | ERROR |
| PB002 | Memory retrieval failed | 返回警告，使用空记忆继续 | WARN |
| PB003 | Knowledge retrieval failed | 返回警告，使用空知识继续 | WARN |
| PB004 | Token limit exceeded | 返回警告，提示词被截断 | WARN |
| PB005 | Build timeout | 返回错误，提示构建超时 | ERROR |
| PB006 | Invalid session id | 返回错误，提示会话 ID 无效 | ERROR |
| PB007 | User input too long | 返回错误，拒绝处理 | ERROR |

### 错误响应结构

```json
{
  "success": false,
  "error": {
    "code": "PB001",
    "message": "Session not found",
    "severity": "ERROR"
  },
  "prompt": null,
  "token_count": 0
}
```

## 边界条件

### 边界条件清单

| 边界条件 | 预期行为 |
|----------|----------|
| session_id 为空 | 返回 PB006 错误 |
| session_id 长度 < 8 | 返回 PB006 错误 |
| user_input 为空 | 返回 PB007 错误 |
| user_input 长度 > 10000 | 返回 PB007 错误 |
| max_total_tokens < 1000 | 使用最小值 1000 |
| max_total_tokens > 128000 | 使用最大值 128000 |
| 无可用记忆 | 使用空列表继续 |
| 无可用知识 | 使用空列表继续 |
| 无可用错题集规则 | 使用空列表继续 |
| 所有可选层都被禁用 | 仅返回系统和角色提示词 |

### Token 估算规则

1. **中文**: 1 Token ≈ 1.5 字符
2. **英文**: 1 Token ≈ 4 字符
3. **代码**: 1 Token ≈ 4 字符
4. **混合文本**: 按实际字符数估算

### 优先级规则

| 优先级 | 层级 | 是否可覆盖 | 可否禁用 |
|--------|------|-----------|----------|
| 1 (最高) | System | 否 | 否 |
| 2 | Role | 是 | 否 |
| 3 | Memory L1 | 是 | 是 |
| 4 | Knowledge L2 | 是 | 是 |
| 5 (最低) | Correction Rules | 是 | 是 |

### 缩减策略

当 Token 超限时，按以下顺序缩减：

1. ** Correction Rules**: 完全移除
2. ** Knowledge L2**: 按相关性排序，保留前 50%
3. ** Memory L1**: 按时间排序，保留最近 50%
4. ** Role**: 保留核心描述，移除详细能力列表
5. ** System**: 不缩减（安全规则必须保留）
