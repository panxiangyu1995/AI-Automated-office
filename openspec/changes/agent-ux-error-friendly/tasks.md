# Agent模块UX错误信息友好化 - 实施任务

## Task ID
- **Task 214**: Agent模块-UX错误信息友好化

## 实施步骤

### Step 1: 创建错误翻译层

1. **创建目录和文件**
   - `src/lib/errors/errTranslator.ts` - 错误翻译工具
   - `src/lib/errors/index.ts` - 模块导出

2. **实现errTranslator.ts**
   - 定义错误码映射表 (20+错误码)
   - 实现translateError函数
   - 实现getFriendlyError函数
   - 实现showErrorToast函数
   - 实现getErrorActionHandler函数

### Step 2: 优化AgentChatPanel错误展示

1. **导入错误翻译**
   - 导入getFriendlyError函数
   - 导入RefreshCw图标

2. **优化错误展示**
   - 使用友好的标题和消息
   - 添加重试按钮
   - 改进布局样式

### Step 3: 优化EmployeeDirectory错误处理

待实施

### Step 4: 验收

- [x] 错误翻译层创建完成
- [x] AgentChatPanel错误展示友好化
- [ ] npm run lint 通过（待验证）
- [ ] npm run build 通过（待验证）
