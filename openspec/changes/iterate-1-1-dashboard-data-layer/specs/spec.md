# 规格文档 - Dashboard数据层

## 接口定义

### Tauri Command: get_dashboard_stats

**输入参数:**
```json
{
  "tenant_id": "string (required)"
}
```

**输出:**
```json
{
  "totalEmployees": "number",
  "totalCustomers": "number", 
  "totalSales": "number",
  "totalContracts": "number",
  "pendingApprovals": "number",
  "totalReceivable": "number",
  "totalPayable": "number",
  "serviceTickets": {
    "total": "number",
    "pending": "number",
    "completed": "number"
  },
  "lastUpdated": "ISO8601 timestamp"
}
```

**错误响应:**
```json
{
  "error": "string",
  "code": "string"
}
```

## TypeScript类型

```typescript
export interface DashboardStats {
  totalEmployees: number;
  totalCustomers: number;
  totalSales: number;
  totalContracts: number;
  pendingApprovals: number;
  totalReceivable: number;
  totalPayable: number;
  serviceTickets: {
    total: number;
    pending: number;
    completed: number;
  };
  lastUpdated: string;
}

export interface DashboardStatsError {
  error: string;
  code: 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN';
}
```

## 验收标准

1. **数据获取**: 调用 `invoke('get_dashboard_stats')` 返回正确的统计数值
2. **错误处理**: 网络错误时返回友好的错误信息
3. **类型安全**: 所有数据字段类型正确
4. **时间戳**: 包含数据最后更新时间
