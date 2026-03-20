# Specification: Frontend Login Flow Enhancement

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**
- 用户通过登录页面输入用户名和密码，系统验证通过后跳转到主界面。
- ✅ 已在 epic-1-story-11-user-login 实现

**FR29 - 基础权限管理**
- 用户登录后获取权限摘要，前端根据权限控制 UI 展示。
- ❌ 本 Story 需要实现

**FR30 - 部门权限管理**
- 权限按部门划分，前端根据部门权限控制功能访问。
- ❌ 本 Story 需要实现

**NFR9 - 数据传输加密**
- 所有网络传输使用 HTTPS，确保登录凭据安全传输。
- ✅ 已实现

**NFR12 - 会话管理**
- 登录成功后建立会话，会话状态由前端和云端共同管理。
- 双 Token 机制支持会话续期。
- ❌ 本 Story 需要实现双 Token

### 架构约束

**ADR-001 - 分层微内核架构**
- 前端 React 负责登录交互和状态展示
- 认证状态存储在前端 Zustand Store
- Token 刷新由前端发起

### UX 规范

**UX-01 - AI 即入口**
- 登录页面作为系统入口之一
- 登录成功后进入 AI 对话主界面
- ✅ 已实现

**UX-04 - 零学习成本**
- 登录界面简洁明了
- 错误提示友好易懂
- 操作流程一目了然
- ✅ 已实现

## 已实现功能（来自 epic-1-story-11-user-login）

### ✅ 场景 1: 登录界面显示
- **GIVEN** 用户打开应用
- **WHEN** 应用启动完成
- **THEN** 显示登录界面（左右分栏布局）
- **AND** 包含品牌展示区（Logo + Slogan）
- **AND** 包含用户名输入框
- **AND** 包含密码输入框
- **AND** 包含"记住我"复选框
- **AND** 包含"忘记密码"链接
- **AND** 包含登录按钮

### ✅ 场景 2: 成功登录
- **GIVEN** 用户在登录页面
- **AND** 输入正确的用户名和密码
- **WHEN** 点击登录按钮
- **THEN** 显示加载状态
- **AND** 登录成功后跳转到主界面

### ✅ 场景 3: 登录失败
- **GIVEN** 用户在登录页面
- **AND** 输入错误的用户名或密码
- **WHEN** 点击登录按钮
- **THEN** 显示错误提示
- **AND** 可以重新尝试登录

### ✅ 场景 4: 注册
- **GIVEN** 用户在注册模式
- **AND** 输入合法用户名、密码和姓名
- **WHEN** 点击注册按钮
- **THEN** 注册成功
- **AND** 切换回登录模式

### ✅ 场景 5: 忘记密码
- **GIVEN** 用户在登录模式
- **AND** 已输入用户名
- **WHEN** 点击忘记密码
- **THEN** 调用忘记密码 API
- **AND** 显示受理结果提示

### ✅ 场景 6: 记住我功能
- **GIVEN** 用户勾选"记住我"
- **WHEN** 登录成功并关闭应用
- **THEN** 下次打开应用时自动登录

### ✅ 场景 7: 路由守卫
- **GIVEN** 用户未登录
- **WHEN** 访问需要认证的页面
- **THEN** 重定向到登录页面

## 待实现功能（本 Story）

### ❌ 场景 8: 权限管理
- **GIVEN** 用户登录成功
- **WHEN** 获取用户信息
- **THEN** 获取权限摘要（roles, permissions, dataScopes）
- **AND** 存储到 authStore
- **AND** 提供 hasPermission / hasRole 检查方法

### ❌ 场景 9: 双 Token 机制
- **GIVEN** 用户登录成功
- **WHEN** 服务器返回 Token
- **THEN** 分别存储 accessToken 和 refreshToken
- **AND** accessToken 存储在内存中
- **AND** refreshToken 可持久化存储

### ❌ 场景 10: Token 刷新
- **GIVEN** 用户已登录
- **AND** accessToken 即将过期
- **WHEN** 发起请求
- **THEN** 自动使用 refreshToken 刷新
- **AND** 更新 accessToken

### ❌ 场景 11: useAuth Hook
- **GIVEN** 组件需要认证功能
- **WHEN** 使用 useAuth Hook
- **THEN** 提供 login, logout, hasPermission, hasRole 方法
- **AND** 提供 isAuthenticated, user, permissions 状态

### ❌ 场景 12: 代码模块化
- **GIVEN** 现有代码中 API 和类型定义内联在 LoginForm
- **WHEN** 重构代码
- **THEN** 创建 authApi.ts 模块化 API
- **AND** 创建 auth.types.ts 模块化类型

## 数据规格

### 登录请求（已有，扩展）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| username | string | 是 | 非空，长度 3-50 |
| password | string | 是 | 非空，长度 6-100 |
| rememberMe | boolean | 否 | 默认 false |

### 登录响应（扩展）
| 字段 | 类型 | 描述 |
|------|------|------|
| user | object | 用户信息 |
| accessToken | string | 访问令牌 |
| refreshToken | string | 刷新令牌 |
| expiresIn | number | 有效期（秒）|
| permissions | object | 权限摘要 |

### 权限摘要
| 字段 | 类型 | 描述 |
|------|------|------|
| roles | string[] | 角色列表 |
| permissions | string[] | 权限列表 |
| dataScopes | object | 数据范围映射 |

### authStore 状态（扩展）
| 字段 | 类型 | 描述 |
|------|------|------|
| user | User \| null | 用户信息 |
| accessToken | string \| null | 访问令牌 |
| refreshToken | string \| null | 刷新令牌 |
| permissions | PermissionSummary \| null | 权限摘要 |
| isAuthenticated | boolean | 是否已认证 |

## 文件结构

### 已有文件
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/features/auth/pages/LoginPage.tsx` | ✅ 已实现 | 登录页面 |
| `src/features/auth/components/LoginForm.tsx` | ✅ 已实现 | 登录表单（需重构）|
| `src/stores/authStore.ts` | ✅ 已实现 | 认证状态（需扩展）|
| `src/components/common/AuthGuard.tsx` | ✅ 已实现 | 路由守卫 |

### 新增文件
| 文件 | 状态 | 说明 |
|------|------|------|
| `src/features/auth/types/auth.types.ts` | ❌ 待实现 | 类型定义 |
| `src/features/auth/api/authApi.ts` | ❌ 待实现 | API 封装 |
| `src/features/auth/hooks/useAuth.ts` | ❌ 待实现 | 认证 Hook |
| `src/features/auth/components/LoginError.tsx` | ❌ 可选 | 错误提示组件 |

## 质量属性

### 性能要求
- 登录页面加载时间 < 1s ✅
- 表单交互响应 < 100ms ✅
- API 请求超时 10s ✅
- 权限检查响应 < 10ms

### 可用性要求
- 表单字段支持 Tab 键切换 ✅
- 登录按钮支持 Enter 键提交 ✅
- 密码输入支持显示/隐藏切换（可选）

### 可访问性要求
- 所有表单元素有正确的 label ✅
- 错误信息可被屏幕阅读器识别
- 颜色对比度符合 WCAG AA 标准 ✅

## 依赖关系

### 上游依赖
- React 18+ ✅
- React Router 6+ ✅
- Zustand 4+ ✅
- Shadcn/ui 组件库 ✅
- Tailwind CSS ✅
- Lucide React 图标 ✅

### 下游依赖
- E2-S2.1-04: Local session cache wrapper
- E2-S2.10-02: Force logout and expiry handling
- E2-S2.5-01: Three-layer permission model（需要配合权限中心）
