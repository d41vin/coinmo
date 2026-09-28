import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react 7.x autodetects the React version through
    // context.getFilename, which ESLint 10 removed. Pinning the version keeps
    // rule creation from throwing; keep it in sync with the react dependency.
    settings: {
      react: { version: "19.2.8" },
    },
  },
  {
    // Vendored shadcn/ui components and the pre-existing viewport hook sync
    // external state into React from inside effects on purpose, which is what
    // this React Compiler-era rule flags. App code keeps the rule enabled.
    files: [
      "components/ui/**/*.ts",
      "components/ui/**/*.tsx",
      "hooks/use-mobile.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Convex CLI output, not ours to lint.
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
