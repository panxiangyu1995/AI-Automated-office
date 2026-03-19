# Design: Import Commit and Receipt

## 技术方案

### 状态机设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Import Batch State Machine               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                               │
│  │ preview  │ ──提交确认──► ┌──────────┐                    │
│  │  (预览)  │               │processing│                    │
│  └──────────┘               │ (处理中) │                    │
│       │                     └────┬─────┘                    │
│       │                          │                          │
│       │ 超时/取消                 ├──成功──► ┌──────────┐   │
│       │                          │          │committed │   │
│       ▼                          │          │ (已提交) │   │
│  ┌──────────┐                    │          └──────────┘   │
│  │  expired │◄──失败────┘                          │
│  │ (已过期) │                                             │
│  └──────────┘                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心接口设计

#### 1. 提交确认 API

```go
// POST /api/admin/users/import/commit
type ImportCommitRequest struct {
    BatchID       string           `json:"batch_id" binding:"required"`
    ConflictResolution *ConflictResolution `json:"conflict_resolution"` // 冲突处理策略
}

type ConflictResolution struct {
    // 冲突处理模式：skip(跳过), update(更新), error(报错)
    UsernameMode   string `json:"username_mode"`   // 用户名冲突处理
    EmployeeCodeMode string `json:"employee_code_mode"` // 工号冲突处理
    // 指定处理方式的行
    RowResolutions []RowResolution `json:"row_resolutions"`
}

type RowResolution struct {
    RowNumber int    `json:"row_number"`
    Action    string `json:"action"` // skip, update, create
}

type ImportCommitResponse struct {
    BatchID       string         `json:"batch_id"`
    Status        string         `json:"status"` // processing, committed, failed
    TotalCount    int            `json:"total_count"`
    SuccessCount  int            `json:"success_count"`
    FailCount     int            `json:"fail_count"`
    Failures      []FailureItem  `json:"failures,omitempty"`
    ReceiptURL    string         `json:"receipt_url"` // 结果回执下载链接
    CompletedAt   string         `json:"completed_at,omitempty"`
}
```

#### 2. 导入提交服务

```go
type ImportCommitService struct {
    batchRepo      ImportBatchRepository
    userRepo       UserRepository
    deptRepo       DepartmentRepository
    positionRepo   PositionRepository
    auditLogger    AuditLogger
}

func (s *ImportCommitService) Commit(ctx context.Context, req *ImportCommitRequest) (*ImportCommitResponse, error) {
    // 1. 幂等性检查
    batch, err := s.checkIdempotency(ctx, req.BatchID)
    if err != nil {
        return nil, err
    }
    
    // 2. 锁定批次状态
    if err := s.lockBatch(ctx, batch); err != nil {
        return nil, err
    }
    
    // 3. 获取预览数据
    previewData, err := s.getPreviewData(ctx, batch)
    if err != nil {
        return nil, err
    }
    
    // 4. 执行批量写入
    result := s.executeImport(ctx, previewData, req.ConflictResolution)
    
    // 5. 更新批次状态
    s.updateBatchStatus(ctx, batch, result)
    
    // 6. 写入审计日志
    s.writeAuditLog(ctx, batch, result)
    
    return &ImportCommitResponse{
        BatchID:      batch.ID,
        Status:       "committed",
        TotalCount:   result.Total,
        SuccessCount: result.Success,
        FailCount:    result.Fail,
        Failures:     result.Failures,
    }, nil
}

// 幂等性检查
func (s *ImportCommitService) checkIdempotency(ctx context.Context, batchID string) (*ImportBatch, error) {
    batch, err := s.batchRepo.GetByID(ctx, batchID)
    if err != nil {
        return nil, ErrBatchNotFound
    }
    
    // 检查状态
    switch batch.Status {
    case "committed":
        return nil, ErrBatchAlreadyCommitted // 已提交，返回幂等错误
    case "processing":
        return nil, ErrBatchProcessing // 处理中，稍后重试
    case "expired":
        return nil, ErrBatchExpired // 已过期
    }
    
    return batch, nil
}
```

#### 3. 批量写入

