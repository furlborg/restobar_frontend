import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        host: true,
        port: 5210,
        historyApiFallback: true,
    },
    resolve: {
        extensions: [".js", ".vue", ".json", ".css", ".min.css"],
        alias: {
            // eslint-disable-next-line no-undef
            "@": path.resolve(__dirname, "./src")
        }
    }
});
