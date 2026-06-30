import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  {
    rules: {
      // Flagea patrones válidos de React (sync prop→state en modals, async effects, preloaders)
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
