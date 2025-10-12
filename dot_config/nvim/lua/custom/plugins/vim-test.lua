return {
  {
    'vim-test/vim-test',
    dependencies = {
      'preservim/vimux',
    },
    config = function()
      -- Configure vimux for bottom horizontal pane
      vim.g.VimuxOrientation = 'v'
      vim.g.VimuxHeight = '30'
      vim.g.VimuxRunnerName = 'test'
      vim.g.VimuxUseNearest = 0

      -- Use vimux strategy
      vim.g['test#strategy'] = 'vimux'

      -- Ruby config with smarter detection
      vim.g['test#ruby#use_binstubs'] = 1

      -- Better executable detection
      local function setup_ruby_executables()
        if vim.fn.filereadable 'bin/rspec' == 1 then
          vim.g['test#ruby#rspec#executable'] = 'bin/rspec'
        else
          vim.g['test#ruby#rspec#executable'] = 'bundle exec rspec'
        end

        if vim.fn.filereadable 'bin/test' == 1 then
          vim.g['test#ruby#minitest#executable'] = 'bin/test'
        elseif vim.fn.filereadable 'bin/rails' == 1 then
          vim.g['test#ruby#minitest#executable'] = 'bin/rails test'
        else
          vim.g['test#ruby#minitest#executable'] = 'bundle exec ruby -Ilib:test'
        end
      end

      setup_ruby_executables()

      -- Enhanced transformations
      vim.cmd [[
        function! ClearTransform(cmd) abort
          return 'clear; ' . a:cmd
        endfunction
        
        function! TimestampTransform(cmd) abort
          return 'echo "=== Test started at $(date) ==="; ' . a:cmd
        endfunction
        
        let g:test#custom_transformations = {
        \   'clear': function('ClearTransform'),
        \   'timestamp': function('TimestampTransform')
        \ }
        let g:test#transformation = 'clear'
        
        function! TestContext()
          wall
          let [_, lnum, cnum, _] = getpos('.')
          if exists(':RubyBlockSpecParentContext')
            RubyBlockSpecParentContext
          endif
          TestNearest
          call cursor(lnum, cnum)
        endfunction
        command! TestContext :call TestContext()
        
        " Quick toggle between test transformations
        function! ToggleTestTransform()
          if g:test#transformation == 'clear'
            let g:test#transformation = 'timestamp'
            echo "Test transformation: timestamp"
          else
            let g:test#transformation = 'clear'
            echo "Test transformation: clear"
          endif
        endfunction
        command! ToggleTestTransform :call ToggleTestTransform()
      ]]
    end,
    keys = {
      { '<leader>tn', '<cmd>wa<CR><cmd>TestNearest<CR>', desc = 'Test Nearest' },
      { '<leader>tf', '<cmd>wa<CR><cmd>TestFile<CR>', desc = 'Test File' },
      { '<leader>ta', '<cmd>wa<CR><cmd>TestSuite<CR>', desc = 'Test Suite' },
      { '<leader>tl', '<cmd>wa<CR><cmd>TestLast<CR>', desc = 'Test Last' },
      { '<LocalLeader>rc', '<cmd>TestContext<CR>', desc = 'Test Context', ft = { 'ruby', 'erb' } },
    },
  },
}
