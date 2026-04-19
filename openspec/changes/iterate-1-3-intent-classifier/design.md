# 技术设计 - 完善意图分类器

## 1. 架构设计

### 1.1 组件关系

```
IntentClassifier (trait)
    │
    ├── KeywordIntentClassifier (新增)
    │       │
    │       ├── KeywordTrie
    │       │
    │       └── IntentPattern
    │
    └── Future: MLIntentClassifier, RuleIntentClassifier
```

### 1.2 新增组件

#### IntentPattern
```rust
pub struct IntentPattern {
    pub intent: IntentType,
    pub keywords: Vec<String>,
    pub patterns: Vec<Regex>,
    pub weight: f32,
}
```

#### KeywordIntentClassifier
```rust
pub struct KeywordIntentClassifier {
    patterns: Vec<IntentPattern>,
    default_intent: IntentType,
    min_confidence: f32,
}
```

## 2. 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/agent/router/classifier.rs` | 修改 | 扩展 IntentType，实现 KeywordIntentClassifier |

## 3. 修改方案

### 3.1 扩展 IntentType

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum IntentType {
    // 通用意图
    General = 0,
    Chat = 1,
    Question = 2,
    
    // 业务意图
    Finance = 10,
    FinanceQuery = 11,
    FinanceOcr = 12,
    FinanceReport = 13,
    
    Hr = 20,
    HrQuery = 21,
    HrOnboard = 22,
    
    Sales = 30,
    SalesOrder = 31,
    SalesCustomer = 32,
    
    Approval = 40,
    ApprovalSubmit = 41,
    ApprovalProcess = 42,
    
    Warehouse = 50,
    WarehouseQuery = 51,
    WarehouseStock = 52,
    
    // 跨部门意图
    CrossDepartment = 100,
    
    // 系统意图
    System = 200,
    Unknown = 255,
}
```

### 3.2 实现 KeywordIntentClassifier

```rust
pub struct KeywordIntentClassifier {
    patterns: Vec<IntentPattern>,
    default_intent: IntentType,
    min_confidence: f32,
}

impl IntentClassifier for KeywordIntentClassifier {
    fn classify(&self, text: &str) -> ClassificationResult {
        let mut scores = HashMap::new();
        
        for pattern in &self.patterns {
            let mut score = 0.0;
            
            // 关键词匹配
            for keyword in &pattern.keywords {
                if text.to_lowercase().contains(&keyword.to_lowercase()) {
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
                scores.insert(pattern.intent, score);
            }
        }
        
        // 归一化并排序
        let mut sorted: Vec<_> = scores.into_iter().collect();
        sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // 取最高分
        if let Some((intent, score)) = sorted.first() {
            let confidence = (score / self.patterns.iter().map(|p| p.weight).sum::<f32>()).min(1.0);
            
            if confidence >= self.min_confidence {
                return ClassificationResult {
                    intent: *intent,
                    confidence,
                    alternatives: sorted.into_iter().take(3).collect(),
                };
            }
        }
        
        // 返回默认意图
        ClassificationResult {
            intent: self.default_intent,
            confidence: 0.0,
            alternatives: Vec::new(),
        }
    }
}
```

## 4. 向后兼容性

- 新增 IntentType 不影响现有代码
- 新增 KeywordIntentClassifier 可选使用
- 默认意图为 IntentType::Unknown
