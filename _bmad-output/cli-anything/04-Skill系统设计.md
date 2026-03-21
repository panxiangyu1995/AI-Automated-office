# Skill 系统设计

## 概述

Skill 系统是 CLI-Anything 连接 AI Agent 的关键桥梁。通过 SKILL.md 文件，AI Agent 能够自动发现、理解并使用 CLI 的全部功能，无需人工编写复杂的集成代码。

## 设计理念

### 问题背景

传统工具集成面临的问题：

```
传统方式：
┌─────────────┐     需要人工编写      ┌─────────────┐
│  AI Agent   │ ──────────────────▶ │   工具 API  │
└─────────────┘                     └─────────────┘
      │                                    │
      │ 1. 阅读文档                        │
      │ 2. 理解接口                        │
      │ 3. 编写调用代码                    │
      │ 4. 处理错误                        │
      │ 5. 维护更新                        │
      └────────────────────────────────────┘
                    高成本、易出错
```

### Skill 系统解决方案

```
Skill 方式：
┌─────────────┐     自动发现/理解      ┌─────────────┐
│  AI Agent   │ ◀──────────────────▶ │  SKILL.md   │
└─────────────┘                       └─────────────┘
      │                                     │
      │ 1. 读取 SKILL.md                    │
      │ 2. 自动理解功能                     │
      │ 3. 生成命令调用                     │
      └─────────────────────────────────────┘
                    零成本、自动化
```

## SKILL.md 规范

### 文件结构

```markdown
---
name: cli-anything-<software>
description: 简短描述 CLI 的功能
---

# cli-anything-<software>

<详细介绍>

## Installation

<安装说明>

## Usage

<基本用法>

## Command Groups

<命令分组文档>

## Examples

<使用示例>

## For AI Agents

<Agent 使用指南>
```

### YAML Frontmatter

```yaml
---
name: cli-anything-audacity
description: Command-line interface for Audacity - A stateful command-line interface for audio editing...
---
```

**字段说明**：
- `name`: CLI 命令名称（用于触发）
- `description`: 简短描述（用于发现和匹配）

### Markdown Body

#### 1. 安装部分

```markdown
## Installation

This CLI is installed as part of the cli-anything-audacity package:

```bash
pip install cli-anything-audacity
```

**Prerequisites:**
- Python 3.10+
- audacity must be installed on your system
- Install audacity: `apt install audacity`
```

#### 2. 基本用法

```markdown
## Usage

### Basic Commands

```bash
# Show help
cli-anything-audacity --help

# Start interactive REPL mode
cli-anything-audacity

# Create a new project
cli-anything-audacity project new -o project.json

# Run with JSON output (for agent consumption)
cli-anything-audacity --json project info -p project.json
```

### REPL Mode

When invoked without a subcommand, the CLI enters an interactive REPL session.
```

#### 3. 命令分组

```markdown
## Command Groups

### Project

Project management commands.

| Command | Description |
|---------|-------------|
| `new` | Create a new project |
| `open` | Open an existing project |
| `save` | Save the current project |
| `info` | Show project information |

### Track

Track management commands.

| Command | Description |
|---------|-------------|
| `add` | Add a new track |
| `remove` | Remove a track by index |
| `list` | List all tracks |
| `set` | Set a track property |
```

#### 4. 使用示例

```markdown
## Examples

### Create a New Project

Create a new audacity project file.

```bash
cli-anything-audacity project new -o myproject.json
# Or with JSON output for programmatic use
cli-anything-audacity --json project new -o myproject.json
```

### Export Project

Export the project to a final output format.

```bash
cli-anything-audacity --project myproject.json export render output.wav --overwrite
```
```

#### 5. Agent 使用指南

```markdown
## For AI Agents

When using this CLI programmatically:

1. **Always use `--json` flag** for parseable output
2. **Check return codes** - 0 for success, non-zero for errors
3. **Parse stderr** for error messages on failure
4. **Use absolute paths** for all file operations
5. **Verify outputs exist** after export operations

## State Management

The CLI maintains session state with:
- **Undo/Redo**: Up to 50 levels of history
- **Project persistence**: Save/load project state as JSON
- **Session tracking**: Track modifications and changes

## Output Formats

All commands support dual output modes:
- **Human-readable** (default): Tables, colors, formatted text
- **Machine-readable** (`--json` flag): Structured JSON for agent consumption
```

## 自动生成机制

### skill_generator.py

