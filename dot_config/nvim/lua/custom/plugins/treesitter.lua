return {
  'nvim-treesitter/nvim-treesitter',
  branch = 'master',
  lazy = false,
  cmd = { 'TSUpdateSync', 'TSUpdate', 'TSInstall' },
  build = ':TSUpdate',
  main = 'nvim-treesitter.configs',
  config = function(_, opts)
    -- tree-sitter 0.26 removed --no-bindings, which the archived compatibility
    -- branch still passes when it generates parsers such as Swift.
    if vim.fn.executable 'tree-sitter' == 1 then
      local version = vim.fn.system { 'tree-sitter', '--version' }
      local major, minor = version:match '(%d+)%.(%d+)'
      if major and (tonumber(major) > 0 or tonumber(minor) >= 26) then
        require('nvim-treesitter.install').ts_generate_args = {
          'generate',
          '--abi',
          vim.treesitter.language_version,
        }
      end
    end

    require('nvim-treesitter.configs').setup(opts)
  end,
  opts = {
    ensure_installed = {
      'ruby',
      'typescript',
      'javascript',
      'bash',
      'c',
      'diff',
      'html',
      'lua',
      'luadoc',
      'markdown',
      'markdown_inline',
      'query',
      'vim',
      'vimdoc',
      'swift',
    },
    auto_install = true,
    highlight = {
      enable = true,
      additional_vim_regex_highlighting = { 'ruby' },
    },
    indent = { enable = true, disable = { 'ruby' } },
  },
}
