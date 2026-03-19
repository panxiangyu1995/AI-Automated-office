# Design: Import Preview and Conflict Detection

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Import Preview Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Upload File                                             │
│     ┌─────────┐                                             │
│     │  用户   │ ──上传 Excel──►  服务器临时存储             │
│     └─────────┘                                             │
│                                                             │
│  2. Parse & Validate                                        │
│     ┌─────────┐                                             │
│     │ Parser  │ ──解析数据──►  字段映射 & 类型验证          │
│     └─────────┘                                             │
│                                                             │
│  3. Conflict Detection                                      │
│     ┌─────────┐                                             │
│     │Checker  │ ──检测冲突──►  数据库查询 & 规则匹配        │
│     └─────────┘                                             │
│                                                             │
│  4. Generate Preview                                        │
│     ┌─────────┐                                             │
│     │Preview  │ ──生成报告──►  返回预览数据                  │
│     └─────────┘                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据库设计

```sql
-- 导入批次表
CREATE TABLE user_import_batches (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    operator_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    status VARCHAR(20) DEFAULT 'preview', -- preview, committed, failed
    total_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    conflict_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- 预览数据过期时间
    INDEX idx_tenant_status (tenant_id, status)
);
```

### 核心接口设计

#### 1. 导入预览 API

```go
// POST /api/admin/users/import/preview
type ImportPreviewRequest struct {
    File         multipart.File `form:"file" binding:"required"`
    FileName     string         `form:"file_name" binding:"required"`
    SheetName    string         `form:"sheet_name"`     // 可选，默认第一个sheet
    HeaderRow    int            `form:"header_row"`     // 可选，默认第1行
    MappingRules *FieldMapping  `form:"mapping_rules"`  // 可选，自定义字段映射
}

type ImportPreviewResponse struct {
    BatchID      string           `json:"batch_id"`
    TotalCount   int              `json:"total_count"`
    SuccessCount int              `json:"success_count"`
    ConflictCount int             `json:"conflict_count"`
    ErrorCount   int              `json:"error_count"`
    Preview      []PreviewRow     `json:"preview"`
    Conflicts    []ConflictItem   `json:"conflicts"`
    Errors       []ErrorItem      `json:"errors"`
    ExpiresAt    string           `json:"expires_at"`
}
```

#### 2. 冲突检测服务

```go
type ConflictChecker interface {
    // CheckDuplicateUsername 检查用户名重复
    CheckDuplicateUsername(ctx context.Context, usernames []string) (map[string]bool, error)
    
    // CheckDuplicateEmployeeCode 检查工号重复
    CheckDuplicateEmployeeCode(ctx context.Context, codes []string) (map[string]bool, error)
    
    // CheckDepartmentExists 检查部门是否存在
    CheckDepartmentExists(ctx context.Context, deptNames []string) (map[string]string, error)
    
    // CheckPositionExists 检查岗位是否存在
    CheckPositionExists(ctx context.Context, positionNames []string) (map[string]string, error)
    
    // CheckManagerExists 检查上级是否存在
    CheckManagerExists(ctx context.Context, managerNames []string) (map[string]string, error)
}
```

#### 3. Excel 解析器

```go
type ExcelParser interface {
    // Parse 解析 Excel 文件
    Parse(file io.Reader) ([]map[string]interface{}, error)
    
    // ParseWithMapping 使用字段映射解析
    ParseWithMapping(file io.Reader, mapping *FieldMapping) ([]ImportUserRow, error)
    
    // ValidateRow 验证单行数据
    ValidateRow(row *ImportUserRow) []ValidationError
}

// 字段映射配置
type FieldMapping struct {
    Username      string `json:"username"`       // 用户名列名，默认"用户名"
    Password      string `json:"password"`       // 密码列名
    RealName      string `json:"real_name"`      // 姓名列名
    EmployeeCode  string `json:"employee_code"`  // 工号列名
    Email         string `json:"email"`          // 邮箱列名
    Phone         string `json:"phone"`          // 手机列名
    Department    string `json:"department"`     // 部门列名
    Position      string `json:"position"`       // 岗位列名
    Manager       string `json:"manager"`        // 上级列名
    Status        string `json:"status"`         // 状态列名
}
```

### 数据结构

```go
// 导入用户行数据
type ImportUserRow struct {
    RowNumber     int    `json:"row_number"`
    Username      string `json:"username"`
    Password      string `json:"-"`  // 不返回给前端
    RealName      string `json:"real_name"`
    EmployeeCode  string `json:"employee_code"`
    Email         string `json:"email"`
    Phone         string `json:"phone"`
    Department    string `json:"department"`
    Position      string `json:"position"`
    Manager       string `json:"manager"`
    Status        string `json:"status"`
    
    // 解析后填充
    DepartmentID  string `json:"department_id,omitempty"`
    PositionID    string `json:"position_id,omitempty"`
    ManagerID     string `json:"manager_id,omitempty"`
}

// 冲突项
type ConflictItem struct {
    RowNumber int           `json:"row_number"`
    Field     string        `json:"field"`
    Value     string        `json:"value"`
    ConflictType string     `json:"conflict_type"` // duplicate, not_found, invalid
    Message   string        `json:"message"`
    Suggestion string       `json:"suggestion,omitempty"`
}

// 错误项
type ErrorItem struct {
    RowNumber int           `json:"row_number"`
    Field     string        `json:"field"`
    Value     string        `json:"value"`
    ErrorType string        `json:"error_type"` // required, format, length
    Message   string        `json:"message"`
}
```

### 冲突检测规则

| 冲突类型 | 检测规则 | 处理建议 |
|---------|---------|---------|
| 用户名重复 | 与现有用户名匹配 | 更新现有用户 或 使用新用户名 |
| 工号重复 | 与现有工号匹配 | 更新现有用户 或 使用新工号 |
| 部门不存在 | 部门名称未找到 | 创建新部门 或 选择现有部门 |
| 岗位不存在 | 岗位名称未找到 | 创建新岗位 或 选择现有岗位 |
| 上级不存在 | 上级姓名未找到 | 清空上级 或 创建上级用户 |
| 必填字段缺失 | 字段为空 | 补充数据 |
| 格式错误 | 邮箱/手机格式无效 | 修正格式 |

### 导入模板设计

```excel
| 用户名* | 密码* | 姓名* | 工号* | 邮箱 | 手机 | 部门* | 岗位 | 上级 | 状态 |
|---------|-------|-------|-------|------|------|-------|------|------|------|
| zhangsan| ******| 张三  | EMP001| ...  | ...  | 销售部 | 销售经理 | 李四 | 启用 |
| lisi    | ******| 李四  | EMP002| ...  | ...  | 销售部 | 销售主管 |      | 启用 |

说明：
- 带 * 为必填字段
- 状态可选值：启用、禁用
- 上级填写上级的姓名
```

### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/admin/users/import/template | 下载导入模板 |
| POST | /api/admin/users/import/preview | 上传文件并预览 |
| GET | /api/admin/users/import/batches | 查询导入批次列表 |
| GET | /api/admin/users/import/batches/:id | 查询批次详情 |

## 性能考虑

1. **文件大小限制**: 最大 10MB
2. **行数限制**: 最大 1000 行
3. **解析优化**: 使用流式解析，避免全量加载到内存
4. **冲突检测优化**: 批量查询数据库，减少 IO 次数

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│ Import Service│────→│  User Repo    │
│   (本模块)    │     │  (用户查询)   │
└───────────────┘     └───────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│  Department   │     │   Position    │
│    Repo       │     │    Repo       │
└───────────────┘     └───────────────┘
```