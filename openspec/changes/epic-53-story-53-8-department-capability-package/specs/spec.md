## 功能规格

### FR800: 能力包注册机制

**描述**: 支持能力包的注册、发现和管理。

**注册流程**:
1. 验证包元数据
2. 检查权限要求
3. 解析依赖关系
4. 安装包文件
5. 注册到本地注册表
6. 激活能力包

**验证**:
- 注册成功返回RegistryEntry
- 重复注册返回错误
- 无效包拒绝注册

---

### FR801: 企业云端市场

**描述**: 支持从企业云端市场安装能力包，同时兼容ClawHub格式插件。

**市场类型**:
- **CloudMarket**: 企业云端市场（主市场）
- **Local**: 本地包安装

**功能**:
- 搜索能力包
- 查看包详情
- 查看版本历史
- 下载安装
- ClawHub格式插件导入

**验证**:
- 企业云端市场连接正常
- 搜索结果正确
- 下载安装成功
- ClawHub格式兼容正常

---

### FR802: 版本管理

**描述**: 支持能力包的版本发布、更新和回滚。

**版本规则**:
- 遵循语义版本规范 (SemVer)
- 支持预发布版本
- 支持版本约束

**功能**:
- 版本发布
- 版本更新
- 版本回滚
- 兼容性检查

**验证**:
- 版本解析正确
- 更新流程正常
- 回滚功能正常

---

### FR803: 权限控制

**描述**: 能力包的访问和操作权限控制。

**权限类型**:
- 安装权限
- 启用/禁用权限
- 更新权限
- 卸载权限

**权限范围**:
- 租户级
- 部门级
- 用户级

**验证**:
- 权限检查正确
- 无权限操作被拒绝
- 审计日志正确

---

### FR804: 依赖管理

**描述**: 能力包之间的依赖关系管理。

**依赖类型**:
- 必需依赖
- 可选依赖
- 开发依赖

**功能**:
- 依赖解析
- 冲突检测
- 自动解决
- 循环检测

**验证**:
- 依赖解析正确
- 冲突检测正常
- 循环依赖被拒绝

---

### FR805: 核心部门能力包

**描述**: 预置核心部门能力包。

**核心包列表**:

| 包ID | 名称 | 部门 | 工具 | Skills |
|------|------|------|------|--------|
| hr-capability | 人事能力包 | 人事部 | 5 | 4 |
| approval-capability | 审批能力包 | 审批中心 | 3 | 3 |
| sales-capability | 销售能力包 | 销售部 | 5 | 4 |
| finance-capability | 财务能力包 | 财务部 | 4 | 3 |
| warehouse-capability | 仓储能力包 | 仓储部 | 4 | 3 |
| management-capability | 管理能力包 | 管理层 | 3 | 2 |

**验证**:
- 所有核心包预装
- 功能正常可用
- 工具和Skills正确注册

---

### FR806: 扩展部门能力包

**描述**: 支持按需安装扩展部门能力包。

**扩展包列表**:

| 包ID | 名称 | 部门 | 工具 | Skills |
|------|------|------|------|--------|
| aftersales-capability | 售后能力包 | 售后服务 | 4 | 3 |
| bidding-capability | 招投标能力包 | 招投标 | 3 | 2 |
| marketing-capability | 市场能力包 | 市场宣传 | 4 | 3 |

**验证**:
- 可从市场安装
- 安装后功能正常
- 可卸载

---

## 数据类型

### CapabilityPackageMeta

```typescript
interface CapabilityPackageMeta {
  packageId: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  packageType: CapabilityPackageType;
  department: string;
  author: string;
  publisher?: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  categories: string[];
  icon?: string;
  screenshots: string[];
  status: CapabilityPackageStatus;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  downloadCount: number;
  rating?: number;
  ratingCount: number;
}
```

### RegistryEntry

```typescript
interface RegistryEntry {
  packageId: string;
  installedVersion: string;
  installedAt: number;
  installedBy: string;
  tenantId: string;
  departmentId?: string;
  enabled: boolean;
  autoUpdate: boolean;
  installationPath: string;
  checksum: string;
  signature?: string;
}
```

### PackageDependency

```typescript
interface PackageDependency {
  packageId: string;
  versionConstraint: string;
  optional: boolean;
}
```

## 错误码

| 错误码 | 描述 |
|--------|------|
| `PKG_001` | 包不存在 |
| `PKG_002` | 版本不存在 |
| `PKG_003` | 依赖解析失败 |
| `PKG_004` | 权限不足 |
| `PKG_005` | 签名验证失败 |
| `PKG_006` | 市场连接失败 |
| `PKG_007` | 下载失败 |
| `PKG_008` | 安装失败 |
| `PKG_009` | 冲突检测失败 |
| `PKG_010` | 版本不兼容 |

## 性能指标

| 指标 | 目标值 |
|------|--------|
| 包安装时间 | < 30s |
| 包卸载时间 | < 5s |
| 市场搜索响应 | < 2s |
| 依赖解析时间 | < 5s |
| 更新检查时间 | < 3s |
| 最大包大小 | 500MB |
| 最大依赖深度 | 10层 |
| 注册表加载时间 | < 500ms |
