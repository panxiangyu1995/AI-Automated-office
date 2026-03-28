# Spec: Skill执行引擎

## 功能规格

### FR700: 系统可以解析SKILL.md格式的技能文件

**描述**: 系统能够解析OpenClaw格式的SKILL.md文件，提取技能定义。

**文件格式**:
```markdown
---
name: skill-name
version: 1.0.0
description: "技能描述"
author: "作者"
tags: ["tag1", "tag2"]
requires:
  bins: ["gh"]
  env: ["GITHUB_TOKEN"]
---

## 技能正文

技能详细描述和使用说明...
```

**解析规则**:
1. Frontmatter必须位于文件开头，用 `---` 包围
2. Frontmatter使用YAML格式
3. 正文使用Markdown格式
4. 必需字段：`name`, `version`, `description`

**验证**:
- 解析成功率 > 99%
- 兼容OpenClaw SKILL.md格式
- 错误信息清晰明确

---

### FR701: 系统可以将Skill中的Tools转换为内部工具

**描述**: 将Skill中定义的工具转换为系统内部工具格式。

**转换规则**:
1. MCP工具 → `ConvertedToolType::Mcp`
2. 内置工具 → `ConvertedToolType::Builtin`
3. 自定义工具 → `ConvertedToolType::Custom`

**输出格式**:
```rust
struct ConvertedTool {
    id: String,           // 唯一标识
    name: String,         // 工具名称
    source_skill: String, // 来源Skill
    tool_type: ConvertedToolType,
    description: String,
    parameters: Vec<ToolParameter>,
    return_type: String,
}
```

**验证**:
- 转换准确率 100%
- 参数类型正确映射
- 必需参数正确标记

---

### FR702: 系统可以将Skill中的Triggers转换为触发器规则

**描述**: 将Skill中定义的触发器转换为系统内部触发器格式。

**触发器类型**:
| 类型 | 说明 | 配置示例 |
|------|------|----------|
| Event | 事件触发 | `{"event": "session_start"}` |
| Schedule | 定时触发 | `{"cron": "0 9 * * *"}` |
| Manual | 手动触发 | `{}` |
| Condition | 条件触发 | `{"condition": "user_input_contains('关键词')"}` |

**验证**:
- 触发器类型正确识别
- 配置正确解析
- 触发条件可执行

---

### FR703: 用户可以从本地导入Skill文件

**描述**: 支持从本地文件系统导入SKILL.md文件。

**导入流程**:
1. 用户选择SKILL.md文件或包含SKILL.md的目录
2. 系统解析文件内容
3. 验证格式和依赖
4. 安装到本地Skill库
5. 注册到Skill注册表

**验证**:
- 支持单文件导入
- 支持目录导入
- 依赖检查正确

---

### FR704: 用户可以从私有市场安装Skill

**描述**: 支持从企业私有市场安装Skill。

**安装流程**:
1. 连接私有市场
2. 浏览/搜索Skill
3. 选择安装
4. 下载并验证
5. 安装到本地

**验证**:
- 私有市场连接正常
- Skill下载成功
- 安装后可正常使用

---

### FR705: 用户可以从ClawHub市场安装Skill

**描述**: 支持从ClawHub官方市场安装Skill。

**安装流程**:
1. 连接ClawHub市场
2. 浏览/搜索Skill
3. 查看详情和评分
4. 选择安装
5. 下载并验证
6. 安装到本地

**验证**:
- ClawHub市场连接正常
- Skill元数据正确显示
- 安装后可正常使用

---

### FR706: Skill执行时自动记录审计日志

**描述**: 每次Skill执行都自动记录审计日志。

**日志内容**:
```json
{
  "event_type": "skill_execution",
  "skill_name": "github",
  "input_hash": "sha256:...",
  "output_hash": "sha256:...",
  "status": "success",
  "duration_ms": 1234,
  "retry_count": 0,
  "timestamp": "2026-03-28T10:00:00Z",
  "user_id": "user-123",
  "session_id": "session-456"
}
```

