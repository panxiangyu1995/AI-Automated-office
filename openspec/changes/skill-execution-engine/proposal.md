# Proposal: Skill执行引擎完善

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前 Skill 配置 UI 已实现（`src/features/settings/components/SkillConfiguration.tsx`），展示了：
- Skill 列表和状态管理
- 参数配置和启用/禁用
- 依赖管理和降级历史
- 加载进度和错误处理

**缺失部分**：
- 后端 SKILL.md 解析器
- Skill 注册表管理
- 多源发现机制
- 渐进加载器
- 工具/触发器转换器

## 目标

完善 Skill 执行引擎，实现：
1. SKILL.md 解析器 - 解析 Skill 定义文件
2. Skill 注册表 - 管理 Skill 的注册和发现
3. 多源发现机制 - 从文件/插件/注册表发现 Skill
4. 渐进加载器 - 按优先级加载 Skill
5. 工具/触发器转换器 - 将 Skill 转换为可执行工具

## 范围

### 包含
- 实现 SKILL.md YAML frontmatter 解析器
- 实现 SkillRegistry 核心功能
- 实现多源 Skill 发现服务
- 实现渐进加载器
- 实现工具转换器
- 前后端集成测试

### 不包含
- Skill 执行逻辑（由 SkillExecutorService 实现）
- Skill 市场功能（独立���块）

## 影响范围

### 前端
- `src/features/settings/components/SkillConfiguration.tsx` - 已实现
- 新增 API 集成

### 后端
- `src-tauri/src/agent/skill/` - 扩展现有模块
- `src-tauri/src/agent/skill/parser.rs` - 新增解析器
- `src-tauri/src/agent/skill/registry.rs` - 新增注册表
- `src-tauri/src/agent/skill/discovery.rs` - 新增发现服务
- `src-tauri/src/agent/skill/loader.rs` - 新增加载器
- `src-tauri/src/agent/skill/converter.rs` - 新增转换器

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| SKILL.md 格式不标准 | 中 | 中 | 提供格式验证和错误提示 |
| 循环依赖 | 低 | 高 | 依赖图检测 |
| 加载性能 | 中 | 中 | 渐进加载和缓存 |

## 依赖

- **前置依赖**: Task 130 (Skill系统基础)
- **后置依赖**: Task 165 (MVP最终集成测试)

## 验收标准

1. SKILL.md 文件能够被正确解析
2. Skill 注册表能够管理 Skill 生命周期
3. 多源发现机制工作正常
4. 渐进加载器按优先级加载 Skill
5. Skill 能够转换为工具并注册到工具系统
6. 前后端集成测试通过
