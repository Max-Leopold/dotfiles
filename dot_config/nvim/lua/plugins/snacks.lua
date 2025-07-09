return {
  "folke/snacks.nvim",
  opts = {
    picker = {
      formatters = {
        file = {
          filename_first = true,
          truncate = 1000,  -- Don't truncate paths
        },
      },
      win = {
        -- Enable wrapping in the results list
        list = {
          wo = {
            wrap = true,        -- Enable line wrapping
            linebreak = true,   -- Wrap at word boundaries
            breakindent = true, -- Preserve indentation on wrapped lines
            conceallevel = 2,   -- Keep existing config
            concealcursor = "nvc",
          },
        },
        -- Enable wrapping in the preview window too
        preview = {
          wo = {
            wrap = true,
            linebreak = true,
            breakindent = true,
          },
        },
      },
    },
  },
}
