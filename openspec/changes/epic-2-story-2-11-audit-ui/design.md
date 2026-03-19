# Design: Audit Query and Export UI

## 技术方案

### 后端 API

```
GET /api/audit/logs
Query Parameters:
  - event_type: 事件类型
  - operator_id: 操作人 ID
  - target_id: 目标对象 ID
  - start_time: 开始时间
  - end_time: 结束时间
  - result: 操作结果
  - page: 页码
  - page_size: 每页条数

GET /api/audit/export
Query Parameters:
  - (同上)
  - format: 导出格式 (csv/excel)
```

### 前端组件

```tsx
// src/features/audit/components/AuditLogTable.tsx
export function AuditLogTable() {
  const [filters, setFilters] = useState<AuditFilters>({
    eventType: '',
    operatorId: '',
    startTime: null,
    endTime: null,
  });
  
  const { data, isLoading } = useAuditLogs(filters);
  
  return (
    <div>
      <AuditFilterBar filters={filters} onChange={setFilters} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>时间</TableHead>
            <TableHead>事件类型</TableHead>
            <TableHead>操作人</TableHead>
            <TableHead>目标</TableHead>
            <TableHead>结果</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map(log => (
            <AuditLogRow key={log.id} log={log} />
          ))}
        </TableBody>
      </Table>
      <AuditExportButton filters={filters} />
    </div>
  );
}
```

## 任务列表

1. 实现审计日志查询 API
2. 实现审计日志导出 API
3. 创建审计日志表格组件
4. 创建筛选组件
5. 创建详情弹窗
6. 实现导出功能
7. 浏览器测试

## 交付物

1. 审计查询 API
2. 审计导出 API
3. 前端审计页面
4. 导出功能