/**
 * Async file picker overlay -- triggered by `#` or `/files`
 *
 * Split-pane layout: left panel has search + file list, right panel shows
 * a syntax-highlighted preview of the selected file's contents.
 *
 * Spawns `fd | fzf --filter` on each keystroke (debounced) for fast fuzzy
 * file search that scales to any repo size.
 *
 * Tradeoff: `#` is consumed by the shortcut and can't be typed in the editor.
 * Use `/files` as an alternative trigger.
 *
 * Requires: `fd` and `fzf` on PATH.
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { highlightCode, getLanguageFromPath } from "@mariozechner/pi-coding-agent";
import type { TUI, Focusable } from "@mariozechner/pi-tui";
import { Input, getEditorKeybindings, matchesKey, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn, type ChildProcess } from "child_process";
import { readFile, stat } from "fs/promises";
import { basename, dirname } from "path";
import { createInterface } from "readline";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_RESULTS = 200;
const DEBOUNCE_MS = 80;
const SEPARATOR = Symbol("separator");

// UI characters
const ELLIPSIS = "…";
const ARROW_UP = "↑";
const ARROW_DOWN = "↓";
const POINTER = "▶";
const MIDDLE_DOT = "·";
const RETURN_KEY = "⏎";

// Box-drawing characters
const BOX_TOP_LEFT = "╭";
const BOX_TOP_RIGHT = "╮";
const BOX_BOTTOM_LEFT = "╰";
const BOX_BOTTOM_RIGHT = "╯";
const BOX_HORIZONTAL = "─";
const BOX_VERTICAL = "│";
const BOX_T_DOWN = "┬";
const BOX_T_UP = "┴";
const BOX_T_RIGHT = "├";
const BOX_T_LEFT = "┤";
type PanelLine = string | typeof SEPARATOR;

/** Read a file, rejecting if it exceeds maxSize.
 *  Note: TOCTOU race between stat and read -- acceptable for a UI preview. */
async function readFileChecked(path: string, maxSize: number): Promise<Buffer> {
    const s = await stat(path);
    if (s.size > maxSize) {
        throw Object.assign(new Error("File too large"), { code: "ETOOLARGE" });
    }
    return readFile(path);
}

/**
 * Spawn `fd | fzf --filter=query` and collect up to MAX_RESULTS lines.
 * If query is empty, just runs `fd` (no fzf) for the initial file listing.
 * Kills the pipeline early once enough results are collected.
 */
async function runSearch(query: string, signal: AbortSignal): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const fdArgs = ["--type", "f", "--type", "d", "--hidden", "--exclude", ".git"];

        // No query: just list files, capped by fd itself
        if (!query) {
            fdArgs.push("--max-results", String(MAX_RESULTS));
        }

        const fd = spawn("fd", fdArgs, { stdio: "pipe" });
        let fzf: ChildProcess | undefined;
        let source: ChildProcess = fd;

        if (query) {
            fzf = spawn("fzf", ["--filter", query], { stdio: "pipe" });
            fd.stdout.pipe(fzf.stdin);
            // Suppress EPIPE when the pipeline is killed mid-stream
            fd.stdout.on("error", () => {});
            fzf.stdin.on("error", () => {});
            // If fd errors, close fzf's stdin so it can finish
            fd.on("error", () => fzf?.stdin?.end());
            source = fzf;
        }

        const kill = () => {
            fd.kill();
            fzf?.kill();
        };
        signal.addEventListener("abort", kill, { once: true });

        const lines: string[] = [];
        let done = false;

        const rl = createInterface({ input: source.stdout! });
        rl.on("error", () => {}); // Suppress errors when pipeline is killed

        rl.on("line", (line) => {
            if (done || !line) return;
            lines.push(line);
            if (lines.length >= MAX_RESULTS) {
                done = true;
                kill();
                rl.close();
                resolve(lines);
            }
        });

        rl.on("close", () => {
            if (done) return;
            done = true;
            resolve(lines);
        });

        // fzf exits with 1 when no matches -- that's not an error
        source.on("error", (err) => {
            if (done) return;
            done = true;
            reject(err);
        });

        fd.on("error", (err) => {
            if (done || fzf) return; // fzf handles fd errors via stdin close
            done = true;
            reject(err);
        });

        // Suppress unhandled EPIPE when we kill fd while fzf is piping
        fd.stderr?.resume();
        fzf?.stderr?.resume();
    });
}

interface FileItem {
    path: string;
    name: string;
    dir: string;
    isDirectory: boolean;
}

