---
name: "serena-code-analysis"
description: "Analyze code structure and relationships using Serena MCP. Invoke when user needs to understand code dependencies, trace call graphs, or analyze code architecture."
---

# Serena Code Analysis

This skill provides comprehensive guidance for analyzing code structure, relationships, and architecture using Serena MCP tools.

## When to Invoke

Invoke this skill when:
- User wants to understand code dependencies
- User needs to trace function call chains
- User asks about code architecture
- User wants to analyze code complexity
- User asks "how does X work?" or "what depends on Y?"

## Analysis Tools Overview

### 1. Symbol Analysis

**`find_symbol`** - Get symbol details and structure

```python
# Get class with all methods
find_symbol(
    name_path_pattern="UserService",
    depth=2,
    include_body=False
)

# Get specific method signature
find_symbol(
    name_path_pattern="UserService/login",
    include_body=True
)

# Find all classes in a module
find_symbol(
    name_path_pattern="*Service",
    substring_matching=True,
    relative_path="src/services"
)
```

### 2. Dependency Analysis

**`find_referencing_symbols`** - Find what uses a symbol

```python
# Find all callers of a function
find_referencing_symbols(
    name_path="utils/helper",
    relative_path="src/utils/helper.py"
)

# Find all subclasses
find_referencing_symbols(
    name_path="BaseModel",
    relative_path="src/models/base.py"
)

# Find all implementations of an interface
find_referencing_symbols(
    name_path="IRepository",
    relative_path="src/interfaces/repository.py"
)
```

### 3. Pattern Analysis

**`search_for_pattern`** - Find patterns across codebase

```python
# Find all async functions
search_for_pattern(
    substring_pattern="async def ",
    restrict_search_to_code_files=True
)

# Find all exception handling
search_for_pattern(
    substring_pattern="except.*:",
    context_lines_after=2
)

# Find all imports of a module
search_for_pattern(
    substring_pattern="from models import|import models"
)

# Find all TODO/FIXME
search_for_pattern(
    substring_pattern="(TODO|FIXME|XXX):.*"
)
```

### 4. Structure Analysis

**`get_symbols_overview`** - Analyze file structure

```python
# Get file structure with methods
get_symbols_overview(
    relative_path="src/services/user.py",
    depth=1
)

# Compare multiple files
for file in ["models.py", "services.py", "controllers.py"]:
    get_symbols_overview(relative_path=f"src/{file}")
```

## Analysis Workflows

### Workflow 1: Trace Call Chain

```
1. find_symbol(name_path_pattern="entryPoint")  # Start point
2. find_referencing_symbols(name_path="entryPoint")  # Who calls it
3. For each caller, recursively find its callers
4. Build the call graph
```

### Workflow 2: Understand Dependencies

```
1. find_symbol(name_path_pattern="TargetClass", depth=1)  # Get class structure
2. search_for_pattern(substring_pattern="import TargetClass|from.*TargetClass")  # Find imports
3. find_referencing_symbols() for key methods  # Find usages
4. think_about_collected_information()  # Synthesize findings
```

### Workflow 3: Analyze Module Architecture

```
1. list_dir(relative_path="src/module", recursive=True)  # File structure
2. get_symbols_overview for each key file  # Symbol structure
3. search_for_pattern(substring_pattern="class.*:", relative_path="src/module")  # All classes
4. find_referencing_symbols for main classes  # Dependencies
```

### Workflow 4: Find Dead Code

```
1. find_symbol(name_path_pattern="*")  # Get all symbols
2. For each symbol, find_referencing_symbols()
3. Symbols with no references might be dead code
4. Verify with search_for_pattern for dynamic usage
```

### Workflow 5: Impact Analysis

```
1. find_symbol(name_path_pattern="targetSymbol")  # Locate symbol
2. find_referencing_symbols()  # Direct references
3. For each reference, find_referencing_symbols() again  # Indirect references
4. Build impact tree
```

## Analysis Patterns

### Pattern: Find All Implementations

```python
# Step 1: Find the interface/base
find_symbol(name_path_pattern="IRepository")

# Step 2: Find all references
find_referencing_symbols(
    name_path="IRepository",
    relative_path="src/interfaces/repository.py"
)

# Step 3: Filter for implementations (classes that inherit/implement)
```

### Pattern: Analyze Class Hierarchy

```python
# Step 1: Find base class
base = find_symbol(name_path_pattern="BaseModel", depth=1)

# Step 2: Find all subclasses
subclasses = find_referencing_symbols(
    name_path="BaseModel",
    relative_path="src/models/base.py"
)

# Step 3: For each subclass, get its structure
for subclass in subclasses:
    find_symbol(name_path_pattern=subclass.name, depth=1)
```

### Pattern: Find Circular Dependencies

```python
# Step 1: Get all imports
imports = search_for_pattern(substring_pattern="^import |^from ")

# Step 2: Build dependency graph
# Step 3: Detect cycles
```

### Pattern: Code Metrics

```python
# Count classes
classes = search_for_pattern(substring_pattern="^class ")

# Count functions
functions = search_for_pattern(substring_pattern="^def |^async def ")

# Count lines of code (approximate)
# Use list_dir and file sizes
```

## Analysis Output Templates

### Dependency Report

```
## Dependency Analysis: [Symbol Name]

### Definition
- Location: [file:line]
- Type: [class/function/variable]

### Direct Dependencies (What it uses)
- [symbol1] from [file1]
- [symbol2] from [file2]

### Direct Dependents (What uses it)
- [symbol1] in [file1:line]
- [symbol2] in [file2:line]

### Indirect Impact
- [List of files that might be affected]
```

### Architecture Overview

```
## Module: [Module Name]

### File Structure
[List files and their purposes]

### Key Classes
- [Class1]: [Brief description]
- [Class2]: [Brief description]

### External Dependencies
- [External module/package]

### Internal Dependencies
- [Internal module]

### Entry Points
- [Function/Class that serves as entry point]
```

## Best Practices

1. **Start with overview**: Use `get_symbols_overview` before deep diving
2. **Use depth wisely**: Only request needed depth (0, 1, or 2)
3. **Context matters**: Use `context_lines_before/after` for pattern search
4. **Think periodically**: Call `think_about_collected_information` during analysis
5. **Document findings**: Use `write_memory` for important discoveries

## Common Analysis Tasks

| Task | Primary Tool | Supporting Tools |
|------|--------------|------------------|
| Find callers | `find_referencing_symbols` | `find_symbol` |
| Find callees | `find_symbol` with body | Manual parsing |
| Find implementations | `find_referencing_symbols` | `find_symbol` |
| Find imports | `search_for_pattern` | `list_dir` |
| Analyze structure | `get_symbols_overview` | `find_symbol` |
| Find patterns | `search_for_pattern` | Context parameters |

## Important Notes

- Always use `relative_path` from project root
- Symbol analysis is language-aware (LSP-based)
- Use `restrict_search_to_code_files=True` for code-only search
- Call `think_about_collected_information` after analysis sequences
- Store important findings in memory using `write_memory`
