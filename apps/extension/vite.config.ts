import { defineConfig, type UserConfig, loadEnv } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "fs";
import { join } from "path";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import tailwindcss from "@tailwindcss/vite";

// Custom plugin to handle Chrome extension specific needs
function chromeExtension() {
  const processHtmlFile = (
    filename: string,
    distDir: string,
    publicDir: string
  ) => {
    const htmlSrc = join(publicDir, filename);
    const htmlDest = join(distDir, filename);

    if (existsSync(htmlSrc)) {
      let htmlContent = readFileSync(htmlSrc, "utf-8");

      // Inject CSS file
      const cssLink = `<link rel="stylesheet" href="assets/css/sidepanel.css">`;
      if (htmlContent.includes("</head>")) {
        htmlContent = htmlContent.replace("</head>", `  ${cssLink}\n</head>`);
      }

      // Inject the corresponding JS file
      const jsFileName = filename.replace(".html", ".js");
      const scriptTag = `<script type="module" src="${jsFileName}"></script>`;

      // Add script tag before closing body tag
      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `  ${scriptTag}\n</body>`);
      } else {
        // If no body tag, append to end
        htmlContent += `\n${scriptTag}`;
      }

      writeFileSync(htmlDest, htmlContent, "utf-8");
    }
  };

  return {
    name: "chrome-extension",
    generateBundle() {
      // Copy manifest and static files
      const publicDir = resolve(__dirname, "public");
      const distDir = resolve(__dirname, "dist");

      // Ensure dist directory exists
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest.json (use transformed version if available)
      const manifestTempSrc = join(publicDir, "manifest.temp.json");
      const manifestSrc = join(publicDir, "manifest.json");
      const manifestDest = join(distDir, "manifest.json");

      if (existsSync(manifestTempSrc)) {
        // Use transformed manifest from build script
        copyFileSync(manifestTempSrc, manifestDest);
      } else if (existsSync(manifestSrc)) {
        // Fallback to original manifest
        copyFileSync(manifestSrc, manifestDest);
      }

      // Copy icons directory
      const iconsSrc = join(publicDir, "icons");
      const iconsDest = join(distDir, "icons");
      if (existsSync(iconsSrc)) {
        if (!existsSync(iconsDest)) {
          mkdirSync(iconsDest, { recursive: true });
        }
        const files = readdirSync(iconsSrc);
        files.forEach((file: string) => {
          copyFileSync(join(iconsSrc, file), join(iconsDest, file));
        });
      }

      // Process HTML files
      processHtmlFile("sidepanel.html", distDir, publicDir);
      processHtmlFile("options.html", distDir, publicDir);
    },
  };
}

export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === "development";
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), chromeExtension(), tailwindcss()],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false, // Never include source maps in production
      minify: isDev ? false : "terser",
      terserOptions: {
        compress: {
          drop_console: !isDev, // Remove console.log in production
          drop_debugger: !isDev,
        },
      },
      rollupOptions: {
        input: {
          background: resolve(__dirname, "src/background/index.ts"),
          sidepanel: resolve(__dirname, "src/ui/sidepanel/index.tsx"),
          options: resolve(__dirname, "src/ui/options/index.tsx"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const { name } = assetInfo;
            if (name && name.endsWith(".css")) {
              return "assets/css/[name][extname]";
            }
            if (name && /\.(png|jpe?g|gif|svg|ico)$/.test(name)) {
              return "assets/images/[name][extname]";
            }
            if (name && /\.(woff2?|eot|ttf|otf)$/.test(name)) {
              return "assets/fonts/[name][extname]";
            }
            return "assets/[name][extname]";
          },
          manualChunks: (id) => {
            // Separate vendor libraries into their own chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@radix-ui')) {
                return 'radix-vendor';
              }
              if (id.includes('framer-motion')) {
                return 'animation-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              return 'vendor';
            }
            // Group related components
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
            if (id.includes('/components/')) {
              return 'components';
            }
          },
        },
        onwarn(warning, warn) {
          // Suppress "Module level directives cause errors when bundled" warnings
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        // "@": path.resolve(__dirname, "./src"),
        "@shopping-copilot/shared": resolve(
          __dirname,
          "../../packages/shared/src/index.ts"
        ),
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer,
          ...(isDev ? [] : [cssnano({ preset: "default" })]),
        ],
      },
    },
    publicDir: false, // Disable automatic copying of public directory
  };
});
