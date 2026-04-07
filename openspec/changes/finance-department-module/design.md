# Design: Finance财务部门模块

## 数据模型

```typescript
interface Invoice {
  id: string;
  number: string;
  type: 'VAT' | 'normal' | 'receipt';
  amount: number;
  taxAmount: number;
  customerId?: string;
  salesQuoteId?: string;
  salesContractId?: string;
  ocrResult?: OCRResult;
  status: 'pending' | 'verified' | 'recorded';
}

interface LedgerEntry {
  id: string;
  type: 'receivable' | 'payable';
  amount: number;
  paidAmount: number;
  customerId?: string;
  invoiceId?: string;
  dueDate: Date;
  status: 'pending' | 'partial' | 'completed';
}
```

## API 设计

```typescript
POST   /api/finance/invoices/ocr          // OCR识别发票
GET    /api/finance/invoices              // 发票列表
POST   /api/finance/ledger               // 生成台账
GET    /api/finance/ledger/receivable    // 应收
GET    /api/finance/ledger/payable       // 应付
GET    /api/finance/reports/monthly      // 月度报表
```
