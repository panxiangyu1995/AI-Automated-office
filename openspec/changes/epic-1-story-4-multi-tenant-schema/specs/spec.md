## ADDED Requirements

### Requirement: 数据库连接与多租户 Schema 管理

As a 系统管理员，I want 系统能够自动管理 PostgreSQL Schema 实现多租户数据隔离，So that 不同企业的数据完全隔离，互不可见。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 创建新企业时，系统自动创建该企业专属的 PostgreSQL Schema（如 tenant_{uuid}）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Schema 包含所有业务表的初始结构

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Schema 创建失败时返回明确错误码

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** API 请求携带企业上下文时，所有 SQL 自动路由到对应企业的 Schema

#### Scenario 5: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 任何查询无法跨越企业 Schema 边界

