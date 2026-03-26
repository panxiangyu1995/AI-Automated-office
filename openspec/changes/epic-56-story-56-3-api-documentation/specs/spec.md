# Specification: API文档生成

## 需求来源

### PRD 需求
- 无具体FR需求（本Story为开发效率优化）

### NFR约束
- NFR22: 可维护性要求

---

## 输入输出规格

### 输入规格

| 输入 | 类型 | 必填 | 说明 |
|------|------|------|------|
| TypeScript源文件 | .ts/.tsx | 是 | 包含JSDoc注释的源码 |
| typedoc.json | JSON | 是 | TypeDoc配置文件 |
| npm scripts | package.json | 是 | 文档生成命令 |

### 输出规格

| 输出 | 类型 | 说明 |
|------|------|------|
| HTML文档 | .html | 生成的API文档 |
| 搜索索引 | search.json | 文档搜索数据 |
| 静态资源 | .js/.css | 文档样式和脚本 |

---

## TypeDoc配置规格

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": [
    "src/features/agent/index.ts",
    "src/features/session/index.ts",
    "src/features/tools/index.ts",
    "src/types/index.ts"
  ],
  "entryPointStrategy": "expand",
  "out": "docs/api",
  "name": "AI-Automated-Office API",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false
}
```

---

## JSDoc注释要求

### 1. 类注释模板

```typescript
/**
 * [简短描述 - 一句话说明类的作用]
 *
 * @remarks
 * [详细说明 - 详细描述类的功能、用途、使用场景等]
 * 可以多段落
 *
 * @example
 * ```typescript
 * // 使用示例代码
 * const instance = new MyClass();
 * instance.doSomething();
 * ```
 *
 * @see {@link RelatedClass} - 相关类
 */
export class MyClass {
  // ...
}
```

### 2. 方法注释模板

```typescript
/**
 * [简短描述 - 方法的作用]
 *
 * @param paramName - 参数描述
 * @param options - 配置选项
 * @param options.propertyA - 属性A说明
 * @param options.propertyB - 属性B说明
 *
 * @returns 返回值描述
 *
 * @throws {ErrorType} 何时抛出异常
 *
 * @remarks
 * 详细说明方法的行为、副作用等
 */
method(paramName: string, options?: { propertyA?: string }): ReturnType {
  // ...
}
```

### 3. 类型注释模板

```typescript
/**
 * [类型名称] - [简短描述]
 *
 * @remarks
 * [详细说明类型的用途、取值范围等]
 */
export type MyType = 'value1' | 'value2';

/**
 * [接口名称] - [简短描述]
 *
 * @property propA - 属性A说明
 * @property propB - 属性B说明
 */
export interface MyInterface {
  propA: string;
  propB: number;
}
```

---

## 验收场景 (Given-When-Then格式)

### Scenario 1: 文档生成
**GIVEN** TypeDoc配置完成，源码有JSDoc注释
**WHEN** 开发者执行 `npm run docs`
**THEN** 在docs/api目录生成完整的HTML文档

### Scenario 2: 文档浏览
**GIVEN** 文档已生成
**WHEN** 开发者打开docs/api/index.html
**THEN** 可以浏览所有模块、类、方法的文档

### Scenario 3: 搜索功能
**GIVEN** 文档已生成
**WHEN** 开发者使用搜索框搜索 "AgentOrchestrator"
**THEN** 找到相关类和方法

### Scenario 4: 链接导航
**GIVEN** 开发者查看AgentOrchestrator文档
**WHEN** 点击 @see 链接到 RuntimeStateMachine
**THEN** 正确跳转到目标文档

---

## 边界条件

### 边界条件 1: 源码无JSDoc注释
- **场景**: 某些方法缺少JSDoc
- **预期**: TypeDoc仍能生成文档，但缺少详细说明

### 边界条件 2: 私有成员
- **场景**: 配置excludePrivate=true
- **预期**: 私有成员不显示在文档中

### 边界条件 3: 循环引用
- **场景**: Class A引用Class B，B引用A
- **预期**: TypeDoc正确处理，不死循环

### 边界条件 4: 缺失的@types包
- **场景**: 第三方库缺少类型定义
- **预期**: 使用any或其他fallback类型

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| DOC-001 | TypeDoc配置解析失败 | 检查typedoc.json语法 |
| DOC-002 | 入口文件不存在 | 确认entryPoints路径 |
| DOC-003 | JSDoc语法错误 | 修复对应注释 |
| DOC-004 | 生成超时 | 检查源码复杂度 |

### 常见问题处理

1. **文档空白**: 检查entryPoints配置和源码路径
2. **搜索不工作**: 确认search.json生成
3. **样式丢失**: 检查out目录和assets路径

---

## 文档质量标准

| 检查项 | 标准 |
|--------|------|
| 覆盖率 | 核心模块100%有注释 |
| 示例代码 | 关键类/方法有可运行示例 |
| 链接有效性 | 无broken links |
| 搜索功能 | 关键词可正确搜索 |
| 响应式布局 | 移动端可读 |

---

## 生成文档目录结构

```
docs/
└── api/
    ├── index.html              # 文档首页
    ├── modules/                # 模块文档
    │   ├── features_agent/     # Agent模块
    │   ├── features_session/   # Session模块
    │   └── types/              # 类型模块
    ├── assets/
    │   ├── main.js            # 文档脚本
    │   └── style.css          # 文档样式
    └── search.json            # 搜索索引
```
