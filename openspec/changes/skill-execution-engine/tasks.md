# Tasks: Skill执行引擎完善

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 4 - Skill完善

## 任务列表

### Task 1: 实现 SKILL.md 解析器
- **描述**: 创建 SkillParser 实现 YAML frontmatter 解析和验证
- **文件**:
  - `src-tauri/src/agent/skill/parser.rs` (新建)
- **验收**: 能够解析标准 SKILL.md 格式

### Task 2: 扩展 SkillRegistry
- **描述**: 扩展现有 SkillRegistry，支持 Skill 生命周期管理
- **文件**:
  - `src-tauri/src/agent/skill/registry.rs`
- **验收**: 能够注册、查询、注销 Skill

### Task 3: 实现多源发现服务
- **描述**: 创建 SkillDiscoveryService，支持多种发现源
- **文件**:
  - `src-tauri/src/agent/skill/discovery.rs` (新建)
- **验收**: 能够从文件/插件/注册表发现 Skill

### Task 4: 实现渐进加载器
- **描述**: 创建 SkillLoader，按优先级加载 Skill
- **文件**:
  - `src-tauri/src/agent/skill/loader.rs`
- **验收**: 能够按优先级加载，支持降级

### Task 5: 实现工具转换器
- **描述**: 创建 SkillConverter，将 Skill 转换为 ToolDescriptor
- **文件**:
  - `src-tauri/src/agent/skill/converter.rs` (新建)
- **验收**: Skill 能够转换为可执行工具

### Task 6: 前后端集成测试
- **描述**: 集成 Skill 配置 UI 与后端
- **文件**:
  - `src/features/settings/components/SkillConfiguration.tsx` (更新)
- **验收**: UI 能够正常显示和管理 Skill

## 测试要点

- [ ] 单元测试：SKILL.md 解析
- [ ] 单元测试：版本约束解析
- [ ] 单元测试：依赖图检测
- [ ] 集成测试：多源发现
- [ ] 集成测试：渐进加载
- [ ] 集成测试：工具转换
