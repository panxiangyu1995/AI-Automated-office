# Design: 代码质量与Lint规则

## 技术方案

### 实现类型
- **类型**: polish (优化完善)
- **优先级**: low
- **阶段**: 技术债务与优化
- **是否需要后端**: 否（纯前端代码质量）

### 技术选型

| 工具 | 说明 | 选择 |
|------|------|------|
| ESLint | JavaScript/TypeScript Linter | 已有，扩展规则 |
| Prettier | 代码格式化 | 已有，集成配置 |
| eslint-plugin-react-hooks | React Hooks规则 | 新增 |
| eslint-plugin-react | React组件规则 | 已有，增强配置 |
| @typescript-eslint | TypeScript规则 | 已有，增强配置 |
| lint-staged | Git hooks增强 | 新增 |

### ESLint配置更新

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:prettier/recommended', // Prettier集成，必须放最后
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'prettier'],
  rules: {
    // React规则
    'react/react-in-jsx-scope': 'off', // React 17+不需要
    'react/prop-types': 'off', // 使用TypeScript代替
    'react/jsx-uses-react': 'off', // React 17+
    'react/display-name': 'warn',

    // React Hooks规则
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript规则
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    // 最佳实践
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Prettier (禁用冲突规则)
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier配置

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

### lint-staged配置

```json
// .lintstagedrc
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "git add"
  ],
  "*.{json,md}": [
    "prettier --write",
    "git add"
  ]
}
```

### Git Hooks配置

```javascript
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  },
  "simple-git-hooks": {
    "pre-commit": "npx lint-staged"
  }
}
```

### npm scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "prepare": "npx simple-git-hooks"
  }
}
```

### 规则分类

#### 1. Error级别（必须修复）
```javascript
{
  'react-hooks/rules-of-hooks': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  'no-debugger': 'error',
  'no-var': 'error',
  'prettier/prettier': 'error'
}
```

#### 2. Warning级别（建议修复）
```javascript
{
  'react-hooks/exhaustive-deps': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  'no-console': 'warn',
  'react/display-name': 'warn'
}
```

#### 3. Off级别（可选）
```javascript
{
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off'
}
```

### 修复现有Lint错误策略

#### Phase 1: 统计现有错误
```bash
npm run lint 2>&1 | grep -E "error|warning" | wc -l
```

#### Phase 2: 分类统计
```bash
# 按规则分类
npm run lint 2>&1 | grep -oE "\[.*\]" | sort | uniq -c
```

#### Phase 3: 批量修复
```bash
# 自动修复
npm run lint:fix
```

#### Phase 4: 手动修复
- 复杂逻辑问题需要手动处理
- 使用 `eslint-disable-next-line` 注释作为临时方案

### 规则豁免注释

```typescript
// 单行豁免
const data = JSON.parse(jsonString) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// 代码块豁免
/* eslint-disable @typescript-eslint/no-explicit-any */
const data = JSON.parse(jsonString);
/* eslint-enable @typescript-eslint/no-explicit-any */

// 文件级别豁免 (放在文件顶部)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### 与CI集成

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier
        run: npx prettier --check "src/**/*.{ts,tsx}"
```

### 安全考虑
- 无安全相关变更（本Story为代码质量）

### 性能考虑
- lint-staged只检查暂存文件，不影响git性能
- pre-commit hook应在5秒内完成