```go
// executeImport 执行批量导入
func (s *ImportCommitService) executeImport(
    ctx context.Context,
    data []ImportUserRow,
    resolution *ConflictResolution,
) *ImportResult {
    result := &ImportResult{
        Total: len(data),
    }
    
    // 使用事务
    tx := s.db.Begin()
    defer func() {
        if result.HasError() {
            tx.Rollback()
        } else {
            tx.Commit()
        }
    }()
    
    for _, row := range data {
        // 检查是否有行级处理策略
        action := s.getRowAction(row, resolution)
        
        switch action {
        case "skip":
            result.Skipped++
            continue
        case "update":
            if err := s.updateUser(tx, row); err != nil {
                result.addFailure(row, err)
            } else {
                result.Success++
            }
        case "create":
            if err := s.createUser(tx, row); err != nil {
                result.addFailure(row, err)
            } else {
                result.Success++
            }
        }
    }
    
    return result
}

// 分批处理大数据量
func (s *ImportCommitService) executeBatchImport(ctx context.Context, data []ImportUserRow) *ImportResult {
    const batchSize = 100
    
    result := &ImportResult{Total: len(data)}
    
    for i := 0; i < len(data); i += batchSize {
        end := i + batchSize
        if end > len(data) {
            end = len(data)
        }
        
        batch := data[i:end]
        batchResult := s.executeImport(ctx, batch, nil)
        result.Merge(batchResult)
    }
    
    return result
}
```

### 失败项数据结构

```go
type FailureItem struct {
    RowNumber int    `json:"row_number"`
    Username  string `json:"username"`
    Field     string `json:"field"`
    Error     string `json:"error"`
    Reason    string `json:"reason"`
}

type ImportResult struct {
    Total     int
    Success   int
    Fail      int
    Skipped   int
    Failures  []FailureItem
}

func (r *ImportResult) HasError() bool {
    return r.Fail > 0
}

func (r *ImportResult) addFailure(row ImportUserRow, err error) {
    r.Fail++
    r.Failures = append(r.Failures, FailureItem{
        RowNumber: row.RowNumber,
        Username:  row.Username,
        Error:     err.Error(),
    })
}
```

### 结果回执

```go
// GenerateReceipt 生成结果回执
func (s *ImportCommitService) GenerateReceipt(ctx context.Context, batchID string) (string, error) {
    batch, _ := s.batchRepo.GetByID(ctx, batchID)
    
    // 生成 Excel 回执
    receipt := &excel.ReceiptBuilder{}
    receipt.AddSheet("导入结果概览", [][]string{
        {"总行数", fmt.Sprintf("%d", batch.TotalCount)},
        {"成功行数", fmt.Sprintf("%d", batch.SuccessCount)},
        {"失败行数", fmt.Sprintf("%d", batch.FailCount)},
        {"导入时间", batch.CompletedAt.Format(time.RFC3339)},
    })
    
    // 失败详情
    if batch.FailCount > 0 {
        receipt.AddSheet("失败详情", s.getFailureRows(batch.ID))
    }
    
    // 保存到临时存储
    filePath := fmt.Sprintf("/tmp/import_receipt_%s.xlsx", batchID)
    receipt.Save(filePath)
    
    return filePath, nil
}
```

### 审计日志

```go
// writeAuditLog 写入审计日志
func (s *ImportCommitService) writeAuditLog(ctx context.Context, batch *ImportBatch, result *ImportResult) {
    s.auditLogger.Log(ctx, &AuditLog{
        TenantID:   batch.TenantID,
        OperatorID: batch.OperatorID,
        EventType:  "user.import.commit",
        Resource:   "users",
        Action:     "batch_import",
        Result:     "success",
        Details: map[string]interface{}{
            "batch_id":      batch.ID,
            "total_count":   result.Total,
            "success_count": result.Success,
            "fail_count":    result.Fail,
            "file_name":     batch.FileName,
        },
    })
    
    // 记录失败的行
    for _, failure := range result.Failures {
        s.auditLogger.Log(ctx, &AuditLog{
            TenantID:   batch.TenantID,
            OperatorID: batch.OperatorID,
            EventType:  "user.import.failure",
            Resource:   "users",
            Action:     "batch_import",
            Result:     "failure",
            Details: map[string]interface{}{
                "batch_id":   batch.ID,
                "row_number": failure.RowNumber,
                "username":   failure.Username,
                "error":      failure.Error,
            },
        })
    }
}
```

### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/admin/users/import/commit | 确认提交导入 |
| GET | /api/admin/users/import/batches/:id/receipt | 下载结果回执 |

## 性能考虑

1. **批量处理**: 每 100 行一批处理
2. **事务控制**: 单批事务，失败可重试
3. **并发控制**: 单用户单批次处理
4. **超时设置**: 处理超时 5 分钟

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│Import Commit  │────→│  User Repo    │
│   Service     │     │  (用户写入)   │
└───────────────┘     └───────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│  Audit Logger │     │ Import Batch  │
│  (审计日志)   │     │    Repo       │
└───────────────┘     └───────────────┘
```