# Design: Finance Department Subagent

## 1. 财务 Subagent 配置

```rust
/// Finance Subagent 配置
pub struct FinanceSubagentConfig {
    pub name: String,           // "finance"
    pub display_name: String,    // "财务助手"
    pub models: ModelConfig,
    pub role_permissions: HashMap<Role, FinanceRolePermission>,
}

/// 财务角色权限
pub struct FinanceRolePermission {
    pub tools: Vec<FinanceTool>,
    pub data_scope: DataScope,
    pub max_daily_ocr: Option<u32>,
    pub max_expense_amount: Option<f64>,
}

/// 财务工具
pub enum FinanceTool {
    Query,      // 查询
    Ocr,        // OCR识别
    Mutate,     // 变更（提交/审核/调整）
    Aggregate,  // 聚合统计
    Export,     // 导出
    Report,     // 报表生成
    Forecast,   // 预测分析
    Dashboard,  // 看板
}
```

## 2. 权限矩阵

| 工具 | staff | specialist | manager | executive |
|------|-------|------------|---------|-----------|
| finance_query | ✓ (本人) | ✓ (部门) | ✓ (全部) | ✓ (含敏感) |
| finance_ocr | ✓ (10次/日) | ✓ (100次/日) | ✓ (500次/日) | ✓ (1000次/日) |
| finance_mutate | submit_expense | approve/reject | all | all |
| finance_aggregate | ✗ | ✓ | ✓ | ✓ |
| finance_export | ✗ | ✓ (excel/pdf) | ✓ (全部格式) | ✓ |
| finance_report | ✗ | ✗ | ✓ | ✓ |
| finance_forecast | ✗ | ✗ | ✗ | ✓ |
| finance_dashboard | ✗ | ✗ | ✓ | ✓ |

## 3. 财务工具实现

```rust
// finance_query - 发票查询
#[derive(Debug, Tool)]
#[tool(name = "finance_query")]
pub struct FinanceQueryTool {
    /// 发票ID
    pub id: Option<String>,
    /// 申请人
    pub applicant_id: Option<String>,
    /// 日期范围
    pub date_range: Option<DateRange>,
    /// 金额范围
    pub amount_range: Option<AmountRange>,
}

impl ToolExecutor for FinanceQueryTool {
    async fn execute(&self, context: &ToolContext) -> Result<ToolResult, ToolError> {
        // 1. 权限检查
        let permission = check_permission(context, "finance_query")?;
        
        // 2. 字段过滤
        let fields = get_allowed_fields(permission.role, "finance_query");
        
        // 3. 数据范围过滤
        let scope_filter = build_scope_filter(permission.data_scope, context.user_id);
        
        // 4. 执行查询
        let results = query_invoices(self, fields, scope_filter).await?;
        
        // 5. 字段级过滤
        Ok(filter_fields(results, fields))
    }
}

// finance_ocr - 发票识别
#[derive(Debug, Tool)]
#[tool(name = "finance_ocr")]
pub struct FinanceOcrTool {
    /// 发票图片（base64 或 URL）
    pub image: String,
    /// 发票类型
    pub invoice_type: Option<InvoiceType>,
}

impl ToolExecutor for FinanceOcrTool {
    async fn execute(&self, context: &ToolContext) -> Result<ToolResult, ToolError> {
        // 1. 频率检查
        check_rate_limit(context, "finance_ocr")?;
        
        // 2. 调用 OCR 服务
        let result = ocr_service.recognize(&self.image).await?;
        
        // 3. 验真（可选）
        let verified = tax_api.verify(&result).await?;
        
        Ok(ToolResult::Success(json!({
            "invoice_number": result.invoice_number,
            "amount": result.amount,
            "date": result.date,
            "verified": verified,
        })))
    }
}
```

## 4. 模型配置

```yaml
models:
  primary:
    provider: "anthropic"
    modelId: "claude-sonnet-4-5"
    temperature: 0.7
    maxTokens: 8192
  light:
    provider: "anthropic"
    modelId: "claude-haiku-4-5"
    temperature: 0.3
    maxTokens: 4096
  small:
    provider: "anthropic"
    modelId: "claude-haiku-4-5"
    temperature: 0.5
    maxTokens: 1024
```

## 5. 触发条件

```yaml
trigger:
  mode: auto
  keywords:
    - "报销"
    - "发票"
    - "财务"
    - "对账"
    - "账单"
  conditions:
    - intent: "finance.ocr"
      entities: ["invoice", "发票"]
    - intent: "finance.query"
      entities: ["expense", "报销"]
    - intent: "finance.report"
      entities: ["report", "报表"]
  priority: 8
```
