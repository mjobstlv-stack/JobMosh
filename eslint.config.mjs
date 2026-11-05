import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", ".claude/**", ".agents/**", ".playwright-mcp/**", "docs/**", "public/**", "next-env.d.ts"],
  },
  {
    rules: {
      // `_name` = intentionally unused (e.g. destructuring a field out)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Hebrew text is full of apostrophes/quotes (ג'וב, צה"ל) — escaping them all adds noise, no safety.
      "react/no-unescaped-entities": "off",
      // Existing reset-on-open / hydrate-from-storage effects; flag, don't block.
      "react-hooks/set-state-in-effect": "warn",
      // Icon components picked from a lookup map trip this rule; they are not created per render.
      "react-hooks/static-components": "warn",
    },
  },
]

export default config
