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
    permissions: ["storage"],
    browser_specific_settings: {
      gecko: {
        id: "@loop_video.aaltop",
        // @ts-expect-error: this isn't in the schema, apparently
        // (though it IS part of manifest.json), but setting it does
        // suppress a warning sent by WXT, so it does seem to be used.
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
