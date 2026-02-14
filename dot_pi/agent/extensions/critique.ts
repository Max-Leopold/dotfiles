/**
 * Critique Tool — Adversarial review before committing to a plan.
 *
 * Spins up a sub-agent with read-only tools to review plans, code, or designs
 * for real problems. Uses a different model to avoid echo-chamber bias.
 *
 * Usage: place in ~/.pi/agent/extensions/ and reload.
 */

import { getModel } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext, ResourceLoader } from "@mariozechner/pi-coding-agent";
import {
  AuthStorage,
  createAgentSession,
  createExtensionRuntime,
  createReadOnlyTools,
  getMarkdownTheme,
  ModelRegistry,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";
import { Container, Markdown, Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

const CRITIQUE_TIMEOUT_MS = 600_000; // 10 minutes

// Preference order for critic model — tried first among available models.
// Any available model not in this list is still eligible as a fallback.
const MODEL_PREFERENCE: ReadonlyArray<[string, string]> = [
  ["anthropic", "claude-opus-4-6"],
  ["openai", "gpt-5.3-codex"],
  ["google", "gemini-3-pro-preview"],
  ["anthropic", "claude-opus-4-5"],
  ["anthropic", "claude-sonnet-4-5"],
  ["openai", "gpt-5-codex"],
  ["anthropic", "claude-sonnet-4-0"],
];

const CRITIC_SYSTEM_PROMPT = `You are a thorough, skeptical code reviewer. Your job is to find real problems in the plan, code, or design you are given. You are not performing; you are protecting the author from shipping mistakes.

## Tools

You have read-only access to the codebase: read, grep, find, ls.

**Use them.** Don't guess at file contents, function signatures, or types when you can verify. Follow the dependency chain from what's under review — read the files that matter, not everything.

## Severity

**CRITICAL** — The code is broken or the plan has a fatal flaw. Will cause bugs, data loss, or crashes.
**WARNING** — Creates real risk: fragility, degraded performance, or failure under predictable conditions.
**SUGGESTION** — The current approach works, but a better alternative exists.

If you can't articulate the concrete failure scenario, downgrade the severity.

## What to look for

Think for yourself about what could go wrong. Consider correctness, architecture, edge cases, error handling, and whether the overall approach is sound. If a fundamentally better approach exists and you can confirm it by reading the codebase, say so directly.

Don't just look for low-level bugs. Step back and assess whether the direction is right before diving into details.

## Output format

### Verdict
One of **SOLID** / **RISKY** / **FLAWED**, followed by a one-sentence summary.

### Issues
For each issue:
- **[SEVERITY] Title** — What's wrong, where exactly, and what breaks. Say whether you confirmed it by reading code or are inferring.

Group related issues. Don't list the same root cause multiple times.

### Direction
Include only if the approach is fundamentally wrong or fighting the codebase. State the better approach and why. Omit if the direction is sound.

### Recommendations
Numbered list of concrete fixes, ordered by priority. Reference the issue each addresses.

## Rules
- **Be precise.** Name the file, the function, the line.
- **No false positives.** If the code is solid, say so.
- **No filler.** Jump straight to findings.
- **No style nitpicks** unless they cause bugs.
- **Proportional depth.** Scale your review to the risk.`;

// Minimal resource loader — just provides the system prompt, everything else empty
const CRITIC_EXTENSION_RUNTIME = createExtensionRuntime();
const CRITIC_RESOURCE_LOADER: ResourceLoader = {
  getExtensions: () => ({ extensions: [], errors: [], runtime: CRITIC_EXTENSION_RUNTIME }),
  getSkills: () => ({ skills: [], diagnostics: [] }),
  getPrompts: () => ({ prompts: [], diagnostics: [] }),
  getThemes: () => ({ themes: [], diagnostics: [] }),
  getAgentsFiles: () => ({ agentsFiles: [] }),
  getSystemPrompt: () => CRITIC_SYSTEM_PROMPT,
  getAppendSystemPrompt: () => [],
  getPathMetadata: () => new Map(),
  extendResources: () => { },
  reload: async () => { },
};

/**
 * Find a usable model + API key, preferring one different from the main agent.
 *
 * Strategy:
 * 1. Walk the preference list — pick the first available model that isn't the current one.
 * 2. If nothing from the preference list works, pick any available model that differs
 *    from the current one, preferring reasoning-capable models.
 * 3. Fall back to the current model if it's all we have.
 */
async function findCriticModel(ctx: ExtensionContext) {
  const currentId = ctx.model?.id;
  const currentProvider = ctx.model?.provider;

  // Build a set of preference-list model keys for fast lookup
  const preferenceKeys = new Set(MODEL_PREFERENCE.map(([p, id]) => `${p}/${id}`));

  // Step 1: Walk the explicit preference list
  for (const [provider, id] of MODEL_PREFERENCE) {
    if (id === currentId && provider === currentProvider) continue;

    // Try the registry first (handles custom models, overrides, etc.)
    const model = ctx.modelRegistry.find(provider, id) ?? getModel(provider, id);
    if (!model) continue;

    const key = await ctx.modelRegistry.getApiKey(model).catch(() => null);
    if (key) return { model, apiKey: key };
  }

  // Step 2: Query the registry for all available models and pick the best fallback
  const available = ctx.modelRegistry.getAvailable();

  // Sort: reasoning models first, then by name for stability
  const fallbacks = available
    .filter((m) => !(m.id === currentId && m.provider === currentProvider))
    .filter((m) => !preferenceKeys.has(`${m.provider}/${m.id}`)) // already tried
    .sort((a, b) => {
      if (a.reasoning !== b.reasoning) return a.reasoning ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

  for (const model of fallbacks) {
    const key = await ctx.modelRegistry.getApiKey(model).catch(() => null);
    if (key) return { model, apiKey: key };
  }

  // Step 3: Same model is better than nothing
  if (ctx.model) {
    const key = await ctx.modelRegistry.getApiKey(ctx.model).catch(() => null);
    if (key) return { model: ctx.model, apiKey: key };
  }

  return null;
}

export default function(pi: ExtensionAPI) {
  pi.registerTool({
    name: "critique",
    label: "Critique",
    description:
      "Get an adversarial review of a plan, approach, or code before committing to it. A separate LLM sub-agent analyzes the input for flaws, edge cases, security issues, and blind spots. The critic can read files, grep code, and explore the project for additional context. Use this BEFORE implementing — catch problems early, not after writing 500 lines. The critique is structured: verdict (SOLID/RISKY/FLAWED), categorized issues with severity, and prioritized recommendations.",
    parameters: Type.Object({
      content: Type.String({
        description:
          "The plan, approach, code, or design to critique. Include enough context for meaningful review.",
      }),
      focus: Type.Optional(
        Type.String({
          description:
            'Optional focus areas, e.g. "security and error handling" or "performance of the database layer". If omitted, all categories are reviewed.',
        }),
      ),
      relatedFiles: Type.Optional(
        Type.Array(Type.String(), {
          description:
            "File paths directly relevant to the review (e.g. files you've been editing or plan to change). The critic will start from these rather than rediscovering context.",
        }),
      ),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      if (!params.content.trim()) {
        return { content: [{ type: "text", text: "Cannot critique empty content." }], isError: true };
      }

      const critic = await findCriticModel(ctx);
      if (!critic) {
        return { content: [{ type: "text", text: "No model available for critique. Check your API keys." }], isError: true };
      }

      const modelLabel = `${critic.model.provider}/${critic.model.id}`;
      onUpdate?.({ content: [{ type: "text", text: `Critiquing with ${modelLabel}...` }] });

      // Build the user prompt with all available context
      let userPrompt = `Review the following for flaws, risks, and blind spots:\n\n${params.content}`;

      if (params.focus) {
        userPrompt += `\n\nFocus especially on: ${params.focus}`;
      }

      // Seed the critic with related file paths
      if (params.relatedFiles?.length) {
        const paths = params.relatedFiles.map((p) => `  - ${p}`).join("\n");
        userPrompt += `\n\n## Related Files\nThese files are directly relevant to the review. Start by reading them to ground your analysis:\n${paths}`;
      }

      // Create sub-agent with isolated session
      let session;
      try {
        const authStorage = new AuthStorage();
        authStorage.setRuntimeApiKey(critic.model.provider, critic.apiKey);
        ({ session } = await createAgentSession({
          cwd: ctx.cwd,
          model: critic.model,
          thinkingLevel: "high",
          tools: createReadOnlyTools(ctx.cwd),
          sessionManager: SessionManager.inMemory(),
          settingsManager: SettingsManager.inMemory({
            compaction: { enabled: false },
            retry: { enabled: true, maxRetries: 1 },
          }),
          resourceLoader: CRITIC_RESOURCE_LOADER,
          authStorage,
          modelRegistry: new ModelRegistry(authStorage),
        }));
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Failed to start critic (${modelLabel}): ${err?.message ?? err}` }],
          isError: true,
        };
      }

      let disposed = false;
      const abort = () => { if (!disposed) session.abort(); };
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let unsubscribe: (() => void) | undefined;

      try {
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) {
          return { content: [{ type: "text", text: "Critique was cancelled." }], isError: true };
        }
        timeoutId = setTimeout(abort, CRITIQUE_TIMEOUT_MS);

        // Stream tool activity as progress
        unsubscribe = session.subscribe((event) => {
          if (event.type === "tool_execution_start") {
            const args = event.args as Record<string, unknown>;
            const label = args?.path ?? args?.pattern ?? "";
            if (label) onUpdate?.({ content: [{ type: "text", text: `${event.toolName}: ${label}` }] });
          }
        });

        await session.prompt(userPrompt);
        const response = session.getLastAssistantText() ?? "";

        if (!response.trim()) {
          return { content: [{ type: "text", text: "Critic returned empty. Try again." }], isError: true };
        }

        const stats = session.getSessionStats();
        return {
          content: [{ type: "text", text: response }],
          details: {
            model: modelLabel,
            fullResponse: response,
            tokens: { input: stats.tokens.input, output: stats.tokens.output, cost: stats.cost },
          },
        };
      } catch (err: any) {
        if (signal?.aborted || err?.name === "AbortError" || err?.code === "ABORT_ERR") {
          return { content: [{ type: "text", text: "Critique was cancelled." }], isError: true };
        }
        return {
          content: [{ type: "text", text: `Critique failed (${modelLabel}): ${err?.message ?? err}` }],
          isError: true,
        };
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        signal?.removeEventListener("abort", abort);
        unsubscribe?.();
        disposed = true;
        session.dispose();
      }
    },

    renderCall(args, theme) {
      const container = new Container();

      // Header line
      let header = theme.fg("toolTitle", theme.bold("critique"));
      if (args.focus) header += " " + theme.fg("accent", `[${args.focus}]`);
      container.addChild(new Text(header, 0, 0));

      // Full plan content
      if (args.content) {
        container.addChild(new Text("", 0, 0));
        container.addChild(new Markdown(args.content, 0, 0, getMarkdownTheme()));
      }

      // Related files
      if (args.relatedFiles?.length) {
        container.addChild(new Text("", 0, 0));
        container.addChild(new Text(theme.fg("muted", "── Related files ──"), 0, 0));
        for (const file of args.relatedFiles) {
          container.addChild(new Text("  " + theme.fg("accent", file), 0, 0));
        }
      }

      return container;
    },

    renderResult(result, _state, theme) {
      const details = result.details as
        | { model: string; fullResponse: string; tokens: { cost: number } }
        | undefined;

      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "(no output)", 0, 0);
      }

      const container = new Container();
      container.addChild(new Markdown(details.fullResponse.trim(), 0, 0, getMarkdownTheme()));

      const costStr = details.tokens.cost > 0 ? `$${details.tokens.cost.toFixed(4)}` : "";
      const footer = [details.model, costStr].filter(Boolean).join("  ");
      container.addChild(new Text("", 0, 0));
      container.addChild(new Text(theme.fg("dim", footer), 0, 0));

      return container;
    },
  });
}
