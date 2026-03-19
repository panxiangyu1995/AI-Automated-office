# epic-2-story-2-4-manager-relationship

## Story 信息
- **Epic**: Epic 2 - 用户认证与部门权限系统
- **Story**: Story 2.4 - 直属上级关系
- **Title**: Direct Manager Relation
- **Task ID**: E2-S2.4-01

## Capability 描述
- **Name**: `relationship`
- **Description**: 添加直属上级关系支持，包含循环检测和合法组织约束校验。

## 铁律映射 (Requirements Mapping)

### PRD 合规
- **FR**: FR101 - 直属上级设置
- **功能定义**: 用户设置直属上级、上级查询、循环检测、跨租户校验

### 架构合规
- **ARCH**: ADR-005 - 多租户采用数据库级隔离

### NFR 合规
- **NFR**: NFR16 - 可扩展性要求

### UX 合规
- **UX-04**: 状态反馈与错误处理

## 依赖关系
- **前置依赖**: 
  - E2-S2.2-01 (User admin APIs)
  - E2-S2.3-01 (Department and position domain model)
- **后续变更**: E2-S2.8-01 (Org chart view)

## 实现步骤 (Planned Steps)
1. 在用户模型中添加直属上级关系字段
2. 构建上级查询 API
3. 检查循环上级链和非法跨租户链接
4. 在用户编辑表单中集成上级选择器

## API 端点规划

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/users/:id/managers` | 获取用户上级链 |
| GET | `/api/admin/users/:id/subordinates` | 获取用户下属列表 |
| PUT | `/api/admin/users/:id/manager` | 设置直属上级 |

## 验收标准
- [ ] 用户模型包含 manager_id 字段
- [ ] 上级查询 API 正确返回上级链
- [ ] 循环上级链检测正确工作
- [ ] 跨租户上级设置被阻止
- [ ] 上级选择器集成到用户编辑表单