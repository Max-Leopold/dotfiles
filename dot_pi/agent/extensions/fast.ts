import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

type Payload = Record<string, unknown>;

interface FastMode {
	description: string;
	apply: (payload: Payload) => Payload;
}

const COMMAND_ARGS = ["on", "off", "status"] as const;

const OPENAI_PRIORITY: FastMode = {
	description: "service_tier=priority",
	apply: (payload) => ({ ...payload, service_tier: "priority" }),
};

const ANTHROPIC_FAST_BETA = "fast-mode-2026-02-01";
const ANTHROPIC_FAST: FastMode = {
	description: `speed=fast (${ANTHROPIC_FAST_BETA})`,
	apply: (payload) => {
		const betas = Array.isArray(payload.betas) ? payload.betas : [];
		return {
			...payload,
			speed: "fast",
			betas: betas.includes(ANTHROPIC_FAST_BETA) ? betas : [...betas, ANTHROPIC_FAST_BETA],
		};
	},
};

// Anthropic rejects `speed` on models without fast mode (e.g. claude-fable-5, claude-opus-4-7, claude-sonnet-5),
// so only list models verified against the API.
const SUPPORTED_MODELS = new Map<string, FastMode>([
	["openai/gpt-5.4", OPENAI_PRIORITY],
	["openai/gpt-5.5", OPENAI_PRIORITY],
	["openai-codex/gpt-5.4", OPENAI_PRIORITY],
	["openai-codex/gpt-5.5", OPENAI_PRIORITY],
	["anthropic/claude-opus-4-8", ANTHROPIC_FAST],
	["anthropic/claude-opus-5", ANTHROPIC_FAST],
	["anthropic/claude-opus-5-5", ANTHROPIC_FAST],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function modelKey(model: ExtensionContext["model"]): string | undefined {
	if (!model) return undefined;
	return `${model.provider}/${model.id}`;
}

function fastModeFor(ctx: ExtensionContext): FastMode | undefined {
	const key = modelKey(ctx.model);
	return key === undefined ? undefined : SUPPORTED_MODELS.get(key);
}

function supportedModelsDescription(): string {
	return [...SUPPORTED_MODELS.keys()].join(", ");
}

function describeStatus(ctx: ExtensionContext, enabled: boolean): string {
	const currentModel = modelKey(ctx.model) ?? "none";

	if (!enabled) {
		return `Fast mode is off for this session. Current model: ${currentModel}.`;
	}

	const mode = fastModeFor(ctx);
	if (mode) {
		return `Fast mode is on for this session. ${currentModel} requests use ${mode.description}.`;
	}

	return `Fast mode is on for this session, but ${currentModel} does not support it. Supported models: ${supportedModelsDescription()}.`;
}

export default function (pi: ExtensionAPI) {
	let enabled = false;

	pi.registerCommand("fast", {
		description: "Toggle fast mode (OpenAI priority tier, Anthropic speed=fast) for supported models",
		getArgumentCompletions: (prefix) => {
			const items = COMMAND_ARGS.filter((value) => value.startsWith(prefix)).map((value) => ({
				value,
				label: value,
			}));
			return items.length > 0 ? items : null;
		},
		handler: async (args, ctx) => {
			const command = args.trim().toLowerCase();

			switch (command) {
				case "on":
					enabled = true;
					ctx.ui.notify(describeStatus(ctx, enabled), "info");
					return;
				case "off":
					enabled = false;
					ctx.ui.notify(describeStatus(ctx, enabled), "info");
					return;
				case "status":
					ctx.ui.notify(describeStatus(ctx, enabled), "info");
					return;
				default:
					ctx.ui.notify("Usage: /fast on | /fast off | /fast status", "error");
			}
		},
	});

	pi.on("before_provider_request", (event, ctx) => {
		const mode = enabled ? fastModeFor(ctx) : undefined;
		if (!mode || !isRecord(event.payload)) return;
		return mode.apply(event.payload);
	});
}
