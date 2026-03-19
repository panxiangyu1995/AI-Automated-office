# Tasks: API Contracts

## 任务列表

### 任务 1: 创建 API 契约文档
- **描述**: 创建 OpenAPI/Swagger 风格的 API 契约文档
- **文件**: `cloud-server/docs/api/openapi.yaml`
- **验收**: Epic 2 所有核心端点定义完整

### 任务 2: 定义 Go 请求/响应结构体
- **描述**: 定义认证、Profile、用户、组织、权限、审计、导入导出的 DTO
- **文件**:
  - `cloud-server/api/auth/types.go`
  - `cloud-server/api/admin/types.go`
- **验收**: DTO 与契约一致

### 任务 3: 定义错误码常量
- **描述**: 定义统一错误码与标准 403 错误结构
- **文件**:
  - `cloud-server/pkg/errors/codes.go`
  - `cloud-server/pkg/errors/errors.go`
- **验收**: 错误码定义完整，403 契约可复用

### 任务 4: 生成 TypeScript 类型定义
- **描述**: 从 API 契约同步前端 TypeScript 类型
- **文件**: `src/types/api.types.ts`
- **验收**: 类型与后端契约一致

### 任务 5: 创建 API 客户端封装
- **描述**: 封装前端 API 调用（含 Profile API）
- **文件**: `src/lib/api-client.ts`
- **验收**: API 调用路径与参数契约一致

### 任务 6: 编写 API 文档
- **描述**: 补充接口说明与错误码说明
- **文件**: `cloud-server/docs/api/README.md`
- **验收**: 文档可直接用于联调

## 执行顺序
1. API 契约文档
2. Go DTO
3. 错误码与 403 契约
4. TypeScript 类型
5. API 客户端
6. 文档整理

## 交付物
1. OpenAPI 契约文档
2. Go DTO
3. 错误码定义
4. TypeScript 类型
5. API 客户端
6. API 文档
