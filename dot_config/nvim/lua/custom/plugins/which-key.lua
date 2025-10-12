return {
  'folke/which-key.nvim',
  event = 'VeryLazy',
  opts_extend = { 'spec' },
  opts = {
    preset = 'helix',
    defaults = {},
    spec = {
      {
        mode = { 'n', 'v' },
        { '<leader><tab>', group = 'Tabs' },
        { '<leader>c', group = '[C]ode' },
        { '<leader>f', group = '[F]ind / [F]ile' },
        { '<leader>g', group = '[G]it' },
        { '<leader>gh', group = '[H]unks' },
        { '<leader>q', group = '[Q]uit' },
        { '<leader>s', group = '[S]earch' },
        { '<leader>t', group = '[T]est' },
        { '<leader>x', group = '[X]code' },
        { '[', group = 'prev' },
        { ']', group = 'next' },
        { 'g', group = 'goto' },
        { 'gs', group = 'surround' },
        { 'z', group = 'fold' },
        {
          '<leader>b',
          group = '[B]uffer',
          expand = function()
            return require('which-key.extras').expand.buf()
          end,
        },
        {
          '<leader>w',
          group = '[W]indows',
          proxy = '<c-w>',
          expand = function()
            return require('which-key.extras').expand.win()
          end,
        },
        -- better descriptions
        { 'gx', desc = 'Open with system app' },
      },
    },
  },
  keys = {
    {
      '<leader>?',
      function()
        require('which-key').show { global = false }
      end,
      desc = 'Buffer Keymaps (which-key)',
    },
    {
      '<c-w><space>',
      function()
        require('which-key').show { keys = '<c-w>', loop = true }
      end,
      desc = 'Window Hydra Mode (which-key)',
    },
  },
}
