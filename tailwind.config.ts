export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    function ({ addVariant, matchVariant }: { addVariant: (name: string, definition: string | string[]) => void; matchVariant: (name: string, cb: (value: string) => string, options?: { values?: Record<string, string> }) => void }) {
      addVariant('data-active', '&[data-active]')
      addVariant('data-open', ['&[data-state="open"]', '&[data-open]:not([data-open="false"])'])
      addVariant('data-closed', ['&[data-state="closed"]', '&[data-closed]:not([data-closed="false"])'])
      addVariant('data-checked', ['&[data-state="checked"]', '&[data-checked]:not([data-checked="false"])'])
      addVariant('data-unchecked', ['&[data-state="unchecked"]', '&[data-unchecked]:not([data-unchecked="false"])'])
      addVariant('data-horizontal', '&[data-orientation="horizontal"]')
      addVariant('data-vertical', '&[data-orientation="vertical"]')
      addVariant('data-side-top', '&[data-side="top"]')
      addVariant('data-side-bottom', '&[data-side="bottom"]')
      addVariant('data-side-left', '&[data-side="left"]')
      addVariant('data-side-right', '&[data-side="right"]')

      matchVariant('data', (value: string) => `&[data-${value}]`)
      matchVariant(
        'group-data',
        (value: string) => {
          const [attr, group] = value.split('/')
          return group ? `:merge(.group\\/${group})&[data-${attr}]` : `:merge(.group)&[data-${attr}]`
        }
      )
    },
  ],
}
