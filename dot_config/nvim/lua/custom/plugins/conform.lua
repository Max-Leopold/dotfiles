return {
  'stevearc/conform.nvim',
  lazy = true,
  event = { 'BufWritePre' },
  cmd = { 'ConformInfo' },
  keys = {
    {
      '<leader>bf',
      function()
        require('conform').format { async = false, quiet = false, lsp_format = 'fallback' }
      end,
      mode = { 'n', 'v' },
      desc = '[B]uffer [F]ormat',
    },
  },
  opts = {
    notify_on_error = false,
    format_on_save = function(bufnr)
      local disable_filetypes = { c = true, cpp = true }
      if disable_filetypes[vim.bo[bufnr].filetype] then
        return nil
      else
        return {
          timeout_ms = 500,
          lsp_format = 'fallback',
        }
      end
    end,
    formatters_by_ft = {
      lua = { 'stylua' },
      ruby = { 'rubocop', stop_after_first = true },
      rust = { 'rustfmt', lsp_format = true },
      typescript = { 'prettierd', 'prettier', stop_after_first = true },
      javascript = { 'prettierd', 'prettier', stop_after_first = true },
      swift = { 'swiftformat' },
    },
  },
}
