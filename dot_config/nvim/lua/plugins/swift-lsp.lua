return {
  -- Configure LSP
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        sourcekit = {
          cmd = { "xcrun", "sourcekit-lsp" },
          filetypes = { "swift", "objective-c", "objective-cpp" },
          root_dir = function(filename, _)
            local lspconfig = require("lspconfig")
            return lspconfig.util.root_pattern(
              "Package.swift",
              "buildServer.json",
              "*.xcodeproj",
              "*.xcworkspace",
              "compile_commands.json",
              ".git"
            )(filename) or lspconfig.util.path.dirname(filename)
          end,
        },
      },
    },
  },

  -- Optional: Configure treesitter for Swift syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    opts = function(_, opts)
      if type(opts.ensure_installed) == "table" then
        vim.list_extend(opts.ensure_installed, { "swift" })
      end
    end,
  },
}
