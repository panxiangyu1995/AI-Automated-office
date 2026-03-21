# Token 优化机制

## 概述

CLI-Anything 通过多种机制显著减少 AI Agent 与工具交互时的 Token 消耗，提高交互效率。本章详细分析这些优化策略及其在 AI-Automated-office 项目中的应用。

## Token 消耗对比

### 传统方式 vs CLI-Anything

#### 场景：图像模糊处理

**传统自然语言方式**：
```
用户: 帮我把这张图片做模糊处理

Agent: 好的，我需要使用 GIMP 来处理这张图片。首先，我需要知道：
1. 图片的路径是什么？
2. 你想要什么程度的模糊？
3. 输出格式是什么？

用户: 图片在 /home/user/image.png，模糊程度中等，输出 PNG 格式

Agent: 好的，我将执行以下步骤：
1. 打开 GIMP 应用程序
2. 通过文件菜单打开图片 /home/user/image.png
3. 选择滤镜菜单
4. 选择模糊子菜单
5. 选择高斯模糊
6. 在弹出的对话框中设置半径为 5 像素
7. 点击确定应用滤镜
8. 选择文件菜单中的导出
9. 选择 PNG 格式
10. 保存到 /home/user/output.png

[Agent 尝试自动化操作，可能失败...]

Agent: 抱歉，自动化操作失败了。你能手动执行这些步骤吗？

（Token 消耗：约 500+ tokens，且可能失败）
```

**CLI-Anything 方式**：
```
用户: 帮我把这张图片做模糊处理

Agent: [读取 SKILL.md，理解可用命令]

Agent: 我将使用以下命令处理：
cli-anything-gimp project new -o temp.json
cli-anything-gimp layer import 0 /home/user/image.png
cli-anything-gimp filter apply blur --radius 5
cli-anything-gimp export render /home/user/output.png

[执行成功]

Agent: 处理完成，输出已保存到 /home/user/output.png

（Token 消耗：约 50 tokens，成功率 100%）
```

### Token 节省分析

| 操作类型 | 传统方式 | CLI-Anything | 节省比例 |
|---------|---------|--------------|---------|
| 简单操作 | 100-200 | 20-30 | 70-85% |
| 中等操作 | 300-500 | 30-50 | 85-90% |
| 复杂操作 | 500-1000 | 50-80 | 90-95% |
| 批量操作 | 1000+ | 100-200 | 80-90% |

## 核心优化策略

### 1. 结构化输出

#### JSON vs 自然语言

**自然语言输出**：
```
项目信息：
名称是 my_project
有 3 个轨道
第一个轨道叫 voice，音量是 0.8
第二个轨道叫 music，音量是 0.5
第三个轨道叫 effects，音量是 0.6
总时长是 180 秒
采样率是 44100 Hz
...
（约 150 tokens）
```

**JSON 输出**：
```json
{
  "name": "my_project",
  "tracks": [
    {"name": "voice", "volume": 0.8},
    {"name": "music", "volume": 0.5},
    {"name": "effects", "volume": 0.6}
  ],
  "duration": 180,
  "sample_rate": 44100
}
（约 50 tokens，节省 67%）
```

#### 实现机制

```python
def output(data, message: str = ""):
    if _json_output:
        # JSON 输出：紧凑、结构化
        click.echo(json.dumps(data, indent=2, default=str))
    else:
        # 人类可读：详细、友好
        if message:
            click.echo(message)
        _print_formatted(data)
```

### 2. 命令分组

#### 功能域划分

将命令按逻辑域组织，减少搜索范围：

```
项目相关命令:
  project new
  project open
  project save
  project info

轨道相关命令:
  track add
  track remove
  track list
  track set

效果相关命令:
  effect list-available
  effect add
  effect remove
  effect set
```

#### Agent 搜索优化

```
传统方式：
Agent 需要在所有命令中搜索 → O(n)

分组方式：
Agent 先确定功能域 → O(log n)
然后在域内搜索 → O(m), m << n
总复杂度 → O(log n + m)
```

### 3. 自描述接口

#### --help 即时文档

```bash
$ cli-anything-audacity effect --help
Usage: cli-anything-audacity effect [OPTIONS] COMMAND [ARGS]...

  Effect management commands.

Commands:
  list-available  List all available effects
  info            Show details about an effect
  add             Add an effect to a track
  remove          Remove an effect by index
  set             Set an effect parameter
  list            List effects on a track
```

**优势**：
- 无需预加载完整文档
- 按需获取信息
- 减少初始上下文

#### 分层帮助系统

```
Level 1: cli-anything-audacity --help
         → 显示所有命令组

Level 2: cli-anything-audacity effect --help
         → 显示 effect 组的所有命令

Level 3: cli-anything-audacity effect add --help
         → 显示 add 命令的详细参数
```

