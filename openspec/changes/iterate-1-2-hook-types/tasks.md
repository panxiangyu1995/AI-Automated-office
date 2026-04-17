# 任务清单 - Hooks类型定义完善

## 前置条件

- [ ] TypeScript环境可用

## 任务步骤

### 步骤1: 创建types目录结构

- [ ] 创建 `src/hooks/types/` 目录
- [ ] 创建 `src/hooks/types/index.ts`

### 步骤2: 完善EventBus类型

- [ ] 创建 `src/hooks/types/eventBus.ts`
- [ ] 导出 `IEventBus` 接口
- [ ] 导出 `EventHandler` 类型
- [ ] 更新 `src/hooks/eventBus.ts` 导入类型

### 步骤3: 完善PluginLifecycle类型

- [ ] 创建 `src/hooks/types/pluginLifecycle.ts`
- [ ] 导出所有PluginLifecycle相关接口
- [ ] 更新 `src/hooks/pluginLifecycle.ts` 导入类型

### 步骤4: 完善ServiceContainer类型

- [ ] 创建 `src/hooks/types/serviceContainer.ts`
- [ ] 导出所有ServiceContainer相关接口
- [ ] 更新 `src/hooks/serviceContainer.ts` 导入类型

### 步骤5: 验证

- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功

## 验收标准

1. 所有hooks类型都有完整定义
2. 类型文件统一在 `types/` 目录
3. `src/hooks/types/index.ts` 统一导出所有类型
