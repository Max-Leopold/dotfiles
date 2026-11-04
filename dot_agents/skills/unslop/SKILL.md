---
name: unslop
description: "Remove LLM habits from code and prose: needless regexes, code comments, one-off helpers, LLM phrasing, and em-dashes. Use when asked to unslop something."
---

# Unslop

Edit text to remove AI patterns. Scan for the patterns below, then rewrite. Preserve meaning and match the intended tone.

## Code

- **Regexes are the exception.** Use the language's string functions, a real parser, or a structured API (JSON, URL, path, AST) instead. Keep a regex only when nothing simpler does the job.
- **No comments.** Delete every code comment. If code needs one to be understood, rename or restructure it instead. Keep only tool directives such as shebangs and linter or type-checker pragmas, and license headers.
- **No one-off helpers.** Inline a helper that is used in one place and isn't generic, especially a one-liner. Keep helpers that are reused or that name a real concept.

## Prose

- **No LLM phrasing:** "load-bearing", "byte-identical", and "not X but Y" or "it's not X, it's Y" constructions.
- **Em-dashes are rare.** Use a period, comma, colon, or parentheses instead.
