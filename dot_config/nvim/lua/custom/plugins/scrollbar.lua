return {
  'petertriho/nvim-scrollbar',
  dependencies = { 'lewis6991/gitsigns.nvim' },
  config = function()
    require('gitsigns').setup()
    require('scrollbar').setup({
      hide_if_all_visible = true,
      handle = {
        blend = 0, -- Make scrollbar fully opaque (0 = opaque, 100 = transparent)
        color = '#808080', -- Light grey color
      },
      excluded_filetypes = {
        'prompt',
        'TelescopePrompt',
        'noice',
        'notify',
      },
    })
    require('scrollbar.handlers.gitsigns').setup()
  end,
}