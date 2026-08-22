# dotfiles

Personal configuration managed with [chezmoi](https://www.chezmoi.io/). The common shell, Git, Alacritty, tmux, Neovim, Claude Code, and Pi configuration works on macOS and Linux. Hyprland, Waybar, Wofi, and btop are deployed only on Linux.

## Bootstrap

On macOS, install the common command-line dependencies first:

```sh
brew bundle
```

Clone the repository, inspect the proposed changes, and apply them:

```sh
git clone git@github.com:Max-Leopold/dotfiles.git
cd dotfiles
chezmoi -S "$PWD" init
chezmoi -S "$PWD" diff
chezmoi -S "$PWD" apply
```

Chezmoi refuses to overwrite changed destination files without confirmation. Review the diff instead of forcing an apply.

## Local configuration

Machine- or employer-specific values stay outside this public repository:

- `~/.gitconfig.local` overrides Git identity or adds conditional includes.
- `~/.config/zsh/local` and `~/.config/bash/local` extend the managed shell setup.
- `~/.config/hypr/monitors.conf.local` contains monitor, scale, and hardware-specific Hyprland settings.

For example, a work Git identity can be scoped to a directory in `~/.gitconfig.local`:

```gitconfig
[includeIf "gitdir:~/Work/"]
    path = ~/.gitconfig.work
```

## Platform notes

The shell configuration deliberately avoids project-local `./bin` entries in `PATH`. Ruby projects can expose binstubs explicitly through their version manager, local shell file, or project tooling.

The Linux desktop profile expects an Omarchy-style installation plus Alacritty, Chromium, Hyprland, Waybar, Wofi, `wl-clipboard`, Clipse, Mako, the Tree-sitter CLI, and the utilities referenced in the Hyprland bindings. Hardware-specific environment variables such as NVIDIA options belong in `monitors.conf.local`.

Chezmoi does not delete files merely because they become ignored. On a Mac that previously received the Linux profile, review and manually remove the now-unmanaged `~/.config/hypr`, `waybar`, `wofi`, and `btop` directories.

Neovim targets the current stable 0.11 API. Treesitter is explicitly pinned to its backwards-compatible `master` branch; its newer `main` branch requires Neovim 0.12. `lazy-lock.json` makes clean installations reproducible.

Claude Code retains only the shared `CLAUDE.md` instructions. This repository no longer manages commands, skills, or agents.

## Validation

Run the local checks after changing configuration:

```sh
./scripts/check.sh
```

To additionally install all Neovim plugins in an isolated temporary home and verify startup:

```sh
./scripts/check.sh --bootstrap-nvim
```
