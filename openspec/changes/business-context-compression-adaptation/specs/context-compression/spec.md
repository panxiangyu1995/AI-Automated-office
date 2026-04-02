# context-compression

## MODIFIED Requirements

### Requirement: 压缩触发条件扩展

**FROM:**
压缩触发条件 SHALL 仅基于 Token 数量阈值：
- 自动触发：当 Token 数超过 32,000
- 手动触发：用户通过 UI 或快捷键触发

**TO:**
压缩触发条件 SHALL 支持多维度触发：

- **Token 阈值触发**：Token 数 >= 上下文窗口 - 15,000 时触发微压缩
- **部门切换触发**：用户切换部门时触发业务记忆压缩
- **审批变更触发**：审批状态变更时触发微压缩
- **时效触发**：30 分钟无操作后首次交互时触发
- **手动触发**：用户主动触发业务全量压缩

#### Scenario: Token 阈值触发

- **WHEN** 当前 Token 数 >= 上下文窗口 - 15,000
- **THEN** 系统 SHALL 自动触发微压缩
- **AND** SHALL 设置优先级为 50

#### Scenario: 部门切换触发

- **WHEN** 用户切换到不同部门
- **THEN** 系统 SHALL 触发业务记忆压缩
- **AND** SHALL 保留 Never Compress 类型的实体

### Requirement: 保留规则扩展

**FROM:**
保留规则 SHALL 仅保留最近 10 轮完整对话，中间轮次做摘要压缩。

**TO:**
保留规则 SHALL 实现分层保留策略：

**Never Compress 层**（永不压缩）：
- pending_approval：待审批项
- form_draft：表单草稿
- current_department_context：当前部门上下文
- user_permission_context：用户权限上下文
- user_explicit_reference：用户显式引用的实体

**分层保留**：
- 最近 5 轮对话：完整保留
- 中间轮次：摘要压缩
- 历史轮次：仅保留关键意图摘要

#### Scenario: 保留待审批项

- **WHEN** 对话中包含待审批项时执行压缩
- **THEN** 系统 SHALL 保留完整的审批详情
- **AND** SHALL 不将该审批信息压缩为摘要

#### Scenario: 部门上下文保留

- **WHEN** 任何压缩操作执行时
- **THEN** 系统 SHALL 保留当前部门完整上下文
- **AND** SHALL 不将部门信息压缩或删除

### Requirement: 压缩结构扩展

**FROM:**
压缩结构 SHALL 生成基础摘要，保留主要意图和技术上下文。

**TO:**
压缩结构 SHALL 生成 9+X 段式摘要：

**基础 9 段**（继承）：
1. Primary Request and Intent
2. Key Business Concepts
3. Documents and Data References
4. Decisions and Resolutions
5. Problem Solving
6. All User Messages
7. Pending Tasks
8. Current Work
9. Optional Next Step

**办公扩展段（新增 X）**：
10. Department Context
11. Approval Chain Status
12. Related Documents
13. Cross-Department Dependencies
14. Business Rules Applied

#### Scenario: 生成完整 9+X 段摘要

- **WHEN** 触发业务全量压缩时
- **THEN** 系统 SHALL 调用 LLM 生成包含所有 14 段的摘要
- **AND** SHALL 每个段的内容简洁但完整
