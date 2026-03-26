# Design: 财务模块 - 发票OCR与台账生成

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 4 - 业务模块动态化
- **后端必需**: Yes

### 前端实现

#### 目录结构
```
src/features/finance/
├── components/
│   ├── OcrCapture.tsx              # OCR图像上传
│   ├── OcrResultReview.tsx         # OCR结果确认
│   ├── OcrFieldValidation.tsx      # 字段验证显示
│   ├── LedgerEntryEditor.tsx       # 台账条目编辑器
│   ├── LedgerConfirmation.tsx       # 台账确认界面
│   ├── LedgerEntryList.tsx         # 台账条目列表
│   └── FinanceDashboard.tsx        # 财务仪表板
├── hooks/
│   ├── useOcrCapture.ts           # OCR捕获Hook
│   ├── useOcrValidation.ts         # OCR验证Hook
│   ├── useLedgerAutoGenerate.ts    # 台账自动生成Hook
│   ├── useLedgerConfirmation.ts    # 台账确认Hook
│   └── useReceivablePayableCalculator.ts # 应收应付计算Hook
└── utils/
    ├── ocrValidator.ts             # OCR验证工具
    └── ledgerCalculator.ts         # 台账计算工具
```

#### 核心组件实现

```typescript
// src/features/finance/components/OcrCapture.tsx
interface OcrCaptureProps {
  onImageSelected: (imageUrl: string) => void;
  onOcrStart?: () => void;
  onOcrComplete?: (result: OcrResult) => void;
  onError?: (error: FinanceError) => void;
}

const OcrCapture: React.FC<OcrCaptureProps> = ({
  onImageSelected,
  onOcrStart,
  onOcrComplete,
  onError,
}) => {
  const { uploadImage, isUploading } = useOcrCapture();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 预览图片
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelected(url);

    // 上传并识别
    try {
      onOcrStart?.();
      const result = await uploadImage(file);
      onOcrComplete?.(result);
    } catch (error) {
      onError?.(error as FinanceError);
    }
  };

  return (
    <div className="ocr-capture">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {previewUrl && <img src={previewUrl} alt="Preview" />}
      {isUploading && <LoadingSpinner />}
    </div>
  );
};
```

```typescript
// src/features/finance/components/OcrResultReview.tsx
interface OcrResultReviewProps {
  ocrResult: OcrResult;
  onConfirm: (validatedData: OcrValidatedData) => void;
  onEdit: (field: string, value: any) => void;
  onCancel: () => void;
}

const OcrResultReview: React.FC<OcrResultReviewProps> = ({
  ocrResult,
  onConfirm,
  onEdit,
  onCancel,
}) => {
  const { isValid, validationErrors } = useOcrValidation(ocrResult);

  return (
    <div className="ocr-result-review">
      <ConfidenceBadge confidence={ocrResult.confidence} />

      <FormFields>
        <FormField
          label="发票号码"
          value={ocrResult.parsedData.invoiceNumber}
          error={validationErrors.invoiceNumber}
          onEdit={(v) => onEdit('invoiceNumber', v)}
        />
        <FormField
          label="发票金额"
          value={ocrResult.parsedData.totalAmount}
          error={validationErrors.totalAmount}
          onEdit={(v) => onEdit('totalAmount', v)}
          type="currency"
        />
        {/* 更多字段... */}
      </FormFields>

      <div className="actions">
        <Button onClick={onCancel}>取消</Button>
        <Button
          onClick={() => onConfirm(validatedData)}
          disabled={!isValid}
        >
          确认并创建发票
        </Button>
      </div>
    </div>
  );
};
```

```typescript
// src/features/finance/components/LedgerConfirmation.tsx
interface LedgerConfirmationProps {
  ledgerEntries: LedgerEntry[];
  onConfirm: () => void;
  onReject: (entryId: string, reason: string) => void;
  onEdit: (entry: LedgerEntry) => void;
}

const LedgerConfirmation: React.FC<LedgerConfirmationProps> = ({
  ledgerEntries,
  onConfirm,
  onReject,
  onEdit,
}) => {
  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="ledger-confirmation">
      <Alert type={isBalanced ? 'success' : 'error'}>
        借贷平衡检查: {isBalanced ? '通过' : '不平衡！'}
        <br />
        借方合计: ¥{totalDebit.toFixed(2)} | 贷方合计: ¥{totalCredit.toFixed(2)}
      </Alert>

      <LedgerEntryList
        entries={ledgerEntries}
        onEdit={onEdit}
        onReject={onReject}
      />

      <div className="actions">
        <Button variant="secondary" onClick={onRejectAll}>
          全部驳回
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!isBalanced}
        >
          确认入账
        </Button>
      </div>
    </div>
  );
};
```

#### Hooks实现

