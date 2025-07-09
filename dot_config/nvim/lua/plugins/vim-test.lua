return {
  {
    "vim-test/vim-test", -- Updated repo (moved from janko-m)
    dependencies = {
      "preservim/vimux", -- Required for your vimux strategy
    },
    config = function()
      -- Configure vimux for bottom horizontal pane
      vim.g.VimuxOrientation = "v" -- Vertical split (creates horizontal pane)
      vim.g.VimuxHeight = "30" -- 30% of screen height
      vim.g.VimuxRunnerName = "test" -- Name the pane "test"
      vim.g.VimuxUseNearest = 0 -- Don't use nearest pane, create dedicated one

      -- Use vimux strategy
      vim.g["test#strategy"] = "vimux"

      -- Your existing Ruby config
      vim.g["test#ruby#use_binstubs"] = 1
      vim.g["test#ruby#rspec#executable"] = "bundle exec rspec"

      if vim.fn.filereadable("bin/test") == 1 then
        vim.g["test#ruby#minitest#executable"] = "bin/test"
      end

      vim.cmd([[
        function! ClearTransform(cmd) abort
          return 'clear; ' . a:cmd
        endfunction
        let g:test#custom_transformations = {'clear': function('ClearTransform')}
        let g:test#transformation = 'clear'
        
        function! TestContext()
          wall
          let [_, lnum, cnum, _] = getpos('.')
          RubyBlockSpecParentContext
          TestNearest
          call cursor(lnum, cnum)
        endfunction
        command! TestContext :call TestContext()
      ]])
    end,
    keys = {
      { "<leader>tn", "<cmd>wa<CR><cmd>TestNearest<CR>", desc = "Test Nearest" },
      { "<leader>tf", "<cmd>wa<CR><cmd>TestFile<CR>", desc = "Test File" },
      { "<leader>ta", "<cmd>wa<CR><cmd>TestSuite<CR>", desc = "Test Suite" },
      { "<leader>tl", "<cmd>wa<CR><cmd>TestLast<CR>", desc = "Test Last" },
      { "<LocalLeader>rc", "<cmd>TestContext<CR>", desc = "Test Context", ft = { "ruby", "erb" } },
    },
  },
}