```python
"""
SKILL.md Generator for CLI-Anything

自动从 CLI-Anything harness 提取元数据并生成 SKILL.md 文件
"""

from dataclasses import dataclass, field
from pathlib import Path
import re

@dataclass
class CommandInfo:
    """CLI 命令信息"""
    name: str
    description: str

@dataclass
class CommandGroup:
    """命令分组"""
    name: str
    description: str
    commands: list[CommandInfo] = field(default_factory=list)

@dataclass
class Example:
    """使用示例"""
    title: str
    description: str
    code: str

@dataclass
class SkillMetadata:
    """Skill 元数据"""
    skill_name: str
    skill_description: str
    software_name: str
    skill_intro: str
    version: str
    system_package: Optional[str] = None
    command_groups: list[CommandGroup] = field(default_factory=list)
    examples: list[Example] = field(default_factory=list)
```

### 提取流程

```python
def extract_cli_metadata(harness_path: str) -> SkillMetadata:
    """从 CLI-Anything harness 目录提取元数据"""
    harness_path = Path(harness_path)
    
    # 1. 找到 cli_anything/<software> 目录
    cli_anything_dir = harness_path / "cli_anything"
    software_dirs = [d for d in cli_anything_dir.iterdir()
                     if d.is_dir() and (d / "__init__.py").exists()]
    software_dir = software_dirs[0]
    software_name = software_dir.name
    
    # 2. 从 README.md 提取介绍
    readme_path = software_dir / "README.md"
    if readme_path.exists():
        readme_content = readme_path.read_text(encoding="utf-8")
        skill_intro = extract_intro_from_readme(readme_content)
        system_package = extract_system_package(readme_content)
    
    # 3. 从 setup.py 提取版本
    setup_path = harness_path / "setup.py"
    if setup_path.exists():
        version = extract_version_from_setup(setup_path)
    
    # 4. 从 CLI 文件提取命令
    cli_file = software_dir / f"{software_name}_cli.py"
    if cli_file.exists():
        command_groups = extract_commands_from_cli(cli_file)
    
    # 5. 生成示例
    examples = generate_examples(software_name, command_groups)
    
    return SkillMetadata(
        skill_name=f"cli-anything-{software_name}",
        skill_description=f"Command-line interface for {software_name}...",
        software_name=software_name,
        skill_intro=skill_intro,
        version=version,
        system_package=system_package,
        command_groups=command_groups,
        examples=examples
    )
```

### 命令提取

从 Click CLI 文件提取命令信息：

```python
def extract_commands_from_cli(cli_file: Path) -> list[CommandGroup]:
    """从 CLI 文件提取命令分组"""
    content = cli_file.read_text(encoding="utf-8")
    groups = []
    
    # 匹配 @cli.group() 装饰的函数
    group_pattern = r'@cli\.group\(\)\s*\ndef\s+(\w+)\(\):\s*"""([^"]+)"""'
    for match in re.finditer(group_pattern, content):
        group_name = match.group(1)
        group_desc = match.group(2)
        
        group = CommandGroup(
            name=group_name.capitalize(),
            description=group_desc,
            commands=[]
        )
        
        # 匹配该分组下的命令
        cmd_pattern = rf'@{group_name}\.command\("(\w+)"\)[^"]*"""([^"]+)"""'
        for cmd_match in re.finditer(cmd_pattern, content, re.DOTALL):
            cmd_name = cmd_match.group(1)
            cmd_desc = cmd_match.group(2).strip().split('\n')[0]
            group.commands.append(CommandInfo(cmd_name, cmd_desc))
        
        groups.append(group)
    
    return groups
```

### 模板渲染

使用 Jinja2 模板生成 SKILL.md：

```python
from jinja2 import Template

SKILL_TEMPLATE = """---
name: >-
  {{ skill_name }}
description: >-
  {{ skill_description }}
---

# {{ skill_name }}

{{ skill_intro }}

## Installation

This CLI is installed as part of the cli-anything-{{ software_name }} package:

```bash
pip install cli-anything-{{ software_name }}
```

**Prerequisites:**
- Python 3.10+
- {{ software_name }} must be installed on your system
{% if system_package %}
- Install {{ software_name }}: `{{ system_package }}`
{% endif %}

## Usage

### Basic Commands

```bash
# Show help
cli-anything-{{ software_name }} --help

# Start interactive REPL mode
cli-anything-{{ software_name }}

# Create a new project
cli-anything-{{ software_name }} project new -o project.json

# Run with JSON output (for agent consumption)
cli-anything-{{ software_name }} --json project info -p project.json
```

{% if command_groups %}
## Command Groups

{% for group in command_groups %}
### {{ group.name }}

{{ group.description }}

| Command | Description |
|---------|-------------|
{% for cmd in group.commands %}
| `{{ cmd.name }}` | {{ cmd.description }} |
{% endfor %}

{% endfor %}
{% endif %}
"""

def generate_skill_file(harness_path: str) -> Path:
    """生成 SKILL.md 文件"""
    metadata = extract_cli_metadata(harness_path)
    
    template = Template(SKILL_TEMPLATE)
    content = template.render(**metadata.__dict__)
    
    # 写入文件
    skill_dir = Path(harness_path) / "cli_anything" / metadata.software_name / "skills"
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text(content, encoding="utf-8")
    
    return skill_path
```

