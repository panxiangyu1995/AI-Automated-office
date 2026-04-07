# Proposal: 通讯录与员工目录完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：
- `src/features/agent/components/EmployeeDirectory.tsx`
- `src/features/agent/components/EmployeeCard.tsx`
- `src-tauri/src/hr/` - 员工管理后端

**缺失部分**：通讯录数据聚合、搜索完善、在线状态、快速对话。

## 目标

完善通讯录与员工目录 (FR650-FR662)：
1. 实现通讯录数据聚合 API
2. 实现员工搜索和筛选
3. 实现在线状态管理
4. 完善员工名片 UI
5. 实现快速发起对话

## 影响范围

### 前端
- `src/features/agent/components/EmployeeDirectory.tsx` - 扩展现有组件
- `src/features/agent/components/EmployeeCard.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/hr/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 147 (HR人事部门模块)

## 验收标准

1. 员工目录能够按部门分组展示
2. 搜索功能能够快速定位员工
3. 员工名片能够正确展示
4. 能够快速发起对话
