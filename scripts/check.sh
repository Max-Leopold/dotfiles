#!/usr/bin/env bash

set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
bootstrap_nvim=false

if [ "${1:-}" = "--bootstrap-nvim" ]; then
  bootstrap_nvim=true
elif [ "$#" -ne 0 ]; then
  echo "Usage: $0 [--bootstrap-nvim]" >&2
  exit 2
fi

for command_name in bash chezmoi git jq tmux zsh; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Missing required command: $command_name" >&2
    exit 1
  }
done

echo "Checking shell syntax"
bash -n \
  "$repo_dir/dot_bashrc" \
  "$repo_dir/dot_config/bash/rc" \
  "$repo_dir/dot_config/bash/shell" \
  "$repo_dir/dot_config/bash/init" \
  "$repo_dir/dot_config/bash/prompt" \
  "$repo_dir/dot_config/shell/aliases" \
  "$repo_dir/dot_config/shell/envs" \
  "$repo_dir/dot_config/shell/functions" \
  "$repo_dir/dot_config/shell/linux"

zsh -n \
  "$repo_dir/dot_zshrc" \
  "$repo_dir/dot_config/zsh/rc" \
  "$repo_dir/dot_config/zsh/shell" \
  "$repo_dir/dot_config/zsh/init" \
  "$repo_dir/dot_config/zsh/prompt" \
  "$repo_dir/dot_config/shell/aliases" \
  "$repo_dir/dot_config/shell/envs" \
  "$repo_dir/dot_config/shell/functions" \
  "$repo_dir/dot_config/shell/linux"

echo "Checking structured configuration"
jq empty "$repo_dir/dot_config/waybar/config"
git config --file "$repo_dir/dot_gitconfig" --list >/dev/null
printf '{}' | bash "$repo_dir/dot_pi/agent/modify_settings.json" | jq -e '
  .compaction.enabled == true
  and (has("skills") | not)
  and (has("prompts") | not)
  and (has("extensions") | not)
' >/dev/null
printf '%s' '{"skills":["~/custom-skill","~/.pi/agent/skills","~/.claude/skills"],"prompts":["~/custom-prompt","~/.claude/commands"],"extensions":["~/custom-extension","~/.pi/agent/extensions"]}' \
  | bash "$repo_dir/dot_pi/agent/modify_settings.json" \
  | jq -e '
      (.skills | index("~/custom-skill"))
      and (.prompts | index("~/custom-prompt"))
      and (.extensions | index("~/custom-extension"))
      and ((.skills | index("~/.pi/agent/skills")) == null)
      and ((.skills | index("~/.claude/skills")) == null)
      and ((.prompts | index("~/.claude/commands")) == null)
      and ((.extensions | index("~/.pi/agent/extensions")) == null)
    ' >/dev/null

echo "Checking Chezmoi templates"
chezmoi -S "$repo_dir" managed >/dev/null
chezmoi -S "$repo_dir" execute-template --init <"$repo_dir/.chezmoi.toml.tmpl" >/dev/null

temp_dir=$(mktemp -d)
tmux_socket="dotfiles-check-$$"
cleanup() {
  tmux -L "$tmux_socket" kill-server >/dev/null 2>&1 || true
  rm -rf "$temp_dir"
}
trap cleanup EXIT

for platform in darwin linux; do
  chezmoi --override-data "{\"chezmoi\":{\"os\":\"$platform\"}}" -S "$repo_dir" \
    execute-template <"$repo_dir/dot_config/tmux/tmux.conf.tmpl" >"$temp_dir/tmux.conf"
  tmux -L "$tmux_socket" -f "$temp_dir/tmux.conf" new-session -d
  tmux -L "$tmux_socket" kill-server

done

if command -v alacritty >/dev/null 2>&1; then
  echo "Checking Alacritty configuration"
  alacritty migrate --dry-run --config-file "$repo_dir/dot_config/alacritty/alacritty.toml" >/dev/null
fi

if command -v nvim >/dev/null 2>&1; then
  echo "Checking Lua syntax"
  nvim --headless -u NONE \
    "+lua for _, file in ipairs(vim.fn.glob('$repo_dir/dot_config/nvim/**/*.lua', false, true)) do assert(loadfile(file)) end" \
    +qa
fi

if $bootstrap_nvim; then
  command -v nvim >/dev/null 2>&1 || {
    echo "Missing required command: nvim" >&2
    exit 1
  }

  echo "Bootstrapping Neovim in an isolated home"
  mkdir -p "$temp_dir/home" "$temp_dir/config" "$temp_dir/data" "$temp_dir/state" "$temp_dir/cache"
  cp -R "$repo_dir/dot_config/nvim" "$temp_dir/config/nvim"

  bootstrap_log="$temp_dir/nvim-bootstrap.log"
  if ! env \
    HOME="$temp_dir/home" \
    XDG_CONFIG_HOME="$temp_dir/config" \
    XDG_DATA_HOME="$temp_dir/data" \
    XDG_STATE_HOME="$temp_dir/state" \
    XDG_CACHE_HOME="$temp_dir/cache" \
    nvim --headless '+Lazy! restore' +qa >"$bootstrap_log" 2>&1; then
    tr '\r' '\n' <"$bootstrap_log" | tail -100 >&2
    exit 1
  fi

  if tr '\r' '\n' <"$bootstrap_log" | grep -Eiq 'Error detected|failed: [1-9]|invalid plugin spec'; then
    tr '\r' '\n' <"$bootstrap_log" | grep -Ei 'Error detected|failed: [1-9]|invalid plugin spec' >&2
    exit 1
  fi

  env \
    HOME="$temp_dir/home" \
    XDG_CONFIG_HOME="$temp_dir/config" \
    XDG_DATA_HOME="$temp_dir/data" \
    XDG_STATE_HOME="$temp_dir/state" \
    XDG_CACHE_HOME="$temp_dir/cache" \
    nvim --headless +qa
fi

echo "All checks passed"
