
import fs from "fs"
import path from "path"
import * as esbuild from 'esbuild'

// Build main application
await esbuild.build({
  outExtension: { '.js': '.mjs' },
  entryPoints: [
    // 'src/init-docs.ts',
    'src/esbuildConfigs/eslint-formatter-testeranto.ts',
    // 'src/server/runtimes/node/node.ts',
    // 'src/server/runtimes/web/web.ts',
    // 'src/testeranto.ts',
    // 'src/server/runtimes/web/hoist.ts'
  ],
  bundle: true,
  format: "esm",
  splitting: true,
  platform: "node",
  target: "node20",
  outdir: "dist/prebuild",
  packages: "external",
  supported: {
    "dynamic-import": true,
  },
  external: [
    "fs", "path", "child_process", "util", "os", "events", "stream",
    "http", "https", "zlib", "crypto", "buffer", "net", "dns", "tls",
    "assert", "querystring", "punycode", "readline", "repl", "vm",
    "perf_hooks", "async_hooks", "timers", "console", "module", "process",
    "vscode"
  ],
})

// Build VS Code extension
try {
  const result = await esbuild.build({
    entryPoints: ['src/vscode/extension.ts'],
    bundle: true,
    format: "esm",  // Use ES modules
    platform: "node",
    target: "node20",
    outdir: "dist/vscode",
    external: ["vscode"],
    outExtension: { '.js': '.mjs' },
    logLevel: 'info',
  });
  console.log("VS Code extension built successfully to dist/vscode/extension.mjs");
} catch (error) {
  console.error("Failed to build VS Code extension:", error);
  process.exit(1);
}

// Copy media files for webview

const mediaDir = 'media';
const distMediaDir = 'dist/vscode/media';

if (!fs.existsSync(distMediaDir)) {
  fs.mkdirSync(distMediaDir, { recursive: true });
}

// Copy icon files
const mediaFiles = ['icon.svg'];
for (const file of mediaFiles) {
  const src = path.join(mediaDir, file);
  const dest = path.join(distMediaDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.warn(`Media file not found: ${src}`);
  }
}

// Copy Ruby artifact to dist/ruby folder
const rubySrcPath = 'src/server/runtimes/ruby/ruby.rb';
const rubyDistDir = 'dist/ruby';
const rubyDestPath = path.join(rubyDistDir, 'ruby.rb');

if (!fs.existsSync(rubyDistDir)) {
  fs.mkdirSync(rubyDistDir, { recursive: true });
}

if (fs.existsSync(rubySrcPath)) {
  fs.copyFileSync(rubySrcPath, rubyDestPath);
  console.log(`Copied Ruby artifact from ${rubySrcPath} to ${rubyDestPath}`);
} else {
  console.warn(`Ruby source file not found: ${rubySrcPath}`);
}



const pythonSrcPath = 'src/server/runtimes/python/python.py';
const pythonDistDir = 'dist/python';
const pythonDestPath = path.join(pythonDistDir, 'python.py');

if (!fs.existsSync(pythonDistDir)) {
  fs.mkdirSync(pythonDistDir, { recursive: true });
}

if (fs.existsSync(pythonSrcPath)) {
  fs.copyFileSync(pythonSrcPath, pythonDestPath);
  console.log(`Copied Python artifact from ${pythonSrcPath} to ${pythonDestPath}`);
} else {
  console.warn(`Python source file not found: ${pythonSrcPath}`);
}



const golangSrcPath = 'src/server/runtimes/golang/main.go';
const golangDistDir = 'dist/golang';
const golangDestPath = path.join(golangDistDir, 'main.go');

if (!fs.existsSync(golangDistDir)) {
  fs.mkdirSync(golangDistDir, { recursive: true });
}

if (fs.existsSync(golangSrcPath)) {
  fs.copyFileSync(golangSrcPath, golangDestPath);
  console.log(`Copied Golang artifact from ${golangSrcPath} to ${golangDestPath}`);
} else {
  console.warn(`Golang source file not found: ${golangSrcPath}`);
}



const rustSrcPath = 'src/server/runtimes/rust/main.rs';
const rustDistDir = 'dist/rust';
const rustDestPath = path.join(rustDistDir, 'main.rs');

if (!fs.existsSync(rustDistDir)) {
  fs.mkdirSync(rustDistDir, { recursive: true });
}

if (fs.existsSync(rustSrcPath)) {
  fs.copyFileSync(rustSrcPath, rustDestPath);
  console.log(`Copied Golang artifact from ${rustSrcPath} to ${rustDestPath}`);
} else {
  console.warn(`Golang source file not found: ${rustSrcPath}`);
}



const javaSrcPath = 'src/server/runtimes/java/main.java';
const javaDistDir = 'dist/java';
const javaDestPath = path.join(javaDistDir, 'main.java');

if (!fs.existsSync(javaDistDir)) {
  fs.mkdirSync(javaDistDir, { recursive: true });
}

if (fs.existsSync(javaSrcPath)) {
  fs.copyFileSync(javaSrcPath, javaDestPath);
  console.log(`Copied Java artifact from ${javaSrcPath} to ${javaDestPath}`);
} else {
  console.warn(`Java source file not found: ${javaSrcPath}`);
}

