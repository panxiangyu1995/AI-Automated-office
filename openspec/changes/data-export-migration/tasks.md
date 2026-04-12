# Tasks: 数据导出与迁移

## 任务列表

### Task 1: 导出模块基础
- 创建 `src-tauri/src/export/mod.rs`
- 定义 Exporter trait
- 定义导出格式枚举
- 验证: cargo build

### Task 2: CSV导出器
- 创建 `src-tauri/src/export/csv_exporter.rs`
- 实现 CSV 导出逻辑
- 支持自定义分隔符
- 验证: cargo build && cargo test

### Task 3: JSON导出器
- 创建 `src-tauri/src/export/json_exporter.rs`
- 实现 JSON 导出逻辑
- 支持格式化输出
- 验证: cargo build && cargo test

### Task 4: Excel导出器
- 创建 `src-tauri/src/export/excel_exporter.rs`
- 实现 Excel 导出逻辑
- 支持多工作表
- 验证: cargo build

### Task 5: 数据迁移器
- 创建 `src-tauri/src/export/migrator.rs`
- 实现数据迁移逻辑
- 实现迁移验证
- 实现迁移回滚
- 验证: cargo build && cargo test

### Task 6: Tauri 命令
- 创建 `src-tauri/src/commands/export.rs`
- 注册所有导出相关命令
- 验证: cargo build

### Task 7: 集成测试
- 运行 cargo build
- 运行 cargo clippy
- 验证所有功能

## 验收标准

- [ ] CSV导出能够工作
- [ ] JSON导出能够工作
- [ ] Excel导出能够工作
- [ ] 数据迁移能够执行
- [ ] 迁移回滚能够工作
- [ ] cargo build 成功
- [ ] cargo clippy 无警告