```typescript
// src/features/finance/hooks/useOcrCapture.ts
export const useOcrCapture = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<FinanceError | null>(null);

  const uploadImage = async (file: File): Promise<OcrResult> => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. 上传图片到临时存储
      const formData = new FormData();
      formData.append('image', file);
      const imageUrl = await financeApi.uploadOcrImage(formData);

      // 2. 调用OCR识别
      const result = await financeApi.ocrRecognize(imageUrl);
      return result;
    } catch (e) {
      const financeError = e as FinanceError;
      setError(financeError);
      throw financeError;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
};
```

```typescript
// src/features/finance/hooks/useLedgerAutoGenerate.ts
export const useLedgerAutoGenerate = (invoiceId: string) => {
  const { data: invoice } = useInvoice(invoiceId);
  const { generateLedgerEntries } = useLedgerGenerator();

  const ledgerEntries = useMemo(() => {
    if (!invoice || invoice.status !== 'verified') return [];

    // 根据发票类型生成台账条目
    return generateLedgerEntries(invoice);
  }, [invoice, generateLedgerEntries]);

  return { ledgerEntries };
};

// 台账生成规则
const generateLedgerEntries = (invoice: Invoice): LedgerEntry[] => {
  const entries: LedgerEntry[] = [];
  const date = invoice.issuedDate;
  const description = `发票 ${invoice.invoiceNumber}`;

  // 销售发票（应收）
  if (invoice.type === 'sale') {
    // 借：应收账款
    entries.push({
      id: uuid(),
      accountId: '1122', // 应收账款
      date,
      description,
      debitAmount: invoice.totalAmount,
      creditAmount: 0,
      balance: 0, // 计算得出
      invoiceId: invoice.id,
    });

    // 贷：主营业务收入
    entries.push({
      id: uuid(),
      accountId: '6001', // 主营业务收入
      date,
      description,
      debitAmount: 0,
      creditAmount: invoice.netAmount,
      balance: 0,
      invoiceId: invoice.id,
    });

    // 贷：应交税费-应交增值税(销项税额)
    entries.push({
      id: uuid(),
      accountId: '2221', // 应交税费
      date,
      description,
      debitAmount: 0,
      creditAmount: invoice.taxAmount,
      balance: 0,
      invoiceId: invoice.id,
    });
  }

  // 采购发票（应付）类似处理...

  return entries;
};
```

### 后端实现

```rust
// src-tauri/src/plugins/finance/ocr_processor.rs

use crate::plugins::finance::models::*;
use crate::plugins::finance::errors::FinanceError;

pub struct OcrProcessor {
    // 可以注入真实的OCR服务客户端
}

impl OcrProcessor {
    /// 处理发票OCR识别
    pub async fn recognize_invoice(
        &self,
        image_url: String,
    ) -> Result<OcrResult, FinanceError> {
        // 模拟OCR识别
        // 真实实现会调用第三方OCR服务
        Ok(OcrResult {
            raw_text: "发票号码: FP12345678\n金额: 1000.00".to_string(),
            parsed_data: OcrParsedData {
                invoice_number: Some("FP12345678".to_string()),
                invoice_date: Some("2024-01-15".to_string()),
                seller_name: Some("XX公司".to_string()),
                buyer_name: Some("YY公司".to_string()),
                total_amount: Some(1000.00),
                tax_amount: Some(130.00),
                items: None,
            },
            confidence: 0.95,
        })
    }

    /// 验证OCR结果
    pub fn validate_ocr_result(&self, result: &OcrResult) -> ValidationResult {
        let mut errors = Vec::new();

        if result.parsed_data.invoice_number.is_none() {
            errors.push("发票号码未识别".to_string());
        }

        if result.parsed_data.total_amount.is_none() {
            errors.push("金额未识别".to_string());
        }

        ValidationResult {
            is_valid: errors.is_empty(),
            errors,
        }
    }
}
```

