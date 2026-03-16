# Tasks: 向量数据库初始化 (Story 1.9)

> **依赖**: Story 1.8 (SQLite本地存储)

## 任务列表

### 任务 1: 创建向量存储抽象接口
- [x] 完成
- **描述**: 定义 VectorStore Trait
- **文件**: `src-tauri/src/vector/store.rs`
- **验收**: Trait 定义完整

### 任务 2: 实现 sqlite-vec 本地向量存储
- [x] 完成
- **描述**: 集成 sqlite-vec 扩展，实现本地向量存储
- **文件**: `src-tauri/src/vector/sqlite_vec.rs`
- **验收**: 向量可插入和搜索

### 任务 3: 实现 Qdrant 云端向量存储适配器
- [x] 完成
- **描述**: 实现 Qdrant HTTP API 客户端
- **文件**: `src-tauri/src/vector/qdrant.rs`
- **验收**: 可连接 Qdrant 服务

### 任务 4: 创建向量嵌入服务
- [x] 完成
- **描述**: 创建 OpenAI 兼容格式的 Embedding 服务
- **文件**: `src-tauri/src/vector/embedding.rs`
- **验收**: 可生成文本向量

### 任务 5: 实现混合搜索（向量 + BM25）
- [x] 完成
- **描述**: 实现向量搜索和 BM25 全文搜索的混合查询
- **文件**: `src-tauri/src/vector/hybrid.rs`
- **验收**: 两种搜索结果正确返回

### 任务 6: 实现 RRF 融合搜索算法
- [x] 完成
- **描述**: 实现 Reciprocal Rank Fusion 算法
- **文件**: `src-tauri/src/vector/hybrid.rs`
- **验收**: 结果融合正确

### 任务 7: 创建向量存储配置管理
- [x] 完成
- **描述**: 创建配置文件支持本地/云端模式切换
- **文件**: `src-tauri/src/vector/config.rs`
- **验收**: 配置可切换

## 执行顺序

1. 任务 1（抽象接口）
2. 任务 2（本地存储）
3. 任务 3（云端存储）
4. 任务 4（嵌入服务）
5. 任务 5 + 任务 6（混合搜索）
6. 任务 7（配置管理）

## 测试要点

- [ ] sqlite-vec 扩展加载成功
- [ ] 向量插入和搜索正常
- [ ] BM25 全文搜索正常
- [ ] RRF 融合结果正确
- [ ] 云端 Qdrant 连接成功
- [ ] Embedding API 调用成功
