# frontend-dev - 工作日志

> 用于上下文恢复。压缩/重启后先读此文件。

---

## 2026-04-16 G9 深度颜色硬编码修复

**发现：** src/remotion/scenes/ProductStory.tsx 中有3处内联hex颜色（不在palette对象中）
- 第124行: `linear-gradient(135deg, #F8FBFF 0%, #EEF4FB 48%, #E8F0F8 100%)`
- 第425行: `linear-gradient(180deg, #17314F 0%, #1E3A5F 100%)`
- 第971行: `linear-gradient(90deg, #1E3A5F 0%, #2DD4BF 100%)`

**修复：** 将3处内联hex移入palette对象，添加 navyDark/bgA/bgB/bgC 键，引用改为palette属性

**其他目录：** src/features/、src/components/、src/stores/、src/hooks/、src/lib/ 中无残留硬编码hex颜色

## 2026-04-16 G5 前端测试框架搭建

**现状：** vitest + @testing-library/react + @testing-library/jest-dom 已配置（vitest.config.ts + src/test/setup.ts）

**新增测试文件：**
1. `src/stores/__tests__/uiStore.test.ts` — 23个测试（初始状态、sidebar/chatPanel/activityItem/quickSearch/sidebarEntries/badges/resetLayout）
2. `src/stores/__tests__/appStore.test.ts` — 12个测试（初始状态、初始化、主题、sidebar、sub-agent UI）
3. `src/stores/__tests__/authStore.test.ts` — 11个测试（初始状态、setAuth、clearAuthSession、updateToken、setUser、setToken）
4. `src/features/hr/__tests__/hrTypes.test.ts` — 8个测试（EmployeeStatus标签/颜色、Employee/HrDepartment/Position接口验证）
5. `src/features/auth/__tests__/authTypes.test.ts` — 13个测试（User/PermissionSummary/LoginRequest/LoginResponse/TokenPair/AuthError/ApiEnvelope接口验证）

**合计：** 5个测试文件，67个测试用例，全部通过

**验证：** vitest run 67/67 passed, npm run build 成功

## 2026-04-16 R2-R3: G8 路由补充

**实施内容：**
1. 创建 `src/features/knowledge/pages/KnowledgePage.tsx`
2. 在 `workbenchRoutes.tsx` 添加 knowledge 路由
3. 在 `Sidebar.tsx` defaultMenuItems 核心部门分组中添加 knowledge 入口

**验证：** tsc --noEmit 通过，npm run build 成功
