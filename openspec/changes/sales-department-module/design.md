# Design: Sales销售部门模块

## 数据模型

```typescript
interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  type: 'individual' | 'corporate';
  level: 'A' | 'B' | 'C';
  tags: string[];
}

interface Quote {
  id: string;
  number: string;
  customerId: string;
  items: QuoteItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: Date;
}

interface Contract {
  id: string;
  number: string;
  customerId: string;
  quoteId?: string;
  items: ContractItem[];
  totalAmount: number;
  status: 'draft' | 'signed' | 'executing' | 'completed';
  signDate?: Date;
  expireDate?: Date;
}
```

## API 设计

```typescript
POST   /api/sales/customers              // 创建客户
GET    /api/sales/customers             // 客户列表
POST   /api/sales/quotes                // 创建报价单
POST   /api/sales/quotes/generate       // AI生成报价单
POST   /api/sales/contracts            // 创建合同
POST   /api/sales/contracts/generate   // AI生成合同
```
