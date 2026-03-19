# Design: Integration Test Plan

## 技术方案

### 测试架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Architecture                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │  E2E Tests  │     │ Integration │     │ Unit Tests  │  │
│  │ (Playwright)│     │   Tests     │     │  (Vitest)   │  │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │   Browser   │     │   Backend   │     │   Isolated  │  │
│  │ Environment │     │ Environment │     │  Functions  │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### E2E 测试场景

#### 认证测试 (auth.spec.ts)

```typescript
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should show error with invalid credentials', async () => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible();
  });
  
  test('should logout successfully', async () => {
    await login(page, 'admin', 'password123');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');
  });
  
  test('should refresh token', async () => {
    // Test token refresh flow
  });
  
  test('should handle session timeout', async () => {
    // Test 30-min idle timeout
  });
  
  test('should handle force logout', async () => {
    // Test admin force logout
  });
});
```

#### 用户管理测试 (user.spec.ts)

```typescript
describe('User Management', () => {
  test.beforeEach(async () => {
    await login(page, 'admin', 'password123');
  });
  
  test('should list users', async () => {
    await page.goto('/users');
    await expect(page.locator('.user-table')).toBeVisible();
  });
  
  test('should create user', async () => {
    await page.goto('/users');
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[name="username"]', 'newuser');
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="real_name"]', 'New User');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();
  });
  
  test('should update user', async () => {
    // Test user update
  });
  
  test('should delete user', async () => {
    // Test user delete
  });
  
  test('should assign role to user', async () => {
    // Test role assignment
  });
  
  test('should assign department to user', async () => {
    // Test department assignment
  });
});
```

#### 导入导出测试 (import.spec.ts)

```typescript
describe('Import/Export', () => {
  test('should preview import file', async () => {
    await page.goto('/users/import');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/import.xlsx');
    await expect(page.locator('.preview-table')).toBeVisible();
  });
  
  test('should show import errors', async () => {
    // Test import with errors
  });
  
  test('should commit import', async () => {
    // Test import commit
  });
  
  test('should export users', async () => {
    // Test user export
  });
});
```

#### 权限测试 (permission.spec.ts)

```typescript
describe('Permissions', () => {
  test('should deny access without permission', async () => {
    await login(page, 'readonly_user', 'password123');
    await page.goto('/users/create');
    await expect(page.locator('.forbidden-message')).toBeVisible();
  });
  
  test('should allow access with permission', async () => {
    await login(page, 'admin', 'password123');
    await page.goto('/users/create');
    await expect(page.locator('form')).toBeVisible();
  });
  
  test('should show only permitted menu items', async () => {
    // Test menu filtering
  });
});
```

### 测试数据管理

```typescript
// tests/fixtures/users.json
{
  "admin": {
    "username": "admin",
    "password": "Admin@123",
    "real_name": "系统管理员",
    "email": "admin@example.com",
    "role": "admin"
  },
  "manager": {
    "username": "manager",
    "password": "Manager@123",
    "real_name": "部门经理",
    "email": "manager@example.com",
    "role": "manager"
  },
  "readonly_user": {
    "username": "readonly",
    "password": "Readonly@123",
    "real_name": "只读用户",
    "email": "readonly@example.com",
    "role": "readonly"
  }
}

// tests/fixtures/roles.json
{
  "admin": {
    "name": "管理员",
    "code": "admin",
    "permissions": ["*"]
  },
  "manager": {
    "name": "部门经理",
    "code": "manager",
    "permissions": ["user.read", "user.update", "department.read"]
  },
  "readonly": {
    "name": "只读用户",
    "code": "readonly",
    "permissions": ["user.read", "department.read"]
  }
}
```

### 测试环境配置

```typescript
// tests/config/test-env.ts
export const testConfig = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
  apiURL: process.env.TEST_API_URL || 'http://localhost:8080',
  testTenant: 'test-tenant',
  timeout: 30000,
  screenshotOnFailure: true,
  videoOnFailure: true,
};
```

## 任务列表

1. 配置测试环境
2. 创建测试数据
3. 编写认证测试
4. 编写用户管理测试
5. 编写角色权限测试
6. 编写部门管理测试
7. 编写导入导出测试
8. 编写审计测试
9. 编写会话管理测试
10. 配置 CI 测试流水线