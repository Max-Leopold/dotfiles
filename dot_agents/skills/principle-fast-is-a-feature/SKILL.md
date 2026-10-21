---
name: principle-fast-is-a-feature
description: "Apply when writing code that runs per request, per keystroke or frame, per item, or at startup, does I/O in a loop, handles data that grows, or defines a query, schema, or API; and before optimizing anything or adding a cache or parallelism. Settle the cost while the design is cheap to change, and back every performance change with measured numbers, not guesses."
user-invocable: false
---

# Fast Is a Feature

Speed is set early, by the data layout, the I/O pattern, and where work runs, and those are the hardest things to change later. Design decides orders of magnitude; tuning recovers percentages. Getting the design of hot code right up front is never premature; tuning before a measurement is.

- **Hot or not:** code is hot when someone waits on it (startup, a keystroke, a frame, a request) or it runs once per item of something that grows. Cold code, such as a one-off script on small input, gets the simplest version.
- **Real sizes:** take N from the data: count the rows, files, or entries, and read the callers to see how often it runs. Design for ten times that, not the three-item fixture.
- **Napkin math:** memory is nanoseconds, an SSD read about 100 µs, a process spawn or database call 1–10 ms, an internet round trip about 100 ms. Multiply by N and how often it runs, and compare with the project's targets, or with 100 ms for a response and 16 ms for a frame. A design that misses on paper misses in production.
- **Tells:** a query, request, file read, subprocess, or parse inside a loop, including one hidden in a helper; a list lookup inside a loop; reading everything to use a little; parsing the same data twice; startup work that could wait for first use; independent waits run one after another; an API with no pagination or bulk path.
- **Do less first:** between two equally simple options, take the one that does less work. Remove, batch, hoist, stream, or filter at the source before adding a cache or parallelism. A cache needs an invalidation story; parallelism needs a bound.
- **Measure twice, cut once:** performance work starts with a measurement that shows where the time goes and ends with the same measurement on the same input after the change. Report both. A count, like queries per request, is a number; an estimate is not, and neither is reading the code, per `principle-prove-it`. Before measuring, read [references/measuring.md](references/measuring.md) for the method and tools.
- **Limits:** report performance problems outside the task with numbers and a proposed fix instead of fixing them.
