---
name: "serena-code-navigation"
description: "Navigate and explore codebases using Serena MCP. Invoke when user needs to find symbols, search code, understand file structure, or explore project architecture."
---

# Serena Code Navigation

This skill provides comprehensive guidance for navigating and exploring codebases using Serena MCP tools.

## When to Invoke

Invoke this skill when:
- User asks to find a specific function, class, or symbol
- User wants to understand the project structure
- User needs to search for code patterns
- User wants to explore file relationships
- User asks "where is X defined?" or "where is X used?"

## Core Navigation Tools

### 1. Symbol Discovery

**`find_symbol`** - Find symbols by name pattern

```python
# Find a specific class
find_symbol(name_path_pattern="UserService")

# Find a method within a class
find_symbol(name_path_pattern="UserService/login")

# Find all methods matching a pattern
find_symbol(name_path_pattern="get*", substring_matching=True)

# Get symbol with its children (methods for a class)
find_symbol(name_path_pattern="MyClass", depth=1)
```

**Parameters:**
- `name_path_pattern`: Symbol name or path (e.g., "Class/method")
- `depth`: Include descendants (0=none, 1=children, 2=grandchildren)
- `include_body`: Include source code (use sparingly)
- `substring_matching`: Match partial names
- `relative_path`: Restrict search to specific file/directory

### 2. Reference Finding

**`find_referencing_symbols`** - Find where a symbol is used

```python
# Find all usages of a function
find_referencing_symbols(
    name_path="utils/helper",
    relative_path="src/utils/helper.py"
)

# Find callers of a method
find_referencing_symbols(
    name_path="UserService/login",
    relative_path="src/services/user.py"
)
```

### 3. File Structure Overview

**`get_symbols_overview`** - Get high-level view of a file

```python
# Quick overview of file structure
get_symbols_overview(relative_path="src/main.py")

# Include immediate children
get_symbols_overview(relative_path="src/main.py", depth=1)
```

### 4. Pattern Search

**`search_for_pattern`** - Search for arbitrary patterns

```python
# Search for TODO comments
search_for_pattern(substring_pattern="TODO.*")

# Search in specific directory
search_for_pattern(
    substring_pattern="async def.*",
    relative_path="src/api"
)

# Search with context
search_for_pattern(
    substring_pattern="class.*Exception",
    context_lines_before=2,
    context_lines_after=2
)
```

### 5. File System Navigation

**`list_dir`** - List directory contents

```python
# List root directory
list_dir(relative_path=".", recursive=False)

# Recursive listing
list_dir(relative_path="src", recursive=True)

# Skip ignored files
list_dir(relative_path=".", skip_ignored_files=True)
```

**`find_file`** - Find files by name/mask

```python
# Find by exact name
find_file(file_mask="config.py", relative_path=".")

# Find by pattern
find_file(file_mask="*.test.ts", relative_path="tests")
```

## Navigation Workflows

### Workflow 1: Understanding a New Codebase

```
1. list_dir(relative_path=".", recursive=False)  # See root structure
2. get_symbols_overview(relative_path="main.py")  # Check entry point
3. find_symbol(name_path_pattern="main", include_body=True)  # Read main function
4. find_referencing_symbols() for key functions  # Trace call graph
```

### Workflow 2: Finding Where a Function is Used

```
1. find_symbol(name_path_pattern="targetFunction")  # Locate the function
2. find_referencing_symbols(name_path="targetFunction", relative_path="path/to/file")
3. Review each reference with context
```

### Workflow 3: Exploring a Module

```
1. list_dir(relative_path="src/module", recursive=True)  # See files
2. get_symbols_overview for each key file
3. find_symbol with depth=1 for main classes
```

## Best Practices

1. **Start broad, then narrow**: Use `get_symbols_overview` before `find_symbol`
2. **Use relative_path**: Restrict searches for better performance
3. **Limit depth**: Only request needed depth (0, 1, or 2)
4. **Avoid include_body**: Only use when you need the actual code
5. **Use context lines**: Add context when searching patterns

## Common Patterns

| Task | Tool | Example |
|------|------|---------|
| Find class | `find_symbol` | `name_path_pattern="UserService"` |
| Find method | `find_symbol` | `name_path_pattern="UserService/login"` |
| Find usages | `find_referencing_symbols` | After finding symbol |
| File overview | `get_symbols_overview` | Quick structure check |
| Search text | `search_for_pattern` | Regex patterns |
| Find files | `find_file` | By name or mask |
| List directory | `list_dir` | Explore structure |

## Important Notes

- Always use `relative_path` from project root
- Symbol names are case-sensitive
- Use `substring_matching=True` for partial matches
- Call `think_about_collected_information` after navigation sequences
