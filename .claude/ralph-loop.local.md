---
active: true
iteration: 1
session_id: 
max_iterations: 40
completion_promise: "所有
   Task 已完成，passes=true，lint/build/测试全部通过"
started_at: "2026-04-08T15:41:39Z"
---

任务：Phase 2 任务执行循环 - 自动化完成所有 passes=false 的 tasks，直到所有任务 passes=true

  ### 1. 初始准备                                                                                                                  - 检查当前分支，确保在 main 分支上工作
  - 生成时间戳（如 20260408_XXXXXX）                                                                                             
  - 读取 task.json，获取所有 passes=false 的任务列表                                                                             
  - 按任务顺序（id升序）依次处理每个任务

  ### 2. 单任务执行循环（对每个 passes=false 的任务）
  1. **读取任务信息**：从 task.json 获取任务详情，找到对应的 OpenSpec 变更文档
  2. **铁律合规检查**：阅读 PRD、架构、UX、Epic 文档，确认实现方案
  3. **实现功能**：按照 OpenSpec 变更文档的 design.md 和 tasks.md 实现功能
  4. **验证**：
     - 运行 npm run lint 确保无 lint 错误
     - 运行 npm run build 确保构建成功
     - 使用 playwright/浏览器测试验证 UI 功能正常
  5. **纠错**：
     - 若验证失败，分析最新错误日志
     - 严禁忽略任何类型错误或 lint 警告
     - 修复后立即重新验证，直到成功
  6. **更新状态**：
     - 更新 progress.txt 记录当前进度
     - 将 task.json 中该任务的 passes 改为 true
  7. **Git 提交**：所有更改在同一个 commit 中提交，格式：[功能]+[模块]+[简要描述]

  ### 3. 完成标准（必须全部满足）
  - [ ] task.json 中所有任务的 passes=true
  - [ ] npm run lint 无错误
  - [ ] npm run build 构建成功
  - [ ] 所有 UI 相关修改已通过浏览器测试验证

  ### 4. 退出信号
  满足上述所有条件后，输出：<promise>所有 Task 已完成，passes=true，lint/build/测试全部通过</promise>
