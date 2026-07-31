# Epic 8 验收测试结果

## 测试结果: 25/25 PASS, 0 FAIL, 0 SKIP

### 8.1: 知识库文档 (3/3 PASS)
- 8.1-1: PASS - 创建知识库文档
- 8.1-2: PASS - 创建第二篇文档
- 8.1-3: PASS - 查询文档列表

### 8.2: 知识库分类 (3/3 PASS)
- 8.2-1: PASS - 创建分类
- 8.2-2: PASS - 查询分类列表
- 8.2-3: PASS - 创建子分类

### 8.3: 文档分块与语义搜索 (3/3 PASS)
- 8.3-1: PASS - 文档分块
- 8.3-2: PASS - 查询文档分块
- 8.3-3: PASS - 语义搜索(keyword模式,SQL LIKE)

### 8.4: 文件上传与管理 (2/2 PASS)
- 8.4-1: PASS - 上传文件
- 8.4-2: PASS - 查询文件列表

### 8.5: 消息发送与查询 (4/4 PASS)
- 8.5-1: PASS - 发送消息
- 8.5-2: PASS - 发送紧急消息
- 8.5-3: PASS - 查询消息列表(发送方,仅收件箱)
- 8.5-4: PASS - 查询消息列表(接收方)

### 8.6: 消息已读与未读 (3/3 PASS)
- 8.6-1: PASS - 查询未读消息
- 8.6-2: PASS - 标记消息已读
- 8.6-3: PASS - 批量标记已读

### 8.7: 消息轮询 (1/1 PASS)
- 8.7-1: PASS - 消息轮询

### 8.8: 公告管理 (2/2 PASS)
- 8.8-1: PASS - 创建公告
- 8.8-2: PASS - 查询公告列表

### 权限边界 (2/2 PASS)
- PERM-1: PASS - employee发送消息(允许)
- PERM-2: PASS - employee查看知识库(允许)

## 修复的Bug
1. **knowledge_docs表缺少creator_id列** → ALTER TABLE添加
2. **knowledge_docs的uuid列接收空字符串** → 将creator_id, parent_version_id, category_id改为text类型
3. **knowledge_docs的allowed_department_ids列jsonb接收空字符串** → 改为text类型
4. **announcements表缺少sender_id/priority/target_type/target_id/expires_at列** → ALTER TABLE添加
5. **knowledge_docs/doc_chunks/vector_records/chat_sessions/chat_messages/file_records/announcement_read_statuses表不存在** → CREATE TABLE
6. **ChunkDocument handler未提取enterprise_id** → 修复handler提取enterprise_id,路由移至enterprise组
7. **BatchMarkRead binding:"required"拒绝JSON数组** → 移除binding tag,手动空检查;CLI param type改为array
8. **chat_sessions.user_id为uuid类型拒绝空字符串** → GORM model改为text类型,DB ALTER TABLE

## 注意事项
- 消息列表只显示接收方消息，发送方看不到自己发出的消息
- 语义搜索keyword模式使用SQL LIKE搜索knowledge_docs.content，无需Qdrant
- message的receiver_id使用user表ID(非employee表ID)
