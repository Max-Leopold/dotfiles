import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const SERVICE_TIER = "priority";
const COMMAND_ARGS = ["on", "off", "status"] as const;
const SUPPORTED_MODELS = new Set([
	"openai/gpt-5.4",
	"openai/gpt-5.5",
	"openai-codex/gpt-5.4",
	"openai-codex/gpt-5.5",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function modelKey(model: ExtensionContext["model"]): string | undefined {
	if (!model) return undefined;
	return `${model.provider}/${model.id}`;
}

function isSupportedModel(ctx: ExtensionContext): boolean {
	const key = modelKey(ctx.model);
	return key !== undefined && SUPPORTED_MODELS.has(key);
}

function supportedModelsDescription(): string {
	return [...SUPPORTED_MODELS].join(", ");
}

function describeStatus(ctx: ExtensionContext, enabled: boolean): string {
	const currentModel = modelKey(ctx.model) ?? "none";

	if (!enabled) {
		return `Fast mode is off for this session. Current model: ${currentModel}.`;
	}

	if (isSupportedModel(ctx)) {
		return `Fast mode is on for this session. ${currentModel} requests use service_tier=${SERVICE_TIER}.`;
	}

	return `Fast mode is on for this session, but ${currentModel} is not configured for it. Supported models: ${supportedModelsDescription()}.`;
}

export default function (pi: ExtensionAPI) {
	let enabled = false;

	pi.registerCommand("fast", {
		description: "Toggle OpenAI priority service tier for supported models",
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
		if (!enabled || !isSupportedModel(ctx) || !isRecord(event.payload)) return;
		return { ...event.payload, service_tier: SERVICE_TIER };
	});
}
