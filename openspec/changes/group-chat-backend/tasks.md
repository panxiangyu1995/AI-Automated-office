# Tasks: 统一消息系统群聊功能

## 实现类型
- **类型**: enhancement
- **优先级**: critical (P0)
- **阶段**: Phase 3 - P0核心

## 任务列表

### Task 1: 创建群组数据模型
- **描述**: 定义Group、GroupMember数据结构
- **文件**:
  - `src-tauri/src/message/group.rs` (新建)
- **验收**: 数据模型符合FR647群组类型定义
- **状态**: ✅ 已完成

### Task 2: 实现群组CRUD API
- **描述**: 创建/更新/删除群组
- **文件**:
  - `src-tauri/src/message/group.rs`
- **验收**: CRUD操作正常工作
- **状态**: ✅ 已完成

### Task 3: 实现成员管理API
- **描述**: 邀请/移除群成员，设置群管理员
- **文件**:
  - `src-tauri/src/message/group.rs`
  - `src-tauri/src/commands/group.rs`
- **验收**: 成员管理符合FR632-FR638
- **状态**: ✅ 已完成

### Task 4: 实现Agent跟随入群逻辑
- **描述**: 员工入群时Agent自动跟随
- **文件**:
  - `src-tauri/src/message/group.rs` (GroupMember.agent_enabled)
- **验收**: 符合FR634-FR635
- **状态**: ✅ 已完成

### Task 5: 实现@提及检测和响应
- **描述**: @提及检测，Agent代为回答
- **文件**:
  - `src-tauri/src/message/group_message.rs` (新建)
- **验收**: 符合FR640-FR641
- **状态**: ✅ 已完成

### Task 6: 实现群消息推送
- **描述**: 实时推送群消息到所有成员
- **文件**:
  - `src-tauri/src/message/group_message.rs`
  - `src-tauri/src/commands/group.rs`
- **验收**: 消息实时推送
- **状态**: ✅ 已完成

### Task 7: 集成测试
- **描述**: 测试群聊完整流程
- **验收**: 集成测试通过
- **状态**: ⏳ 待测试

## 已实现功能

### 后端 (Rust)

1. **message/group.rs** - 群组管理
   - `Group` - 群组数据结构
   - `GroupMember` - 成员数据结构
   - `GroupType` - 群组类型 (公开/私有)
   - `MemberRole` - 成员角色 (群主/管理员/成员)
   - `GroupStore` - 群组存储服务
   - CRUD操作：create/update/delete/get
   - 成员管理：add_member/remove_member/set_admin
   - Agent跟随入群：`set_agent_auto_join`

2. **message/group_message.rs** - 群消息
   - `GroupMessage` - 群消息数据结构
   - `GroupMessageStore` - 消息存储
   - `@MentionHandler` - @提及处理器
   - `AgentGroupResponder` - Agent响应接口
   - `@提及解析`：parse_mentions

3. **commands/group.rs** - Tauri命令
   - `create_group` - 创建群组
   - `update_group` - 更新群组
   - `delete_group` - 删除群组
   - `get_group` / `get_user_groups` - 获取群组
   - `invite_member` / `remove_member` - 成员管理
   - `set_group_admin` / `set_agent_auto_join` - 设置管理
   - `send_group_message` - 发送群消息
   - `get_group_messages` - 获取消息
   - `get_mentioned_messages` - 获取被@消息

## 需求覆盖

| FR | 需求 | 实现位置 |
|----|------|----------|
| FR631 | 员工可以创建群组 | create_group |
| FR632 | 群主可以邀请成员 | invite_member |
| FR633 | 群主可以移除成员 | remove_member |
| FR634 | 员工入群时其Agent自动跟随 | GroupMember.agent_enabled |
| FR635 | Agent可以代表员工参与群聊 | GroupMessage.sender_type="agent" |
| FR636 | 被@提及时Agent响应 | MentionHandler + AgentGroupResponder |
| FR637 | Agent消息有明确标识 | GroupMessage.sender_type |
| FR638 | 群内消息支持引用回复 | GroupMessage.reply_to |
| FR640 | @提及检测 | GroupMessage::parse_mentions |
| FR641 | @Agent代为回答 | AgentGroupResponder trait |
| FR647 | 群组类型定义 | GroupType (Public/Private) |
