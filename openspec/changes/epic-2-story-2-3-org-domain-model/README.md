# epic-2-story-2-3-org-domain-model

## Story 信息
- **Epic**: Epic 2 - 用户认证与部门权限系统
- **Story**: Story 2.3 - 组织管理
- **Title**: Department and Position Domain Model
- **Task ID**: E2-S2.3-01

## Capability 描述
- **Name**: `domain-model`
- **Description**: 定义部门树和岗位数据结构，实现 CRUD API。

## 铁律映射 (Requirements Mapping)

### PRD 合规
- **FR**: FR100 - 部门架构管理
- **FR**: FR102 - 岗位管理
- **功能定义**: 部门树形结构、部门增删改查、岗位管理、删除与迁移约束

### 架构合规
- **ARCH**: ADR-005 - 多租户采用数据库级隔离
- **ARCH**: ADR-001 - 分层微内核架构，业务逻辑在云端

### NFR 合规
- **NFR**: NFR16 - 可扩展性要求

### UX 合规
- 本变更不涉及前端 UI，依赖后续 `org-ui` 变更

## 依赖关系
- **前置依赖**: E2-S2.1-01 (Cloud auth module foundation)
- **后续变更**: E2-S2.3-02 (Department and position UI)

## 实现步骤 (Planned Steps)
1. 设计部门和岗位数据模型
2. 实现部门树查询 API
3. 实现部门和岗位 CRUD 操作
4. 定义删除和迁移约束规则

## API 端点规划

### 部门 API
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/departments/tree` | 获取部门树 |
| GET | `/api/admin/departments/:id` | 获取部门详情 |
| POST | `/api/admin/departments` | 创建部门 |
| PUT | `/api/admin/departments/:id` | 更新部门 |
| DELETE | `/api/admin/departments/:id` | 删除部门 |

### 岗位 API
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/positions` | 获取岗位列表 |
| GET | `/api/admin/positions/:id` | 获取岗位详情 |
| POST | `/api/admin/positions` | 创建岗位 |
| PUT | `/api/admin/positions/:id` | 更新岗位 |
| DELETE | `/api/admin/positions/:id` | 删除岗位 |

## 验收标准
- [ ] 部门树查询支持多级结构
- [ ] 部门 CRUD 操作正确执行
- [ ] 岗位管理 API 实现完成
- [ ] 删除约束正确生效（有子部门/有员工时禁止删除）
- [ ] 迁移约束正确处理