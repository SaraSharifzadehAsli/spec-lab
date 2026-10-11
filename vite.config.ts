import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "web",
  plugins: [react()],
  // Relative asset paths, so the built page also works when it is served from
  // a GitHub Pages subdirectory rather than the root of a domain.
  base: "./",
  build: { outDir: "../dist", emptyOutDir: true },
});
