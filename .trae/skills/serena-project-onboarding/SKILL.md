---
name: "serena-project-onboarding"
description: "Onboard new projects with Serena MCP. Invoke when starting work on a new project or when user wants to understand project structure and setup."
---

# Serena Project Onboarding

This skill guides the process of onboarding and understanding a new project using Serena MCP tools.

## When to Invoke

Invoke this skill when:
- User starts working on a new project
- User wants to understand project structure
- User asks "help me understand this codebase"
- User needs project documentation
- User wants to set up project memory

## Onboarding Workflow

### Step 1: Check Onboarding Status

```python
check_onboarding_performed()
```

If not performed, call `onboarding()` to get instructions.

### Step 2: Activate Project

```python
activate_project(project="project_name_or_path")
```

### Step 3: Get Initial Instructions

```python
initial_instructions()
```

This returns the Serena Instructions Manual with essential usage information.

### Step 4: Explore Project Structure

```python
# List root directory
list_dir(relative_path=".", recursive=False)

# List source directory
list_dir(relative_path="src", recursive=True)

# Find configuration files
find_file(file_mask="*.json", relative_path=".")
find_file(file_mask="*.yaml", relative_path=".")
find_file(file_mask="*.toml", relative_path=".")
```

### Step 5: Identify Entry Points

```python
# Find main files
find_file(file_mask="main.py", relative_path=".")
find_file(file_mask="index.js", relative_path=".")
find_file(file_mask="app.py", relative_path=".")

# Get overview of entry points
get_symbols_overview(relative_path="main.py", depth=1)
get_symbols_overview(relative_path="app.py", depth=1)
```

### Step 6: Analyze Key Modules

```python
# Find all classes
find_symbol(name_path_pattern="*", include_kinds=[5])  # 5 = Class

# Find all functions
find_symbol(name_path_pattern="*", include_kinds=[12])  # 12 = Function

# Get structure of key files
for file in key_files:
    get_symbols_overview(relative_path=file, depth=1)
```

### Step 7: Create Project Memory

```python
write_memory(
    memory_file_name="project_overview.md",
    content="""# Project Overview

## Project Name
[Project name]

## Technology Stack
- Language: [Python/JavaScript/etc.]
- Framework: [Django/React/etc.]
- Database: [PostgreSQL/MongoDB/etc.]

## Directory Structure
[src/]
  - [module1/]: [description]
  - [module2/]: [description]

## Key Components
- [Component1]: [description]
- [Component2]: [description]

## Entry Points
- [main.py]: Main application entry
- [api.py]: API endpoints

## Important Patterns
- [Pattern1]: [description]
- [Pattern2]: [description]
"""
)
```

## Complete Onboarding Script

```python
def onboard_project():
    # 1. Check if already onboarded
    check_onboarding_performed()
    
    # 2. Get instructions
    initial_instructions()
    
    # 3. Explore structure
    root_structure = list_dir(relative_path=".", recursive=False)
    
    # 4. Find config files
    configs = find_file(file_mask="*.json", relative_path=".")
    
    # 5. Find entry points
    main_files = find_file(file_mask="main.*", relative_path=".")
    app_files = find_file(file_mask="app.*", relative_path=".")
    
    # 6. Analyze entry points
    for entry in main_files + app_files:
        get_symbols_overview(relative_path=entry, depth=1)
    
    # 7. Find key symbols
    classes = find_symbol(name_path_pattern="*", include_kinds=[5])
    
    # 8. Think about findings
    think_about_collected_information()
    
    # 9. Write memory
    write_memory(memory_file_name="project_overview.md", content="...")
```

## Memory Templates

### Project Overview Memory

```markdown
# Project Overview

## Basic Info
- Name: [Project Name]
- Description: [Brief description]
- Version: [Version]

## Tech Stack
- Language: [Primary language]
- Framework: [Framework name]
- Build Tool: [Build tool]
- Package Manager: [npm/pip/etc.]

## Architecture
[High-level architecture description]

## Directory Structure
```
project/
├── src/
│   ├── api/
│   ├── models/
│   └── services/
├── tests/
└── config/
```

## Key Files
- [file1]: [purpose]
- [file2]: [purpose]

## Entry Points
- [entry1]: [description]
- [entry2]: [description]
```

### Module Documentation Memory

```markdown
# Module: [Module Name]

## Purpose
[What this module does]

## Components
- [Class1]: [description]
- [Function1]: [description]

## Dependencies
- [Dependency1]
- [Dependency2]

## Usage Examples
[Code examples]
```

### API Documentation Memory

```markdown
# API Documentation

## Endpoints

### [Endpoint Name]
- Method: [GET/POST/etc.]
- Path: [/api/path]
- Description: [What it does]
- Parameters: [List of parameters]
- Response: [Response format]
```

## Onboarding Checklist

- [ ] Check onboarding status
- [ ] Get initial instructions
- [ ] List project structure
- [ ] Identify configuration files
- [ ] Find entry points
- [ ] Analyze key modules
- [ ] Identify technology stack
- [ ] Document key patterns
- [ ] Create project memory
- [ ] List available memories

## Best Practices

1. **Be thorough**: Don't skip exploration steps
2. **Document findings**: Use `write_memory` for important discoveries
3. **Think periodically**: Call `think_about_collected_information`
4. **Start broad**: Understand overall structure before diving deep
5. **Identify patterns**: Look for coding conventions and patterns

## Common Onboarding Tasks

| Task | Tool | Purpose |
|------|------|---------|
| Check status | `check_onboarding_performed` | Avoid duplicate work |
| Get instructions | `initial_instructions` | Learn tool usage |
| Explore structure | `list_dir` | Understand layout |
| Find files | `find_file` | Locate key files |
| Analyze code | `get_symbols_overview` | Understand symbols |
| Save knowledge | `write_memory` | Persist findings |
| List memories | `list_memories` | See available docs |

## Important Notes

- Always call `check_onboarding_performed()` first
- Use `write_memory` to persist important project knowledge
- Memories are shared across conversations
- Use descriptive memory file names
- Update memories when project changes
