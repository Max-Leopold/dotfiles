---
description: Research and implement simple-to-medium complexity tasks in one shot
---

# One-Shot Task Execution

You are tasked with researching and implementing a task that is too complex for a quick fix but doesn't warrant a full implementation plan document. This command combines thorough research with direct execution.

## Initial Response

When this command is invoked:

1. **If a task description was provided**: Begin immediately with research
2. **If no task provided**, respond with:
```
I'll help you research and implement a task. What do you need done?

Provide:
- What you want to accomplish
- Any relevant files or areas of the codebase
- Constraints or preferences

I'll research the codebase, understand the patterns, and implement the solution.
```

## Execution Process

### Phase 1: Understand the Request (Do NOT skip)

1. **Parse the task** - What exactly is being asked?
2. **Identify unknowns** - What do you need to learn about the codebase?
3. **Note constraints** - Any specific requirements mentioned?
4. **Ask questions** - Interview the user in detail using the AskUserQuestionTool about literally anything: technical implementation, UI & UX, concerns, tradeoffs, etc. but make sure the questions are not obvious. Be very in-depth and continue interviewing me continually until it's complete.

### Phase 2: Research (Critical - Do This Thoroughly)

Before writing ANY code:

1. **Create a todo list** to track your research and implementation:
   ```
   - [ ] Research: Find relevant files
   - [ ] Research: Understand existing patterns
   - [ ] Research: Identify integration points
   - [ ] Implement: [specific changes]
   - [ ] Verify: Run tests/checks
   ```

2. **Spawn parallel research agents** based on what you need to learn:

   **Finding files:**
   - Use **codebase-locator** to find all files related to the task
   - Be specific: "Find all files that handle [X]" or "Locate where [Y] is implemented"

   **Understanding code:**
   - Use **codebase-analyzer** to understand how existing implementations work
   - Ask for specific details: "How does [X] work? Include file:line references"

   **Finding patterns to follow:**
   - Use **codebase-pattern-finder** to find similar implementations you can model after
   - Request: "Find examples of [similar feature] that I can use as a template"

   **Checking for prior work:**
   - Use **thoughts-locator** if there might be relevant research or decisions documented

3. **Wait for all research to complete**

4. **Read the key files identified** - Read them fully into your context

5. **Synthesize understanding**:
   - What patterns must you follow?
   - What files need changes?
   - What are the integration points?
   - Are there tests to update or add?

### Phase 3: Validate Approach (Quick Check)

Before implementing, briefly state your approach:

```
Based on my research:

**What I'll do:**
- [Change 1 in file X]
- [Change 2 in file Y]
- [Add test in Z]

**Pattern I'm following:** [Reference to similar code found]

**Potential concerns:** [Any risks or uncertainties]

Proceeding with implementation...
```

If there are significant uncertainties or multiple valid approaches, **ask the user** before proceeding.

### Phase 4: Implement

1. **Make changes incrementally** - Don't try to do everything at once
2. **Follow the patterns you discovered** - Match the codebase style
3. **Update your todo list** as you complete items
4. **Include necessary tests** - Follow existing test patterns

### Phase 5: Verify

1. **Run relevant checks**:
   - Type checking if applicable
   - Linting
   - Tests (unit and integration)
   - Build if applicable

2. **Fix any issues** before declaring done

3. **Summarize what was done**:
   ```
   Completed: [task summary]

   Changes:
   - [file:line] - [what changed]
   - [file:line] - [what changed]

   Verification:
   - [x] Tests pass
   - [x] Linting clean
   - [x] Types check

   Notes: [Any follow-up items or things to watch]
   ```

## Key Principles

### Research First, Code Second
The most common failure mode is jumping straight to implementation. Even if the task seems simple, spend time understanding:
- How similar things are done in this codebase
- What patterns and conventions exist
- Where the integration points are

### Follow Existing Patterns
Don't invent new patterns. Find how similar things are done and follow that approach. Use the codebase-pattern-finder agent to locate examples.

### Ask When Uncertain
If you find multiple valid approaches or discover complexity you didn't expect:
- Stop and explain what you found
- Present options with trade-offs
- Let the user decide before proceeding

### Keep It Focused
This is a one-shot task. If you discover the scope is larger than expected:
- Implement what you can cleanly
- Note what remains
- Suggest using `/create_plan` for the larger effort

### Verify Before Declaring Done
Run the checks. Fix issues. Don't leave broken code.

## Common Pitfalls to Avoid

1. **Skipping research** - "This looks simple" often leads to rework
2. **Not finding patterns** - Implementing in a way that doesn't match the codebase
3. **Over-engineering** - Adding features or abstractions not requested
4. **Under-verifying** - Not running tests or checks before declaring done
5. **Scope creep** - Trying to fix "nearby" issues not part of the task

