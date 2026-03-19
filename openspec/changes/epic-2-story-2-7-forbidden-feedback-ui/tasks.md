## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.7-01（权限网关）已完成
- [ ] 1.2 确认 403 响应契约格式已定义
- [ ] 1.3 确认 FR/NFR/ARCH/UX 需求映射正确

## 2. 核心开发任务

### 2.1 权限状态管理
- [ ] 2.1.1 创建 permissionStore Zustand Store
- [ ] 2.1.2 实现 permissions 权限集合管理
- [ ] 2.1.3 实现 hasPermission 检查方法
- [ ] 2.1.4 实现 403 弹窗状态管理
- [ ] 2.1.5 实现防重复弹出机制

### 2.2 权限 Hook
- [ ] 2.2.1 实现 usePermission Hook
- [ ] 2.2.2 实现 useForbiddenHandler Hook
- [ ] 2.2.3 实现 useApplyPermission Hook
- [ ] 2.2.4 实现权限预加载逻辑

### 2.3 403 响应拦截
- [ ] 2.3.1 实现 Axios 403 响应拦截器
- [ ] 2.3.2 解析 403 响应数据
- [ ] 2.3.3 调用 showForbidden 显示弹窗
- [ ] 2.3.4 处理特殊场景（路由跳转等）

### 2.4 ForbiddenPage 403 页面
- [ ] 2.4.1 创建 ForbiddenPage 页面组件
- [ ] 2.4.2 实现资源/权限信息展示
- [ ] 2.4.3 实现返回和申请按钮
- [ ] 2.4.4 添加路由配置

### 2.5 NoPermissionEmpty 空状态
- [ ] 2.5.1 创建 NoPermissionEmpty 组件
- [ ] 2.5.2 实现图标和文案
- [ ] 2.5.3 实现申请入口

### 2.6 PermissionGuard 守卫组件
- [ ] 2.6.1 创建 PermissionGuard 组件
- [ ] 2.6.2 实现 hidden 模式
- [ ] 2.6.3 实现 disabled 模式
- [ ] 2.6.4 实现 empty 模式
- [ ] 2.6.5 实现 Tooltip 提示

### 2.7 ForbiddenModal 弹窗
- [ ] 2.7.1 创建 ForbiddenModal 弹窗组件
- [ ] 2.7.2 实现拒绝信息展示
- [ ] 2.7.3 实现申请入口按钮
- [ ] 2.7.4 集成 ApplyPermissionModal

### 2.8 ApplyPermissionModal 申请弹窗
- [ ] 2.8.1 创建 ApplyPermissionModal 弹窗组件
- [ ] 2.8.2 实现申请原因输入
- [ ] 2.8.3 实现提交逻辑
- [ ] 2.8.4 实现成功/失败反馈

## 3. 测试验证

### 3.1 单元测试
- [ ] 3.1.1 usePermission Hook 测试
- [ ] 3.1.2 PermissionGuard 组件测试
- [ ] 3.1.3 permissionStore 测试

### 3.2 集成测试
- [ ] 3.2.1 403 响应拦截流程测试
- [ ] 3.2.2 权限申请流程测试

### 3.3 E2E 测试
- [ ] 3.3.1 无权限访问页面流程 E2E 测试
- [ ] 3.3.2 按钮级权限控制 E2E 测试
- [ ] 3.3.3 权限申请完整流程 E2E 测试

## 4. 文档与交付

- [ ] 4.1 更新组件使用文档
- [ ] 4.2 编写权限守卫使用指南
- [ ] 4.3 编写 403 处理说明
- [ ] 4.4 标记 Story 完成状态