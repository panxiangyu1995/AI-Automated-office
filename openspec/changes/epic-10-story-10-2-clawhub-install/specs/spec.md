# Specs: ClawHub生态 - Skill/Plugin安装与安全管理

## 功能规格

### 1. 本地文件安装 (capability_install_local)

**描述：** 用户上传本地ZIP包，系统解析并安装Skill/Plugin

**输入：**
```typescript
{
  fileData: number[];      // 文件二进制数据 | 必填 | ZIP包内容
  fileName: string;        // 文件名 | 必填 | 包含扩展名
  options: {
    skipApprove: boolean;  // 跳过审批 | 选填 | 默认false
    forceInstall: boolean;// 强制覆盖 | 选填 | 默认false
    sandboxMode: boolean; // 沙箱模式 | 选填 | 默认true
  }
}
```

**输出：**
```typescript
{
  // 成功
  status: "success";
  capabilityId: string;
  installedPath: string;
  version: string;
} |
{
  // 等待审批
  status: "pending_approval";
  requestId: string;
  estimatedWait: number; // 分钟
} |
{
  // 安全阻断
  status: "security_blocked";
  reason: "malicious_code" | "invalid_signature" | "excessive_permissions";
  details: string;
} |
{
  // 依赖缺失
  status: "dependency_missing";
  missing: Array<{
    id: string;
    name: string;
    requiredVersion: string;
  }>;
} |
{
  // 错误
  status: "error";
  code: string;
  message: string;
}
```

**处理逻辑：**
1. 验证文件格式（必须是ZIP）
2. 提取ZIP包内容
3. 解析 Skill.md/Package.json
4. 执行安全扫描
5. 验证签名（如有）
6. 检查依赖是否满足
7. 判断是否需要审批
8. 执行安装或提交审批

**错误处理：**
| 错误码 | 说明 |
|--------|------|
| `INVALID_FORMAT` | 文件格式不是ZIP |
| `PARSE_ERROR` | Skill.md/Pacakge.json解析失败 |
| `SCAN_FAILED` | 安全扫描执行失败 |
| `SIGNATURE_INVALID` | 签名验证失败 |
| `DEPENDENCY_CONFLICT` | 依赖冲突 |

---

### 2. 市场安装 (capability_install_from_market)

**描述：** 从ClawHub市场安装能力资源

**输入：**
```typescript
{
  resourceId: string;       // 资源ID | 必填 | 市场中的唯一标识
  version?: string;        // 版本号 | 选填 | 不填则安装最新
  marketId: string;        // 市场ID | 必填 | marketplace/private
  options: InstallOptions;  // 安装选项 | 必填 | 见1.1
}
```

**输出：**
```typescript
// 同1.本地文件安装
```

**处理逻辑：**
1. 调用市场API获取资源信息
2. 下载资源包
3. 后续流程同本地安装

**错误处理：**
| 错误码 | 说明 |
|--------|------|
| `MARKET_NOT_FOUND` | 市场不存在 |
| `RESOURCE_NOT_FOUND` | 资源不存在 |
| `VERSION_NOT_FOUND` | 指定版本不存在 |
| `DOWNLOAD_FAILED` | 下载失败 |

---

### 3. 卸载能力 (capability_uninstall)

**描述：** 卸载已安装的能力

**输入：**
```typescript
{
  capabilityId: string;    // 能力ID | 必填 | 要卸载的能力
  force: boolean;         // 强制卸载 | 选填 | 忽略依赖检查
}
```

**输出：**
```typescript
{
  success: boolean;
  message?: string;        // 失败原因
  backupPath?: string;      // 备份路径（如有）
}
```

**处理逻辑：**
1. 检查是否有其他能力依赖此能力
2. 如有依赖且非force，阻止卸载
3. 备份数据和配置
4. 从注册表移除
5. 删除文件和目录
6. 清理相关缓存

**错误处理：**
| 错误码 | 说明 |
|--------|------|
| `NOT_INSTALLED` | 能力未安装 |
| `DEPENDENCY_EXISTS` | 有其他能力依赖此能力 |
| `UNINSTALL_FAILED` | 卸载执行失败 |

---

### 4. 安全扫描 (capability_security_scan)

**描述：** 对能力包进行安全扫描

**输入：**
```typescript
{
  fileData: number[];      // 文件数据 | 必填 | 待扫描内容
}
```

**输出：**
```typescript
{
  passed: boolean;          // 是否通过
  score: number;          // 评分 0-100
  warnings: Array<{
    type: "network_access" | "filesystem_access" | "sensitive_api" | "dynamic_code";
    path?: string;
    api?: string;
    description: string;
  }>;
  errors: Array<{
    type: "malicious_pattern" | "tampered_signature" | "unknown_source";
    pattern?: string;
    location?: string;
    description: string;
  }>;
  scanDurationMs: number; // 扫描耗时
  scannedAt: number;      // 扫描时间戳
}
```

**处理逻辑：**
1. 提取代码特征
2. 匹配恶意模式库
3. 检测敏感API调用
4. 分析网络/文件系统访问
5. 计算安全评分
6. 缓存扫描结果

**评分规则：**
- 100分：无警告无错误
- 80-99分：有警告无错误
- 60-79分：轻微问题
- <60分：严重问题，阻断安装

---

### 5. 签名验证 (capability_verify_signature)

**描述：** 验证能力包的签名

**输入：**
```typescript
{
  fileData: number[];      // 文件数据 | 必填 | 待验证内容
  signature: string;        // 签名 | 必填 | Base64编码
  publicKey: string;        // 公钥 | 必填 | PEM格式
}
```

