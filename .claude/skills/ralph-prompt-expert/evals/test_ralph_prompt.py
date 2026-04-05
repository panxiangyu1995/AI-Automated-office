#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test ralph-prompt-expert generated /ralph-loop:ralph-loop command format

Validation points:
1. Command starts with /ralph-loop:ralph-loop
2. Contains --completion-promise parameter
3. Contains --max-iterations parameter
4. Quotes and brackets are properly paired
5. Task description is not empty
6. <promise> tag exists in task description
"""

import re
import sys
import json
from pathlib import Path


def validate_ralph_command(command: str) -> tuple[bool, list[str]]:
    """
    Validate /ralph-loop:ralph-loop command format.
    Returns (passed: bool, errors: list[str])
    """
    errors = []

    # 1. Check if command starts with /ralph-loop:ralph-loop
    if not command.strip().startswith("/ralph-loop:ralph-loop"):
        errors.append("Command must start with /ralph-loop:ralph-loop")

    # 2. Check for --completion-promise parameter
    if "--completion-promise" not in command:
        errors.append("Missing --completion-promise parameter")

    # 3. Check for --max-iterations parameter
    if "--max-iterations" not in command:
        errors.append("Missing --max-iterations parameter")

    # 4. Check double quote pairing
    double_quote_count = command.count('"')
    if double_quote_count % 2 != 0:
        errors.append(f"Unmatched double quotes: {double_quote_count} (should be even)")

    # 5. Check bracket pairing
    for opening, closing in [('(', ')'), ('[', ']')]:
        opening_count = command.count(opening)
        closing_count = command.count(closing)
        if opening_count != closing_count:
            errors.append(f"Unmatched {opening}{closing}: {opening_count} opening, {closing_count} closing")

    # 6. Check for task description (after /ralph-loop:ralph-loop and before closing quote)
    match = re.search(r'/ralph-loop:ralph-loop\s+"([^"]*)"', command)
    if not match or not match.group(1).strip():
        errors.append("Task description is empty or malformed")

    # 7. Check --completion-promise format
    promise_match = re.search(r'--completion-promise\s+"([^"]*)"', command)
    if not promise_match or not promise_match.group(1).strip():
        errors.append("--completion-promise format error or empty value")

    # 8. Check --max-iterations format
    iter_match = re.search(r'--max-iterations\s+(\d+)', command)
    if not iter_match:
        errors.append("--max-iterations format error or non-numeric value")

    # 9. Check for <promise> tag
    if "<promise>" not in command:
        errors.append("Missing <promise> tag in task description")

    return len(errors) == 0, errors


def run_tests():
    """Run validation tests"""
    print("=" * 60)
    print("Ralph Prompt Expert - Command Format Validation Test")
    print("=" * 60)
    print()

    # Test cases: (description, command, expected_pass)
    test_cases = [
        # Test 1: Valid format (from examples.md)
        (
            "Valid command - coverage improvement",
            '/ralph-loop:ralph-loop "Task: Improve test coverage.\n### 1. Setup\n- Generate timestamp\n- Create plan file\n\n### 2. Execute\n1. Run coverage report\n2. Write tests\n3. Verify\nDone: <promise>COVERAGE_ACHIEVED</promise>" \\\n--completion-promise "COVERAGE_ACHIEVED" \\\n--max-iterations 20',
            True
        ),

        # Test 2: Missing --completion-promise
        (
            "Missing --completion-promise",
            '/ralph-loop:ralph-loop "Task: Fix SQL injection" \\\n--max-iterations 10',
            False
        ),

        # Test 3: Unmatched brackets
        (
            "Unmatched brackets",
            '/ralph-loop:ralph-loop "Task: Refactor(\n### Steps\n- Refactor code[ \nDone: <promise>REFACTOR</promise>" \\\n--completion-promise "REFACTOR" \\\n--max-iterations 50',
            False
        ),

        # Test 4: Unmatched double quotes
        (
            "Unmatched double quotes",
            '/ralph-loop:ralph-loop "Task: Upgrade React\n- Install new version\n- Run tests\nDone: <promise>REACT_DONE</promise" \\\n--completion-promise "REACT_DONE" \\\n--max-iterations 30',
            False
        ),

        # Test 5: Missing --max-iterations
        (
            "Missing --max-iterations",
            '/ralph-loop:ralph-loop "Task: Generate docs\n- Scan API\n- Generate swagger\nDone: <promise>DOCS_DONE</promise>" \\\n--completion-promise "DOCS_DONE"',
            False
        ),

        # Test 6: Empty task description
        (
            "Empty task description",
            '/ralph-loop:ralph-loop "" \\\n--completion-promise "DONE" \\\n--max-iterations 5',
            False
        ),

        # Test 7: Missing <promise> tag
        (
            "Missing <promise> tag",
            '/ralph-loop:ralph-loop "Task: Fix bugs\n- Run tests\n- Fix failures" \\\n--completion-promise "BUGS_FIXED" \\\n--max-iterations 10',
            False
        ),

        # Test 8: Valid with allowed-tools
        (
            "Valid with --allowed-tools",
            '/ralph-loop:ralph-loop "Task: Batch rename.\n### Steps\n1. Find files\n2. Rename\n3. Verify\nDone: <promise>RENAME_DONE</promise>" \\\n--completion-promise "RENAME_DONE" \\\n--max-iterations 50 \\\n--allowed-tools "Write,Bash(git *),Read,Grep"',
            True
        ),
    ]

    all_passed = True
    results = []

    for i, (desc, cmd, expected) in enumerate(test_cases):
        print(f"Test {i+1}: {desc}")
        print("-" * 40)
        print(cmd[:80] + "..." if len(cmd) > 80 else cmd)
        print()

        passed, errors = validate_ralph_command(cmd)

        if passed == expected:
            status = "[OK]" if passed else "[OK-SHOULD-FAIL]"
        else:
            status = "[UNEXPECTED]"
            all_passed = False

        if passed:
            print(f"  Result: PASSED {status}")
        else:
            print(f"  Result: FAILED {status}")
            for err in errors:
                print(f"    - {err}")
            all_passed = False

        results.append({
            "test": i + 1,
            "description": desc,
            "passed": passed,
            "expected": expected,
            "errors": errors if not passed else []
        })

        print()

    print("=" * 60)
    print(f"Results: {sum(1 for r in results if r['passed'])}/{len(results)} tests passed")
    if all_passed:
        print("All tests passed!")
    else:
        print("Some tests failed - check command format")
    print("=" * 60)

    # Save results to JSON
    output_file = Path(__file__).parent / "test_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total": len(results),
                "passed": sum(1 for r in results if r["passed"]),
                "failed": sum(1 for r in results if not r["passed"])
            },
            "results": results
        }, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to: {output_file}")

    return 0 if all_passed else 1


def validate_from_skill_output(skill_output: str) -> dict:
    """
    Validate skill output and return validation result.
    """
    passed, errors = validate_ralph_command(skill_output)
    return {
        "passed": passed,
        "errors": errors,
        "output": skill_output
    }


if __name__ == "__main__":
    sys.exit(run_tests())
