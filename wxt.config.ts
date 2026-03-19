import { defineConfig } from "wxt";
import { BINARY_FIREFOX } from "./_config";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  webExt: {
    binaries: {
      firefox: BINARY_FIREFOX,
    },
  },
  manifest: {
    icons: Object.fromEntries(
      [16, 24, 48, 96, 128].map((elem) => [elem, "/icon.svg"]),
    ),
  },
});
