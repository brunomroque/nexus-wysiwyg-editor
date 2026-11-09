import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  onSuccess: async () => {
    fs.copyFileSync(
      path.resolve(__dirname, "src/styles/editor.css"),
      path.resolve(__dirname, "dist/style.css")
    );
  },
});

