return {
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "lua-language-server",
        "typescript-language-server",
        "rust-analyzer",
        "sorbet",
        "ruby-lsp",
      },
    },
  },
}