```rust
// src-tauri/src/plugins/finance/ledger_generator.rs

use crate::plugins::finance::models::*;

pub struct LedgerGenerator;

impl LedgerGenerator {
    /// 根据发票生成台账条目
    pub fn generate_from_invoice(&self, invoice: &Invoice) -> Vec<LedgerEntry> {
        let mut entries = Vec::new();

        match invoice.invoice_type {
            InvoiceType::Sale => {
                // 销售发票生成应收台账
                entries.extend(self.create_sale_ledger_entries(invoice));
            }
            InvoiceType::Purchase => {
                // 采购发票生成应付台账
                entries.extend(self.create_purchase_ledger_entries(invoice));
            }
        }

        entries
    }

    fn create_sale_ledger_entries(&self, invoice: &Invoice) -> Vec<LedgerEntry> {
        let mut entries = Vec::new();
        let date = &invoice.issued_date;
        let desc = format!("发票 {}", invoice.invoice_number);

        // 借：应收账款
        entries.push(LedgerEntry {
            id: uuid(),
            account_id: "1122".to_string(), // 应收账款
            date: date.clone(),
            description: desc.clone(),
            debit_amount: invoice.total_amount,
            credit_amount: 0.0,
            balance: invoice.total_amount,
            invoice_id: Some(invoice.id.clone()),
            receivable_id: None,
            payable_id: None,
            created_at: now(),
            created_by: invoice.created_by.clone(),
        });

        // 贷：主营业务收入（不含税金额）
        entries.push(LedgerEntry {
            id: uuid(),
            account_id: "6001".to_string(),
            date: date.clone(),
            description: desc.clone(),
            debit_amount: 0.0,
            credit_amount: invoice.net_amount,
            balance: -invoice.net_amount,
            invoice_id: Some(invoice.id.clone()),
            receivable_id: None,
            payable_id: None,
            created_at: now(),
            created_by: invoice.created_by.clone(),
        });

        // 贷：应交税费-销项税额
        entries.push(LedgerEntry {
            id: uuid(),
            account_id: "2221".to_string(),
            date: date.clone(),
            description: desc,
            debit_amount: 0.0,
            credit_amount: invoice.tax_amount,
            balance: -invoice.tax_amount,
            invoice_id: Some(invoice.id.clone()),
            receivable_id: None,
            payable_id: None,
            created_at: now(),
            created_by: invoice.created_by.clone(),
        });

        entries
    }
}
```

```rust
// src-tauri/src/plugins/finance/receivable_payable_calculator.rs

pub struct ReceivablePayableCalculator;

impl ReceivablePayableCalculator {
    /// 计算应收金额
    pub fn calculate_receivable(&self, invoice: &Invoice) -> Receivable {
        let pending_amount = invoice.total_amount; // 初始为发票全额

        Receivable {
            id: uuid(),
            customer_id: invoice.customer_id.clone(),
            customer_name: invoice.customer_name.clone(),
            invoice_id: invoice.id.clone(),
            invoice_number: invoice.invoice_number.clone(),
            amount: invoice.total_amount,
            paid_amount: 0.0,
            pending_amount,
            status: ReceivableStatus::Pending,
            due_date: invoice.due_date.clone(),
            issued_date: invoice.issued_date.clone(),
            overdue_days: 0,
            last_payment_date: None,
            created_at: now(),
            updated_at: now(),
        }
    }

    /// 更新逾期天数
    pub fn update_overdue_days(&self, receivable: &mut Receivable) {
        if receivable.status == ReceivableStatus::Paid ||
           receivable.status == ReceivableStatus::Cancelled {
            receivable.overdue_days = 0;
            return;
        }

        let today = chrono::Utc::now().date_naive();
        let due_date = chrono::NaiveDate::parse_from_str(
            &receivable.due_date, "%Y-%m-%d"
        ).unwrap();

        if today > due_date {
            receivable.overdue_days = (today - due_date).num_days() as i32;
            if receivable.overdue_days > 0 {
                receivable.status = ReceivableStatus::Overdue;
            }
        }
    }
}
```

### FinancePilotIntegration增强

```typescript
// src/features/agent/components/FinancePilotIntegration.tsx
const FinancePilotIntegration: React.FC = () => {
  const { executeTool, tools } = useFinanceTools();
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [pendingLedgerEntries, setPendingLedgerEntries] = useState<LedgerEntry[]>([]);

  // OCR识别完成，自动生成台账条目
  useEffect(() => {
    if (ocrResult && ocrResult.isValid) {
      const entries = generateLedgerEntriesFromOcr(ocrResult);
      setPendingLedgerEntries(entries);
    }
  }, [ocrResult]);

  return (
    <div className="finance-pilot">
      <OcrCapture
        onOcrComplete={setOcrResult}
      />

      {ocrResult && (
        <OcrResultReview
          ocrResult={ocrResult}
          onConfirm={(data) => createInvoiceAndGenerateLedger(data)}
        />
      )}

      {pendingLedgerEntries.length > 0 && (
        <LedgerConfirmation
          ledgerEntries={pendingLedgerEntries}
          onConfirm={confirmLedgerEntries}
          onReject={rejectLedgerEntry}
        />
      )}
    </div>
  );
};
```

## 状态管理

- `financeOcrStore` - OCR识别状态和结果
- `financeLedgerStore` - 台账条目状态（待确认、已确认、已驳回）
- `financeCalculationStore` - 应收应付计算状态

## 安全考虑

- 遵循ADR-018安全设计
- OCR结果需要用户确认才能创建发票
- 台账条目需要确认才能正式入账
- 应收应付计算使用精确的定点数运算
- 添加操作审计日志

## 性能考虑

- OCR识别（模拟）< 500ms
- 台账自动生成 < 100ms
- 应收应付计算 < 50ms
- 借贷平衡检查 < 10ms
