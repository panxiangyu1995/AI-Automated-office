---
name: "serena-memory-management"
description: "Manage project knowledge with Serena MCP memory system. Invoke when user needs to store, retrieve, or update project knowledge across sessions."
---

# Serena Memory Management

This skill guides the use of Serena MCP's memory system for persisting and retrieving project knowledge.

## When to Invoke

Invoke this skill when:
- User wants to save important project information
- User needs to recall previously stored knowledge
- User wants to update existing documentation
- User asks about "memory" or "project knowledge"
- User wants to persist findings across sessions

## Memory Tools

### 1. Write Memory

**`write_memory`** - Store information for future sessions

```python
write_memory(
    memory_file_name="api_endpoints.md",
    content="""# API Endpoints

## User Endpoints
- GET /api/users - List all users
- POST /api/users - Create new user
- GET /api/users/:id - Get user by ID

## Authentication
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
"""
)
```

### 2. Read Memory

**`read_memory`** - Retrieve stored information

```python
read_memory(memory_file_name="api_endpoints.md")
```

### 3. List Memories

**`list_memories`** - See all available memories

```python
list_memories()
```

### 4. Edit Memory

**`edit_memory`** - Update existing memory content

```python
# Literal replacement
edit_memory(
    memory_file_name="api_endpoints.md",
    needle="GET /api/users - List all users",
    repl="GET /api/users - List all users (paginated)",
    mode="literal"
)

# Regex replacement
edit_memory(
    memory_file_name="api_endpoints.md",
    needle="## User Endpoints.*?(?=##|$)",
    repl="## User Endpoints\n- GET /api/users - List users\n- POST /api/users - Create user\n",
    mode="regex"
)
```

### 5. Delete Memory

**`delete_memory`** - Remove a memory file

```python
delete_memory(memory_file_name="outdated_info.md")
```

## Memory Use Cases

### Use Case 1: Project Architecture

```python
write_memory(
    memory_file_name="architecture.md",
    content="""# Architecture Overview

## System Design
[High-level system design]

## Components
- Frontend: React SPA
- Backend: FastAPI
- Database: PostgreSQL
- Cache: Redis

## Data Flow
[Description of data flow]

## Key Decisions
- Decision 1: [Reasoning]
- Decision 2: [Reasoning]
"""
)
```

### Use Case 2: Coding Conventions

```python
write_memory(
    memory_file_name="coding_conventions.md",
    content="""# Coding Conventions

## Naming
- Classes: PascalCase
- Functions: snake_case
- Constants: UPPER_SNAKE_CASE
- Variables: snake_case

## File Organization
- One class per file
- Tests in tests/ directory
- Config in config/ directory

## Documentation
- Docstrings for all public functions
- Type hints required
- README for each module
"""
)
```

### Use Case 3: API Documentation

```python
write_memory(
    memory_file_name="api_reference.md",
    content="""# API Reference

## Authentication
All API calls require Bearer token in Authorization header.

## Endpoints

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List users |
| POST | /api/users | Create user |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products |
| POST | /api/products | Create product |
"""
)
```

### Use Case 4: Troubleshooting Guide

```python
write_memory(
    memory_file_name="troubleshooting.md",
    content="""# Troubleshooting Guide

## Common Issues

### Database Connection Failed
- Check PostgreSQL is running
- Verify connection string in .env
- Check firewall rules

### Import Errors
- Run: pip install -r requirements.txt
- Check Python version compatibility
- Verify virtual environment is active

## Solutions Log
- [Date] Issue: [Description] - Solution: [Fix]
"""
)
```

### Use Case 5: Development Notes

```python
write_memory(
    memory_file_name="dev_notes.md",
    content="""# Development Notes

## Active Tasks
- [ ] Implement user authentication
- [ ] Add API rate limiting
- [x] Set up database migrations

## Known Issues
- Issue 1: [Description and workaround]
- Issue 2: [Description and workaround]

## Ideas
- Idea 1: [Description]
- Idea 2: [Description]

## References
- [Link to documentation]
- [Link to related issue]
"""
)
```

## Memory Workflow

### Creating New Memory

```
1. Identify information worth persisting
2. Choose descriptive file name
3. Write memory with structured content
4. Verify with list_memories()
```

### Updating Memory

```
1. read_memory(memory_file_name="...")
2. Identify what needs to change
3. edit_memory() with literal or regex mode
4. Verify with read_memory() again
```

### Using Memory in Tasks

```
1. list_memories() to see available memories
2. read_memory(memory_file_name="relevant_memory.md")
3. Use the information in current task
4. Update memory if new information discovered
```

## Memory Naming Conventions

| Memory Type | Naming Pattern | Example |
|-------------|----------------|---------|
| Architecture | `architecture.md` | System design docs |
| API Docs | `api_*.md` | `api_endpoints.md` |
| Conventions | `coding_conventions.md` | Style guides |
| Troubleshooting | `troubleshooting.md` | Issue solutions |
| Module Docs | `module_*.md` | `module_auth.md` |
| Dev Notes | `dev_notes.md` | Active work notes |

## Best Practices

1. **Be descriptive**: Use clear memory file names
2. **Structure content**: Use markdown headers and lists
3. **Keep updated**: Edit memories when information changes
4. **Don't duplicate**: Check existing memories before creating new ones
5. **Be concise**: Focus on essential information
6. **Use sections**: Organize with clear headers

## Memory Content Guidelines

### Good Memory Content
- Architecture decisions and reasoning
- API contracts and endpoints
- Coding conventions and patterns
- Troubleshooting solutions
- Important discoveries during analysis

### Avoid Storing
- Temporary information
- Sensitive data (keys, passwords)
- Information that changes frequently
- Information easily found in code

## Memory Management Checklist

- [ ] Check existing memories before creating new ones
- [ ] Use descriptive file names
- [ ] Structure content with markdown
- [ ] Update memories when information changes
- [ ] Delete outdated memories
- [ ] Reference memories in conversations

## Important Notes

- Memories persist across sessions
- Memories are project-specific
- Use `edit_memory` for updates instead of rewriting
- Delete outdated memories to avoid confusion
- Read relevant memories at the start of complex tasks
