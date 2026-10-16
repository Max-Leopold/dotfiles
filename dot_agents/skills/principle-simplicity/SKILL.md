---
name: principle-simplicity
description: "Apply when designing or writing code, and before calling a solution done. Aim for the simplest solution that fully handles the real problem, by understanding the problem until its complexity is distilled and under control, not hidden, skipped, or pushed onto someone else."
user-invocable: false
---

# Simplicity

Simple, beautiful software is the highest goal. Simple is not the opposite of complex: it is complexity that has been understood and brought under control. A solution that isn't simple yet usually means the problem isn't fully understood yet.

- **Counts:** the essential complexity lives in one obvious place, the code reads like the problem it solves, each part does one thing, and the next likely change is easy to make.
- **Doesn't count:** fewer lines bought with cleverness, ignoring real cases, pushing complexity onto callers or users, layers and options for needs nobody has, and solving problems your own design created.
- **Action:** when a solution feels complicated, stop adding and go back to understanding. Restate the problem, find the real cases from the code, the data, and how it is actually used, and look for the model in which most of them become the same case. Then delete what that model makes unnecessary.
- **Essential complexity:** when the problem is genuinely hard, don't flatten it. Split it into simple parts with clear names and boundaries, and connect them plainly.
- **When it isn't simple yet:** ship the clearest version you can, and say which part is still complicated and why.
