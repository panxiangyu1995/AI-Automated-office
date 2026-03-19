# Design: Direct Manager Relation

## Context (上下文)

- **Change**: `epic-2-story-2-4-manager-relationship`
- **Story**: Story 2.4 - 直属上级关系
- **Capability**: `relationship`
- **相关约束**: FR(FR101)、NFR(NFR16)、ARCH(ADR-005)

本变更实现用户直属上级关系的数据模型、API 和前端集成。

## Goals / Non-Goals (目标与非目标)

### Goals (目标)
- 实现用户直属上级关系数据模型
- 实现上级查询和管理 API
- 实现循环检测和约束校验
- 前端集成上级选择器

### Non-Goals (非目标)
- 不实现多上级关系（仅支持单一直属上级）
- 不实现上级关系历史记录
- 不实现上级变更审批流程

## Architecture Decisions (架构决策)

### 1. 数据模型
**决策**: 在 users 表添加 manager_id 外键
**理由**:
- 简单直接，符合常见设计模式
- 支持单一上级关系
- 易于查询和维护

### 2. 循环检测
**决策**: 设置上级时执行递归检测
**理由**:
- 防止数据不一致
- 在写入前拦截非法操作
- 限制最大递归深度防止性能问题

### 3. 上级链缓存
**决策**: MVP 阶段不实现缓存，实时查询
**理由**:
- 上级链查询频率较低
- 实现简单，减少复杂度
- Post-MVP 可根据性能需求添加缓存

## Data Model (数据模型)

### Users 表扩展

```sql
-- 在 users 表添加 manager_id 字段
ALTER TABLE users ADD COLUMN manager_id UUID REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_users_manager ON users(manager_id);

-- 添加检查约束，防止自己设为上级
ALTER TABLE users ADD CONSTRAINT chk_manager_not_self 
    CHECK (id != manager_id);
```

### 数据模型定义

```go
type User struct {
    ID          string     `json:"id"`
    TenantID    string     `json:"tenant_id"`
    Username    string     `json:"username"`
    RealName    string     `json:"real_name"`
    ManagerID   *string    `json:"manager_id,omitempty"`
    Manager     *User      `json:"manager,omitempty"`      // 直属上级
    Subordinates []User    `json:"subordinates,omitempty"` // 直接下属
    // ... 其他字段
}
```

## API Specification (API 规格)

### PUT /api/admin/users/:id/manager
设置用户直属上级

**Request Body:**
```json
{
  "manager_id": "uuid" // null 表示清除上级
}
```

**Response:**
```json
{
  "code": "SUCCESS",
  "data": {
    "id": "uuid",
    "manager_id": "uuid",
    "manager": {
      "id": "uuid",
      "real_name": "张总"
    }
  }
}
```

**错误响应:**
```json
{
  "code": "CIRCULAR_MANAGER_CHAIN",
  "http_status": 400,
  "message": "设置该上级将形成循环汇报关系",
  "trace_id": "req-xxx"
}
```

### GET /api/admin/users/:id/managers
获取用户上级链

**Response:**
```json
{
  "code": "SUCCESS",
  "data": [
    {
      "level": 1,
      "user": {
        "id": "uuid1",
        "real_name": "直接上级"
      }
    },
    {
      "level": 2,
      "user": {
        "id": "uuid2",
        "real_name": "二级上级"
      }
    }
  ]
}
```

### GET /api/admin/users/:id/subordinates
获取用户直接下属列表

**Response:**
```json
{
  "code": "SUCCESS",
  "data": [
    {
      "id": "uuid",
      "real_name": "下属A",
      "department": {
        "id": "uuid",
        "name": "技术部"
      }
    }
  ]
}
```

## Constraint Rules (约束规则)

### 循环检测算法

```go
const MaxManagerChainDepth = 20

func (s *UserService) SetManager(ctx context.Context, userID, managerID string) error {
    // 1. 检查是否设自己为上级
    if userID == managerID {
        return errors.New("MANAGER_CANNOT_BE_SELF", "不能将自己设为上级")
    }
    
    // 2. 检查是否跨租户
    user, _ := s.repo.FindByID(ctx, userID)
    manager, _ := s.repo.FindByID(ctx, managerID)
    if user.TenantID != manager.TenantID {
        return errors.New("CROSS_TENANT_MANAGER", "不能设置跨租户的上级")
    }
    
    // 3. 检查循环引用
    if err := s.checkCircularReference(ctx, userID, managerID); err != nil {
        return err
    }
    
    // 4. 设置上级
    return s.repo.UpdateManagerID(ctx, userID, managerID)
}

func (s *UserService) checkCircularReference(ctx context.Context, userID, managerID string) error {
    current := managerID
    depth := 0
    
    for current != "" && depth < MaxManagerChainDepth {
        if current == userID {
            return errors.New("CIRCULAR_MANAGER_CHAIN", "设置该上级将形成循环汇报关系")
        }
        
        manager, err := s.repo.FindByID(ctx, current)
        if err != nil {
            break
        }
        
        current = ""
        if manager.ManagerID != nil {
            current = *manager.ManagerID
        }
        depth++
    }
    
    if depth >= MaxManagerChainDepth {
        return errors.New("MANAGER_CHAIN_TOO_DEEP", "上级链超过最大深度限制")
    }
    
    return nil
}
```

## Frontend Integration (前端集成)

### 上级选择器组件

```tsx
interface ManagerPickerProps {
  value?: string;
  onChange: (managerId: string | null) => void;
  excludeIds?: string[]; // 排除的用户 ID（如当前用户）
  placeholder?: string;
}

// 使用示例
<ManagerPicker
  value={formData.manager_id}
  onChange={(id) => setFormData({ ...formData, manager_id: id })}
  excludeIds={[currentUser.id]}
  placeholder="选择直属上级"
/>
```

### 选择器功能
- 支持按姓名/工号搜索
- 显示用户的部门和岗位信息
- 排除当前用户（防止自引用）
- 支持清除选择

## Error Handling (错误处理)

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| MANAGER_NOT_FOUND | 404 | 指定的上级不存在 |
| MANAGER_CANNOT_BE_SELF | 400 | 不能设自己为上级 |
| CIRCULAR_MANAGER_CHAIN | 400 | 会形成循环关系 |
| CROSS_TENANT_MANAGER | 400 | 跨租户上级 |
| MANAGER_CHAIN_TOO_DEEP | 400 | 上级链过深 |

## Testing Strategy (测试策略)

### 单元测试
- 循环检测算法测试
- 约束校验测试
- 边界条件测试

### 集成测试
- 上级设置完整流程
- 上级链查询测试
- 下属列表查询测试

### E2E 测试
- 上级选择器交互
- 错误提示展示

## Open Questions (待解决问题)

1. 上级链最大深度限制设为多少合适？
2. 上级变更是否需要通知相关人员？
3. 是否需要支持临时/代理上级？