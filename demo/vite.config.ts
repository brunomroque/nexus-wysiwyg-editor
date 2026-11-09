import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "nexus-wysiwyg-editor": path.resolve(__dirname, "../src"),
    },
  },
});

