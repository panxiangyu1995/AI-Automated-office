# Specification: Skill执行引擎完善

## 需求来源

### PRD 需求
- FR700: Skill 系统概述
- FR701: SKILL.md 格式定义
- FR702: Skill 注册与发现
- FR703: Skill 加载优先级
- FR704: Skill 版本管理
- FR705: Skill 依赖管理

### 架构约束
- ARCH-01: 分层微内核架构
- ADR-046: Skill 系统架构

### UX 规范
- UX-01: VSCode风格四栏布局
- UX-04: Shadcn/ui 组件使用

## 功能规格

### 用户故事

As a **Skill 开发者**,
I want **提供标准化的 SKILL.md 定义**,
So that **我的 Skill 能够被系统正确识别和加载**。

As a **用户**,
I want **查看和管理已安装的 Skill**,
So that **配置 Skill 参数和启用状态**。

### 验收场景

#### Scenario 1: Skill 解析
- **GIVEN** 存在标准 SKILL.md 文件
- **WHEN** 调用 skill_discover
- **THEN** 返回解析后的 Skill 元数据

#### Scenario 2: 多源发现
- **GIVEN** Skill 分布在文件系统、插件和注册表
- **WHEN** 调用 skill_discover_all
- **THEN** 合并所有来源的 Skill

#### Scenario 3: 渐进加载
- **GIVEN** 存在多个 Skill，某些有依赖
- **WHEN** 调用加载器
- **THEN** 按依赖顺序加载，优先级高的先加载

#### Scenario 4: 工具转换
- **GIVEN** 已注册的 Skill
- **WHEN** 调用 skill_to_tool
- **THEN** 返回 ToolDescriptor 用于工具系统

## 数据规格

### SKILL.md Metadata
| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | String | 是 | Skill 名称 |
| version | String | 是 | 语义化版本 |
| description | String | 是 | Skill 描述 |
| author | String | 否 | 作者 |
| permissions | Array | 否 | 权限配置 |
| triggers | Array | 否 | 触发器配置 |
| dependencies | Array | 否 | 依赖声明 |
| capabilities | Array | 否 | 能力列表 |

### 依赖声明
| 字段 | 类型 | 描述 |
|------|------|------|
| skill | String | 依赖的 Skill 名称 |
| version | String | 版本约束（如 >=1.5.0） |
| required | Boolean | 是否必需 |

## 边界条件

- SKILL.md 文件不存在时跳过
- 循环依赖检测并拒绝加载
- 版本冲突时使用最高版本
- 加载超时时降级到简化版本

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| PARSE_001 | 无效的 YAML 格式 | 返回解析错误 |
| PARSE_002 | 缺少必填字段 | 返回字段列表 |
| DISCOVERY_001 | 目录不存在 | 跳过该目录 |
| LOADER_001 | 循环依赖 | 拒绝加载 |
| LOADER_002 | 依赖缺失 | 提示安装 |
| LOADER_003 | 加载超时 | 使用降级版本 |
