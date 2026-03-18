# Epic 2 前后端分层开发计划

## 1. 目标与边界

本文件用于补强 Epic 2“用户认证与部门权限系统”的实现方案，明确以下边界：

- 登录认证主链路由 `Go 云端` 承担
- `React` 前端负责登录交互、状态展示和管理台界面
- `Tauri/Rust` 只承担桌面壳、IPC、本地缓存和辅助能力
- 本地层不承担账号密码鉴权主入口

覆盖范围：

- `FR27-FR33`
- `FR99-FR102`
- `FR105-FR106`
- `NFR9-NFR16`

目标是把 Epic 2 从“功能可用”提升为“可上线、可审计、可扩展”。

## 2. 总体分层架构

### 2.1 分层职责

**前端 React**

- 登录页、会话过期提示、强制下线提示
- 用户管理、部门管理、岗位管理、权限配置、审计查询页面
- 路由守卫、按钮级权限态、越权反馈展示

**Go 云端**

- 登录鉴权、密码策略、会话签发、会话失效
- 用户、部门、岗位、角色、权限 CRUD
- 权限计算、越权拦截、审计日志主记录
- 导入导出任务、预检与冲突处理

**Tauri / Rust**

- 桌面容器、窗口生命周期、系统托盘、IPC
- 安全缓存少量会话元数据或刷新凭证
- 本地诊断日志、离线提示、受控本地存储
- 不做账号密码认证兜底

**数据层**

- 云端主数据：用户、组织、角色、权限、会话、审计
- 本地缓存：当前用户态、界面偏好、少量只读镜像
- 审计合规主记录以云端为准

### 2.2 请求链路

```text
React Login Page
  -> Go Auth API
  -> Go 返回 access token / refresh token / user profile / tenant profile / permission summary
  -> React 更新全局认证状态
  -> Tauri/Rust 仅缓存必要元数据
```

## 3. Epic 2 Story 与分层映射

### Story 2.1 安全登录与密码策略

**前端**

- 登录表单
- 基础字段校验
- 统一错误提示
- 登录成功后的初始化跳转

**Go 云端**

- `POST /api/auth/login`
- 密码校验、账号状态校验、失败次数限制、锁定策略
- 返回 token、用户信息、租户信息、权限摘要
- 写入登录成功与失败审计

**Tauri/Rust**

- 受控保存会话元数据
- 清理本地旧缓存

### Story 2.2 用户管理工作台

**前端**

- 用户列表页
- 新增与编辑表单
- 搜索、筛选、状态展示

**Go 云端**

- 用户分页查询
- 用户新增、编辑、启停用接口
- 用户与部门、岗位、角色绑定
- 写入审计日志

**Tauri/Rust**

- 无核心业务逻辑，仅桥接桌面能力

### Story 2.3 / 2.4 / 2.8 组织与可视化

**前端**

- 部门树
- 岗位管理
- 直属上级选择器
- 组织架构图与部门详情

**Go 云端**

- 部门、岗位、汇报关系 CRUD
- 组织树查询接口

### Story 2.5 / 2.6 / 2.7 权限闭环

**前端**

- 权限模型配置中心
- 细粒度权限配置页
- 403 拒绝页、禁用态、申请入口

**Go 云端**

- 角色权限模型
- 数据范围权限计算
- 权限校验中间件
- 返回统一 403 合约

**Tauri/Rust**

- 不进行权限放大，只消费最终权限结果

### Story 2.9 导入导出

**前端**

- 上传文件
- 预检结果展示
- 冲突处理确认
- 导出范围选择

**Go 云端**

- 导入预检
- 冲突识别
- 批量写入
- 导出过滤
- 批处理审计

### Story 2.10 会话安全管理

**前端**

- 会话过期提示
- 强制下线提示
- 自动跳转登录页

**Go 云端**

- 30 分钟空闲超时
- 强制下线
- token 撤销
- 会话查询与失效

**Tauri/Rust**

- 清理本地缓存
- 停止后续受保护 IPC 或请求

### Story 2.11 审计日志与合规追踪

**前端**

- 审计日志查询页
- 按用户、事件类型、时间范围筛选
- 导出审计记录

**Go 云端**

- 结构化审计落库
- 审计查询接口
- 合规保留策略

**Tauri/Rust**

- 本地诊断日志仅辅助排障，不替代云端审计

## 4. 推荐开发顺序

### 阶段 A：认证与会话底座

- Story `2.1`
- Story `2.10`
- Story `2.11` 基础埋点

交付结果：

- Go 登录接口可用
- 前端登录成功进入主界面
- 云端会话失效和强制下线可用
- 关键认证事件已审计

### 阶段 B：组织主数据

