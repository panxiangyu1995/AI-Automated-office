# Design: Management管理层模块

## 数据模型

```typescript
interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSource;
  refreshInterval: number;
  config: Record<string, unknown>;
}

interface WarningRule {
  id: string;
  type: 'inventory' | 'payment' | 'approval';
  condition: WarningCondition;
  level: 'info' | 'warning' | 'critical';
  recipients: string[];
}
```

## API 设计

```typescript
GET    /api/management/dashboard           // 仪表板数据
GET    /api/management/analysis          // 经营分析
GET    /api/management/warnings         // 预警列表
POST   /api/management/warnings/rules    // 创建预警规则
```
