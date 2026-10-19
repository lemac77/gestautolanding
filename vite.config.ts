import { defineConfig } from "vite";
import { resolve } from "node:path";

// Sito multipagina: la landing e le tre pagine legali.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        privacy: resolve(__dirname, "privacy/index.html"),
        cookie: resolve(__dirname, "cookie/index.html"),
        condizioni: resolve(__dirname, "condizioni/index.html"),
      },
    },
  },
});