**验证**:
- 所有执行都有日志
- 日志内容完整
- 日志可查询

---

### FR707: Skill执行支持超时和重试机制

**描述**: Skill执行支持配置超时时间和重试策略。

**超时配置**:
```yaml
invocation:
  timeout_ms: 30000      # 30秒超时
  max_retries: 3         # 最大重试3次
  retry_delay_ms: 1000   # 重试延迟1秒
```

**重试策略**:
- 指数退避：每次重试延迟加倍
- 最大重试次数限制
- 超时后终止执行

**验证**:
- 超时正确触发
- 重试次数正确
- 延迟时间正确

---

### FR708: 用户可以查看已安装Skill的状态和版本

**描述**: 提供已安装Skill的状态和版本查看功能。

**状态类型**:
| 状态 | 说明 |
|------|------|
| Installed | 已安装 |
| Loading | 加载中 |
| Active | 活跃使用中 |
| Error | 错误状态 |
| Disabled | 已禁用 |
| Deprecated | 已废弃 |

**显示信息**:
- 名称、版本、描述
- 来源、状态
- 安装时间、更新时间
- 依赖列表

**验证**:
- 状态正确显示
- 版本信息准确
- 列表可搜索/筛选

---

### FR709: 用户可以卸载已安装的Skill

**描述**: 支持卸载已安装的Skill。

**卸载流程**:
1. 选择要卸载的Skill
2. 检查是否有其他Skill依赖
3. 确认卸载
4. 删除文件和注册信息
5. 更新审计日志

**验证**:
- 卸载后文件删除
- 注册信息清除
- 依赖检查正确

---

### FR710: 系统支持Skill版本更新检查和升级

**描述**: 支持检查Skill更新并执行升级。

**更新流程**:
1. 定期检查更新（可配置）
2. 发现新版本时通知用户
3. 用户确认升级
4. 下载新版本
5. 备份旧版本
6. 安装新版本
7. 支持回滚

**验证**:
- 更新检查正确
- 升级过程完整
- 回滚功能正常

---

### FR835: 用户可以查看已安装的Skill列表

**描述**: 提供已安装Skill列表查看功能。

**列表显示**:
- 名称、描述、状态
- 来源、版本
- 操作按钮

**验证**:
- 列表完整显示
- 支持搜索
- 支持排序

---

### FR836: 用户可以启用/禁用已安装的Skill

**描述**: 支持快速启用或禁用Skill。

**操作**:
- 切换开关启用/禁用
- 禁用后Skill不参与加载
- 启用后立即可用

**验证**:
- 状态切换正确
- 禁用后不加载
- 启用后可使用

---

### FR837: 用户可以配置Skill的参数和选项

**描述**: 支持配置Skill级别的参数。

**参数类型**:
| 类型 | 说明 |
|------|------|
| string | 字符串 |
| number | 数字 |
| boolean | 布尔值 |
| array | 数组 |
| object | 对象 |
| select | 单选 |
| multiselect | 多选 |

**验证**:
- 参数类型正确
- 验证规则生效
- 默认值正确

---

### FR838: 用户可以查看Skill提供的工具和触发器

**描述**: 透明展示Skill提供的工具和触发器。

**显示内容**:
- 工具名称、类型、描述
- 工具参数定义
- 触发器类型、配置

**验证**:
- 工具列表完整
- 参数定义清晰
- 触发器配置可见

---

### FR839: 用户可以测试Skill是否正常工作

**描述**: 提供Skill测试功能。

**测试流程**:
1. 选择Skill
2. 输入测试参数
3. 执行测试
4. 查看结果

**验证**:
- 测试执行正常
- 结果正确显示
- 错误信息清晰

---

### FR840: 管理员可以设置Skill的访问权限

