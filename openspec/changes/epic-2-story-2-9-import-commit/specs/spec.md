# Specification: Import Commit and Receipt

## 需求来源

### PRD 需求

**FR33 - 管理员可以导入和导出用户数据**

管理员确认导入预览后，系统执行批量数据写入，并返回详细的导入结果回执。

### 架构约束

**ADR-005 - 多租户数据库级隔离**
- 导入数据写入遵循租户隔离原则
- 审计日志按租户隔离

### NFR 约束

**NFR14 - 审计日志**
- 所有导入操作需记录审计日志
- 记录成功和失败的详情

**NFR16 - 数据完整性**
- 使用事务确保数据一致性
- 失败时回滚已写入数据

## 功能规格

### 用户故事

As a **管理员**,
I want **确认并提交导入数据，查看详细的导入结果**,
So that **我能确保数据正确导入并追踪导入历史**。

### 验收场景

#### Scenario 1: 正常提交导入
- **GIVEN** 管理员已完成导入预览
- **WHEN** 管理员点击确认提交
- **THEN** 系统执行批量导入
  - 显示处理进度
  - 更新批次状态为 processing
  - 完成后显示结果统计

#### Scenario 2: 幂等性检查 - 重复提交
- **GIVEN** 导入批次已提交成功
- **WHEN** 管理员再次提交同一批次
- **THEN** 系统拒绝重复提交
  - 返回已提交错误
  - 显示原始导入结果

#### Scenario 3: 幂等性检查 - 处理中
- **GIVEN** 导入批次正在处理中
- **WHEN** 管理员再次提交
- **THEN** 系统返回处理中状态
  - 提示稍后查询结果

#### Scenario 4: 部分失败处理
- **GIVEN** 导入数据中部分行有错误
- **WHEN** 系统执行导入
- **THEN** 
  - 成功的数据写入数据库
  - 失败的数据记录详情
  - 返回成功/失败统计

#### Scenario 5: 冲突处理 - 更新模式
- **GIVEN** 导入数据中存在用户名冲突
- **WHEN** 管理员选择更新模式
- **THEN** 系统更新现有用户数据
  - 使用导入数据覆盖现有数据
  - 保留原有 ID 和关联关系

#### Scenario 6: 冲突处理 - 跳过模式
- **GIVEN** 导入数据中存在用户名冲突
- **WHEN** 管理员选择跳过模式
- **THEN** 系统跳过冲突行
  - 不写入冲突数据
  - 记录跳过原因

#### Scenario 7: 下载结果回执
- **GIVEN** 导入已完成
- **WHEN** 管理员点击下载回执
- **THEN** 系统生成 Excel 回执
  - 包含导入概览统计
  - 包含失败详情（如有）
  - 文件名为批次 ID

#### Scenario 8: 审计日志记录
- **GIVEN** 导入操作完成
- **WHEN** 查询审计日志
- **THEN** 
  - 记录导入操作事件
  - 包含操作人、时间、结果
  - 包含导入详情（总数、成功、失败）

## 数据规格

### 输入

```typescript
interface ImportCommitRequest {
  batch_id: string;  // 批次 ID（必填）
  conflict_resolution?: {
    username_mode: 'skip' | 'update' | 'error';
    employee_code_mode: 'skip' | 'update' | 'error';
    row_resolutions: Array<{
      row_number: number;
      action: 'skip' | 'update' | 'create';
    }>;
  };
}
```

### 输出

```typescript
interface ImportCommitResponse {
  batch_id: string;
  status: 'processing' | 'committed' | 'failed';
  total_count: number;
  success_count: number;
  fail_count: number;
  failures?: Array<{
    row_number: number;
    username: string;
    field: string;
    error: string;
    reason: string;
  }>;
  receipt_url?: string;
  completed_at?: string;
}
```

## 边界条件

1. **批次过期**: 预览超过 1 小时的批次无法提交
2. **并发限制**: 同一用户同时只能处理 1 个批次
3. **处理超时**: 单批次处理时间超过 5 分钟视为失败

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| IMPORT_010 | 批次不存在 | 提示重新上传文件 |
| IMPORT_011 | 批次已提交 | 返回原始结果，幂等处理 |
| IMPORT_012 | 批次处理中 | 提示稍后查询结果 |
| IMPORT_013 | 批次已过期 | 提示重新上传文件 |
| IMPORT_014 | 处理超时 | 提示重试 |

## 质量属性

### 性能要求
- 100 行数据提交 < 5秒
- 1000 行数据提交 < 60秒
- 回执生成 < 5秒

### 可靠性要求
- 事务保证数据一致性
- 失败可重试
- 审计日志完整

### 安全要求
- 数据写入遵循租户隔离
- 敏感字段加密存储
- 操作记录审计日志

## 依赖关系

### 上游依赖
- E2-S2.9-01: Import preview and conflict detection（预览数据）

### API 依赖
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/:id` - 更新用户
- `POST /api/admin/audit-logs` - 写入审计日志

## 验收标准

| 标准 | 验证方式 |
|------|---------|
| 提交功能正常 | 自动化测试 |
| 幂等性生效 | 自动化测试 |
| 事务回滚正确 | 自动化测试 |
| 审计日志完整 | 手动检查 |
| 回执下载正常 | 手动测试 |
| 性能达标 | 性能测试 |