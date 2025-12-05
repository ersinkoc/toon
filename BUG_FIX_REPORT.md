# Bug Fix Report - TOON Repository

**Date:** 2025-12-05
**Repository:** toon-format/toon
**Analyzer:** Claude Code (Opus 4.5)

## Overview

| Metric | Value |
|--------|-------|
| Total Bugs Found | 3 |
| Total Bugs Fixed | 3 |
| Unfixed/Deferred | 0 |
| Tests Added | 6 |
| Test Suite Status | 455 tests passing (toon) + 88 tests passing (cli) |

## Critical Findings

All identified bugs have been fixed. No critical security vulnerabilities were found.

## Detailed Bug Reports

---

### BUG-001: Missing `await` in Async Function

**Severity:** HIGH
**Category:** Functional
**File:** [packages/toon/src/decode/decoders.ts:844](packages/toon/src/decode/decoders.ts#L844)
**Component:** Async Streaming Decoder

#### Description

**Current behavior (before fix):**
The `decodeListItemAsync` function called `cursor.atEnd()` without `await`, causing the async method to return a Promise object instead of a boolean. Since a Promise is truthy, the `while (!cursor.atEnd())` loop would incorrectly evaluate `!Promise` as `false` and potentially skip iterations or cause unexpected behavior.

**Expected behavior:**
The `cursor.atEnd()` method returns a Promise that must be awaited to get the actual boolean value.

#### Root Cause

Missing `await` keyword before an async method call in a while loop condition.

#### Impact Assessment

- **User impact:** Could cause incomplete parsing of nested list items when using async streaming decoder
- **System impact:** Potential for incorrect data parsing without errors
- **Business impact:** Data integrity issues for users relying on async streaming

#### Fix Applied

```diff
- while (!cursor.atEnd()) {
+ while (!(await cursor.atEnd())) {
```

#### Verification

Test added in [packages/toon/test/bugfixes.test.ts](packages/toon/test/bugfixes.test.ts):
- `correctly decodes nested list items with async stream`

---

### BUG-002: Negative Numbers with Leading Zeros Incorrectly Parsed

**Severity:** MEDIUM
**Category:** Functional
**File:** [packages/toon/src/shared/literal-utils.ts:13-25](packages/toon/src/shared/literal-utils.ts#L13-L25)
**Component:** Numeric Literal Parser

#### Description

**Current behavior (before fix):**
The `isNumericLiteral` function only checked for leading zeros at the start of the token (e.g., `05`), but did not check for leading zeros after a minus sign. This caused `-05` to be parsed as the number `-5` instead of the string `"-05"`.

**Expected behavior:**
Numbers with leading zeros (like `-05`, `-007`) should be treated as strings, consistent with how positive numbers with leading zeros are handled (`05` → `"05"`).

#### Root Cause

The leading zero validation only checked `token[0] === '0'`, missing the case where `token[0] === '-'` and `token[1] === '0'`.

#### Impact Assessment

- **User impact:** Inconsistent parsing behavior between positive and negative numbers with leading zeros
- **System impact:** Data type inconsistency
- **Business impact:** Potential data corruption when preserving string formats like ZIP codes or product codes with negative indicators

#### Fix Applied

```diff
  // Must not have leading zeros (except for `"0"` itself or decimals like `"0.5"`)
  if (token.length > 1 && token[0] === '0' && token[1] !== '.') {
    return false
  }

+ // Must not have leading zeros after minus sign (e.g., `-05` is invalid, but `-0` and `-0.5` are valid)
+ if (token.length > 2 && token[0] === '-' && token[1] === '0' && token[2] !== '.') {
+   return false
+ }
```

#### Verification

Tests added in [packages/toon/test/bugfixes.test.ts](packages/toon/test/bugfixes.test.ts):
- `treats -05 as string (leading zero after minus)`
- `treats -007 as string (multiple leading zeros after minus)`
- `parses -0 as number (valid negative zero)`
- `parses -0.5 as number (negative decimal starting with zero)`
- `handles mixed positive and negative leading zeros in array`

---

### BUG-003: Missing Newline at End of README.md

**Severity:** LOW
**Category:** Code Quality
**File:** [README.md](README.md)
**Component:** Documentation

#### Description

**Current behavior (before fix):**
The `README.md` file did not end with a newline character, causing ESLint to report a `style/eol-last` error.

**Expected behavior:**
All text files should end with a newline character per POSIX standards and project ESLint configuration.

#### Root Cause

File was saved without trailing newline.

#### Impact Assessment

- **User impact:** None
- **System impact:** ESLint CI failures
- **Business impact:** None

#### Fix Applied

Added trailing newline to `README.md`.

#### Verification

ESLint now passes without errors.

---

## Fix Summary by Category

| Category | Bugs Fixed |
|----------|------------|
| Functional | 2 |
| Code Quality | 1 |

## Testing Results

```
Test Command: pnpm test
Tests Passed: 543/543
New Tests Added: 6
Coverage Impact: +6 test cases for edge cases
```

### Test Breakdown

**packages/toon:**
- Test Files: 8 passed
- Tests: 455 passed

**packages/cli:**
- Test Files: 3 passed
- Tests: 88 passed

## Files Modified

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `packages/toon/src/decode/decoders.ts` | Bug fix | 1 |
| `packages/toon/src/shared/literal-utils.ts` | Bug fix | 6 |
| `README.md` | Code quality | 1 |
| `packages/toon/test/bugfixes.test.ts` | New test file | 63 |

## Recommendations

1. **Consider adding the negative leading zero test case to the spec package** - The `@toon-format/spec` package should include test cases for `-05` and similar patterns to ensure consistency across all TOON implementations.

2. **Code review async functions** - A quick audit of other async functions for similar missing `await` issues is recommended.

3. **Enable stricter TypeScript settings** - Consider enabling `noUncheckedIndexedAccess` and other strict checks to catch similar issues at compile time.

## Conclusion

All identified bugs have been successfully fixed and verified with comprehensive tests. The codebase is now in a clean state with:
- All 543 tests passing
- No TypeScript errors
- No ESLint errors
- Full backward compatibility maintained