**描述**: 支持设置Skill的访问权限控制。

**权限级别**:
| 级别 | 说明 |
|------|------|
| global | 全局可用 |
| tenant | 租户可用 |
| user | 用户可用 |
| session | 会话可用 |

**验证**:
- 权限设置生效
- 访问控制正确
- 权限继承正确

---

## API规格

### RESTful API

#### GET /api/skills
获取已安装Skill列表

**响应**:
```json
{
  "skills": [
    {
      "id": "skill-001",
      "name": "github",
      "version": "1.0.0",
      "status": "active",
      "source": "workspace"
    }
  ]
}
```

#### POST /api/skills/parse
解析SKILL.md文件

**请求**:
```json
{
  "file_path": "/path/to/SKILL.md"
}
```

**响应**:
```json
{
  "success": true,
  "skill": {
    "name": "github",
    "version": "1.0.0",
    "description": "GitHub operations"
  }
}
```

#### POST /api/skills/{name}/execute
执行Skill

**请求**:
```json
{
  "input": {
    "action": "create_issue",
    "title": "Bug report"
  }
}
```

**响应**:
```json
{
  "success": true,
  "output": {
    "issue_url": "https://github.com/..."
  },
  "duration_ms": 1234
}
```

#### PUT /api/skills/{name}/enabled
启用/禁用Skill

**请求**:
```json
{
  "enabled": false
}
```

---

### Tauri命令

| 命令 | 说明 | 参数 |
|------|------|------|
| `get_installed_skills` | 获取已安装Skill列表 | 无 |
| `parse_skill_file` | 解析SKILL.md文件 | `file_path: String` |
| `toggle_skill` | 启用/禁用Skill | `skill_name: String, enabled: bool` |
| `execute_skill` | 执行Skill | `skill_name: String, input: SkillInput` |
| `check_skill_updates` | 检查Skill更新 | 无 |
| `update_skill` | 更新Skill | `skill_name: String` |
| `get_skill_prompt` | 获取Skill提示文本 | `skill_filter: Option<Vec<String>>` |

---

## 事件规格

### Skill事件

| 事件类型 | 说明 | 数据 |
|----------|------|------|
| `skill:installed` | Skill安装完成 | `{skill_name, version}` |
| `skill:uninstalled` | Skill卸载完成 | `{skill_name}` |
| `skill:updated` | Skill更新完成 | `{skill_name, old_version, new_version}` |
| `skill:enabled` | Skill启用 | `{skill_name}` |
| `skill:disabled` | Skill禁用 | `{skill_name}` |
| `skill:execution:start` | 执行开始 | `{skill_name, input_hash}` |
| `skill:execution:end` | 执行结束 | `{skill_name, status, duration_ms}` |
| `skill:execution:timeout` | 执行超时 | `{skill_name, timeout_ms}` |
| `skill:execution:retry` | 执行重试 | `{skill_name, attempt, max_retries}` |

---

## 错误代码

| 代码 | 说明 |
|------|------|
| `SKILL_001` | SKILL.md解析失败 |
| `SKILL_002` | Frontmatter格式错误 |
| `SKILL_003` | 必需字段缺失 |
| `SKILL_004` | 依赖不满足 |
| `SKILL_005` | 执行超时 |
| `SKILL_006` | 执行失败 |
| `SKILL_007` | 权限不足 |
| `SKILL_008` | Skill不存在 |
| `SKILL_009` | 版本冲突 |
| `SKILL_010` | 市场连接失败 |

---

## 性能规格

| 指标 | 要求 |
|------|------|
| SKILL.md解析时间 | < 100ms |
| Skill列表加载时间 | < 200ms |
| 执行启动时间 | < 50ms |
| 提示生成时间 | < 100ms |
| 最大并发执行数 | 10 |
| 最大Skill文件大小 | 100KB |
| 提示中最大Skill数 | 20 |
| 提示最大字符数 | 50,000 |
