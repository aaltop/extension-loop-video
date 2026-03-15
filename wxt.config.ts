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
});
