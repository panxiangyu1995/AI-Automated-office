# Proposal: 财务部门AI能力完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/finance/components/FinancePanel.tsx`
后端工具已存在：`src-tauri/src/agent/tools/finance/`

**缺失部分**：与业务模块集成、发票 OCR、台账自动生成。

## 目标

完善财务部门 AI 能力：
1. 实现发票 OCR 识别
2. 实现台账自动生成
3. 实现应收应付联动
4. 实现与销售模块数据对接
5. 完善财务报表 UI

## 影响范围

### 前端
- `src/features/finance/components/FinancePanel.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/agent/tools/finance/` - 扩展现有模块
- `src-tauri/src/finance/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 150 (财务部门模块), Task 184 (Pilot部门集成完善)

## 验收标准

1. 发票 OCR 能够正常工作
2. 台账能够自动生成
3. 财务报表能够正确展示
