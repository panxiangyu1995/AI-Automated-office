# Agent Harness 框架

## 概述

Agent Harness 是 CLI-Anything 的核心方法论，提供了一套标准操作流程（SOP），让 AI Agent 能够自动将任意 GUI 软件转换为功能完整的 CLI 接口。

## 7 阶段构建流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Harness Pipeline                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: 代码库分析                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 识别后端引擎 (MLT, GEGL, bpy 等)                        │   │
│  │ • 映射 GUI 操作到 API 调用                                 │   │
│  │ • 确定数据模型 (XML, JSON, binary)                        │   │
│  │ • 发现现有 CLI 工具                                       │   │
│  │ • 编目命令/撤销系统                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 2: CLI 架构设计                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 选择交互模型 (REPL / CLI / 双模式)                      │   │
│  │ • 定义命令分组                                            │   │
│  │ • 设计状态模型                                            │   │
│  │ • 规划输出格式                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 3: 功能实现                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 实现数据层 (XML/JSON 操作)                              │   │
│  │ • 添加探测/信息命令                                       │   │
│  │ • 添加变更命令                                            │   │
│  │ • 集成后端                                                │   │
│  │ • 添加渲染/导出                                           │   │
│  │ • 实现会话管理                                            │   │
│  │ • 添加 REPL 界面                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 4: 测试规划                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 创建 TEST.md                                            │   │
│  │ • 规划单元测试                                            │   │
│  │ • 规划 E2E 测试                                           │   │
│  │ • 设计工作流场景                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 5: 测试实现                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 实现 test_core.py (单元测试)                            │   │
│  │ • 实现 test_full_e2e.py (端到端测试)                      │   │
│  │ • 实现输出验证                                            │   │
│  │ • 实现 CLI 子进程测试                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 6: 测试文档                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 运行所有测试                                            │   │
│  │ • 记录测试结果                                            │   │
│  │ • 更新 TEST.md                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 6.5: SKILL.md 生成                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 提取 CLI 元数据                                         │   │
│  │ • 生成 SKILL.md 文件                                      │   │
│  │ • 包含到 Python 包中                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  Phase 7: 发布安装                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • 创建 setup.py                                           │   │
│  │ • 配置 entry_points                                       │   │
│  │ • 安装到 PATH                                             │   │
│  │ • (可选) 发布到 PyPI                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: 代码库分析

### 目标

深入理解目标软件的架构和操作机制。

### 分析步骤

1. **识别后端引擎**

大多数 GUI 软件将表示层与逻辑层分离：

| 软件 | 后端引擎 | 说明 |
|------|---------|------|
| Shotcut | MLT | 多媒体框架 |
| GIMP | GEGL | 图像处理库 |
| Blender | bpy | Python API |
| Audacity | PortAudio + libsndfile | 音频 I/O |
| LibreOffice | UNO | 组件框架 |

2. **映射 GUI 操作到 API**

将每个用户操作映射到对应的函数调用：

```
GUI 操作                    API 调用
────────────────────────────────────────────
File -> New              →  project_new()
File -> Open             →  project_open(path)
Edit -> Undo             →  session_undo()
Track -> Add New         →  track_add(name)
Effect -> Amplify        →  effect_add("amplify", params)
File -> Export           →  export_render(output, format)
```

3. **确定数据模型**

分析项目文件的格式和结构：

| 软件 | 项目格式 | 说明 |
|------|---------|------|
| GIMP | XCF (binary) | 需要通过 GEGL 操作 |
| Blender | .blend (binary) | 通过 bpy API |
| Audacity | .aup3 (SQLite) | 复杂数据库结构 |
| Shotcut | .mlt (XML) | 可直接操作 |
| Kdenlive | .kdenlive (XML) | 可直接操作 |

**策略选择**：
- 如果格式可直接操作 → 直接读写
- 如果格式复杂 → 使用 JSON 中间格式 + Backend 渲染

4. **发现现有 CLI 工具**

许多软件已提供 CLI 工具：

| 软件 | 现有 CLI | 用途 |
|------|---------|------|
| FFmpeg | `ffmpeg` | 音视频处理 |
| ImageMagick | `convert` | 图像转换 |
| SoX | `sox` | 音频处理 |
| Blender | `blender --python-expr` | 脚本执行 |
| LibreOffice | `soffice --headless` | 无头转换 |

5. **编目命令/撤销系统**

如果软件有撤销/重做功能，通常使用命令模式：

```
每个 GUI 操作对应一个 Command 对象：
- execute(): 执行操作
- undo(): 撤销操作
- redo(): 重做操作

这些 Command 就是 CLI 的操作单元
```

### 输出产物

创建软件特定的 SOP 文档（如 `AUDACITY.md`）：

```markdown
# Audacity: 项目特定分析 & SOP

## 架构摘要
[架构图和说明]

## CLI 策略
[JSON 项目格式 + Python stdlib]

## 项目格式
[JSON 结构定义]

## 命令映射
[GUI 操作 → CLI 命令映射表]

## 效果注册表
[可用效果和参数]

## 导出格式
[支持的输出格式]

## 渲染流水线
[渲染步骤说明]
```

