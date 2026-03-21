---
name: "serena-refactoring"
description: "Refactor code using Serena MCP tools. Invoke when user wants to rename symbols, extract methods, move code, or perform safe code transformations."
---

# Serena Refactoring

This skill guides safe and effective code refactoring using Serena MCP's symbol-aware tools.

## When to Invoke

Invoke this skill when:
- User wants to rename a variable, function, class, or method
- User needs to extract or move code
- User wants to update method signatures
- User asks to "refactor" or "rename" something
- User needs to change code structure safely

## Core Refactoring Tools

### 1. Symbol Renaming

**`rename_symbol`** - Rename a symbol across the entire codebase

```python
# Rename a class
rename_symbol(
    name_path="OldClassName",
    relative_path="src/models/old_class.py",
    new_name="NewClassName"
)

# Rename a method
rename_symbol(
    name_path="MyClass/oldMethodName",
    relative_path="src/services/my_class.py",
    new_name="newMethodName"
)
```

**Important:** This updates ALL references across the entire project automatically!

### 2. Symbol Body Replacement

**`replace_symbol_body`** - Replace a symbol's implementation

```python
# Replace a function body
replace_symbol_body(
    name_path="calculate_total",
    relative_path="src/utils/calculator.py",
    body='''def calculate_total(items: list) -> float:
    """Calculate total price with discount."""
    subtotal = sum(item.price for item in items)
    return subtotal * 0.9  # 10% discount'''
)
```

### 3. Code Insertion

**`insert_before_symbol`** - Insert code before a symbol

```python
# Add a new import before the first symbol
insert_before_symbol(
    name_path="main",
    relative_path="src/main.py",
    body="from typing import Optional\n"
)

# Add a helper function before a class
insert_before_symbol(
    name_path="UserService",
    relative_path="src/services/user.py",
    body='''def validate_email(email: str) -> bool:
    return "@" in email

'''
)
```

**`insert_after_symbol`** - Insert code after a symbol

```python
# Add a new class after existing one
insert_after_symbol(
    name_path="BaseModel",
    relative_path="src/models/base.py",
    body='''

class ExtendedModel(BaseModel):
    """Extended model with additional features."""
    extra_field: str = ""
'''
)

# Add a new method after existing method
insert_after_symbol(
    name_path="UserService/login",
    relative_path="src/services/user.py",
    body='''

    def logout(self) -> None:
        """Log out the current user."""
        self.current_user = None'''
)
```

### 4. Content Replacement

**`replace_content`** - Replace content using regex or literal matching

```python
# Literal replacement
replace_content(
    relative_path="src/config.py",
    needle="DEBUG = True",
    repl="DEBUG = False",
    mode="literal"
)

# Regex replacement (more flexible)
replace_content(
    relative_path="src/api.py",
    needle="def old_api.*?return result",
    repl="def new_api() -> dict:\n    return {'status': 'ok'}",
    mode="regex"
)

# Multiple occurrences
replace_content(
    relative_path="src/utils.py",
    needle="print\\(",
    repl="logger.debug(",
    mode="regex",
    allow_multiple_occurrences=True
)
```

## Refactoring Workflows

### Workflow 1: Rename a Symbol Safely

```
1. find_symbol(name_path_pattern="OldName")  # Locate the symbol
2. find_referencing_symbols()  # Check impact
3. think_about_task_adherence()  # Verify it's safe
4. rename_symbol(name_path="OldName", new_name="NewName", relative_path="...")
5. Verify changes with find_referencing_symbols() again
```

### Workflow 2: Extract Method

```
1. find_symbol(name_path_pattern="targetMethod", include_body=True)  # Get original
2. Analyze the code to extract
3. insert_after_symbol()  # Add new extracted method
4. replace_symbol_body()  # Update original to call new method
```

### Workflow 3: Move Code Between Files

```
1. find_symbol(name_path_pattern="SymbolToMove", include_body=True)  # Get code
2. insert_after_symbol() in target file  # Add to new location
3. find_referencing_symbols()  # Find all references
4. Update imports in referencing files
5. replace_content() to remove from original file
```

### Workflow 4: Update Method Signature

```
1. find_symbol(name_path_pattern="ClassName/methodName", include_body=True)
2. find_referencing_symbols()  # Find all callers
3. replace_symbol_body() with new signature
4. Update each caller using replace_content()
```

## Safety Guidelines

### Before Refactoring

1. **Always find first**: Use `find_symbol` to locate the symbol
2. **Check references**: Use `find_referencing_symbols` to understand impact
3. **Think**: Call `think_about_task_adherence` before making changes
4. **Read context**: Understand the surrounding code

### During Refactoring

1. **One change at a time**: Don't batch unrelated changes
2. **Preserve behavior**: Ensure functionality remains the same
3. **Update imports**: Add/remove imports as needed
4. **Check for conflicts**: Watch for naming conflicts

### After Refactoring

1. **Verify references**: Check that references are updated
2. **Think about completion**: Call `think_about_whether_you_are_done`
3. **Run tests**: Suggest running tests to verify

## Common Refactoring Patterns

| Refactoring Type | Primary Tool | Supporting Tools |
|-----------------|--------------|------------------|
| Rename | `rename_symbol` | `find_referencing_symbols` |
| Extract Method | `insert_after_symbol` | `replace_symbol_body` |
| Inline Method | `replace_content` | `find_referencing_symbols` |
| Move Code | `insert_after_symbol` | `replace_content` |
| Change Signature | `replace_symbol_body` | `find_referencing_symbols` |
| Add Code | `insert_before/after_symbol` | `find_symbol` |

## Regex Tips for replace_content

```python
# Match function definition (non-greedy)
needle="def func_name.*?:"

# Match class with body
needle