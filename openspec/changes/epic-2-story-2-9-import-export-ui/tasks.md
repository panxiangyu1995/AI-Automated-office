# Tasks: Import and Export UI

## 任务列表

### 任务 1: 创建导入导出页面入口
- **描述**: 创建页面和路由配置
- **文件**: 
  - `src/pages/hr/ImportExportPage.tsx`
  - `src/routes/hr.routes.tsx`（更新）
  - `src/components/common/Sidebar.tsx`（添加菜单项）
- **验收**: 页面可正常访问，路由配置正确

### 任务 2: 创建 ImportWizard 组件
- **描述**: 创建导入向导主组件，管理步骤状态
- **文件**: 
  - `src/features/hr/components/ImportExport/ImportWizard.tsx`
- **验收**: 
  - 4 步流程正常切换
  - 状态管理正确

### 任务 3: 实现 ImportUpload 上传组件
- **描述**: 实现文件上传和模板下载功能
- **文件**: 
  - `src/features/hr/components/ImportExport/ImportUpload.tsx`
- **验收**: 
  - 支持拖拽上传
  - 支持模板下载
  - 显示上传进度

### 任务 4: 实现 ImportPreview 预览组件
- **描述**: 实现预览数据展示和冲突/错误列表
- **文件**: 
  - `src/features/hr/components/ImportExport/ImportPreview.tsx`
- **验收**: 
  - 显示统计信息
  - 显示冲突列表
  - 显示错误列表

### 任务 5: 实现 ImportConfirm 确认组件
- **描述**: 实现冲突处理选择和确认提交
- **文件**: 
  - `src/features/hr/components/ImportExport/ImportConfirm.tsx`
- **验收**: 
  - 支持冲突处理模式选择
  - 支持提交确认
  - 显示处理进度

### 任务 6: 实现 ImportResult 结果组件
- **描述**: 实现导入结果展示和回执下载
- **文件**: 
  - `src/features/hr/components/ImportExport/ImportResult.tsx`
- **验收**: 
  - 显示成功/失败统计
  - 显示失败详情
  - 支持回执下载

### 任务 7: 实现 ExportPanel 导出组件
- **描述**: 实现导出范围选择和字段选择
- **文件**: 
  - `src/features/hr/components/ImportExport/ExportPanel.tsx`
- **验收**: 
  - 支持范围选择
  - 支持字段选择
  - 支持文件下载

### 任务 8: 实现数据获取 Hooks
- **描述**: 实现导入导出的自定义 Hooks
- **文件**: 
  - `src/features/hr/components/ImportExport/hooks/useImport.ts`
  - `src/features/hr/components/ImportExport/hooks/useExport.ts`
- **验收**: 
  - useImport 封装导入流程
  - useExport 封装导出流程

### 任务 9: 浏览器测试
- **描述**: 在浏览器中测试完整导入导出流程
- **验收**: 
  - 导入流程正常
  - 导出流程正常
  - 错误处理正确

### 任务 10: 优化和修复
- **描述**: 修复发现的问题并优化用户体验
- **验收**: 
  - 无控制台错误
  - 交互流畅
  - 错误提示清晰

## 执行顺序

```
1. 创建导入导出页面入口
      ↓
2. 创建 ImportWizard 组件
      ↓
3. 实现 ImportUpload 上传组件
      ↓
4. 实现 ImportPreview 预览组件
      ↓
5. 实现 ImportConfirm 确认组件
      ↓
6. 实现 ImportResult 结果组件
      ↓
7. 实现 ExportPanel 导出组件
      ↓
8. 实现数据获取 Hooks
      ↓
9. 浏览器测试
      ↓
10. 优化和修复
```

## 测试要点

- [ ] 单元测试：组件渲染
- [ ] 集成测试：导入流程
- [ ] E2E 测试：完整导入导出流程
- [ ] 手动测试：文件上传、下载

## 交付物

1. 导入导出页面
2. ImportWizard 及子组件
3. ExportPanel 组件
4. 自定义 Hooks