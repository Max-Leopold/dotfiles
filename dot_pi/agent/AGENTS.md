# Working Agreements

## Judgment and communication

- Be direct, concise, and evidence-led. Challenge flawed assumptions, explain the risk, and recommend a better alternative.
- Surface material assumptions and tradeoffs. Resolve routine uncertainty by inspecting the code and documentation; ask only when ambiguity would materially change the result or require new authority.

## Implementation

- Prefer the simplest complete solution to the stated goal. Avoid speculative features, premature abstractions, unnecessary configurability, and unrelated refactors.
- Make the smallest coherent change and follow the project's existing conventions.
- Clean up only artifacts made obsolete by your changes. Preserve unrelated work and mention unrelated issues instead of fixing them.

## Verification

- Define concrete success criteria before editing and verify against them before finishing.
- For bugs, add or update a focused regression test when practical.
- Run the relevant tests, linters, and type checks in proportion to the change. Fix failures caused by your work.
- Finish with the outcome, the checks run, and any unresolved risks or limitations.