## Phase 2: CLI 架构设计

### 交互模型选择

| 模型 | 适用场景 | 实现方式 |
|------|---------|---------|
| REPL 模式 | 交互式会话、需要上下文 | `invoke_without_command=True` |
| CLI 模式 | 脚本化、一次性操作 | 子命令结构 |
| 双模式 | 通用场景（推荐） | 两者结合 |

### 命令分组设计

按软件的逻辑域组织命令：

```python
# 标准命令分组
@click.group()
def project():    """项目管理命令"""
    
@click.group()
def track():      """轨道管理命令"""
    
@click.group()
def clip():       """片段管理命令"""
    
@click.group()
def effect():     """效果处理命令"""
    
@click.group()
def export():     """导出渲染命令"""
    
@click.group()
def session():    """会话管理命令"""
```

### 状态模型设计

定义需要持久化的状态：

```json
{
  "version": "1.0",
  "name": "project_name",
  "settings": {
    "sample_rate": 44100,
    "channels": 2
  },
  "tracks": [...],
  "selection": {...},
  "metadata": {...}
}
```

### 输出格式规划

双输出格式支持：

```python
def output(data, message: str = ""):
    if _json_output:
        click.echo(json.dumps(data, indent=2, default=str))
    else:
        if message:
            click.echo(message)
        if isinstance(data, dict):
            _print_dict(data)
        elif isinstance(data, list):
            _print_list(data)
```

## Phase 3: 功能实现

### 实现顺序

1. **数据层** → 2. **探测命令** → 3. **变更命令** → 4. **后端集成** → 5. **导出渲染** → 6. **会话管理** → 7. **REPL 界面**

### 数据层实现

```python
# core/project.py

def new_project(name: str = "untitled", **settings) -> dict:
    """创建新项目"""
    return {
        "version": "1.0",
        "name": name,
        "settings": {
            "sample_rate": settings.get("sample_rate", 44100),
            "bit_depth": settings.get("bit_depth", 16),
            "channels": settings.get("channels", 2),
        },
        "tracks": [],
        "labels": [],
        "selection": {"start": 0.0, "end": 0.0},
        "metadata": {},
    }

def save_project(project: dict, path: str) -> None:
    """保存项目到文件"""
    _locked_save_json(path, project, indent=2)

def open_project(path: str) -> dict:
    """打开项目文件"""
    with open(path, "r") as f:
        return json.load(f)
```

### 后端集成

```python
# utils/software_backend.py

def find_software() -> str:
    """查找软件可执行文件"""
    candidates = ["software", "/usr/bin/software", ...]
    for cmd in candidates:
        path = shutil.which(cmd)
        if path:
            return path
    raise RuntimeError(
        "Software not found. Install with:\n"
        "  Ubuntu: sudo apt install software\n"
        "  macOS: brew install software\n"
        "  Windows: winget install Software"
    )

def render_output(project_path: str, output_path: str, format: str):
    """调用软件渲染输出"""
    software = find_software()
    subprocess.run([
        software,
        "--headless",
        "--project", project_path,
        "--output", output_path,
        "--format", format,
    ], check=True)
```

### REPL 界面

```python
# 复制 repl_skin.py 到 utils/
from cli_anything.software.utils.repl_skin import ReplSkin

@cli.command()
@click.pass_context
def repl(ctx):
    """启动交互式 REPL 会话"""
    skin = ReplSkin("software", version="1.0.0")
    skin.print_banner()
    
    session = skin.create_prompt_session()
    
    while True:
        try:
            line = skin.get_input(
                session,
                project_name=current_project.get("name"),
                modified=session.is_modified()
            )
            # 解析并执行命令
            ...
        except EOFError:
            skin.print_goodbye()
            break
```

## Phase 4: 测试规划

### TEST.md 结构

```markdown
# Software CLI Harness - 测试文档

## 测试清单

| 文件 | 测试类 | 测试数量 | 焦点 |
|------|--------|---------|------|
| test_core.py | XX | XX | 单元测试 |
| test_full_e2e.py | XX | XX | E2E 测试 |

## 单元测试计划 (test_core.py)

### TestProject (XX tests)
- 创建项目（默认参数、自定义参数）
- 保存/打开往返
- 无效输入处理

### TestTracks (XX tests)
- 添加/删除轨道
- 属性设置
- 边界条件

...

## E2E 测试计划 (test_full_e2e.py)

### TestRealFiles (XX tests)
- 真实文件读写
- 格式验证
- 完整工作流

...

## 现实工作流场景

### 工作流 1: 完整编辑流程
**模拟**: 真实用户编辑任务
**操作链**: 创建项目 → 添加轨道 → 导入媒体 → 应用效果 → 导出
**验证**: 输出文件存在且格式正确
```

## Phase 5: 测试实现

### 单元测试 (test_core.py)

使用合成数据，无外部依赖：

