return {
  {
    "github/copilot.vim",
    lazy = false,
    config = function()
      -- Disable default tab mapping
      vim.g.copilot_no_tab_map = true

      -- Accept suggestion with Tab
      vim.keymap.set("i", "<Tab>", [[copilot#Accept("\<CR>")]], {
        expr = true,
        replace_keycodes = false,
      })

      -- Optional: Other keymaps
      vim.keymap.set("i", "<M-]>", "<Plug>(copilot-next)")
      vim.keymap.set("i", "<M-[>", "<Plug>(copilot-previous)")
    end,
  },
}
