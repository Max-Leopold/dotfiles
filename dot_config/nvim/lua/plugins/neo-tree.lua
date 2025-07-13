-- Disable neo-tree file following for large repositories
return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    opts = {
      filesystem = {
        follow_current_file = {
          enabled = false, -- Disable auto-follow for performance
        },
      },
    },
    keys = {
      {
        "<leader>ef",
        function()
          require("neo-tree.command").execute({ action = "focus", reveal = true })
        end,
        desc = "Focus and reveal current file in neo-tree",
      },
    },
  },
}
