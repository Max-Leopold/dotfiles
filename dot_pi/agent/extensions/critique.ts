/**
 * Critique Tool — Adversarial review before committing to a plan.
 *
 * Spins up a sub-agent with read-only tools to review plans, code, or designs
 * for real problems. Uses a different model to avoid echo-chamber bias.
 *
 * Usage: place in ~/.pi/agent/extensions/ and reload.
 */

import type { ExtensionAPI, ExtensionContext, ResourceLoader } from "@mariozechner/pi-coding-agent";
import {
  createAgentSession,
  createExtensionRuntime,
  createReadOnlyTools,
  getMarkdownTheme,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";
import { Container, Markdown, Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

// Preference order for critic model — tried first among available models.
// Any available model not in this list is still eligible as a fallback.
const MODEL_PREFERENCE: ReadonlyArray<[string, string]> = [
  ["anthropic", "claude-opus-4-6"],
  ["openai", "gpt-5.3-codex"],
  ["google", "gemini-3.1-pro-preview"],
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

type BasicModel = { provider: string; id: string; reasoning?: boolean };

type CriticModelResult = { model: BasicModel } | { error: string };

function modelLabel(model: Pick<BasicModel, "provider" | "id">) {
  return `${model.provider}/${model.id}`;
}

function formatAvailableModels(models: ReadonlyArray<BasicModel>) {
  if (!models.length) return "(none)";

  const sorted = [...models].sort((a, b) => modelLabel(a).localeCompare(modelLabel(b)));
  return sorted.map((m) => `- ${modelLabel(m)}`).join("\n");
}

function formatAvailableModelsBlock(models: ReadonlyArray<BasicModel>) {
  return `Available models:\n${formatAvailableModels(models)}`;
}

function formatErrorDetails(err: unknown) {
  const value = err as { message?: string; code?: string; status?: number; requestId?: string; cause?: unknown } | undefined;
  if (!value) return "unknown error";

  const parts = [
    value.message,
    typeof value.code === "string" ? `code=${value.code}` : undefined,
    typeof value.status === "number" ? `status=${value.status}` : undefined,
    typeof value.requestId === "string" ? `requestId=${value.requestId}` : undefined,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join("; ");
  return String(err);
}

function parseRequestedModel(requestedModel: string) {
  const value = requestedModel.trim();
  if (!value) return null;

  const slashIndex = value.indexOf("/");
  if (slashIndex === -1) {
    return { id: value };
  }

  const provider = value.slice(0, slashIndex).trim();
  const id = value.slice(slashIndex + 1).trim();
  if (!provider || !id) return null;

  return { provider, id };
}

function equalsIgnoreCase(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function findPreferredAvailableModel(available: BasicModel[]) {
  for (const [provider, id] of MODEL_PREFERENCE) {
    const match = available.find((m) => equalsIgnoreCase(m.provider, provider) && equalsIgnoreCase(m.id, id));
    if (match) return match;
  }

  const sorted = [...available].sort((a, b) => {
    if (a.reasoning !== b.reasoning) return a.reasoning ? -1 : 1;
    return modelLabel(a).localeCompare(modelLabel(b));
  });

  return sorted[0];
}

async function findCriticModel(ctx: ExtensionContext, requestedModel?: string): Promise<CriticModelResult> {
  const available = ctx.modelRegistry.getAvailable() as BasicModel[];

  if (!available.length) {
    return { error: "No model available for critique. Check your API keys." };
  }

  if (requestedModel) {
    const parsed = parseRequestedModel(requestedModel);
    if (!parsed) {
      return { error: `Invalid model format: "${requestedModel}". Use "provider/model-id" or "model-id".` };
    }

    if ("provider" in parsed) {
      const exactAvailable = available.find((m) =>
        equalsIgnoreCase(m.provider, parsed.provider) && equalsIgnoreCase(m.id, parsed.id),
      );
      if (exactAvailable) return { model: exactAvailable };

      const configuredModel = ctx.modelRegistry.find(parsed.provider, parsed.id) as BasicModel | undefined;
      if (configuredModel) {
        const key = await ctx.modelRegistry.getApiKey(configuredModel).catch(() => undefined);
        if (!key) {
          return {
            error: `Requested critique model "${parsed.provider}/${parsed.id}" exists, but API credentials for provider "${parsed.provider}" are missing.`,
          };
        }
      }

      return {
        error:
          `Requested critique model "${parsed.provider}/${parsed.id}" is not available.\n\n` +
          formatAvailableModelsBlock(available),
      };
    }

    const idMatches = available.filter((m) => equalsIgnoreCase(m.id, parsed.id));
    if (idMatches.length === 1) return { model: idMatches[0]! };

    if (idMatches.length > 1) {
      return {
        error:
          `Requested critique model id "${parsed.id}" is ambiguous across providers. Use provider/model-id.\n\n` +
          formatAvailableModelsBlock(available),
      };
    }

    return {
      error:
        `Requested critique model "${parsed.id}" was not found among available models.\n\n` +
        formatAvailableModelsBlock(available),
    };
  }

  const preferred = findPreferredAvailableModel(available);
  if (preferred) return { model: preferred };

  return {
    error: `No model with API credentials is available for critique.\n\n${formatAvailableModelsBlock(available)}`,
  };
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
      model: Type.Optional(
        Type.String({
          description:
            "Optional critique model override. Use \"provider/model-id\" (e.g. \"anthropic/claude-sonnet-4-5\") or a bare model id.",
        }),
      ),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      if (!params.content.trim()) {
        return { content: [{ type: "text", text: "Cannot critique empty content." }], isError: true };
      }

      const requestedModel = typeof params.model === "string" ? params.model.trim() : "";
      const criticResult = await findCriticModel(ctx, requestedModel || undefined);
      if ("error" in criticResult) {
        return { content: [{ type: "text", text: criticResult.error }], isError: true };
      }

      const critic = criticResult;
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
          modelRegistry: ctx.modelRegistry,
        }));
      } catch (err: unknown) {
        return {
          content: [{ type: "text", text: `Failed to start critic (${modelLabel}): ${formatErrorDetails(err)}` }],
          isError: true,
        };
      }

      let disposed = false;
      const abort = () => { if (!disposed) session.abort(); };
      let unsubscribe: (() => void) | undefined;

      try {
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) {
          return { content: [{ type: "text", text: "Critique was cancelled." }], isError: true };
        }
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
        const stats = session.getSessionStats();
        const lastAssistant = [...(session.messages as Array<{ role: string; stopReason?: string }>)]
          .reverse()
          .find((message) => message.role === "assistant");

        if (!response.trim()) {
          if (signal?.aborted || lastAssistant?.stopReason === "aborted") {
            return { content: [{ type: "text", text: "Critique was cancelled." }], isError: true };
          }

          const availableModels = ctx.modelRegistry.getAvailable() as BasicModel[];

          return {
            content: [{
              type: "text",
              text:
                `Critique model ${modelLabel} returned an empty response (output tokens: ${stats.tokens.output}).\n\n` +
                formatAvailableModelsBlock(availableModels),
            }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: response }],
          details: {
            model: modelLabel,
            fullResponse: response,
            tokens: { input: stats.tokens.input, output: stats.tokens.output, cost: stats.cost },
          },
        };
      } catch (err: unknown) {
        if (signal?.aborted || (err as { name?: string; code?: string })?.name === "AbortError" || (err as { code?: string })?.code === "ABORT_ERR") {
          return { content: [{ type: "text", text: "Critique was cancelled." }], isError: true };
        }
        return {
          content: [{ type: "text", text: `Critique failed (${modelLabel}): ${formatErrorDetails(err)}` }],
          isError: true,
        };
      } finally {
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
      if (args.model) header += " " + theme.fg("dim", `(model: ${args.model})`);
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
