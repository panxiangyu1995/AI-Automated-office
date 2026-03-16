# Specification: 面板布局自定义

## 需求来源

### PRD 需求
- **FR2**: 用户可以自定义调整界面面板大小和布局

### UX 规范
- **UX-02**: 透明可控原则
- **UX-03**: 零学习成本原则

## 功能规格

### 用户故事
As a 用户,
I want 自定义调整界面面板大小和布局,
So that 可以根据自己的使用习惯调整界面。

### 验收场景

#### Scenario 1: 拖拽调整面板
- **GIVEN** 用户在主界面
- **WHEN** 拖拽面板边界
- **THEN** 面板大小实时调整
- **AND** 显示当前面板宽度提示
- **AND** 面板有最小/最大宽度限制

#### Scenario 2: 布局自动保存
- **GIVEN** 用户调整了面板布局
- **WHEN** 调整完成
- **THEN** 布局配置自动保存到本地存储

#### Scenario 3: 布局恢复
- **GIVEN** 用户调整了布局并关闭应用
- **WHEN** 重新打开应用
- **THEN** 布局设置被恢复
- **AND** 各面板宽度和折叠状态与关闭前一致

#### Scenario 4: 重置布局
- **GIVEN** 用户在设置页面
- **WHEN** 点击"重置为默认布局"
- **THEN** 布局恢复为默认状态
- **AND** 面板位置和大小恢复默认

## 数据规格

### 布局配置存储
| 字段 | 类型 | 默认值 |
|------|------|--------|
| sidebarWidth | number | 240 |
| chatPanelWidth | number | 400 |
| sidebarCollapsed | boolean | false |
| chatPanelCollapsed | boolean | false |
| bottomPanelHeight | number | 200 |
| bottomPanelCollapsed | boolean | true |

## 性能要求

| 指标 | 目标值 |
|------|--------|
| 拖拽响应延迟 | < 16ms |
| 配置保存延迟 | < 100ms (防抖后) |
| 布局恢复时间 | < 50ms |
