return {
  "folke/snacks.nvim",
  keys = {
    -- Override default search keys to use CWD for monorepo performance
    {
      "<leader><space>",
      function()
        return LazyVim.pick("files", { root = false })()
      end,
      desc = "Find Files (cwd)",
    },
    {
      "<leader>/",
      function()
        return LazyVim.pick("live_grep", { root = false })()
      end,
      desc = "Grep (cwd)",
    },
  },
  opts = {
    bigfile = {
      enabled = true,
      size = 1.5 * 1024 * 1024, -- 1.5MB
    },
    scroll = {
      enabled = false, -- Disable scrolling animations
    },
    picker = {
      -- Performance optimizations for large monorepos
      sources = {
        files = {
          hidden = false, -- Don't search hidden files by default for performance
          ignored = false, -- Don't search ignored files by default for performance
          -- Exclude common large directories and files
          exclude = {
            -- Build outputs and dependencies
            "node_modules/",
            "dist/",
            "build/",
            "target/",
            ".next/",
            ".nuxt/",
            ".output/",
            ".vite/",
            ".turbo/",
            "coverage/",

            -- Lock files and package files
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "Cargo.lock",
            "composer.lock",

            -- Cache and temporary directories
            ".cache/",
            ".tmp/",
            "tmp/",
            ".temp/",
            "temp/",

            -- Version control and IDE
            ".git/",
            ".svn/",
            ".hg/",
            ".vscode/",
            ".idea/",
            "*.swp",
            "*.swo",
            "*~",

            -- Language-specific excludes
            "__pycache__/",
            "*.pyc",
            ".pytest_cache/",
            "vendor/",
            ".bundle/",
            ".sass-cache/",
            ".DS_Store",
            "Thumbs.db",

            -- Log files
            "*.log",
            "logs/",

            -- Ruby interface files (Sorbet)
            "*.rbi",
          },
        },
        grep = {
          hidden = false,
          ignored = false,
          -- Same excludes for grep operations
          exclude = {
            "node_modules/",
            "dist/",
            "build/",
            "target/",
            ".next/",
            ".nuxt/",
            ".output/",
            ".vite/",
            ".turbo/",
            "coverage/",
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "Cargo.lock",
            "composer.lock",
            ".cache/",
            ".tmp/",
            "tmp/",
            ".temp/",
            "temp/",
            ".git/",
            ".svn/",
            ".hg/",
            ".vscode/",
            ".idea/",
            "__pycache__/",
            "*.pyc",
            ".pytest_cache/",
            "vendor/",
            ".bundle/",
            ".sass-cache/",
            ".DS_Store",
            "Thumbs.db",
            "*.log",
            "logs/",
            "*.rbi",
          },
        },
        explorer = {
          hidden = false,
          ignored = false,
          -- Same excludes for explorer operations
          exclude = {
            "node_modules/",
            "dist/",
            "build/",
            "target/",
            ".next/",
            ".nuxt/",
            ".output/",
            ".vite/",
            ".turbo/",
            "coverage/",
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "Cargo.lock",
            "composer.lock",
            ".cache/",
            ".tmp/",
            "tmp/",
            ".temp/",
            "temp/",
            ".git/",
            ".svn/",
            ".hg/",
            ".vscode/",
            ".idea/",
            "__pycache__/",
            "*.pyc",
            ".pytest_cache/",
            "vendor/",
            ".bundle/",
            ".sass-cache/",
            ".DS_Store",
            "Thumbs.db",
            "*.log",
            "logs/",
            "*.rbi",
          },
        },
      },
      formatters = {
        file = {
          filename_first = true,
          truncate = 1000, -- Don't truncate paths
        },
      },
      win = {
        input = {
          keys = {
            -- Performance toggles
            ["<c-h>"] = { "toggle_hidden", mode = { "i", "n" } },
            ["<c-i>"] = { "toggle_ignored", mode = { "i", "n" } },
            -- Restore missing Alt+key bindings from defaults
            ["<a-f>"] = { "toggle_follow", mode = { "i", "n" } },
            ["<a-h>"] = { "toggle_hidden", mode = { "i", "n" } },
            ["<a-i>"] = { "toggle_ignored", mode = { "i", "n" } },
            ["<a-r>"] = { "toggle_regex", mode = { "i", "n" } },
            ["<a-e>"] = { "toggle_show_excluded", mode = { "i", "n" } },
            ["<a-m>"] = { "toggle_maximize", mode = { "i", "n" } },
            ["<a-p>"] = { "toggle_preview", mode = { "i", "n" } },
            ["<a-w>"] = { "cycle_win", mode = { "i", "n" } },
            ["<a-d>"] = { "inspect", mode = { "n", "i" } },
          },
        },
        -- Enable wrapping in the results list
        list = {
          wo = {
            wrap = true, -- Enable line wrapping
            linebreak = true, -- Wrap at word boundaries
            breakindent = true, -- Preserve indentation on wrapped lines
            conceallevel = 2, -- Keep existing config
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
