return {
  'folke/snacks.nvim',
  priority = 1000,
  lazy = false,
  opts = {
    bigfile = { enabled = true },
    bufdelete = { enabled = true },
    explorer = { enabled = true },
    notifier = { enabled = true },
    picker = { enabled = true },
    quickfile = { enabled = true },
    statuscolumn = { enabled = true },
    words = { enabled = true },
  },
  keys = {
    -- Buffer
    {
      '<leader>bd',
      function()
        Snacks.bufdelete()
      end,
      desc = '[B]uffer [D]elete',
    },
    -- Explorer
    {
      '<leader>fe',
      function()
        Snacks.explorer()
      end,
      desc = '[F]ile [E]xplorer',
    },
    { '<leader>e', '<leader>fe', desc = '[E]xplorer', remap = true },
    -- Notifications
    {
      '<leader>n',
      function()
        Snacks.picker.notifications()
      end,
      desc = '[N]otification History',
    },
    -- Picker
    {
      '<leader>,',
      function()
        Snacks.picker.buffers()
      end,
      desc = 'Buffers',
    },
    {
      '<leader>/',
      function()
        Snacks.picker.grep { cwd = vim.fn.getcwd() }
      end,
      desc = 'Grep',
    },
    {
      '<leader>:',
      function()
        Snacks.picker.command_history()
      end,
      desc = 'Command History',
    },
    -- find
    {
      '<leader>fb',
      function()
        Snacks.picker.buffers()
      end,
      desc = 'Buffers',
    },
    {
      '<leader>fB',
      function()
        Snacks.picker.buffers { hidden = true, nofile = true }
      end,
      desc = 'Buffers (all)',
    },
    {
      '<leader>ff',
      function()
        Snacks.picker.files { cwd = vim.fn.getcwd() }
      end,
      desc = 'Find Files',
    },
    {
      '<leader>fg',
      function()
        Snacks.picker.git_files()
      end,
      desc = 'Git Files',
    },
    {
      '<leader>fr',
      function()
        Snacks.picker.recent { filter = { cwd = true } }
      end,
      desc = 'Recent Files',
    },
    {
      '<leader>fp',
      function()
        Snacks.picker.projects()
      end,
      desc = 'Projects',
    },
    -- git
    {
      '<leader>gd',
      function()
        Snacks.picker.git_diff()
      end,
      desc = 'Git Diff (hunks)',
    },
    {
      '<leader>gs',
      function()
        Snacks.picker.git_status()
      end,
      desc = 'Git Status',
    },
    {
      '<leader>gS',
      function()
        Snacks.picker.git_stash()
      end,
      desc = 'Git Stash',
    },
    -- Grep
    {
      '<leader>sb',
      function()
        Snacks.picker.lines()
      end,
      desc = 'Buffer Lines',
    },
    {
      '<leader>sB',
      function()
        Snacks.picker.grep_buffers()
      end,
      desc = 'Grep Open Buffers',
    },
    {
      '<leader>sg',
      function()
        Snacks.picker.grep { cwd = vim.fn.getcwd() }
      end,
      desc = 'Grep',
    },
    {
      '<leader>sp',
      function()
        Snacks.picker.lazy()
      end,
      desc = 'Search for Plugin Spec',
    },
    {
      '<leader>sw',
      function()
        Snacks.picker.grep_word { cwd = vim.fn.getcwd() }
      end,
      desc = 'Grep word under cursor',
      mode = { 'n', 'x' },
    },
    -- search
    {
      '<leader>s"',
      function()
        Snacks.picker.registers()
      end,
      desc = 'Registers',
    },
    {
      '<leader>s/',
      function()
        Snacks.picker.search_history()
      end,
      desc = 'Search History',
    },
    {
      '<leader>sa',
      function()
        Snacks.picker.autocmds()
      end,
      desc = 'Autocmds',
    },
    {
      '<leader>sc',
      function()
        Snacks.picker.command_history()
      end,
      desc = 'Command History',
    },
    {
      '<leader>sC',
      function()
        Snacks.picker.commands()
      end,
      desc = 'Commands',
    },
    {
      '<leader>sd',
      function()
        Snacks.picker.diagnostics()
      end,
      desc = 'Diagnostics',
    },
    {
      '<leader>sD',
      function()
        Snacks.picker.diagnostics_buffer()
      end,
      desc = 'Buffer Diagnostics',
    },
    {
      '<leader>sh',
      function()
        Snacks.picker.help()
      end,
      desc = 'Help Pages',
    },
    {
      '<leader>sH',
      function()
        Snacks.picker.highlights()
      end,
      desc = 'Highlights',
    },
    {
      '<leader>si',
      function()
        Snacks.picker.icons()
      end,
      desc = 'Icons',
    },
    {
      '<leader>sj',
      function()
        Snacks.picker.jumps()
      end,
      desc = 'Jumps',
    },
    {
      '<leader>sk',
      function()
        Snacks.picker.keymaps()
      end,
      desc = 'Keymaps',
    },
    {
      '<leader>sl',
      function()
        Snacks.picker.loclist()
      end,
      desc = 'Location List',
    },
    {
      '<leader>sM',
      function()
        Snacks.picker.man()
      end,
      desc = 'Man Pages',
    },
    {
      '<leader>sm',
      function()
        Snacks.picker.marks()
      end,
      desc = 'Marks',
    },
    {
      '<leader>sR',
      function()
        Snacks.picker.resume()
      end,
      desc = 'Resume',
    },
    {
      '<leader>sq',
      function()
        Snacks.picker.qflist()
      end,
      desc = 'Quickfix List',
    },
    {
      '<leader>su',
      function()
        Snacks.picker.undo()
      end,
      desc = 'Undotree',
    },
  },
}
