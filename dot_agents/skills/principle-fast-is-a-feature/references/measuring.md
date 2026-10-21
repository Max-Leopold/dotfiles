# Measuring Performance

Read this before you change code for speed, compare options on speed, or report a speed number.

## Method

1. **Name the number.** Pick the metric the user waits on: wall time for a command, p50 and p99 for a request, frame time for UI, time to first output for startup, peak memory, or a count such as queries per request. Write the sentence you expect to report, such as "startup drops from 180 ms to 60 ms on a cold shell", and measure that.
2. **Write a benchmark script.** Put it in a file so it reruns unchanged. It runs the real path on realistic input, prints the metric, and checks the output is correct. A fast run that skipped the work or returned an error is not a result.
3. **Take a baseline.** Use a quiet machine, warm up, then run at least 5 times. Record the median and the range. A difference smaller than the range is no difference.
4. **Find where the time goes.** Profile in a separate run, since profilers slow the work. If the CPU is mostly idle, the process is waiting on I/O, a lock, the network, or a child process, and a CPU profile will not show it. Count those waits instead.
5. **Change one thing,** then rerun the same script on the same input and machine. The time saved cannot exceed the time the changed piece took.
6. **Report** the command, the input size, before and after as median and range, the run count, and what limits the result now.
7. **Keep counts as tests.** When the fix is a count, such as N queries reduced to 1, assert the count in a test so the regression cannot return.

## Tools

Use the project's existing benchmarks, profilers, and perf tests first, since their numbers are the ones the project already trusts. Otherwise use a standard tool for the job, and prefer one that is already installed:

- **A benchmark runner** that warms up, repeats runs, and reports the spread, for commands and startup.
- **A sampling profiler** that produces a flame graph, for CPU time. Use the one built for the language or runtime.
- **Counters** for waits: the database's query plan and query log, and syscall or process counts.
- **The runtime's peak memory report,** for memory.
- **A microbenchmark harness,** only after a profile shows the function matters. Report its share of the end-to-end time.
