---
name: "serena-thinking-workflow"
description: "Use Serena MCP thinking tools for systematic reasoning. Invoke when user needs structured thinking during complex tasks or verification of work completion."
---

# Serena Thinking Workflow

This skill guides the use of Serena MCP's thinking tools for systematic reasoning and verification.

## When to Invoke

Invoke this skill when:
- User is working on complex multi-step tasks
- User needs to verify information sufficiency
- User wants to check task progress
- User needs to confirm work completion
- User asks for help with reasoning or decision-making

## Thinking Tools

### 1. Think About Collected Information

**`think_about_collected_information`** - Verify information sufficiency

Call this after completing a sequence of information gathering steps:
- After multiple `find_symbol` calls
- After `find_referencing_symbols` searches
- After `search_for_pattern` operations
- After reading files or getting overviews

```python
# Example usage after gathering information
find_symbol(name_path_pattern="UserService")
find_referencing_symbols(name_path="UserService/login")
search_for_pattern(substring_pattern="def login")

# Now think about what you've gathered
think_about_collected_information()
```

**When to use:**
- After non-trivial search sequences
- Before making decisions based on gathered info
- When unsure if you have enough information
- After exploring multiple code paths

### 2. Think About Task Adherence

**`think_about_task_adherence`** - Verify you're on track

Call this before making code changes:
- Before `replace_symbol_body`
- Before `insert_before/after_symbol`
- Before `rename_symbol`
- Before `replace_content`

```python
# Example usage before making changes
find_symbol(name_path_pattern="targetFunction")
find_referencing_symbols(name_path="targetFunction")

# Think about whether you should proceed
think_about_task_adherence()

# Now make the change
replace_symbol_body(...)
```

**When to use:**
- Before any code modification
- When task has been running for a while
- When there's been back-and-forth discussion
- Before critical changes

### 3. Think About Whether You Are Done

**`think_about_whether_you_are_done`** - Verify completion

Call this when you believe the task is complete:
- After implementing requested changes
- After answering a question
- After completing analysis

```python
# Example usage after completing work
replace_symbol_body(...)
find_referencing_symbols(...)  # Verify changes

# Think about whether you're done
think_about_whether_you_are_done()
```

**When to use:**
- When you think the task is complete
- Before reporting completion to user
- After implementing all requested changes
- After answering complex questions

## Thinking Workflow Patterns

### Pattern 1: Information Gathering Cycle

```
1. find_symbol() / search_for_pattern() / get_symbols_overview()
2. find_referencing_symbols() if needed
3. Repeat step 1-2 as needed
4. think_about_collected_information()
5. Decide: Need more info? -> Go to step 1
           Have enough? -> Proceed
```

### Pattern 2: Safe Modification Cycle

```
1. Gather information (find_symbol, find_referencing_symbols)
2. think_about_collected_information()
3. Plan the modification
4. think_about_task_adherence()
5. Execute modification
6. Verify changes
7. think_about_whether_you_are_done()
```

### Pattern 3: Complex Task Cycle

```
1. Understand requirements
2. Gather initial information
3. think_about_collected_information()
4. Plan approach
5. think_about_task_adherence()
6. Execute first step
7. Gather more information if needed
8. think_about_collected_information()
9. Continue execution
10. think_about_whether_you_are_done()
```

## Decision Trees

### When to Call think_about_collected_information

```
Did you just complete a search sequence?
├── Yes → Call think_about_collected_information
└── No → Are you about to make a decision?
    ├── Yes → Do you have enough info?
    │   ├── Yes → Proceed
    │   └── No → Gather more info, then call think_about_collected_information
    └── No → Continue current task
```

### When to Call think_about_task_adherence

```
Are you about to modify code?
├── Yes → Call think_about_task_adherence
└── No → Has the task been running for a while?
    ├── Yes → Call think_about_task_adherence
    └── No → Continue current task
```

### When to Call think_about_whether_you_are_done

```
Did you complete all requested work?
├── Yes → Call think_about_whether_you_are_done
└── No → Continue working
```

## Integration with Other Workflows

### With Code Navigation

```python
# Navigate and think
find_symbol(name_path_pattern="Target")
get_symbols_overview(relative_path="target.py")
find_referencing_symbols(name_path="Target")

think_about_collected_information()  # Process findings
```

### With Code Modification

```python
# Modify safely
find_symbol(name_path_pattern="Target")
find_referencing_symbols(name_path="Target")

think_about_collected_information()  # Verify understanding
think_about_task_adherence()  # Verify it's the right change

replace_symbol_body(...)

think_about_whether_you_are_done()  # Verify completion
```

### With Code Analysis

```python
# Analyze thoroughly
search_for_pattern(substring_pattern="class.*:")
find_symbol(name_path_pattern="*", include_kinds=[5])
get_symbols_overview(relative_path="main.py")

think_about_collected_information()  # Synthesize findings
# Continue analysis or conclude

think_about_whether_you_are_done()  # Check if analysis complete
```

## Best Practices

1. **Call thinking tools explicitly**: Don't skip them for efficiency
2. **Call at the right time**: Each tool has specific triggers
3. **Trust the process**: The tools help catch oversights
4. **Don't batch**: Call thinking tools when appropriate, not just at the end
5. **Use after complex sequences**: Always call after non-trivial operations

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Skipping thinking tools | Always call at appropriate times |
| Calling at wrong time | Follow the decision trees |
| Only calling at the end | Call throughout the workflow |
| Ignoring the output | Use the output to guide next steps |

## Thinking Tool Summary

| Tool | When to Call | Purpose |
|------|--------------|---------|
| `think_about_collected_information` | After search sequences | Verify info sufficiency |
| `think_about_task_adherence` | Before modifications | Verify you're on track |
| `think_about_whether_you_are_done` | After completing work | Verify completion |

## Important Notes

- These tools are part of Serena's systematic approach
- They help prevent errors and oversights
- Call them at appropriate points in your workflow
- They provide structured reasoning support
- Use them to maintain task focus
