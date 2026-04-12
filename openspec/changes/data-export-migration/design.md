# 设计文档: 数据导出与迁移

## 1. 架构设计

### 1.1 模块结构

```
src-tauri/src/
├── export/
│   ├── mod.rs              # 模块入口
│   ├── csv_exporter.rs      # CSV导出
│   ├── json_exporter.rs     # JSON导出
│   ├── excel_exporter.rs    # Excel导出
│   └── migrator.rs         # 数据迁移
```

### 1.2 核心组件

#### Exporter Trait
- 统一的导出接口
- 支持多种格式

#### DataMigrator
- 支持数据导入导出
- 支持迁移验证
- 支持迁移回滚

## 2. 数据模型

### ExportRequest
```rust
struct ExportRequest {
    entity_type: EntityType,
    filters: Option<ExportFilters>,
    format: ExportFormat,
    include_headers: bool,
}
```

### ExportFormat
```rust
enum ExportFormat {
    Csv,
    Json,
    Excel,
}
```

### MigrationRecord
```rust
struct MigrationRecord {
    id: String,
    direction: MigrationDirection,
    source_data: String,
    target_data: String,
    status: MigrationStatus,
    created_at: DateTime<Utc>,
}
```

## 3. API 设计

### Tauri 命令

| 命令 | 参数 | 返回 | 说明 |
|------|------|------|------|
| export_data | ExportRequest | bytes | 导出数据 |
| import_data | ImportRequest | ImportResult | 导入数据 |
| validate_import | ImportRequest | ValidationResult | 验证导入 |
| rollback_migration | migration_id | Result | 回滚迁移 |

## 4. 验收标准

- [ ] CSV导出能够工作
- [ ] JSON导出能够工作
- [ ] Excel导出能够工作
- [ ] 数据迁移能够执行
- [ ] 迁移回滚能够工作
- [ ] cargo build 成功