## Agent 发现机制

### ReplSkin 集成

ReplSkin 自动检测并显示 SKILL.md 路径：

```python
class ReplSkin:
    def print_banner(self):
        """打印启动横幅，自动检测 SKILL.md"""
        # ... 横幅内容 ...
        
        # 检测 SKILL.md
        skill_path = self._find_skill_file()
        if skill_path:
            print(f"│  Skill: {skill_path}  │")
    
    def _find_skill_file(self) -> Optional[str]:
        """查找 SKILL.md 文件"""
        import importlib.resources
        try:
            # 在包内查找 skills/SKILL.md
            skills_dir = importlib.resources.files(
                f"cli_anything.{self.software}.skills"
            )
            skill_file = skills_dir / "SKILL.md"
            if skill_file.is_file():
                return str(skill_file)
        except (ImportError, TypeError):
            pass
        return None
```

### Agent 读取流程

```
1. Agent 启动 CLI
   ↓
2. ReplSkin 打印横幅，显示 SKILL.md 路径
   ↓
3. Agent 读取 SKILL.md
   ↓
4. 解析 YAML frontmatter 获取名称和描述
   ↓
5. 解析 Markdown body 获取命令列表
   ↓
6. Agent 理解 CLI 功能并生成命令
```

## 与 AI-Automated-office 集成

### 插件 Skill 定义

在 AI-Automated-office 的插件系统中，每个插件可以定义自己的 Skill：

```yaml
# plugin-manifest.yaml
name: image-processor
version: 1.0.0
skills:
  - name: cli-anything-gimp
    description: Image editing and processing
    cli_command: cli-anything-gimp
    skill_file: skills/SKILL.md
```

### Agent 调用流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-Automated-office Agent                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 用户请求: "帮我处理这张图片"                                  │
│     ↓                                                            │
│  2. Agent 分析请求，匹配到 image-processor 插件                  │
│     ↓                                                            │
│  3. 读取插件的 SKILL.md                                          │
│     ↓                                                            │
│  4. 理解可用命令:                                                │
│     - project new                                                │
│     - layer add                                                  │
│     - filter apply                                               │
│     - export render                                              │
│     ↓                                                            │
│  5. 生成命令序列:                                                │
│     cli-anything-gimp project new -o temp.json                   │
│     cli-anything-gimp layer import 0 input.png                   │
│     cli-anything-gimp filter apply blur --radius 5               │
│     cli-anything-gimp export render output.png                   │
│     ↓                                                            │
│  6. 执行命令并返回结果                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Token 优化示例

**传统方式**（需要详细描述）：
```
用户: 帮我处理这张图片
Agent: 我需要知道你有什么图片处理工具...
用户: 我有 GIMP
Agent: 好的，请告诉我 GIMP 的具体操作步骤...
用户: 你需要打开 GIMP，然后点击文件菜单...
（大量交互，消耗大量 Token）
```

**Skill 方式**（自动发现）：
```
用户: 帮我处理这张图片
Agent: [读取 SKILL.md]
Agent: 我可以使用 GIMP CLI 来处理。请告诉我你想要什么效果？
用户: 模糊处理
Agent: [执行命令]
       cli-anything-gimp --json filter apply blur --radius 5
（少量交互，节省 Token）
```

## 最佳实践

### 1. 保持 SKILL.md 更新

每次 CLI 功能变更时，重新生成 SKILL.md：

```bash
# 在 setup.py 中添加自动生成
python -c "from skill_generator import generate_skill_file; generate_skill_file('.')"
```

### 2. 提供丰富的示例

示例应该覆盖常见用例：

```markdown
## Examples

### Basic Image Editing
...

### Batch Processing
...

### Complex Workflow
...
```

### 3. 清晰的错误处理

在 Agent 指南中说明错误处理：

```markdown
## For AI Agents

### Error Handling

1. Check return code: 0 = success, non-zero = error
2. Parse stderr for error details
3. Common errors:
   - Software not installed: Provide installation instructions
   - Invalid parameters: Check parameter types and ranges
   - File not found: Verify file paths
```

### 4. 版本兼容性

记录版本要求和兼容性：

```markdown
## Version

1.0.0

### Compatibility

- Python: 3.10+
- Software: GIMP 2.10+
- OS: Linux, macOS, Windows (via Git Bash)
```

## 总结

Skill 系统的核心价值：

1. **自动化发现**：Agent 自动理解 CLI 功能
2. **标准化格式**：统一的 SKILL.md 规范
3. **自动生成**：从代码自动提取元数据
4. **Token 优化**：减少 Agent 与工具的交互成本

对于 AI-Automated-office 项目，Skill 系统提供了一种优雅的插件功能暴露机制，让 Agent 能够高效地发现和使用插件功能。
