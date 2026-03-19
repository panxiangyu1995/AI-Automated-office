# Tasks: Direct Manager Relation

## 1. 准备工作

- [ ] 1.1 确认前置依赖 E2-S2.2-01 和 E2-S2.3-01 已完成
- [ ] 1.2 确认 FR/NFR/ARCH 需求映射
- [ ] 1.3 设计循环检测算法

## 2. 数据模型扩展

- [ ] 2.1 Add direct manager relation to user model
  - 在 users 表添加 manager_id 字段
  - 添加外键约束和索引
  - 添加自引用检查约束

- [ ] 2.2 更新 Go 用户模型
  - 在 User struct 添加 ManagerID 字段
  - 添加 Manager 和 Subordinates 关联字段

## 3. 后端 API 实现

- [ ] 3.1 Build manager lookup API
  - 实现 `GET /api/admin/users/:id/managers`
  - 递归查询上级链
  - 返回带层级的上级列表

- [ ] 3.2 实现下属查询 API
  - 实现 `GET /api/admin/users/:id/subordinates`
  - 查询直接下属列表

- [ ] 3.3 实现上级设置 API
  - 实现 `PUT /api/admin/users/:id/manager`
  - 支持设置和清除上级

- [ ] 3.4 Check circular manager chains and illegal cross-tenant links
  - 实现循环检测函数
  - 实现跨租户校验
  - 实现自引用检查
  - 设置最大链深度限制

## 4. 前端集成

- [ ] 4.1 Connect manager picker in the user edit form
  - 创建 ManagerPicker 组件
  - 实现用户搜索选择
  - 排除当前用户和已检测的循环用户

- [ ] 4.2 更新用户编辑表单
  - 集成上级选择器
  - 处理上级变更提交

- [ ] 4.3 错误处理
  - 循环关系错误提示
  - 跨租户错误提示
  - 自引用错误提示

## 5. 测试验证

- [ ] 5.1 编写单元测试
  - 循环检测算法测试
  - 约束校验测试

- [ ] 5.2 编写集成测试
  - 上级设置流程测试
  - 上级链查询测试

- [ ] 5.3 E2E 测试
  - 上级选择器交互测试
  - 错误提示展示测试

- [ ] 5.4 验收标准
  - 循环检测正确工作
  - 跨租户设置被阻止
  - 上级选择器正常工作
  - 无 TypeScript 错误

## 任务依赖关系

```
E2-S2.2-01 + E2-S2.3-01 (前置依赖)
    |
    v
[2.1-2.2] 数据模型扩展
    |
    v
[3.1-3.4] 后端 API 实现
    |
    v
[4.1-4.3] 前端集成
    |
    v
[5.1-5.4] 测试验证
    |
    v
E2-S2.8-01 (后续依赖 - 组织架构图)
```