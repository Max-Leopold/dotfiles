return { -- Autocompletion
  'saghen/blink.cmp',
  event = 'VimEnter',
  version = '1.*',
  dependencies = {
    'folke/lazydev.nvim',
    'fang2hou/blink-copilot',
  },
  --- @module 'blink.cmp'
  --- @type blink.cmp.Config
  opts = {
    keymap = {
      -- 'default' (recommended) for mappings similar to built-in completions
      --   <c-y> to accept ([y]es) the completion.
      --    This will auto-import if your LSP supports it.
      --    This will expand snippets if the LSP sent a snippet.
      -- 'super-tab' for tab to accept
      -- 'enter' for enter to accept
      -- 'none' for no mappings
      --
      -- For an understanding of why the 'default' preset is recommended,
      -- you will need to read `:help ins-completion`
      --
      -- No, but seriously. Please read `:help ins-completion`, it is really good!
      --
      -- All presets have the following mappings:
      -- <tab>/<s-tab>: move to right/left of your snippet expansion
      -- <c-space>: Open menu or open docs if already open
      -- <c-n>/<c-p> or <up>/<down>: Select next/previous item
      -- <c-e>: Hide menu
      -- <c-k>: Toggle signature help
      --
      -- See :h blink-cmp-config-keymap for defining your own keymap
      preset = 'default',
    },

    appearance = {
      -- 'mono' (default) for 'Nerd Font Mono' or 'normal' for 'Nerd Font'
      -- Adjusts spacing to ensure icons are aligned
      nerd_font_variant = 'mono',
    },

    completion = {
      documentation = {
        auto_show = true,
        auto_show_delay_ms = 200,
        window = { border = 'rounded' },
      },
      ghost_text = { enabled = true },
      menu = {
        auto_show = true,
        draw = {
          columns = { { 'label', 'label_description', gap = 1 }, { 'kind_icon', 'kind' } },
        },
      },
      accept = {
        auto_brackets = {
          enabled = true,
        },
      },
      list = {
        selection = {
          preselect = false, -- Don't preselect first item
          auto_insert = false, -- Don't auto-insert on select
        },
      },
    },

    sources = {
      default = { 'lsp', 'path', 'lazydev', 'copilot' },
      providers = {
        lazydev = { module = 'lazydev.integrations.blink', score_offset = 100 },
        copilot = {
          name = 'copilot',
          module = 'blink-copilot',
          score_offset = 100,
          async = true,
        },
      },
    },

    -- Blink.cmp includes an optional, recommended rust fuzzy matcher,
    -- which automatically downloads a prebuilt binary when enabled.
    --
    -- By default, we use the Lua implementation instead, but you may enable
    -- the rust implementation via `'prefer_rust_with_warning'`
    --
    -- See :h blink-cmp-config-fuzzy for more information
    fuzzy = { implementation = 'lua' },

    -- Shows a signature help window while you type arguments for a function
    signature = { enabled = true },
  },
}