function parseFiles(paths: string[]): FileItem[] {
    return paths.map((p) => {
        const isDir = p.endsWith("/");
        const clean = isDir ? p.slice(0, -1) : p;
        return {
            path: p,
            name: basename(clean) + (isDir ? "/" : ""),
            dir: dirname(clean),
            isDirectory: isDir,
        };
    });
}

/** Truncate a string from the left to fit within maxWidth visual columns, prepending ellipsis. */
function truncateFromLeft(text: string, maxWidth: number, ellipsis = ELLIPSIS): string {
    if (visibleWidth(text) <= maxWidth) return text;
    const ellipsisW = visibleWidth(ellipsis);
    let start = 0;
    while (start < text.length && visibleWidth(text.slice(start)) + ellipsisW > maxWidth) {
        start++;
    }
    return ellipsis + text.slice(start);
}

function isBinary(buf: Buffer): boolean {
    for (let i = 0; i < Math.min(buf.length, 512); i++) {
        if (buf[i] === 0) return true;
    }
    return false;
}

interface Layout {
    leftW: number;
    rightW: number;
    listRows: number;
    totalRows: number;
    previewContentRows: number;
}

class FilePickerOverlay implements Focusable {
    private input: Input;
    private results: FileItem[] = [];
    private selectedIndex = 0;
    private loading = true;
    private error: string | null = null;
    private query = "";
    private layout: Layout;

    // Search lifecycle
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private currentSearch: AbortController | null = null;

    // Preview state
    private previewPath: string | null = null;
    private previewLines: string[] = [];
    private previewLoading = false;
    private previewError: string | null = null;
    private previewScroll = 0;

    // Focusable -- propagate to Input for IME cursor positioning
    private _focused = false;
    get focused(): boolean { return this._focused; }
    set focused(value: boolean) {
        this._focused = value;
        this.input.focused = value;
    }

    constructor(
        private tui: TUI,
        private theme: Theme,
        private done: (result: string | null) => void,
    ) {
        this.input = new Input();
        this.layout = this.computeLayout(80);
        this.search(); // initial listing
    }

    // --- Layout ---

    private computeLayout(width: number): Layout {
        const innerW = width - 2;               // subtract left + right border
        const leftW = Math.floor(innerW * 0.5);
        const rightW = innerW - leftW - 1;      // -1 for center divider

        const listRows = 18;
        const headerRows = 4;                   // title + blank + input + separator
        const footerRows = 3;                   // info + blank + help
        const totalRows = headerRows + listRows + footerRows;
        const previewContentRows = totalRows - 2; // minus preview header (title + blank)

        return { leftW, rightW, listRows, totalRows, previewContentRows };
    }

    // --- Search ---

