# 详细规格 - 完善意图分类器

## 1. 类型定义

### 1.1 IntentType

```rust
/// 意图类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)]
pub enum IntentType {
    // ========== 通用意图 (0-9) ==========
    /// 通用聊天
    General = 0,
    /// 聊天
    Chat = 1,
    /// 提问
    Question = 2,
    
    // ========== 财务意图 (10-19) ==========
    /// 财务通用
    Finance = 10,
    /// 财务查询
    FinanceQuery = 11,
    /// 财务OCR
    FinanceOcr = 12,
    /// 财务报表
    FinanceReport = 13,
    
    // ========== 人事实迹 (20-29) ==========
    /// 人事通用
    Hr = 20,
    /// 人事查询
    HrQuery = 21,
    /// 入职办理
    HrOnboard = 22,
    
    // ========== 销售意图 (30-39) ==========
    /// 销售通用
    Sales = 30,
    /// 销售订单
    SalesOrder = 31,
    /// 客户管理
    SalesCustomer = 32,
    
    // ========== 审批意图 (40-49) ==========
    /// 审批通用
    Approval = 40,
    /// 提交审批
    ApprovalSubmit = 41,
    /// 处理审批
    ApprovalProcess = 42,
    
    // ========== 仓储意图 (50-59) ==========
    /// 仓储通用
    Warehouse = 50,
    /// 库存查询
    WarehouseQuery = 51,
    /// 库存管理
    WarehouseStock = 52,
    
    // ========== 跨部门意图 (100-199) ==========
    /// 跨部门协作
    CrossDepartment = 100,
    
    // ========== 系统意图 (200-254) ==========
    /// 系统命令
    System = 200,
    
    // ========== 未知 (255) ==========
    /// 未知意图
    Unknown = 255,
}

impl IntentType {
    /// 获取意图分类（粗粒度）
    pub fn category(&self) -> IntentCategory {
        match self {
            IntentType::General | IntentType::Chat | IntentType::Question => IntentCategory::General,
            IntentType::Finance | IntentType::FinanceQuery | IntentType::FinanceOcr | IntentType::FinanceReport => IntentCategory::Finance,
            IntentType::Hr | IntentType::HrQuery | IntentType::HrOnboard => IntentCategory::Hr,
            IntentType::Sales | IntentType::SalesOrder | IntentType::SalesCustomer => IntentCategory::Sales,
            IntentType::Approval | IntentType::ApprovalSubmit | IntentType::ApprovalProcess => IntentCategory::Approval,
            IntentType::Warehouse | IntentType::WarehouseQuery | IntentType::WarehouseStock => IntentCategory::Warehouse,
            IntentType::CrossDepartment => IntentCategory::CrossDepartment,
            IntentType::System => IntentCategory::System,
            IntentType::Unknown => IntentCategory::Unknown,
        }
    }
}

/// 意图分类
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum IntentCategory {
    General,
    Finance,
    Hr,
    Sales,
    Approval,
    Warehouse,
    CrossDepartment,
    System,
    Unknown,
}
```

### 1.2 IntentPattern

```rust
/// 意图模式
#[derive(Debug, Clone)]
pub struct IntentPattern {
    /// 意图类型
    pub intent: IntentType,
    /// 关键词列表
    pub keywords: Vec<String>,
    /// 正则模式
    pub patterns: Vec<Regex>,
    /// 权重
    pub weight: f32,
}

impl IntentPattern {
    pub fn new(intent: IntentType, keywords: Vec<&str>, weight: f32) -> Self {
        Self {
            intent,
            keywords: keywords.into_iter().map(String::from).collect(),
            patterns: Vec::new(),
            weight,
        }
    }
    
    pub fn with_regex(mut self, patterns: Vec<&str>) -> Self {
        self.patterns = patterns
            .into_iter()
            .filter_map(|p| Regex::new(p).ok())
            .collect();
        self
    }
}
```

### 1.3 ClassificationResult

```rust
/// 分类结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassificationResult {
    /// 识别的意图
    pub intent: IntentType,
    /// 置信度 (0.0-1.0)
    pub confidence: f32,
    /// 备选意图列表
    pub alternatives: Vec<(IntentType, f32)>,
}

impl ClassificationResult {
    pub fn new(intent: IntentType, confidence: f32) -> Self {
        Self {
            intent,
            confidence,
            alternatives: Vec::new(),
        }
    }
    
    pub fn with_alternatives(mut self, alternatives: Vec<(IntentType, f32)>) -> Self {
        self.alternatives = alternatives;
        self
    }
}
```

### 1.4 IntentClassifier Trait

```rust
/// 意图分类器接口
pub trait IntentClassifier: Send + Sync {
    /// 对文本进行意图分类
    fn classify(&self, text: &str) -> ClassificationResult;
    
    /// 获取支持的意图类型
    fn supported_intents(&self) -> Vec<IntentType>;
}
```

