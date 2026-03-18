## Why

当前登录流程缺少统一的账号入口，用户登录后无法在主界面快速查看账号信息、退出登录或切换账号，导致认证闭环不完整，也无法满足多账号场景的日常使用。

## What Changes

- 在 TopBar 增加账号图标入口，点击后展开账号操作菜单。
- 新增“查看账户信息”面板内容，展示当前用户基础信息与登录状态。
- 新增“切换账号”操作，执行后清理当前认证状态并跳转登录页。
- 新增“退出登录”操作，执行后清理认证状态并跳转登录页。
- 完善未登录状态下入口行为，支持从 TopBar 直接进入登录页。

## Capabilities

### New Capabilities
- `auth-account-menu`: 规范 TopBar 账号入口、账户信息展示、切换账号与退出登录的交互行为与状态处理规则。

### Modified Capabilities
- 无

## Impact

- 前端受影响模块：`src/components/common/TopBar.tsx`、`src/stores/authStore.ts`、`src/App.tsx`、认证相关 UI 组件。
- 路由与导航：需统一登录态失效后的重定向与入口跳转逻辑。
- 测试影响：需新增/扩展账号菜单与切换账号、退出登录的自动化测试用例。
