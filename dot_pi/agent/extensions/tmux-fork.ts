import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { access } from "node:fs/promises";

function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

function formatTmuxError(result: { stdout?: string; stderr?: string; code?: number | null }): string {
	const output = [result.stderr?.trim(), result.stdout?.trim()].filter(Boolean).join("\n");
	return output || `tmux exited with code ${result.code ?? "unknown"}`;
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("tmux-fork", {
		description: "Open a fork of the current pi session in a horizontal tmux split",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			const pane = process.env.TMUX_PANE;
			if (!process.env.TMUX || !pane) {
				ctx.ui.notify("tmux-fork must be run inside tmux", "error");
				return;
			}

			const sessionFile = ctx.sessionManager.getSessionFile();
			if (!sessionFile) {
				ctx.ui.notify("tmux-fork requires a persisted pi session", "error");
				return;
			}

			try {
				await access(sessionFile);
			} catch {
				ctx.ui.notify("Current pi session has not been written to disk yet", "error");
				return;
			}

			const command = `exec pi --fork ${shellQuote(sessionFile)}`;
			const result = await pi.exec("tmux", ["split-window", "-h", "-t", pane, "-c", ctx.cwd, command]);

			if (result.code === 0) {
				ctx.ui.notify("Opened fork in horizontal tmux split", "info");
				return;
			}

			ctx.ui.notify(`tmux-fork failed: ${formatTmuxError(result)}`, "error");
		},
	});
}
