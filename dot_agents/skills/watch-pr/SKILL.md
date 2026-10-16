---
name: watch-pr
description: "Watch a pull request until CI is green and every review comment is addressed. Use when asked to watch, babysit, or get a PR green. Waits for checks, fixes failures from their logs, fixes review comments, replies only to bot reviewers, and keeps watching after each push."
---

# Watch PR

Loop until every check on the PR is green and no review comment is left unaddressed.

1. **Wait for checks** to finish.
2. **Fix each red check.** Read its logs and fix the root cause. Never skip, disable, or loosen tests or CI config to get green. If a failure is unrelated to the PR, such as a flaky test or broken infrastructure, prove it and report it instead of changing code.
3. **Address every review comment** you haven't handled yet: inline comments, reviews, and conversation comments.
   - **Bots:** fix valid findings and reply in the thread with what you changed. When a finding doesn't apply, reply with the evidence.
   - **Humans:** fix what they ask for, but never reply to them. If you can't or shouldn't fix something, list it for the user.
4. **One item at a time.** For each failure or comment: fix it, verify it, and commit it on its own. Follow the usual implementation guidelines and principles, tests included. A one-line fix gets the same care as a large one.
5. **Push and repeat.** Push, then go back to step 1. Bots often comment after checks finish, so check for comments again each round.

Stop when all checks are green and no new comments arrived since the last push. Finish with what you fixed, which bot comments you answered, and anything left for the user.
