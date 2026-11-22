import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import versionManifest from "./vite-plugins/version-manifest.mjs";
import { CLIENT_CONTRACT_VERSION, MIN_SUPPORTED_CLIENT_CONTRACT } from "./src/version/contract.js";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        // Genera dist/app-version.json y marca la versión en index.html (HU-FLZ-ACT-002).
        versionManifest({
            clientContract: CLIENT_CONTRACT_VERSION,
            minSupportedClientContract: MIN_SUPPORTED_CLIENT_CONTRACT,
        }),
    ],
    server: {
        host: true,
        port: 5210,
        historyApiFallback: true,
    },
    preview: {
        host: true,
        port: 5210,
    },
    resolve: {
        extensions: [".js", ".vue", ".json", ".css", ".min.css"],
        alias: {
            // eslint-disable-next-line no-undef
            "@": path.resolve(__dirname, "./src")
        }
    },
    build: {
        chunkSizeWarningLimit: 2500,
    }
});