```python
import pytest

class TestProject:
    def test_new_project_defaults(self):
        project = new_project()
        assert project["name"] == "untitled"
        assert project["settings"]["sample_rate"] == 44100
        
    def test_new_project_custom_name(self):
        project = new_project(name="my_project")
        assert project["name"] == "my_project"
        
    def test_invalid_sample_rate(self):
        with pytest.raises(ValueError):
            new_project(sample_rate=0)
```

### E2E 测试 (test_full_e2e.py)

使用真实文件和实际软件：

```python
class TestRealRender:
    def test_render_to_wav(self, tmp_path):
        # 创建项目
        project = new_project()
        track = add_track(project, name="test")
        add_clip(project, 0, "test_audio.wav")
        
        # 渲染
        output = tmp_path / "output.wav"
        render_project(project, str(output))
        
        # 验证
        assert output.exists()
        assert output.stat().st_size > 0
        
        # 验证格式
        with wave.open(str(output), "rb") as wav:
            assert wav.getnchannels() == 2
            assert wav.getframerate() == 44100
```

### CLI 子进程测试

```python
def _resolve_cli(name):
    """解析已安装的 CLI 命令"""
    import shutil
    path = shutil.which(name)
    if path:
        return [path]
    # 回退到开发模式
    module = name.replace("cli-anything-", "cli_anything.")
    return [sys.executable, "-m", module]

class TestCLISubprocess:
    CLI_BASE = _resolve_cli("cli-anything-software")
    
    def test_help(self):
        result = subprocess.run(
            self.CLI_BASE + ["--help"],
            capture_output=True, text=True
        )
        assert result.returncode == 0
        
    def test_json_output(self, tmp_path):
        output = tmp_path / "project.json"
        result = subprocess.run(
            self.CLI_BASE + ["--json", "project", "new", "-o", str(output)],
            capture_output=True, text=True
        )
        assert result.returncode == 0
        data = json.loads(result.stdout)
        assert "name" in data
```

## Phase 6: 测试文档

### 更新 TEST.md

运行测试后追加结果：

```markdown
## 测试结果

```
============================= test session starts ==============================
platform linux -- Python 3.13.11, pytest-9.0.2
collected 154 items

test_core.py   109 passed
test_full_e2e.py   45 passed

============================= 154 passed in 4.89s ==============================
```

## 覆盖率说明

- 所有核心功能已覆盖
- 边界条件已测试
- 错误处理已验证
```

## Phase 6.5: SKILL.md 生成

### 自动生成流程

```python
from skill_generator import generate_skill_file

skill_path = generate_skill_file(
    harness_path="/path/to/agent-harness"
)
# 输出: cli_anything/software/skills/SKILL.md
```

### 提取的信息

1. **软件名称和版本**（从 setup.py）
2. **命令分组**（从 CLI 文件的 Click 装饰器）
3. **文档内容**（从 README.md）
4. **系统依赖**（从 README.md 提取安装说明）

### 包配置

在 setup.py 中包含 SKILL.md：

```python
setup(
    ...
    package_data={
        "cli_anything.software": ["skills/*.md"],
    },
    include_package_data=True,
)
```

## Phase 7: 发布安装

### setup.py 模板

```python
from setuptools import setup, find_namespace_packages

setup(
    name="cli-anything-software",
    version="1.0.0",
    author="cli-anything contributors",
    description="CLI harness for Software",
    packages=find_namespace_packages(include=["cli_anything.*"]),
    python_requires=">=3.10",
    install_requires=[
        "click>=8.0.0",
        "prompt-toolkit>=3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cli-anything-software=cli_anything.software.software_cli:main",
        ],
    },
    package_data={
        "cli_anything.software": ["skills/*.md"],
    },
    include_package_data=True,
)
```

### 安装和测试

```bash
# 开发模式安装
pip install -e .

# 验证安装
cli-anything-software --help

# 运行测试
pytest -v

# 发布到 PyPI
python -m build
twine upload dist/*
```

## 最佳实践

### 1. 测试优先

在实现功能前先编写测试计划，确保覆盖完整。

### 2. 真实文件验证

E2E 测试必须使用真实文件和实际软件，验证输出有效性。

### 3. 错误信息友好

提供清晰的安装指引和错误提示：

```python
raise RuntimeError(
    "Software not found. Install with:\n"
    "  Ubuntu/Debian: sudo apt install software\n"
    "  macOS: brew install software\n"
    "  Windows: winget install Software"
)
```

### 4. 文档同步

SKILL.md、README.md 和 TEST.md 保持同步更新。

### 5. 版本控制

使用语义化版本号，记录变更历史。

## 总结

Agent Harness 框架提供了一套完整的、可重复的流程，让 AI Agent 能够自动为任意软件生成生产级 CLI 接口。关键特点：

1. **标准化流程**：7 个阶段确保一致性
2. **测试驱动**：完整的测试覆盖保证质量
3. **自动化生成**：SKILL.md 自动提取元数据
4. **可扩展**：适用于任意 GUI 软件
