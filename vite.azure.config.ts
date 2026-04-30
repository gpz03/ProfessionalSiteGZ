import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";

let commitHash = "Unknown";
try {
  commitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  console.warn("Could not retrieve git commit hash");
}

const buildTime = new Date().toISOString();

export default defineConfig({
  base: "/",
  define: {
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(commitHash),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
    "import.meta.env.VITE_HOSTING_PROVIDER": JSON.stringify("Azure Static Web Apps (East US 2)"),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-azure"),
    emptyOutDir: true,
  },
});