### 1.5 KeywordIntentClassifier

```rust
/// 基于关键词的意图分类器
pub struct KeywordIntentClassifier {
    patterns: Vec<IntentPattern>,
    default_intent: IntentType,
    min_confidence: f32,
}

impl KeywordIntentClassifier {
    pub fn new() -> Self {
        Self::with_patterns(Self::default_patterns())
    }
    
    pub fn with_patterns(patterns: Vec<IntentPattern>) -> Self {
        Self {
            patterns,
            default_intent: IntentType::Unknown,
            min_confidence: 0.3,
        }
    }
    
    pub fn default_patterns() -> Vec<IntentPattern> {
        vec![
            // 财务相关
            IntentPattern::new(IntentType::FinanceOcr, vec!["发票", "OCR", "扫描", "识别"], 1.0)
                .with_regex(vec![r"发票[0-9]+"]),
            IntentPattern::new(IntentType::FinanceQuery, vec!["账单", "报销", "查询", "财务报表"], 1.0),
            IntentPattern::new(IntentType::Finance, vec!["财务", "会计", "预算"], 0.8),
            
            // 人事相关
            IntentPattern::new(IntentType::HrOnboard, vec!["入职", "新员工", "报到", "入职手续"], 1.0),
            IntentPattern::new(IntentType::HrQuery, vec!["员工", "人事", "考勤", "工资"], 1.0),
            IntentPattern::new(IntentType::Hr, vec!["人力资源", "HR"], 0.8),
            
            // 销售相关
            IntentPattern::new(IntentType::SalesOrder, vec!["订单", "合同", "报价"], 1.0),
            IntentPattern::new(IntentType::SalesCustomer, vec!["客户", "商机", "拜访"], 1.0),
            IntentPattern::new(IntentType::Sales, vec!["销售", "业绩", "市场"], 0.8),
            
            // 审批相关
            IntentPattern::new(IntentType::ApprovalSubmit, vec!["提交", "申请", "发起"], 1.0),
            IntentPattern::new(IntentType::ApprovalProcess, vec!["审批", "通过", "拒绝", "处理"], 1.0),
            IntentPattern::new(IntentType::Approval, vec!["审批", "流程"], 0.8),
            
            // 仓储相关
            IntentPattern::new(IntentType::WarehouseStock, vec!["入库", "出库", "库存"], 1.0),
            IntentPattern::new(IntentType::WarehouseQuery, vec!["盘点", "查询", "库存"], 1.0),
            IntentPattern::new(IntentType::Warehouse, vec!["仓库", "仓储", "物流"], 0.8),
        ]
    }
}

impl IntentClassifier for KeywordIntentClassifier {
    fn classify(&self, text: &str) -> ClassificationResult {
        let text_lower = text.to_lowercase();
        let mut scores: HashMap<IntentType, f32> = HashMap::new();
        let total_weight: f32 = self.patterns.iter().map(|p| p.weight).sum();
        
        for pattern in &self.patterns {
            let mut score = 0.0;
            
            // 关键词匹配
            for keyword in &pattern.keywords {
                if text_lower.contains(&keyword.to_lowercase()) {
                    score += pattern.weight;
                }
            }
            
            // 正则匹配
            for re in &pattern.patterns {
                if re.is_match(text) {
                    score += pattern.weight;
                }
            }
            
            if score > 0.0 {
                *scores.entry(pattern.intent).or_insert(0.0) += score;
            }
        }
        
        // 排序
        let mut sorted: Vec<_> = scores.into_iter().collect();
        sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // 取最高分
        if let Some((intent, score)) = sorted.first() {
            let confidence = (score / total_weight).min(1.0);
            
            if confidence >= self.min_confidence {
                let alternatives: Vec<_> = sorted
                    .into_iter()
                    .skip(1)
                    .take(3)
                    .map(|(i, s)| (i, (s / total_weight).min(1.0)))
                    .collect();
                
                return ClassificationResult {
                    intent: *intent,
                    confidence,
                }.with_alternatives(alternatives);
            }
        }
        
        // 返回默认意图
        ClassificationResult::new(self.default_intent, 0.0)
    }
    
    fn supported_intents(&self) -> Vec<IntentType> {
        self.patterns.iter().map(|p| p.intent).collect()
    }
}
```

## 2. 验收标准

### 2.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1 | 财务关键词正确识别 | 单元测试 |
| AC2 | 人事关键词正确识别 | 单元测试 |
| AC3 | 置信度计算正确 | 单元测试 |
| AC4 | 返回 alternatives | 单元测试 |
| AC5 | 无匹配时返回 Unknown | 边界测试 |

### 2.2 性能验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| PC1 | 单次分类延迟 < 5ms | 通过 |

### 2.3 准确性验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| AC6 | 关键词分类准确率 > 85% | 集成测试 |