- Story `2.3`
- Story `2.4`
- Story `2.2`

交付结果：

- 部门、岗位、上级关系稳定
- 用户管理工作台可用

### 阶段 C：权限闭环

- Story `2.5`
- Story `2.6`
- Story `2.7`
- Story `2.11` 完整态

交付结果：

- 可配置角色与细粒度权限
- 前后端统一越权拦截
- 审计可查可导

### 阶段 D：效率增强

- Story `2.8`
- Story `2.9`

交付结果：

- 组织图与部门详情可视化
- 导入导出闭环完成

## 5. Go 云端 API 规划

### 5.1 认证与会话

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/session/current`
- `POST /api/auth/session/revoke`
- `GET /api/auth/session/list`

### 5.2 用户与组织

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/departments/tree`
- `POST /api/admin/departments`
- `PUT /api/admin/departments/:id`
- `GET /api/admin/positions`
- `POST /api/admin/positions`

### 5.3 权限

- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `PUT /api/admin/roles/:id`
- `GET /api/admin/permissions`
- `PUT /api/admin/users/:id/roles`
- `PUT /api/admin/users/:id/permission-overrides`

### 5.4 审计与导入导出

- `GET /api/admin/audit-logs`
- `GET /api/admin/audit-logs/export`
- `POST /api/admin/users/import/preview`
- `POST /api/admin/users/import/commit`
- `POST /api/admin/users/export`

## 6. 数据模型建议

### 云端核心表

- `users`
- `departments`
- `positions`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_permission_overrides`
- `sessions`
- `audit_logs`
- `user_import_batches`

### 关键字段建议

**sessions**

- `id`
- `tenant_id`
- `user_id`
- `access_token_jti`
- `refresh_token_jti`
- `issued_at`
- `last_active_at`
- `expires_at`
- `revoked_at`
- `revoke_reason`

**audit_logs**

- `id`
- `tenant_id`
- `operator_id`
- `target_id`
- `event_type`
- `resource`
- `action`
- `result`
- `reason`
- `ip_hash`
- `user_agent_hash`
- `trace_id`
- `created_at`

## 7. 统一权限网关约定

### 7.1 后端校验顺序

1. 租户隔离
2. 用户状态校验
3. 角色权限校验
4. 个人覆盖权限校验
5. 数据范围校验
6. 字段级可见与可编辑校验

### 7.2 统一 403 响应

```json
{
  "code": "PERMISSION_DENIED",
  "http_status": 403,
  "message": "当前账号无权限执行该操作",
  "resource": "auth.user.update",
  "required_permission": "auth_user_write",
  "apply_entry": "/permissions/apply?resource=auth.user.update",
  "trace_id": "req-20260318-xxxx"
}
```

### 7.3 前端处理约定

- 列表页显示无权限空态
- 按钮显示禁用态或隐藏态
- 重要越权操作显示原因与申请入口
- 不在前端自行推导高权限结果

## 8. Tauri / Rust 配合层约定

Tauri/Rust 在 Epic 2 中只承担以下能力：

- 保存极少量必要登录元数据
- 清理本地缓存
- 提供桌面通知、系统托盘、窗口控制
- 记录本地诊断日志

明确禁止：

- 本地保存明文密码
- 本地自行判定登录成功
- 本地绕过云端会话与权限校验

## 9. 交付清单

### 前端

- 登录页
- 全局认证状态管理
- 路由守卫
- 用户管理台
- 部门岗位管理页
- 权限中心
- 审计页
- 导入导出页

### Go 云端

- 认证接口
- 会话接口
- 用户组织接口
- 权限接口
- 审计接口
- 导入导出接口

### Tauri/Rust

- 本地会话缓存封装
- 安全清理逻辑
- 诊断日志封装

## 10. 验收检查清单

- 登录请求是否明确走 Go 云端而非 Tauri 本地后台
- 登录成功后是否返回用户、租户、权限摘要
- 30 分钟空闲是否由云端会话系统判定失效
- 强制下线后前端是否能立即退回登录页
- 关键认证与权限事件是否写入云端审计
- 前后端是否都执行权限校验而非只做前端隐藏
- 导入导出是否遵守当前权限边界

## 11. 风险与缓解

- 风险：前端误把 Tauri IPC 当认证入口
  缓解：认证状态统一来源于 Go 云端 token 与 session API

- 风险：本地缓存与云端会话状态不一致
  缓解：使用会话校验接口、刷新机制和强制下线通知

- 风险：审计分散到本地导致合规不可追踪
  缓解：云端为主审计，本地仅做辅助诊断

- 风险：权限逻辑散落在页面中造成绕过
  缓解：统一后端权限中间件与前端 Guard 组件双层收口
