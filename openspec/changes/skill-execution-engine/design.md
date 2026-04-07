# Design: Skill执行引擎完善

## 技术架构

### 1. 组件结构

```
SKILL.md File
     ↓
SkillParser (YAML解析)
     ↓
SkillDefinition (中间格式)
     ↓
     ├─→ SkillRegistry (注册)
     ├─→ SkillDiscoveryService (多源发现)
     ├─→ SkillLoader (渐进加载)
     └─→ SkillConverter (工具转换)
```

### 2. SKILL.md 格式

```yaml
---
name: code-review
description: 自动分析代码质量
version: "2.1.0"
author: AI-Automated-office
permissions:
  - type: tool
    names: ["file_read", "http_request"]
  - type: data
    scope: ["workspace"]
triggers:
  - type: keyword
    keywords: ["代码审查", "code review"]
  - type: intent
    intent: "analyze_code"
dependencies:
  - skill: document-writer
    version: ">=1.5.0"
capabilities:
  - code-analysis
  - security-scan
  - best-practice
---
# Skill Implementation
```

### 3. 核心模块

#### 3.1 SkillParser
- 解析 YAML frontmatter
- 验证必填字段
- 处理版本约束
- 转换依赖关系

#### 3.2 SkillRegistry
- Skill 注册和注销
- Skill 查询和过滤
- Skill 版本管理
- Skill 依赖解析

#### 3.3 SkillDiscoveryService
- 文件系统发现
- 插件发现
- 注册表发现
- 企业市场发现

#### 3.4 SkillLoader
- 优先级队列
- 依赖拓扑排序
- 加载进度追踪
- 错误恢复

#### 3.5 SkillConverter
- Skill → ToolDescriptor
- Skill → TriggerConfig
- Skill → Permission

## 实现细节

### 1. SKILL.md 解析器

```rust
pub struct SkillParser;

impl SkillParser {
    pub fn parse(content: &str) -> Result<SkillDefinition, SkillError> {
        // 1. 分离 frontmatter 和 content
        let (frontmatter, body) = Self::split_frontmatter(content)?;
        
        // 2. 解析 YAML
        let metadata: SkillMetadata = serde_yaml::from_str(&frontmatter)?;
        
        // 3. 验证必填字段
        Self::validate_required_fields(&metadata)?;
        
        // 4. 构建 SkillDefinition
        Ok(SkillDefinition {
            metadata,
            body: body.to_string(),
        })
    }
    
    fn validate_required_fields(meta: &SkillMetadata) -> Result<(), SkillError> {
        // 验证 name, version, description
        // 验证权限配置
        // 验证触发器配置
    }
}
```

### 2. Skill 注册表

```rust
pub struct SkillRegistry {
    skills: Arc<RwLock<HashMap<String, Arc<Skill>>>>,
    loader: Arc<SkillLoader>,
}

impl SkillRegistry {
    pub async fn register(&self, skill: Skill) -> Result<(), SkillError> {
        // 检查版本冲突
        // 解析依赖
        // 添加到注册表
        self.skills.write().await.insert(skill.id.clone(), Arc::new(skill));
        Ok(())
    }
    
    pub async fn list(&self) -> Vec<Skill> {
        let skills = self.skills.read().await;
        skills.values().map(|s| (*s).()).collect()
    }
}
```

### 3. 多源发现

```rust
pub enum SkillSource {
    FileSystem(PathBuf),
    Plugin(String),
    Registry,
    Marketplace(String),
}

pub struct SkillDiscoveryService {
    sources: Vec<SkillSource>,
}

impl SkillDiscoveryService {
    pub async fn discover_all(&self) -> Result<Vec<DiscoveredSkill>, SkillError> {
        let mut discovered = Vec::new();
        for source in &self.sources {
            let skills = self.discover_from_source(source).await?;
            discovered.extend(skills);
        }
        Ok(discovered)
    }
}
```

### 4. 工具转换器

```rust
pub struct SkillConverter;

impl SkillConverter {
    pub fn skill_to_tool(skill: &Skill) -> ToolDescriptor {
        ToolDescriptor {
            name: format!("skill_{}", skill.name),
            description: skill.description.clone(),
            input_schema: skill.parameters_schema.clone(),
            handler: skill.execution_handler.clone(),
        }
    }
    
    pub fn skill_to_trigger(skill: &Skill) -> TriggerConfig {
        TriggerConfig {
            mode: TriggerMode::Hybrid,
            keywords: skill.triggers.iter()
                .filter_map(|t| t.keyword.clone())
                .collect(),
            conditions: Vec::new(),
            priority: 5,
        }
    }
}
```

## API 设计

### Tauri 命令

```rust
#[tauri::command]
pub async fn skill_list() -> Result<Vec<Skill>, String>;

#[tauri::command]
pub async fn skill_get(skill_id: String) -> Result<Option<Skill>, String>;

#[tauri::command]
pub async fn skill_discover() -> Result<SkillDiscoveryResult, String>;

#[tauri::command]
pub async fn skill_register(skill: Skill) -> Result<(), String>;

#[tauri::command]
pub async fn skill_loading_progress() -> Result<LoadingProgress, String>;

#[tauri::command]
pub async fn skill_to_tool(skill_id: String) -> Result<ToolDescriptor, String>;
```

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| SKILL_001 | 无效的 SKILL.md 格式 | 返回解析错误详情 |
| SKILL_002 | 依赖缺失 | 提示安装依赖 |
| SKILL_003 | 版本冲突 | 提供版本选择 |
| SKILL_004 | 循环依赖 | 拒绝加载 |
| SKILL_005 | 加载超时 | 重试或降级 |
