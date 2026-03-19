## Why

Epic 2 用户认证与部门权限系统需要支持更精细的权限控制。Story 2.6 细粒度权限覆盖在三层权限模型基础上，实现用户级权限覆盖、数据范围权限和字段级权限控制，满足 FR31（细粒度权限到个人级别）和 FR32（数据访问权限部门级/个人级）的需求。

本 Story 解决以下问题：
1. 如何实现用户级别的权限覆盖（额外授权或权限剥夺）
2. 如何控制用户可访问的数据范围
3. 如何实现字段级别的显示/隐藏/只读控制

## What Changes

### 新增内容
- 设计 user_permission_overrides 数据表
- 支持部门范围和本人范围的数据访问控制
- 支持字段隐藏和只读规则
- 扩展权限计算逻辑支持覆盖

### 需求映射
- **FR:** FR31, FR32
- **NFR:** NFR16
- **ARCH:** ADR-018
- **UX:** N/A

### 依赖关系
- **E2-S2.5-01** - 需要三层权限模型作为基础

## Capabilities

### New Capabilities
- `fine-grained-permissions`: 提供 Story 2.6 细粒度权限覆盖的数据基础，支持用户级权限覆盖、数据范围权限和字段级权限控制。

### Modified Capabilities
- `permission-model` (E2-S2.5-01): 扩展权限计算逻辑，支持覆盖规则

## Impact

### Go 云端后端
- 新增 user_permission_overrides 数据表和迁移脚本
- 扩展 PermissionCalculator 支持覆盖计算
- 新增数据范围过滤服务
- 新增字段权限服务

### API 变更
- 新增 GET /api/admin/users/:id/permission-overrides
- 新增 PUT /api/admin/users/:id/permission-overrides
- 扩展权限计算 API 返回数据范围和字段限制

### 依赖关系
- 依赖 E2-S2.5-01 完成基础权限模型
- 为 E2-S2.6-02 细粒度权限 UI 提供数据基础

## Technical Decisions

### 权限覆盖优先级

```
用户级覆盖 > 角色权限 > 默认权限

具体规则：
1. 用户被明确授权 (grant)：增加权限
2. 用户被明确剥夺 (deny)：移除权限（即使角色拥有）
3. 无覆盖配置：使用角色权限
```

### 数据范围定义

| 范围类型 | 编码 | 说明 | SQL 过滤条件示例 |
|---------|------|------|-----------------|
| 全部数据 | all | 可访问所有数据 | 无过滤条件 |
| 本部门 | department | 仅本部门数据 | `department_id = :user_dept_id` |
| 本部门及下级 | department_tree | 本部门及下级部门数据 | `department_id IN (:dept_tree)` |
| 仅本人 | self | 仅自己创建的数据 | `created_by = :user_id` |
| 自定义 | custom | 自定义规则 | 根据 rule_json 动态生成 |

### 字段权限类型

| 类型 | 编码 | 说明 | 前端展示 |
|------|------|------|---------|
| 可见 | visible | 字段正常显示 | 正常渲染 |
| 隐藏 | hidden | 字段不显示 | 不渲染 |
| 只读 | readonly | 可见不可编辑 | 禁用状态 |
| 脱敏 | masked | 显示脱敏值 | 显示 **** |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 权限计算复杂度增加 | 分层计算、缓存策略 |
| 数据范围过滤性能 | 数据库索引、查询优化 |
| 字段权限配置复杂 | 提供模板和批量配置 |
| 权限继承冲突 | 明确优先级规则、冲突检测 |

## Migration Plan

1. 创建 user_permission_overrides 数据表
2. 扩展权限计算服务支持覆盖
3. 实现数据范围过滤服务
4. 实现字段权限服务
5. 编写单元测试和集成测试
6. 与 E2-S2.6-02 UI 集成验证

## Open Questions

- 自定义数据范围规则的表达式语法？
- 字段权限是否需要支持条件触发？
- 权限覆盖是否需要审批流程？