# Proposal: Session Model and Timeout Engine

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 用户认证与部门权限系统需要完善的会话管理机制。根据 NFR12，会话需要 30 分钟空闲超时。本提案实现会话模型和空闲超时引擎。

### 业务背景
- 会话需要有效管理（FR27）
- 30 分钟空闲超时（NFR12）
- 支持强制登出

### 技术背景
- 后端采用 Go 语言（ADR-005）
- 多租户数据库级隔离
- 需要 Token 和会话双重管理

## 目标

构建云端会话管理基础设施：
1. 定义会话数据模型和状态
2. 实现 30 分钟空闲超时规则
3. 实现会话活跃时间更新
4. 支持会话列表查询

## 范围

### 包含
- sessions 数据表设计
- 会话实体定义
- 会话仓储接口和实现
- 空闲超时检测引擎
- 会话服务层
- 定时清理任务

### 不包含
- 强制登出 API（E2-S2.10-02）
- 前端会话处理（E2-S2.10-02）
- Token 管理逻辑（E2-S2.1-01）

## 影响范围

### 后端
- `cloud-server/internal/module/auth/domain/entity/session.go` - 会话实体
- `cloud-server/internal/module/auth/application/service/session_service.go` - 会话服务
- `cloud-server/internal/module/auth/infrastructure/persistence/session_repo.go` - 仓储实现

### 数据库
- 新增 `sessions` 表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 大量会话数据 | 中 | 中 | 定期清理，索引优化 |
| 超时检测延迟 | 低 | 低 | 使用内存缓存加速 |

## 实施计划

1. **Step 1**: 设计 sessions 数据表
2. **Step 2**: 定义会话实体
3. **Step 3**: 实现会话仓储
4. **Step 4**: 实现会话服务
5. **Step 5**: 实现空闲超时引擎
6. **Step 6**: 实现定时清理任务
7. **Step 7**: 编写测试

## 依赖关系

### 前置依赖
- E2-S2.1-01: Cloud auth module foundation

### 后置依赖
- E2-S2.10-02: Force logout and expiry handling
- E2-S2.11-02: Audit event integration