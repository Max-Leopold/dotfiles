---
name: principle-prove-it
description: "Apply before claiming that something works, is fixed, is the cause, is faster, is unused or safe to delete, or is a risk. Back every claim with evidence observed on the real thing, name that evidence when you report, and say plainly what is unverified."
user-invocable: false
---

# Prove It

A claim without evidence is a guess. Back every claim with something you observed.

- **Evidence:** a command you ran and its output, a value you read, a measurement you took, a test you saw fail before the fix and pass after.
- **Not evidence:** it compiles, the types check, it looks right, it should work, a green test that was never red, your own reading of your own output, a summary from a tool or subagent you didn't check.
- **Tracing code** proves structure (the cause, unused, safe to delete), never that something works.
- **Use the real thing.** Run the feature the way its user would. Reproduce a bug before fixing it, and show it gone after.
- **Name it.** For every claim you report, say what you ran or read and what it showed.
- **Concerns are claims too.** Name what would trigger the problem and what it would break.
- **When you can't prove it,** keep the claim, call it unverified, and say what you assumed. Never round it up.
