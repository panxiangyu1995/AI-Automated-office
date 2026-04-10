# 下一阶段 Stories 中文说明（Epic 41 / 39 / 40 / 42）

本文件是新增 OpenSpec changes 的中文执行说明。  
英文原版仍以各 change 目录内的 `README.md`、`proposal.md`、`design.md`、`tasks.md` 为准。

## Epic 41：页面容器与渲染宿主

### Story 41.1 - Workbench 宿主化改造
- `change`: `epic-41-story-41-1-workbench-host-foundation`
- 目标：将 Workbench 从固定页面渲染器升级为统一页面宿主，支持 `static` / `dynamic` / `editor` 三类视图。
- 实施步骤：
1. 定义页面宿主接口
2. 支持三类视图切换
3. 实现宿主生命周期与错误边界
4. 保持现有固定页面入口兼容

### Story 41.2 - 路由容器化
- `change`: `epic-41-story-41-2-route-containerization`
- 目标：将路由从页面直连改为容器入口，统一进入页面宿主。
- 实施步骤：
1. 统一路由容器入口
2. 定义页面上下文参数模型
3. 接入容器层权限检查
4. 支持静态和动态页面路由映射

### Story 41.3 - Sidebar 资源入口化
- `change`: `epic-41-story-41-3-sidebar-resource-entry`
- 目标：将 Sidebar 升级为导航 + 动态资源入口 + 编辑器入口。
- 实施步骤：
1. 保留固定导航项
2. 增加动态资源入口模型
3. 增加编辑器入口与最近打开项
4. 统一通过宿主协议打开资源

### Story 41.4 - 页面打开模式与上下文协议
- `change`: `epic-41-story-41-4-page-open-mode-context-contract`
- 目标：定义 `static` / `dynamic` / `editor` 打开模式及统一上下文协议。
- 实施步骤：
1. 定义页面打开模式协议
2. 定义页面上下文结构
3. 定义数据源与权限上下文字段
4. 定义宿主生命周期回调

## Epic 39：内置编辑器与文档编辑

### Story 39.1 - 文本编辑器内置能力
- `change`: `epic-39-story-39-1-builtin-text-editor`
- 目标：提供系统内置文本/富文本编辑器基础能力。
- 实施步骤：
1. 实现文本内容加载与保存
2. 提供基础工具栏
3. 支持只读/可编辑状态切换
4. 接入统一状态提示

### Story 39.2 - 表格与结构化文档编辑
- `change`: `epic-39-story-39-2-structured-document-table-editor`
- 目标：提供表格与结构化文档块编辑能力。
- 实施步骤：
1. 支持表格渲染与单元格编辑
2. 支持基础结构化文档块
3. 支持文档内容变更追踪
4. 支持统一保存入口

### Story 39.3 - 编辑器宿主接入
- `change`: `epic-39-story-39-3-editor-host-integration`
- 目标：将内置编辑器接入 Workbench 宿主与标签体系。
- 实施步骤：
1. 支持编辑器标签打开
2. 支持保存状态提示
3. 支持编辑器实例切换
4. 接入统一宿主生命周期

## Epic 40：编辑器系统与动态模板渲染

### Story 40.1 - Editor Registry 与 Resolver
- `change`: `epic-40-story-40-1-editor-registry-resolver`
- 目标：建立编辑器注册表与解析器，按资源类型选择编辑器。
- 实施步骤：
1. 定义 `EditorDescriptor` 协议
2. 实现 `EditorRegistry` 注册能力
3. 实现资源到编辑器的 Resolver
4. 实现默认回退与冲突规则

### Story 40.2 - 基础 Schema Renderer
- `change`: `epic-40-story-40-2-schema-renderer-foundation`
- 目标：构建最小可用动态页面 Schema 渲染器。
- 实施步骤：
1. 定义基础页面 Schema 结构
2. 实现布局与基础组件节点渲染
3. 实现渲染错误边界
4. 输出渲染调试信息

### Story 40.3 - 数据绑定与条件渲染
- `change`: `epic-40-story-40-3-data-binding-conditional-rendering`
- 目标：支持数据绑定、条件显示与循环渲染能力。
- 实施步骤：
1. 实现数据源引用绑定
2. 实现表达式与条件显示
3. 实现循环渲染能力
4. 实现权限上下文联动显示

### Story 40.4 - 模板权限与安全边界
- `change`: `epic-40-story-40-4-template-permission-safety-boundary`
- 目标：为模板运行时加入白名单、权限与审计边界。
- 实施步骤：
1. 实现组件白名单机制
2. 实现数据源访问控制
3. 实现动作权限检查
4. 接入模板渲染审计事件

