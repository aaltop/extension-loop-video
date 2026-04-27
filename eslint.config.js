// @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from "node:url";

// Says the URL is undefined, though isn't. Can't be bothered.
// eslint-disable-next-line no-undef
const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  includeIgnoreFile(gitignorePath),
  {
    rules: {
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_"
            }
        ]
    }
  }
);