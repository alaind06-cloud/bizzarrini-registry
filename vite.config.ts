import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: { plugins: [visualizer({ filename: "/tmp/stats.json", template: "raw-data" }) as any] },
});
