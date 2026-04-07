# Specification: 统一消息系统群聊功能

## 需求来源

### PRD 需求
- FR631: 用户可以创建群组并设置群名称和群公告
- FR632: 群主可以邀请/移除群成员
- FR633: 群主可以设置群管理员
- FR634: 员工入群时，其Agent自动跟随入群
- FR635: 员工可以设置自己的Agent不自动入群
- FR636: 群主/管理员可以单独移除群内的Agent
- FR637: 员工可以主动退出群组
- FR638: 群主可以解散群组
- FR639: Agent在群聊中的消息必须有"AI助手"标识和所属员工
- FR640: Agent默认静默，仅在特定场景发言
- FR641: 被@提及或@其所属员工时，Agent代为回答
- FR642: 检测到相关任务状态变化时，Agent主动通知
- FR643: 员工发言涉及数据时，Agent可补充相关数据卡片
- FR644: 员工可以让Agent在群里汇报工作进度
- FR645: 上游任务完成时，Agent通知下游相关人员
- FR646: Agent所属员工可设置Agent在群内的发言权限
- FR647: 群主可以设置群组类型（公开/私密）
- FR648: 私密群组需要邀请才能加入
- FR649: Agent在群内只能访问与任务相关的数据

## 功能规格

### 用户故事

As a **用户**,
I want **创建和管理群组**,
So that **与多个同事协作讨论工作**。

As a **用户**,
I want **在群聊中获得AI Agent的智能辅助**,
So that **提高群聊效率和自动化水平**。

### 验收场景

#### Scenario 1: Agent跟随入群（FR634）
- **GIVEN** 用户被邀请加入群组
- **WHEN** 入群成功
- **THEN** 用户的Agent自动加入群聊（除非用户禁用）

#### Scenario 2: @提及响应（FR641）
- **GIVEN** 群成员@了另一个成员或其Agent
- **WHEN** 消息发送
- **THEN** 被@的Agent代为回答

#### Scenario 3: Agent静默模式（FR640）
- **GIVEN** 群内有新消息
- **WHEN** 消息不@任何人
- **THEN** Agent保持静默，不主动发言

## 数据规格

### Group
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | String | 是 | UUID格式 |
| name | String | 是 | 长度1-50 |
| announcement | String | 否 | 长度0-500 |
| owner_id | String | 是 | 用户ID |
| group_type | String | 是 | public/private |
| created_at | i64 | 是 | Unix时间戳 |

### GroupMember
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| user_id | String | 是 | 用户ID |
| role | String | 是 | owner/admin/member |
| agent_enabled | bool | 是 | 默认true |
| agent_silent | bool | 是 | 默认true |
| joined_at | i64 | 是 | Unix时间戳 |
