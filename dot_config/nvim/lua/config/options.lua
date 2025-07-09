-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.opt.relativenumber = false

vim.opt.autoread = true -- Enable auto read
vim.opt.autowrite = true -- Enable auto write
vim.opt.autowriteall = true -- Write all buffers when leaving

vim.opt.wrap = true

-- Auto save when leaving insert mode
vim.api.nvim_create_autocmd({ "InsertLeave", "TextChanged" }, {
  pattern = "*",
  command = "silent! wall",
})

-- Auto save on focus lost
vim.api.nvim_create_autocmd({ "FocusLost", "BufLeave" }, {
  pattern = "*",
  command = "silent! wall",
})

-- Notify on buffer reload
vim.api.nvim_create_autocmd("FileChangedShellPost", {
  pattern = "*",
  command = "echohl WarningMsg | echo 'File changes on disk. Buffer reloaded. | echohl None",
})
