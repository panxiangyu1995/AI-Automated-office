---
name: "serena-code-modification"
description: "Modify code safely using Serena MCP tools. Invoke when user needs to add, update, or delete code with proper symbol awareness and reference handling."
---

# Serena Code Modification

This skill guides safe and precise code modifications using Serena MCP's symbol-aware editing tools.

## When to Invoke

Invoke this skill when:
- User wants to add new code (functions, classes, methods)
- User needs to update existing code
- User wants to delete code safely
- User asks to "add", "update", "modify", or "change" code
- User needs precise code editing with reference awareness

## Modification Tools

### 1. Symbol Body Replacement

**`replace_symbol_body`** - Replace entire symbol implementation

```python
# Replace a function
replace_symbol_body(
    name_path="calculate_price",
    relative_path="src/utils/pricing.py",
    body='''def calculate_price(base: float, discount: float = 0) -> float:
    """Calculate final price with discount."""
    return base * (1 - discount)'''
)

# Replace a class method
replace_symbol_body(
    name_path="User/get_full_name",
    relative_path="src/models/user.py",
    body='''    def get_full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"'''
)
```

**Note:** Body includes the signature line but NOT docstrings/comments above it.

### 2. Code Insertion

**`insert_before_symbol`** - Insert code before a symbol

```python
# Add import at top of file
insert_before_symbol(
    name_path="first_symbol_in_file",
    relative_path="src/main.py",
    body="from typing import List, Optional\n\n"
)

# Add helper function before a class
insert_before_symbol(
    name_path="UserService",
    relative_path="src/services/user.py",
    body='''def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


'''
)

# Add decorator before function
insert_before_symbol(
    name_path="api_handler",
    relative_path="src/api/handlers.py",
    body="@login_required\n"
)
```

**`insert_after_symbol`** - Insert code after a symbol

```python
# Add new method after existing one
insert_after_symbol(
    name_path="User/save",
    relative_path="src/models/user.py",
    body='''

    def delete(self) -> bool:
        """Delete this user from database."""
        return db.delete(self.id)'''
)

# Add new class after existing class
insert_after_symbol(
    name_path="BaseModel",
    relative_path="src/models/base.py",
    body='''


class TimestampMixin:
    """Mixin for timestamp fields."""
    created_at: datetime
    updated_at: datetime'''
)
```

### 3. Content Replacement

**`replace_content`** - Replace content by pattern

```python
# Literal replacement
replace_content(
    relative_path="src/config.py",
    needle="DEBUG = True",
    repl="DEBUG = False",
    mode="literal"
)

# Regex replacement
replace_content(
    relative_path="src/api.py",
    needle="def old_endpoint\\(.*?\\):.*?return .*",
    repl="def new_endpoint() -> Response:\n    return Response({'status': 'ok'})",
    mode="regex"
)

# Replace with captured groups
replace_content(
    relative_path="src/utils.py",
    needle="def (\\w+)\\(self,(.*)\\):",
    repl="def $!1(self,$!2) -> Any:",
    mode="regex"
)

# Multiple occurrences
replace_content(
    relative_path="src/logger.py",
    needle="print\\(",
    repl="logger.info(",
    mode="regex",
    allow_multiple_occurrences=True
)
```

## Modification Workflows

### Workflow 1: Add a New Function

```
1. find_symbol(name_path_pattern="existing_function")  # Find insertion point
2. insert_after_symbol(
     name_path="existing_function",
     relative_path="...",
     body="def new_function():\n    ..."
   )
```

### Workflow 2: Update a Method

```
1. find_symbol(name_path_pattern="ClassName/methodName", include_body=True)
2. Review current implementation
3. replace_symbol_body(
     name_path="ClassName/methodName",
     relative_path="...",
     body="def methodName(self):\n    # new implementation"
   )
```

### Workflow 3: Add a Class Method

```
1. find_symbol(name_path_pattern="ClassName", depth=1)  # See existing methods
2. find_symbol(name_path_pattern="ClassName/lastMethod")  # Find last method
3. insert_after_symbol(
     name_path="ClassName/lastMethod",
     relative_path="...",
     body="\n    def new_method(self):\n        ..."
   )
```

### Workflow 4: Add Import Statement

```
1. get_symbols_overview(relative_path="target.py")  # Find first symbol
2. insert_before_symbol(
     name_path="first_symbol",
     relative_path="target.py",
     body="from typing import Optional\n"
   )
```

### Workflow 5: Update Multiple References

```
1. find_referencing_symbols(name_path="old_function")  # Find all usages
2. For each reference:
   - replace_content() to update the call
3. Consider if rename_symbol() is more appropriate
```

## Safe Modification Checklist

### Before Modifying

- [ ] Find the target symbol with `find_symbol`
- [ ] Check references with `find_referencing_symbols`
- [ ] Understand the context with `get_symbols_overview`
- [ ] Call `think_about_task_adherence`

### During Modification

- [ ] Use correct `relative_path` (from project root)
- [ ] Include proper indentation in inserted code
- [ ] Preserve existing style and conventions
- [ ] Handle imports if adding new dependencies

### After Modifying

- [ ] Verify the change with `find_symbol`
- [ ] Check for any broken references
- [ ] Call `think_about_whether_you_are_done`

## Code Style Guidelines

### Indentation

```python
# Method body should have correct indentation
body='''    def method(self):
        """Docstring."""
        return self.value'''

# Note: 4 spaces for method, 8 for body content
```

### Newlines

```python
# Add blank line before new symbol
body="\n\ndef new_function():\n    ..."

# Add blank line after symbol (for insert_after)
body="\n\n\nclass NewClass:\n    ..."
```

### Imports

```python
# Add import with newline
body="from typing import Optional\n"

# Add multiple imports
body="from typing import Optional, List\nimport os\n"
```

## Common Modification Patterns

| Task | Tool | Example |
|------|------|---------|
| Replace function | `replace_symbol_body` | Update implementation |
| Add method | `insert_after_symbol` | After existing method |
| Add import | `insert_before_symbol` | Before first symbol |
| Add helper | `insert_before_symbol` | Before class that uses it |
| Update text | `replace_content` | Literal or regex |
| Bulk replace | `replace_content` | With `allow_multiple_occurrences` |

## Regex Patterns for replace_content

```python
# Match function with simple body
"def func_name\\(.*?\\):.*?return .*"

# Match class definition line
"class ClassName.*:"

# Match import line
"^from .* import .*$"

# Match variable assignment
"variable_name = .*"

# Match decorator
"@\\w+"

# Match docstring
'""".*?"""'
```

## Error Handling

### Common Errors

1. **Symbol not found**: Check `name_path` and `relative_path`
2. **Invalid body**: Ensure proper indentation and syntax
3. **Multiple matches**: Use more specific `name_path` or regex

### Recovery Steps

1. Use `find_symbol` to verify symbol exists
2. Check `include_body=True` to see current format
3. Use `get_symbols_overview` to understand structure

## Important Notes

- `replace_symbol_body` replaces ENTIRE body including signature
- `insert_before/after_symbol` adds code on new lines
- Use `mode="regex"` for complex pattern matching
- Always verify changes after modification
- Consider using `rename_symbol` for renaming instead of manual replacement
