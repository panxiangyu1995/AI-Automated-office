# 任务拆分 - 完善意图分类器

## 任务清单

### Task 1: 扩展 IntentType 枚举

**文件**: `src-tauri/src/agent/router/classifier.rs`

**步骤**:
1. 扩展 IntentType 枚举，添加业务意图类型
2. 添加业务意图范围定义
3. 添加 IntentType 的 Display 和 FromStr 实现

**验收标准**:
- [ ] IntentType 包含所有业务意图
- [ ] 意图类型编号连续

---

### Task 2: 定义 IntentPattern

**文件**: `src-tauri/src/agent/router/classifier.rs`

**步骤**:
1. 定义 `IntentPattern` 结构体
2. 定义 `ClassificationResult` 结构体
3. 定义默认模式集合

**验收标准**:
- [ ] IntentPattern 包含 keywords 和 patterns
- [ ] ClassificationResult 包含 alternatives

---

### Task 3: 实现 KeywordIntentClassifier

**文件**: `src-tauri/src/agent/router/classifier.rs`

**步骤**:
1. 实现 IntentClassifier trait
2. 实现 `classify()` 方法
3. 实现置信度计算
4. 实现回退逻辑

**验收标准**:
- [ ] KeywordIntentClassifier 正常工作
- [ ] 返回 ClassificationResult
- [ ] 支持 alternatives

---

### Task 4: 添加单元测试

**步骤**:
1. 测试 IntentType 枚举
2. 测试 KeywordIntentClassifier
3. 测试置信度计算
4. 测试回退逻辑

**验收标准**:
- [ ] 所有单元测试通过
- [ ] 覆盖率 > 80%
