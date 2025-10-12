return {
  'navarasu/onedark.nvim',
  priority = 1001,
  config = function()
    require('onedark').setup {
      style = 'darker',
    }
    require('onedark').load()
  end,
}