**输出：**
```typescript
{
  valid: boolean;           // 是否有效
  signerId?: string;        // 签名者ID
  signerName?: string;      // 签名者名称
  algorithm?: string;       // 算法
  validFrom?: number;      // 有效期开始
  validUntil?: number;      // 有效期结束
  error?: string;           // 错误信息
}
```

**处理逻辑：**
1. 解析公钥
2. 解析签名
3. 计算文件哈希
4. 验证签名
5. 检查证书有效期

---

### 6. 审批请求 (capability_submit_approval)

**描述：** 提交能力安装审批

**输入：**
```typescript
{
  installRequest: InstallRequest;  // 安装请求 | 必填
  reason: string;                  // 申请理由 | 必填
}
```

**输出：**
```typescript
{
  requestId: string;       // 审批请求ID
  capabilityId: string;     // 能力ID
  capabilityName: string;    // 能力名称
  version: string;          // 版本
  requestedAt: number;      // 申请时间
  estimatedProcessTime: number; // 预计处理时间（分钟）
}
```

---

### 7. 审批处理 (capability_process_approval)

**描述：** 审批人处理审批请求

**输入：**
```typescript
{
  requestId: string;       // 审批请求ID | 必填
  decision: {
    action: "approve" | "reject" | "request_more_info";
    notes?: string;         // 审批意见 | 审批时必填
    reason?: string;        // 拒绝理由 | 拒绝时必填
    questions?: string[];   // 问题列表 | 需补充信息时必填
  };
}
```

**输出：**
```typescript
{
  success: boolean;
  installResult?: InstallResult; // 批准时的安装结果
}
```

---

### 8. 版本检查 (capability_check_updates)

**描述：** 检查能力是否有可用更新

**输入：**
```typescript
{
  capabilityId: string;     // 能力ID | 必填
}
```

**输出：**
```typescript
{
  hasUpdate: boolean;       // 是否有更新
  currentVersion?: string;  // 当前版本
  latestVersion?: string;   // 最新版本
  changelog?: string;       // 变更日志
  updateSize?: number;      // 更新包大小（字节）
  breakingChanges?: string[]; // 破坏性变更
} | null                    // 无市场更新信息
```

---

## 接口规格

### Tauri命令汇总

| 命令 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `capability_install_local` | fileData, fileName, options | InstallResult | 本地安装 |
| `capability_install_from_market` | resourceId, version, marketId, options | InstallResult | 市场安装 |
| `capability_uninstall` | capabilityId, force | UninstallResult | 卸载 |
| `capability_list_installed` | category? | InstalledCapability[] | 列表 |
| `capability_security_scan` | fileData | SecurityScanResult | 安全扫描 |
| `capability_verify_signature` | fileData, signature, publicKey | SignatureResult | 签名验证 |
| `capability_submit_approval` | installRequest, reason | ApprovalRequest | 提交审批 |
| `capability_pending_approvals` | - | ApprovalRequest[] | 待审批列表 |
| `capability_process_approval` | requestId, decision | ApprovalResult | 处理审批 |
| `capability_check_updates` | capabilityId | UpdateInfo | 检查更新 |
| `capability_execute_update` | capabilityId, targetVersion | InstallResult | 执行更新 |

### 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| `INVALID_FORMAT` | 400 | 格式错误 |
| `PARSE_ERROR` | 400 | 解析错误 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `NOT_INSTALLED` | 404 | 未安装 |
| `SECURITY_BLOCKED` | 403 | 安全阻断 |
| `SIGNATURE_INVALID` | 403 | 签名无效 |
| `DEPENDENCY_MISSING` | 409 | 依赖缺失 |
| `DEPENDENCY_CONFLICT` | 409 | 依赖冲突 |
| `ALREADY_INSTALLED` | 409 | 已安装 |
| `PERMISSION_DENIED` | 403 | 权限不足 |
| `INTERNAL_ERROR` | 500 | 内部错误 |

## 数据规格

### 数据库表

#### capability_installs

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 记录ID |
| capability_id | TEXT | NOT NULL | 能力ID |
| version | TEXT | NOT NULL | 版本号 |
| source | TEXT | NOT NULL | 安装来源 |
| install_path | TEXT | NOT NULL | 安装路径 |
| sandbox_type | TEXT | NOT NULL | 沙箱类型 |
| status | TEXT | NOT NULL | 状态 |
| security_score | INTEGER | | 安全评分 |
| installed_by | TEXT | NOT NULL | 安装人 |
| installed_at | INTEGER | NOT NULL | 安装时间 |
| updated_at | INTEGER | NOT NULL | 更新时间 |
| tenant_id | TEXT | NOT NULL | 租户ID |

#### install_approvals

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | 请求ID |
| install_id | TEXT | FK | 安装记录ID |
| capability_id | TEXT | NOT NULL | 能力ID |
| capability_name | TEXT | NOT NULL | 能力名称 |
| version | TEXT | NOT NULL | 版本 |
| status | TEXT | NOT NULL | 状态 |
| requested_by | TEXT | NOT NULL | 申请人 |
| requested_at | INTEGER | NOT NULL | 申请时间 |
| reason | TEXT | | 申请理由 |
| security_scan_result | TEXT | | 扫描结果JSON |
| approver | TEXT | | 审批人 |
| decided_at | INTEGER | | 审批时间 |
| decision_note | TEXT | | 审批意见 |

### 索引

```sql
CREATE INDEX idx_installs_tenant ON capability_installs(tenant_id);
CREATE INDEX idx_installs_status ON capability_installs(status);
CREATE INDEX idx_installs_capability ON capability_installs(capability_id);
CREATE INDEX idx_approvals_status ON install_approvals(status);
CREATE INDEX idx_approvals_tenant ON install_approvals(tenant_id);
```