### 4. 状态管理

#### Session 机制

避免重复传输完整状态：

```python
# 传统方式：每次都传输完整状态
{
  "project": {...完整项目数据...},
  "operation": "add_track",
  "params": {...}
}
（每次传输约 5000 tokens）

# Session 方式：只传输变更
{
  "operation": "add_track",
  "params": {"name": "new_track"}
}
（每次传输约 20 tokens）
```

#### 状态持久化

```python
# 项目状态保存在文件中
project.json

# Agent 只需引用文件路径
cli-anything-audacity --project project.json track add --name "voice"
```

### 5. 参数验证前置

#### 本地验证 vs 远程验证

```python
# 在 CLI 中进行参数验证
def add_track(project: dict, name: str, volume: float = 1.0):
    # 本地验证，避免无效请求
    if volume < 0 or volume > 2:
        raise ValueError(f"Volume must be 0-2, got {volume}")
    
    # 执行操作
    track = {"name": name, "volume": volume, ...}
    project["tracks"].append(track)
    return track
```

**Token 节省**：
- 无效请求立即被拒绝
- 避免远程调用开销
- 错误信息简洁明了

## 上下文管理策略

### 1. 最小必要上下文

Agent 只加载必要的上下文：

```
初始状态:
┌─────────────────────────────────┐
│  Agent 只知道 CLI 名称           │
│  cli-anything-audacity          │
└─────────────────────────────────┘
           ↓
第一次交互:
┌─────────────────────────────────┐
│  Agent 读取 SKILL.md            │
│  了解基本功能和命令结构          │
└─────────────────────────────────┘
           ↓
按需加载:
┌─────────────────────────────────┐
│  Agent 使用 --help 获取详细参数  │
│  只在需要时加载特定命令的文档    │
└─────────────────────────────────┘
```

### 2. 缓存策略

```python
class AgentContext:
    def __init__(self):
        self._skill_cache = {}      # SKILL.md 缓存
        self._help_cache = {}       # --help 输出缓存
        self._project_cache = {}    # 项目状态缓存
    
    def get_skill(self, cli_name: str) -> Skill:
        """获取 Skill，带缓存"""
        if cli_name not in self._skill_cache:
            self._skill_cache[cli_name] = self._load_skill(cli_name)
        return self._skill_cache[cli_name]
    
    def get_help(self, cli_name: str, command: str) -> str:
        """获取帮助，带缓存"""
        key = f"{cli_name}:{command}"
        if key not in self._help_cache:
            result = subprocess.run(
                [cli_name, command, "--help"],
                capture_output=True, text=True
            )
            self._help_cache[key] = result.stdout
        return self._help_cache[key]
```

### 3. 增量更新

```python
# 只传输变更部分
def update_project(project_path: str, changes: dict):
    """增量更新项目"""
    project = load_project(project_path)
    
    # 应用变更
    for path, value in changes.items():
        set_nested_value(project, path, value)
    
    # 只返回变更确认
    return {"updated": list(changes.keys())}
```

## AI-Automated-office 集成方案

### 1. 插件 Skill 注册

```yaml
# plugin-registry.yaml
plugins:
  - name: image-processor
    cli: cli-anything-gimp
    skill_file: skills/SKILL.md
    context_priority: high
    
  - name: audio-editor
    cli: cli-anything-audacity
    skill_file: skills/SKILL.md
    context_priority: medium
```

### 2. Agent 上下文管理

```python
class PluginContextManager:
    """管理插件的上下文加载"""
    
    def __init__(self):
        self.loaded_skills = {}
        self.active_plugins = set()
    
    def load_plugin_skill(self, plugin_name: str) -> Skill:
        """按需加载插件 Skill"""
        if plugin_name not in self.loaded_skills:
            skill_path = self._find_skill_file(plugin_name)
            self.loaded_skills[plugin_name] = self._parse_skill(skill_path)
        return self.loaded_skills[plugin_name]
    
    def get_available_commands(self, plugin_name: str) -> list:
        """获取插件的可用命令"""
        skill = self.load_plugin_skill(plugin_name)
        return skill.command_groups
    
    def estimate_token_cost(self, command: str) -> int:
        """估算命令的 Token 成本"""
        # 基于命令复杂度估算
        base_cost = 10
        param_cost = command.count("--") * 5
        return base_cost + param_cost
```

### 3. 智能命令生成

