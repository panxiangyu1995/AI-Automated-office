# Agent模块安全漏洞修复 - 实施任务

## Task ID
- **Task 211**: Agent模块-安全漏洞修复

## 执行步骤

### Step 1: 修复XSS漏洞

1. **安装sanitize-html依赖**
   ```bash
   npm install sanitize-html @types/sanitize-html
   ```

2. **创建XSS过滤工具**
   - 文件: `src/lib/sanitize.ts`
   - 实现 sanitizeMarkdown 函数
   - 配置允许的HTML标签和属性

3. **修改ChatMessage组件**
   - 文件: `src/features/agent/components/ChatMessage.tsx`
   - 导入 sanitizeMarkdown
   - 在 dangerouslySetInnerHTML 前调用过滤

### Step 2: 审查敏感数据存储

1. **分析Checkpoint数据类型**
   - 检查 CheckpointData 接口定义
   - 识别是否包含敏感字段

2. **根据分析结果处理**
   - 如无敏感数据: 添加注释说明
   - 如有敏感数据: 迁移到加密存储

### Step 3: 修复SQL注入风险（已实施）

#### 已修复的SQL注入问题

**文件**: `src-tauri/src/agent/subagent/personal_loader.rs`

| 位置 | 问题 | 修复方式 |
|------|------|---------|
| `delete()` | `format!`拼接DELETE | 使用`params!`参数化 |
| `update()` WHERE | `format!`拼接WHERE | 使用`?1 ?2`参数化 |
| `load_all()` | `format!`拼接SELECT | 使用`?1`参数化 |
| `load()` | `format!`拼接SELECT | 使用`?1 ?2`参数化 |

#### lock().unwrap()说明

代码中多处使用`db.lock().unwrap()`模式：
- 这是Rust中处理Mutex的标准模式
- Mutex poisoning在实践中极少发生
- 如果需要更严格的错误处理，可以使用`lock().map_err()`

### Step 4: 修复unwrap()调用（已实施）

#### 已修复的unwrap()问题

**文件**: `src-tauri/src/agent/subagent/personal_loader.rs`

| 位置 | 问题 | 修复方式 |
|------|------|---------|
| `create()` 第114行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `create()` 第130行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `create()` 第154行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `update()` 第198行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `update()` 第279行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `delete()` 第298行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `load_all()` 第402行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |
| `load()` 第416行 | `db.lock().unwrap()` | 使用 `map_err()` 包装 |

#### lock().unwrap() 说明

代码中多处使用`db.lock().unwrap()`模式：
- 原有的 Mutex poisoning 风险已通过 `map_err()` 处理
- 所有数据库锁操作现在返回 `SubagentResult` 而非直接 panic

### Step 5: 验证

- [x] SQL注入修复已完成
- [x] unwrap() 修复已完成
- [x] 错误处理已统一为 SubagentResult
- [x] sanitize-html 依赖已添加到 package.json
- [x] 验证清单完成

---

## 验收标准

- [x] XSS过滤正常工作，恶意脚本被过滤
- [x] Checkpoint存储经过安全评估
- [x] SQL查询使用参数化，无字符串拼接
- [x] unwrap() 已替换为 map_err() 错误处理
- [x] sanitize-html 依赖已添加到 package.json
- [x] 单元测试通过（PersonalLoader 测试已实现）

## 已完成的修改

### Step 1: XSS漏洞修复
- 创建 `src/lib/sanitize.ts` - XSS过滤工具
- 修改 `src/features/agent/components/ChatMessage.tsx` - 使用sanitizeMarkdownHtml

### Step 2: 敏感数据存储审查
- 审查 `src/features/agent/hooks/useCheckpointStore.ts`
- 添加安全说明注释
- 评估结论：数据为非敏感元数据，可继续使用localStorage

### Step 3: SQL注入风险修复
- 修改 `src-tauri/src/agent/subagent/personal_loader.rs`
- DELETE语句：使用参数化查询
- UPDATE语句：WHERE子句使用参数化
- SELECT语句：load_all和load使用参数化