### Story 40.5 - 模板发布与版本管理基础能力
- `change`: `epic-40-story-40-5-template-version-publish-baseline`
- 目标：提供模板发布、版本管理与回滚基础能力。
- 实施步骤：
1. 定义模板版本号与状态
2. 实现模板发布动作
3. 实现模板回滚动作
4. 支持默认模板指定

## Epic 42：动态表单与动态详情渲染

### Story 42.1 - 动态表单字段协议
- `change`: `epic-42-story-42-1-dynamic-form-field-schema`
- 目标：定义动态表单字段元数据协议。
- 实施步骤：
1. 定义字段类型与布局属性
2. 定义默认值与校验规则
3. 定义可见性与可编辑性规则
4. 定义字段级权限映射

### Story 42.2 - 动态表单渲染器
- `change`: `epic-42-story-42-2-dynamic-form-renderer`
- 目标：根据字段协议生成可提交动态表单。
- 实施步骤：
1. 实现控件映射渲染
2. 实现表单校验与反馈
3. 实现提交动作绑定
4. 支持只读态渲染

### Story 42.3 - 动态详情页区块渲染
- `change`: `epic-42-story-42-3-dynamic-detail-section-renderer`
- 目标：支持详情页主体区块动态渲染。
- 实施步骤：
1. 定义详情区块协议
2. 实现字段区块渲染
3. 实现附件与关联区块渲染
4. 实现区块级条件显示

### Story 42.4 - 审批单内容动态化
- `change`: `epic-42-story-42-4-approval-content-dynamic-rendering`
- 目标：将审批详情内容主体接入动态渲染，审批动作区保持固定。
- 实施步骤：
1. 接入审批详情动态区块
2. 保持审批动作区固定
3. 实现流程状态与字段联动
4. 补充审批场景权限检查

### Story 42.5 - 工作台内容区动态卡片化
- `change`: `epic-42-story-42-5-dashboard-content-card-composition`
- 目标：将首页与部门工作台内容区改造为动态卡片布局。
- 实施步骤：
1. 定义卡片布局协议
2. 实现图表与待办卡片渲染
3. 实现快捷入口区块渲染
4. 实现工作台内容配置加载

## 使用建议
- 任务执行以 `task.json` 中 `id 43-59` 为主顺序。
- 开发细节优先参考各 change 目录英文文档。
- 对外汇报或团队同步可直接引用本中文说明文件。

---

## Agent模块代码质量优化

### Task 211 - Agent模块-安全漏洞修复
- `change`: `agent-security-fix`
- 目标：修复XSS漏洞、敏感数据存储问题、SQL注入风险。
- 实施步骤：
1. 安装sanitize-html依赖
2. 创建XSS过滤工具sanitize.ts
3. 修复ChatMessage.tsx的dangerouslySetInnerHTML
4. 审查useCheckpointStore.ts的localStorage
5. 重构personal_loader.rs的SQL为参数化查询

### Task 212 - Agent模块-unwrap消除
- `change`: `agent-unwrap-elimination`
- 目标：消除200+处unwrap()滥用，避免运行时panic。
- 实施步骤：
1. 创建统一AgentError错误类型
2. 重构manager.rs/failover.rs/routing.rs
3. 重构browser.rs/registry.rs
4. 重构personal_loader.rs
5. 运行cargo clippy验证

### Task 213 - Agent模块-TODO清理与调试代码移除
- `change`: `agent-todo-cleanup`
- 目标：清理4处TODO和13处调试代码。
- 实施步骤：
1. 实现intercom内容安全检查
2. 实现message_sync同步逻辑
3. 添加heartbeat HTTP客户端
4. 移除前端console.log
5. 移除后端println!/dbg!

### Task 214 - Agent模块-UX错误信息友好化
- `change`: `agent-ux-error-friendly`
- 目标：将技术错误转为用户友好的消息。
- 实施步骤：
1. 创建错误翻译层errTranslator.ts
2. 优化AgentChatPanel错误展示
3. 添加EmployeeDirectory错误toast
4. 优化表单实时验证
5. npm run lint/build验证

### Task 215 - Agent模块-前后端集成对齐
- `change`: `agent-integration-align`
- 目标：审查和修复前后端命令契约对齐。
- 实施步骤：
1. 审查intercom命令契约
2. 审查subagent命令契约
3. 生成TypeScript类型定义
4. 添加参数验证
5. cargo/npm build验证