```python
class CommandGenerator:
    """智能生成 CLI 命令"""
    
    def generate_command(self, intent: str, context: dict) -> str:
        """根据意图生成命令"""
        # 1. 分析意图
        action, target, params = self._parse_intent(intent)
        
        # 2. 匹配命令
        command = self._match_command(action, target)
        
        # 3. 生成参数
        args = self._generate_args(params)
        
        # 4. 组装命令
        return f"{context['cli']} {command} {args}"
    
    def _parse_intent(self, intent: str) -> tuple:
        """解析用户意图"""
        # 使用 NLP 或规则匹配
        # 返回 (action, target, params)
        pass
```

### 4. Token 预算管理

```python
class TokenBudgetManager:
    """管理 Token 预算"""
    
    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens
        self.used_tokens = 0
    
    def can_execute(self, estimated_cost: int) -> bool:
        """检查是否有足够预算"""
        return self.used_tokens + estimated_cost <= self.max_tokens
    
    def execute_with_budget(self, command: str, budget: int) -> dict:
        """在预算内执行命令"""
        if not self.can_execute(budget):
            raise TokenBudgetExceeded()
        
        result = subprocess.run(
            command.split(),
            capture_output=True, text=True
        )
        
        actual_cost = self._count_tokens(result.stdout)
        self.used_tokens += actual_cost
        
        return {
            "output": result.stdout,
            "tokens_used": actual_cost,
            "remaining_budget": self.max_tokens - self.used_tokens
        }
```

## 性能优化技巧

### 1. 批量操作

```bash
# 单个操作（多次调用）
cli-anything-gimp layer add --name layer1
cli-anything-gimp layer add --name layer2
cli-anything-gimp layer add --name layer3
（3 次调用，约 90 tokens）

# 批量操作（一次调用）
cli-anything-gimp layer add-batch --names layer1,layer2,layer3
（1 次调用，约 30 tokens）
```

### 2. 预设模板

```python
# 定义常用操作模板
TEMPLATES = {
    "blur_image": [
        "project new -o temp.json",
        "layer import 0 {input}",
        "filter apply blur --radius {radius}",
        "export render {output}"
    ],
    "normalize_audio": [
        "project new -o temp.json",
        "track add --name main",
        "clip add 0 {input}",
        "effect add normalize --track 0",
        "export render {output}"
    ]
}

def apply_template(template_name: str, params: dict) -> list:
    """应用模板生成命令序列"""
    template = TEMPLATES[template_name]
    return [cmd.format(**params) for cmd in template]
```

### 3. 并行执行

```python
import asyncio

async def execute_parallel(commands: list) -> list:
    """并行执行多个独立命令"""
    tasks = [execute_command(cmd) for cmd in commands]
    return await asyncio.gather(*tasks)

# 示例：并行处理多个文件
commands = [
    "cli-anything-gimp --project p1.json export render out1.png",
    "cli-anything-gimp --project p2.json export render out2.png",
    "cli-anything-gimp --project p3.json export render out3.png",
]
results = await execute_parallel(commands)
```

## 监控与分析

### Token 使用追踪

```python
class TokenTracker:
    """追踪 Token 使用情况"""
    
    def __init__(self):
        self.history = []
    
    def record(self, operation: str, tokens: int, success: bool):
        """记录 Token 使用"""
        self.history.append({
            "timestamp": datetime.now(),
            "operation": operation,
            "tokens": tokens,
            "success": success
        })
    
    def get_statistics(self) -> dict:
        """获取统计信息"""
        total = sum(h["tokens"] for h in self.history)
        success_rate = sum(1 for h in self.history if h["success"]) / len(self.history)
        
        return {
            "total_tokens": total,
            "operation_count": len(self.history),
            "success_rate": success_rate,
            "avg_tokens_per_operation": total / len(self.history)
        }
```

### 优化建议生成

```python
def generate_optimization_suggestions(tracker: TokenTracker) -> list:
    """生成优化建议"""
    suggestions = []
    
    stats = tracker.get_statistics()
    
    if stats["avg_tokens_per_operation"] > 100:
        suggestions.append({
            "type": "batch_operations",
            "message": "考虑使用批量操作减少调用次数"
        })
    
    if stats["success_rate"] < 0.9:
        suggestions.append({
            "type": "error_handling",
            "message": "优化参数验证，减少失败重试"
        })
    
    return suggestions
```

## 总结

CLI-Anything 的 Token 优化策略：

| 策略 | 节省比例 | 实现复杂度 |
|------|---------|-----------|
| 结构化输出 | 50-70% | 低 |
| 命令分组 | 20-30% | 低 |
| 自描述接口 | 30-50% | 低 |
| 状态管理 | 60-80% | 中 |
| 参数验证 | 10-20% | 低 |

**综合优化效果**：70-95% 的 Token 节省

对于 AI-Automated-office 项目，这些策略可以直接应用于插件系统，显著提升 Agent 与插件交互的效率。
