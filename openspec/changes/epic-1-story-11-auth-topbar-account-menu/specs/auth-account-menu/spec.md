## ADDED Requirements

### Requirement: TopBar SHALL provide account entry for authenticated users
系统 SHALL 在 TopBar 提供账号图标入口，使已登录用户可以访问账号菜单。

#### Scenario: Authenticated user sees account entry
- **WHEN** 用户处于已登录状态并进入任意受保护页面
- **THEN** TopBar 显示可点击的账号图标按钮

#### Scenario: Open account menu
- **WHEN** 用户点击 TopBar 的账号图标按钮
- **THEN** 系统显示账号菜单并提供账户信息、切换账号、退出登录操作项

### Requirement: System SHALL show current account information
系统 SHALL 在账号菜单中展示当前登录用户的关键信息，包括用户名、姓名、部门与角色。

#### Scenario: Display account profile summary
- **WHEN** 用户展开账号菜单
- **THEN** 菜单内显示当前用户用户名、姓名、部门、角色

#### Scenario: Handle missing profile fields
- **WHEN** 当前用户存在缺失字段
- **THEN** 菜单使用占位文案展示缺失信息且界面不报错

### Requirement: System SHALL support account switching through logout-and-login flow
系统 SHALL 提供“切换账号”操作，并在执行时清理当前认证状态后进入登录页面，以便用户使用其他账号重新登录。

#### Scenario: Switch account action
- **WHEN** 用户在账号菜单中点击“切换账号”
- **THEN** 系统清理当前会话状态并导航到登录页

#### Scenario: Login with another account after switching
- **WHEN** 用户在切换账号后输入新的账号密码并提交
- **THEN** 系统使用新账号建立会话并进入主界面

### Requirement: System SHALL support explicit logout
系统 SHALL 提供“退出登录”操作，并在执行后终止当前登录态。

#### Scenario: Logout from account menu
- **WHEN** 用户在账号菜单中点击“退出登录”
- **THEN** 系统清理 token 与用户信息并跳转到登录页

#### Scenario: Protected page access after logout
- **WHEN** 用户退出后尝试访问受保护页面
- **THEN** 系统拒绝访问并重定向到登录页

### Requirement: System SHALL provide deterministic behavior for unauthenticated account-entry action
系统 SHALL 对未登录用户点击账号入口时给出确定性行为，直接进入登录流程。

#### Scenario: Unauthenticated account-entry click
- **WHEN** 未登录用户触发账号入口动作
- **THEN** 系统立即导航到登录页
