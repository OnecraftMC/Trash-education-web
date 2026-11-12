import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The React app is the production site; the root `index.html` is its
// only entry since the Task 5 cutover.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
});
