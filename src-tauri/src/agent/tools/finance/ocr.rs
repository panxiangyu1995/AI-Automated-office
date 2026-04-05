//! Finance OCR 工具
//!
//! 发票识别和验真工具

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::{InvoiceType, OcrResult, FinanceRole};
use crate::agent::tools::descriptor::{Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType};

/// OCR 请求参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceOcrParams {
    /// 发票图片（base64 或 URL）
    pub image: String,
    /// 发票类型（可选，自动识别）
    pub invoice_type: Option<String>,
    /// 是否验真
    #[serde(default)]
    pub verify: bool,
}

/// OCR 工具
#[derive(Debug, Clone)]
pub struct FinanceOcrTool {
    /// 使用计数器（用于频率限制）
    usage_counter: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl Default for FinanceOcrTool {
    fn default() -> Self {
        Self {
            usage_counter: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

impl FinanceOcrTool {
    /// OCR 识别（模拟实现）
    async fn recognize(&self, image_data: &str, invoice_type: Option<&str>) -> OcrResult {
        // 模拟 OCR 识别结果
        // 实际实现应该调用 OCR 服务 API
        
        // 判断是 base64 还是 URL
        let is_base64 = image_data.len() > 100 && !image_data.starts_with("http");
        
        // 根据发票类型生成不同的模拟结果
        let (invoice_number, amount, tax_amount, date, seller, buyer) = match invoice_type {
            Some("vat") | Some("增值税") => (
                Some(format!("FP{:08}", rand_u64())),
                Some(1500.00 + rand_f64() * 1000.0),
                Some(195.00 + rand_f64() * 100.0),
                Some("2026-03-15".to_string()),
                Some("北京某某科技有限公司".to_string()),
                Some("某某企业有限公司".to_string()),
            ),
            Some("hotel") | Some("酒店") => (
                Some(format!("JZ{:08}", rand_u64())),
                Some(300.00 + rand_f64() * 400.0),
                Some((300.0 + rand_f64() * 400.0) * 0.1),
                Some("2026-03-20".to_string()),
                Some("北京某某酒店".to_string()),
                Some("某某企业".to_string()),
            ),
            Some("train") | Some("火车票") => (
                Some(format!("HP{:08}", rand_u64())),
                Some(500.0 + rand_f64() * 200.0),
                None,
                Some("2026-03-18".to_string()),
                Some("中国铁路".to_string()),
                None,
            ),
            _ => (
                Some(format!("FP{:08}", rand_u64())),
                Some(100.0 + rand_f64() * 900.0),
                Some((100.0 + rand_f64() * 900.0) * 0.13),
                Some("2026-03-25".to_string()),
                Some("某某商店".to_string()),
                Some("某某公司".to_string()),
            ),
        };

        OcrResult {
            invoice_number,
            amount,
            tax_amount,
            date,
            seller,
            buyer,
            invoice_type: Some(InvoiceType::Vat),
            verified: false, // 验真需要后续调用
            confidence: 0.85 + rand_f64() * 0.14,
        }
    }

    /// 发票验真（模拟实现）
    async fn verify(&self, invoice_number: &str, amount: f64) -> bool {
        // 模拟验真
        // 实际实现应该调用税务局 API
        if invoice_number.is_empty() {
            return false;
        }
        // 模拟：发票号码包含特定字符时验真失败
        invoice_number.len() > 0
    }

    /// 检查频率限制
    pub async fn check_rate_limit(&self, user_id: &str, role: FinanceRole) -> Result<(), String> {
        let limits = match role {
            FinanceRole::Staff => 10,
            FinanceRole::Specialist => 100,
            FinanceRole::Manager => 500,
            FinanceRole::Executive => 1000,
        };

        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let key = format!("{}:{}", user_id, today);

        let mut counter = self.usage_counter.write().await;
        let dates = counter.entry(user_id.to_string()).or_insert_with(Vec::new);
        
        // 清理过期记录
        dates.retain(|d| d == &today);
        
        if dates.len() >= limits {
            return Err(format!(
                "已达到今日OCR使用上限（{}次），请明天再试",
                limits
            ));
        }
        
        dates.push(today);
        Ok(())
    }

    /// 执行 OCR
    pub async fn execute(
        &self,
        params: FinanceOcrParams,
        user_id: &str,
        role: FinanceRole,
    ) -> Result<serde_json::Value, String> {
        // 1. 频率检查
        self.check_rate_limit(user_id, role).await?;

        // 2. OCR 识别
        let result = self.recognize(&params.image, params.invoice_type.as_deref()).await;

        // 3. 验真（如果请求）
        let verified = if params.verify {
            if let Some(ref inv_num) = result.invoice_number {
                if let Some(amount) = result.amount {
                    self.verify(inv_num, amount).await
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        };

        // 4. 构建响应
        let mut response = json!({
            "success": true,
            "data": {
                "invoiceNumber": result.invoice_number,
                "amount": result.amount,
                "taxAmount": result.tax_amount,
                "date": result.date,
                "seller": result.seller,
                "buyer": result.buyer,
                "invoiceType": result.invoice_type.map(|t| format!("{:?}", t).to_lowercase()),
                "confidence": result.confidence,
            }
        });

        if params.verify {
            response["data"]["verified"] = json!(verified);
        }

        Ok(response)
    }
}

impl Tool for FinanceOcrTool {
    fn name(&self) -> &str {
        "finance_ocr"
    }

    fn description(&self) -> &str {
        "OCR识别发票图片"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: false,
            is_read_only: false,
            has_side_effects: false,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "image".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "发票图片（base64或URL）".to_string(),
                required: true,
                default: None,
                enum_: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "invoiceType".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "发票类型（vat/normal/receipt/electronic/train/airplane/hotel）".to_string(),
                required: false,
                default: None,
                enum_: Some(vec![
                    "vat".to_string(),
                    "normal".to_string(),
                    "receipt".to_string(),
                    "electronic".to_string(),
                    "train".to_string(),
                    "airplane".to_string(),
                    "hotel".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "verify".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Boolean),
                description: "是否验真".to_string(),
                required: false,
                default: Some(serde_json::json!(false)),
                enum_: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
            description: Some("OCR识别结果".to_string()),
            items: None,
            properties: None,
        }
    }
}

/// 生成随机 u64
fn rand_u64() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as u64;
    nanos % 100000000
}

/// 生成随机 f64
fn rand_f64() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as f64;
    (nanos as f64) / (u32::MAX as f64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ocr_basic() {
        let tool = FinanceOcrTool::default();
        let result = tool.execute(
            FinanceOcrParams {
                image: "https://example.com/invoice.jpg".to_string(),
                invoice_type: Some("vat".to_string()),
                verify: false,
            },
            "user-001",
            FinanceRole::Staff,
        ).await.unwrap();

        assert!(result["success"].as_bool().unwrap());
        assert!(result["data"]["amount"].is_number());
    }

    #[tokio::test]
    async fn test_rate_limit() {
        let tool = FinanceOcrTool::default();
        
        // 模拟达到限制
        for i in 0..10 {
            let result = tool.execute(
                FinanceOcrParams {
                    image: format!("https://example.com/invoice{}.jpg", i),
                    invoice_type: None,
                    verify: false,
                },
                "limit-test-user",
                FinanceRole::Staff,
            ).await;
            assert!(result.is_ok(), "Request {} should succeed", i);
        }
    }

    #[tokio::test]
    async fn test_verify() {
        let tool = FinanceOcrTool::default();
        let result = tool.execute(
            FinanceOcrParams {
                image: "https://example.com/invoice.jpg".to_string(),
                invoice_type: Some("vat".to_string()),
                verify: true,
            },
            "user-001",
            FinanceRole::Staff,
        ).await.unwrap();

        assert!(result["success"].as_bool().unwrap());
        assert!(result["data"]["verified"].is_boolean());
    }
}
