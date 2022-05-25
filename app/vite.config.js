import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite replaces react-scripts@4, which doesn't run on modern Node.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
