---
description: Implement technical plans from thoughts/shared/plans with verification
model: opus
---

# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/shared/plans/`. These plans contain phases with specific changes and success criteria.

## Getting Started

When given a plan path:
- Read the plan completely and check for any existing checkmarks (- [x])
- Read the original ticket and all files mentioned in the plan
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- Create a todo list to track your progress
- Start implementing if you understand what needs to be done

If no plan path provided, ask for one.

## Execution Strategy: Phase Subagents

For plans with multiple phases, use the `phase-executor` subagent to implement each phase separately. This prevents context bloat and allows for cleaner phase boundaries.

### How to Use Phase Subagents

1. **Read the plan** to understand all phases and their dependencies
2. **For each phase to implement**, spawn a `phase-executor` agent with:
   ```
   Execute Phase [N] of the implementation plan.

   **Plan Location**: [full plan path]
   **Phase Number**: [N]
   **Phase Name**: [name from plan]

   **Additional Instructions**: [any context or "None"]

   Read the plan completely, verify prerequisites are met, implement the phase, run all automated verification steps, and report completion status.
   ```

3. **Wait for each agent to complete** before proceeding to the next phase (unless phases are independent and can run in parallel)

4. **Review the agent's output** for:
   - Completion status
   - Any blockers or mismatches encountered
   - Manual verification steps that need human attention

### When to Use Subagents vs Direct Implementation

**Use phase-executor subagents when:**
- The plan has 3+ phases
- Individual phases are complex with many file changes
- You want to preserve context for later phases
- The user wants to review between phases

**Implement directly (without subagents) when:**
- The plan has only 1-2 simple phases
- Total changes are minimal
- The user requests direct implementation

### Parallel Phase Execution

If phases have no dependencies on each other, you can spawn multiple `phase-executor` agents in parallel:

```
Phases 2 and 3 are independent. Spawning both in parallel...
```

Use the Task tool with multiple invocations in a single message to run them concurrently.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Verification Approach

After implementing a phase:
- Run the success criteria checks
- Fix any issues before proceeding
- Update your progress in both the plan and your todos
- Check off completed items in the plan file itself using Edit
- **Pause for human verification**: After completing all automated verification for a phase, pause and inform the human that the phase is ready for manual testing. Use this format:
  ```
  Phase [N] Complete - Ready for Manual Verification

  Automated verification passed:
  - [List automated checks that passed]

  Please perform the manual verification steps listed in the plan:
  - [List manual verification items from the plan]

  Let me know when manual testing is complete so I can proceed to Phase [N+1].
  ```

If instructed to execute multiple phases consecutively, skip the pause until the last phase. Otherwise, assume you are just doing one phase.

do not check off items in the manual testing steps until confirmed by the user.


## If You Get Stuck

When something isn't working as expected:
- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
