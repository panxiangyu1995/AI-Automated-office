# Tasks: Audit Query and Export UI

## 任务列表

### 任务 1: 对接审计日志查询 API
- **描述**: 对接后端已提供的审计日志列表查询接口
- **文件**: `src/features/audit/api/auditApi.ts`
- **验收**: 支持分页和筛选

### 任务 2: 对接审计日志导出 API
- **描述**: 对接后端已提供的审计日志导出接口
- **文件**: `src/features/audit/api/auditApi.ts`
- **验收**: 支持 CSV 和 Excel 格式

### 任务 3: 创建审计日志表格组件
- **描述**: 创建前端审计日志表格组件
- **文件**: `src/features/audit/components/AuditLogTable.tsx`
- **验收**: 表格显示正常

### 任务 4: 创建筛选组件
- **描述**: 创建前端筛选组件
- **文件**: `src/features/audit/components/AuditFilterBar.tsx`
- **验收**: 筛选功能正常

### 任务 5: 创建详情弹窗
- **描述**: 创建审计日志详情弹窗
- **文件**: `src/features/audit/components/AuditLogDetail.tsx`
- **验收**: 显示完整详情

### 任务 6: 实现导出功能
- **描述**: 实现前端导出按钮和逻辑
- **文件**: `src/features/audit/components/AuditExportButton.tsx`
- **验收**: 导出文件正确

### 任务 7: 创建审计页面入口
- **描述**: 创建审计页面入口
- **文件**: `src/pages/audit/index.tsx`
- **验收**: 页面路由正常

### 任务 8: 浏览器测试
- **描述**: 在浏览器中测试审计功能
- **验收**: 所有功能正常

## 执行顺序

1-2 可并行，3-7 需依赖 1，8 最后