    private scheduleSearch(): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.search(), DEBOUNCE_MS);
    }

    private search(): void {
        this.currentSearch?.abort();
        this.currentSearch = new AbortController();
        const signal = this.currentSearch.signal;

        this.loading = true;

        runSearch(this.query, signal)
            .then((paths) => {
                if (signal.aborted) return;
                this.results = parseFiles(paths);
                this.selectedIndex = 0;
                this.loading = false;
                this.error = null;
                this.loadPreview();
                this.tui.requestRender();
            })
            .catch((err) => {
                if (signal.aborted) return;
                this.loading = false;
                const msg = err?.message ?? "unknown";
                if (msg.includes("ENOENT")) {
                    this.error = "fd/fzf not found -- install both";
                } else {
                    this.error = `Error: ${msg}`;
                }
                this.tui.requestRender();
            });
    }

    private cleanup(): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.currentSearch?.abort();
    }

    // --- Preview ---

    private loadPreview(): void {
        const item = this.results[this.selectedIndex];
        if (!item || item.isDirectory) {
            this.previewPath = item?.path ?? null;
            this.previewLines = item ? ["", "  (directory)"] : [];
            this.previewError = null;
            this.previewLoading = false;
            this.previewScroll = 0;
            return;
        }

        if (item.path === this.previewPath) return;
        this.previewPath = item.path;
        this.previewLoading = true;
        this.previewError = null;
        this.previewScroll = 0;

        const path = item.path;
        readFileChecked(path, MAX_FILE_SIZE)
            .then((buf) => {
                if (this.previewPath !== path) return; // stale

                if (isBinary(buf)) {
                    this.previewLines = ["", "  (binary file)"];
                } else {
                    const text = buf.toString("utf-8");
                    const lang = getLanguageFromPath(path);
                    this.previewLines = highlightCode(text, lang);
                }
                this.previewLoading = false;
                this.tui.requestRender();
            })
            .catch((err) => {
                if (this.previewPath !== path) return; // stale
                this.previewLoading = false;
                const code = err?.code;
                this.previewError = code === "EISDIR" ? "(directory)"
                    : code === "ETOOLARGE" ? "(file too large)"
                    : (err?.message ?? "read error");
                this.previewLines = [];
                this.tui.requestRender();
            });
    }

    // --- Navigation ---

    private moveSelection(delta: number): void {
        if (this.results.length === 0) return;
        this.selectedIndex = (this.selectedIndex + delta + this.results.length) % this.results.length;
        this.loadPreview();
    }

    private scrollPreview(delta: number): void {
        const maxScroll = Math.max(0, this.previewLines.length - this.layout.previewContentRows);
        this.previewScroll = Math.max(0, Math.min(this.previewScroll + delta, maxScroll));
    }

    // --- Input handling ---

    handleInput(data: string): void {
        const kb = getEditorKeybindings();

        // --- Close ---
        if (kb.matches(data, "selectCancel")) {
            this.cleanup();
            this.done(null);
            return;
        }

        // --- Confirm ---
        if (kb.matches(data, "selectConfirm")) {
            const item = this.results[this.selectedIndex];
            this.cleanup();
            this.done(item?.path ?? null);
            return;
        }

        // --- File list navigation ---
        if (kb.matches(data, "selectUp") || matchesKey(data, "ctrl+p") || matchesKey(data, "ctrl+k")) {
            this.moveSelection(-1);
            this.tui.requestRender();
            return;
        }

        if (kb.matches(data, "selectDown") || matchesKey(data, "ctrl+n") || matchesKey(data, "ctrl+j")) {
            this.moveSelection(1);
            this.tui.requestRender();
            return;
        }

        // --- Preview scrolling (half-page) ---
        const halfPage = Math.max(1, Math.floor(this.layout.previewContentRows / 2));

        if (matchesKey(data, "ctrl+d")) {
            this.scrollPreview(halfPage);
            this.tui.requestRender();
            return;
        }

        if (matchesKey(data, "ctrl+u")) {
            this.scrollPreview(-halfPage);
            this.tui.requestRender();
            return;
        }

        // --- Preview scrolling (single line) ---
        if (matchesKey(data, "ctrl+e")) {
            this.scrollPreview(1);
            this.tui.requestRender();
            return;
        }

        if (matchesKey(data, "ctrl+y")) {
            this.scrollPreview(-1);
            this.tui.requestRender();
            return;
        }

        // --- Everything else goes to the search input ---
        this.input.handleInput(data);
        const newQuery = this.input.getValue();
        if (newQuery !== this.query) {
            this.query = newQuery;
            this.scheduleSearch();
        }
        this.tui.requestRender();
    }

    // --- Rendering ---

    private renderLeftPanel(layout: Layout): PanelLine[] {
        const th = this.theme;
        const { leftW, listRows } = layout;
        const lines: PanelLine[] = [];

        // Title
        lines.push(` ${th.fg("accent", th.bold("Find File"))}`);
        lines.push("");

        // Search input
        for (const line of this.input.render(leftW - 2)) {
            lines.push(` ${line}`);
        }

        // Separator
        lines.push(SEPARATOR);

        // File list
        let fileListRendered = 0;
        if (this.loading) {
            lines.push(` ${th.fg("muted", "Searching...")}`);
            fileListRendered = 1;
        } else if (this.error) {
            lines.push(` ${th.fg("error", this.error)}`);
            fileListRendered = 1;
        } else if (this.results.length === 0) {
            lines.push(` ${th.fg("warning", "No matches")}`);
            fileListRendered = 1;
        } else {
            const total = this.results.length;
            const visible = Math.min(listRows, total);
            const halfVisible = Math.floor(visible / 2);
            const start = Math.max(0, Math.min(
                this.selectedIndex - halfVisible,
                total - visible,
            ));
            const end = Math.min(start + visible, total);

            for (let i = start; i < end; i++) {
                const item = this.results[i]!;
                const isSelected = i === this.selectedIndex;
                const prefix = isSelected ? th.fg("accent", `${POINTER} `) : "  ";
                const nameStr = isSelected ? th.fg("accent", item.name) : item.name;
                let dirStr = "";
                if (item.dir !== ".") {
                    const nameWidth = visibleWidth(` ${prefix}${nameStr} `);
                    const availableForDir = leftW - nameWidth;
                    dirStr = ` ${th.fg("dim", truncateFromLeft(item.dir, availableForDir))}`;
                }
                lines.push(truncateToWidth(` ${prefix}${nameStr}${dirStr}`, leftW, ELLIPSIS));
                fileListRendered++;
            }
        }

        // Pad file list to fixed height
        for (let i = fileListRendered; i < listRows; i++) {
            lines.push("");
        }

        // Info line
        const total = this.results.length;
        if (!this.loading && !this.error && total > 0) {
            lines.push(th.fg("dim", `  ${this.selectedIndex + 1}/${total}`));
        } else {
            lines.push("");
        }

        // Help
        lines.push("");
        lines.push(` ${th.fg("dim", `${ARROW_UP}${ARROW_DOWN}/C-n/p nav ${MIDDLE_DOT} C-d/u scroll ${MIDDLE_DOT} ${RETURN_KEY}/esc`)}`);

        return lines;
    }

    private renderRightPanel(layout: Layout): string[] {
        const th = this.theme;
        const { rightW, totalRows } = layout;
        const lines: string[] = [];

        // Preview header
        const selectedItem = this.results[this.selectedIndex];
        const previewTitle = selectedItem
            ? truncateToWidth(selectedItem.path, rightW - 2, ELLIPSIS)
            : "No file selected";
        lines.push(` ${th.fg("muted", previewTitle)}`);
        lines.push("");

        // Preview content
        const contentHeight = totalRows - 2; // minus header lines above
        if (this.previewLoading) {
            lines.push(` ${th.fg("muted", "Loading...")}`);
        } else if (this.previewError) {
            lines.push(` ${th.fg("error", this.previewError)}`);
        } else if (this.previewLines.length === 0 && !selectedItem) {
            // no file selected
        } else {
            const pLines = this.previewLines;
            const start = this.previewScroll;
            const end = Math.min(start + contentHeight, pLines.length);
            for (let i = start; i < end; i++) {
                const line = (pLines[i] ?? "").replace(/\t/g, "  ");
                lines.push(truncateToWidth(` ${line}`, rightW, ELLIPSIS));
            }
        }

        // Pad to match left panel
        while (lines.length < totalRows) {
            lines.push("");
        }

        return lines;
    }

    private mergePanels(left: PanelLine[], right: string[], layout: Layout): string[] {
        const th = this.theme;
        const { leftW, rightW } = layout;
        const lines: string[] = [];

        const pad = (s: string, w: number) => {
            const vis = visibleWidth(s);
            return th.fg("text", s + " ".repeat(Math.max(0, w - vis)));
        };
        const border = (c: string) => th.fg("border", c);

        // Top border
        const h = BOX_HORIZONTAL;
        lines.push(border(`${BOX_TOP_LEFT}${h.repeat(leftW)}${BOX_T_DOWN}${h.repeat(rightW)}${BOX_TOP_RIGHT}`));

        // Content rows
        for (let i = 0; i < left.length; i++) {
            const l = left[i]!;
            const r = right[i] ?? "";

            if (l === SEPARATOR) {
                lines.push(
                    border(`${BOX_T_RIGHT}${h.repeat(leftW)}${BOX_T_LEFT}`)
                    + pad(r, rightW)
                    + border(BOX_VERTICAL)
                );
            } else {
                lines.push(
                    border(BOX_VERTICAL) + pad(l, leftW)
                    + border(BOX_VERTICAL) + pad(r, rightW)
                    + border(BOX_VERTICAL)
                );
            }
        }

        // Bottom border
        lines.push(border(`${BOX_BOTTOM_LEFT}${h.repeat(leftW)}${BOX_T_UP}${h.repeat(rightW)}${BOX_BOTTOM_RIGHT}`));

        return lines;
    }

    render(width: number): string[] {
        this.layout = this.computeLayout(width);
        const left = this.renderLeftPanel(this.layout);
        const right = this.renderRightPanel(this.layout);
        return this.mergePanels(left, right, this.layout);
    }

    invalidate(): void {}
}

async function openFilePicker(ctx: ExtensionContext): Promise<void> {
    let appTui: TUI | null = null;
    const result = await ctx.ui.custom<string | null>(
        (tui, theme, _kb, done) => {
            appTui = tui;
            return new FilePickerOverlay(tui, theme, done);
        },
        {
            overlay: true,
            overlayOptions: {
                anchor: "center",
                width: "90%",
                minWidth: 80,
                maxHeight: "80%",
                visible: (w: number) => w >= 80,
            },
        },
    );

    if (result) {
        ctx.ui.pasteToEditor(`${result} `);
        appTui?.requestRender();
    }
}

export default function (pi: ExtensionAPI) {
    pi.registerShortcut("#", {
        description: "Open file picker",
        handler: async (ctx) => openFilePicker(ctx),
    });

    pi.registerCommand("files", {
        description: "Open async file picker overlay",
        handler: async (_args, ctx) => openFilePicker(ctx),
    });
}
