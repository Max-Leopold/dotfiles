return {
  'dmtrKovalenko/fff.nvim',
  build = function()
    require('fff.download').download_or_build_binary()
  end,
  opts = {
    layout = {
      prompt_position = 'top',
    },
    debug = {
      enabled = false,
      show_scores = false,
    },
    prompt = '🔎 ',
    lazy_sync = false,
  },
  lazy = false,
  keys = {
    {
      '<leader><space>', -- try it if you didn't it is a banger keybinding for a picker
      function()
        require('fff').find_files() -- or find_in_git_root() if you only want git files
      end,
      desc = 'Open file picker',
    },
  },
}
