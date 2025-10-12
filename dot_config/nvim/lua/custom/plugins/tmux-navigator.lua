return {
  'christoomey/vim-tmux-navigator',
  lazy = false, -- Don't lazy load this plugin
  config = function()
    -- Disable default mappings since we'll set our own
    vim.g.tmux_navigator_no_mappings = 1

    -- Set up our own mappings for normal mode
    vim.keymap.set('n', '<C-h>', '<cmd>TmuxNavigateLeft<cr>', { silent = true })
    vim.keymap.set('n', '<C-j>', '<cmd>TmuxNavigateDown<cr>', { silent = true })
    vim.keymap.set('n', '<C-k>', '<cmd>TmuxNavigateUp<cr>', { silent = true })
    vim.keymap.set('n', '<C-l>', '<cmd>TmuxNavigateRight<cr>', { silent = true })
    vim.keymap.set('n', '<C-\\>', '<cmd>TmuxNavigatePrevious<cr>', { silent = true })

    -- IMPORTANT: Set up terminal mode mappings
    vim.keymap.set('t', '<C-h>', '<C-\\><C-n><cmd>TmuxNavigateLeft<cr>', { silent = true })
    vim.keymap.set('t', '<C-j>', '<C-\\><C-n><cmd>TmuxNavigateDown<cr>', { silent = true })
    vim.keymap.set('t', '<C-k>', '<C-\\><C-n><cmd>TmuxNavigateUp<cr>', { silent = true })
    vim.keymap.set('t', '<C-l>', '<C-\\><C-n><cmd>TmuxNavigateRight<cr>', { silent = true })
    vim.keymap.set('t', '<C-\\>', '<C-\\><C-n><cmd>TmuxNavigatePrevious<cr>', { silent = true })
  end,
}
