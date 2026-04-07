# Proposal: 插件运行时自愈机制

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/settings/components/PluginRuntimeSelfHealing.tsx`

**缺失部分**：后端自愈机制、健康检测、自动重启。

## 目标

实现插件运行时自愈 (FR1170-FR1186)：
1. 实现插件健康检测
2. 实现错误分类和处理
3. 实现自动重启机制
4. 实现重启次数限制
5. 实现故障告警

## 影响范围

### 前端
- `src/features/settings/components/PluginRuntimeSelfHealing.tsx` - 集成后端 API

### 后端
- 新增插件自愈模块

## 依赖

- **前置依赖**: Task 162 (部门能力包完整实现)

## 验收标准

1. 健康检测能够正常工作
2. 自动重启能够触发
3. 重启次数限制能够生效
