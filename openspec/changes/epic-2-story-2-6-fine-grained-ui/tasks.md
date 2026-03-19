## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.6-01（细粒度权限覆盖）已完成
- [ ] 1.2 确认 E2-S2.5-02（权限中心 UI）已完成
- [ ] 1.3 确认 API 类型定义已同步

## 2. 核心开发任务

### 2.1 页面基础结构
- [ ] 2.1.1 创建细粒度权限配置页面路由 /admin/permissions/fine-grained
- [ ] 2.1.2 创建 FineGrainedPermissionPage 页面容器组件
- [ ] 2.1.3 实现 Tab 切换布局
- [ ] 2.1.4 创建 Zustand 细粒度权限状态 Store

### 2.2 用户选择器
- [ ] 2.2.1 实现 UserSelector 组件
- [ ] 2.2.2 实现用户搜索功能
- [ ] 2.2.3 实现 UserSummary 用户权限摘要组件
- [ ] 2.2.4 实现用户切换时的变更检查

### 2.3 权限覆盖配置 Tab
- [ ] 2.3.1 实现 PermissionOverrideTab 组件
- [ ] 2.3.2 实现 ResourceList 资源列表组件
- [ ] 2.3.3 实现 PermissionSourceCompare 权限来源对比组件
- [ ] 2.3.4 实现覆盖操作按钮（授权/剥夺/清除）
- [ ] 2.3.5 实现权限覆盖状态管理

### 2.4 数据范围配置 Tab
- [ ] 2.4.1 实现 DataScopeTab 组件
- [ ] 2.4.2 实现 ResourceSelector 资源选择组件
- [ ] 2.4.3 实现 DataScopeEditor 数据范围编辑器
- [ ] 2.4.4 实现 ScopeTypeSelector 范围类型选择
- [ ] 2.4.5 实现 DepartmentTreeSelector 部门树选择器
- [ ] 2.4.6 实现 CustomRuleEditor 自定义规则编辑器
- [ ] 2.4.7 实现数据范围状态管理

### 2.5 字段权限配置 Tab
- [ ] 2.5.1 实现 FieldPermissionTab 组件
- [ ] 2.5.2 实现 FieldList 字段列表组件
- [ ] 2.5.3 实现 FieldRestrictionEditor 字段限制编辑器
- [ ] 2.5.4 实现字段权限批量操作
- [ ] 2.5.5 实现字段权限状态管理

### 2.6 API 集成
- [ ] 2.6.1 实现 useUserPermissions Hook
- [ ] 2.6.2 实现 usePermissionOverrides Hook
- [ ] 2.6.3 实现权限覆盖 API 封装
- [ ] 2.6.4 实现数据缓存策略

### 2.7 交互功能
- [ ] 2.7.1 实现配置变更的即时反馈
- [ ] 2.7.2 实现保存/重置功能
- [ ] 2.7.3 实现配置确认对话框
- [ ] 2.7.4 实现变更摘要展示

## 3. 测试验证

### 3.1 单元测试
- [ ] 3.1.1 UserSelector 组件测试
- [ ] 3.1.2 PermissionSourceCompare 组件测试
- [ ] 3.1.3 DataScopeEditor 组件测试
- [ ] 3.1.4 FieldRestrictionEditor 组件测试

### 3.2 集成测试
- [ ] 3.2.1 权限覆盖配置流程测试
- [ ] 3.2.2 数据范围配置流程测试
- [ ] 3.2.3 字段权限配置流程测试

### 3.3 E2E 测试
- [ ] 3.3.1 细粒度权限配置完整流程 E2E 测试
- [ ] 3.3.2 浏览器兼容性测试

## 4. 文档与交付

- [ ] 4.1 更新组件文档
- [ ] 4.2 编写使用说明
- [ ] 4.3 标记 Story 完成状态