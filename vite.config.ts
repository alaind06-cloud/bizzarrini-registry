import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { visualizer } from "rollup-plugin-visualizer";

const v: any = visualizer({ filename: "/tmp/stats-client.json", template: "raw-data" });
v.applyToEnvironment = (env: any) => env.name === "client";

export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: { plugins: [v] },
});
