# Agent模块前后端集成对齐 - 实施任务

## Task ID
- **Task 215**: Agent模块-前后端集成对齐

## 实施步骤

### Step 1: 审查intercom命令契约

1. **对比前后端定义**
   - 前端: `src/features/agent/api/intercom.ts`
   - 后端: `src-tauri/src/commands/intercom.rs`

2. **记录差异**
   - 参数命名不一致: camelCase vs snake_case
   - 参数验证缺失
   - 返回值结构需对齐

### Step 2: 审查subagent命令契约

1. **对比前后端定义**
   - 前端: `src/features/agent/services/subagent.ts`
   - 后端: `src-tauri/src/commands/subagent.rs`

2. **记录差异**
   - createPersonalSubagent参数结构不一致
   - 类型定义需同步

### Step 3: 生成TypeScript类型定义

1. **创建共享类型文件**
   ```bash
   mkdir -p src/types/agent
   touch src/types/agent/intercom.ts
   touch src/types/agent/subagent.ts
   ```

2. **定义消息相关类型** (src/types/agent/intercom.ts):
   ```typescript
   export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
   export type MessageType = 'text' | 'tool_call' | 'tool_result';
   
   export interface Message {
     id: string;
     agentId: string;
     content: string;
     messageType: MessageType;
     status: MessageStatus;
     createdAt: string;
     updatedAt?: string;
   }
   
   export interface SendMessageParams {
     agentId: string;
     content: string;
     messageType?: MessageType;
     sessionId?: string;
   }
   ```

3. **定义SubAgent相关类型** (src/types/agent/subagent.ts):
   ```typescript
   export type AgentType = 'personal' | 'department' | 'system';
   
   export interface AgentConfig {
     id: string;
     name: string;
     description: string;
     type: AgentType;
     enabled: boolean;
     config: Record<string, unknown>;
     createdAt: string;
     updatedAt: string;
   }
   
   export interface CreateSubagentParams {
     name: string;
     description: string;
     type?: AgentType;
     config?: Record<string, unknown>;
   }
   ```

### Step 4: 修复参数类型不匹配

1. **统一前端调用格式**
   ```typescript
   // intercom.ts - 修复前后
   // 修复前
   invoke('send_agent_message', { agentId, content, messageType, sessionId })
   
   // 修复后 - 保持现有格式，因为Tauri会自动处理camelCase/snake_case
   invoke('send_agent_message', { agent_id: agentId, content, message_type: messageType, session_id: sessionId })
   ```

2. **统一后端参数名** (可选，统一使用snake_case)

### Step 5: 添加参数验证

1. **在后端添加验证** (commands/intercom.rs):
   ```rust
   #[tauri::command]
   async fn send_agent_message(
       agent_id: String,
       content: String,
       message_type: Option<String>,
       session_id: Option<String>,
   ) -> Result<SendMessageResult, String> {
       // 验证 agent_id
       if agent_id.is_empty() {
           return Err("agent_id cannot be empty".to_string());
       }
       
       // 验证 content
       if content.is_empty() {
           return Err("content cannot be empty".to_string());
       }
       if content.len() > 65535 {
           return Err("content exceeds maximum length (65535)".to_string());
       }
       
       // 验证 message_type
       if let Some(ref mt) = message_type {
           match mt.as_str() {
               "text" | "tool_call" | "tool_result" => {}
               _ => return Err(format!("invalid message_type: {}", mt)),
           }
       }
       
       // 业务逻辑...
   }
   ```

2. **在后端添加验证** (commands/subagent.rs):
   ```rust
   #[tauri::command]
   async fn create_personal_subagent(
       name: String,
       description: String,
       config: serde_json::Value,
   ) -> Result<AgentConfig, String> {
       // 验证 name
       if name.is_empty() {
           return Err("name cannot be empty".to_string());
       }
       if name.len() > 64 {
           return Err("name exceeds maximum length (64)".to_string());
       }
       if !name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
           return Err("name contains invalid characters".to_string());
       }
       
       // 业务逻辑...
   }
   ```

### Step 6: 验证构建

1. **Rust编译**
   ```bash
   cd src-tauri && cargo build
   ```

2. **前端构建**
   ```bash
   npm run build
   ```

3. **类型检查**
   ```bash
   npx tsc --noEmit
   ```

---

## 验收标准

- [ ] intercom命令契约审查完成
- [ ] subagent命令契约审查完成
- [ ] TypeScript类型定义生成
- [ ] 参数验证添加
- [ ] cargo build 通过
- [ ] npm run build 通过
- [ ] 类型检查通过
