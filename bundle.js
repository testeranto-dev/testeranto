import fs from "fs"
import path from "path"
import * as esbuild from 'esbuild'
await esbuild.build({
  outExtension: { '.js': '.mjs' },
  entryPoints: [
    // 'src/init-docs.ts',
    // 'src/esbuildConfigs/eslint-formatter-testeranto.ts',
    'src/server/runtimes/node/node.ts',
    'src/server/runtimes/web/web.ts',
    // 'src/testeranto.ts',
    'src/server/runtimes/web/hoist.ts',
    // stakeholderSrcPath
  ],
  bundle: true,
  format: "esm",
  // splitting: true,
  platform: "node",
  target: "node20",
  outdir: "dist/prebuild",
  packages: "external",
  supported: {
    "dynamic-import": true,
  },
  external: [
    // './src/server/serverClasses/index.tsx',
    "fs", "path", "child_process", "util", "os", "events", "stream",
    "http", "https", "zlib", "crypto", "buffer", "net", "dns", "tls",
    "assert", "querystring", "punycode", "readline", "repl", "vm",
    "perf_hooks", "async_hooks", "timers", "console", "module", "process",
    "vscode"
  ],
})

//////////////////////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////

// Build grafeovidajo first using its own bundle.js (tiposkripto pattern)
try {
  console.log("Building grafeovidajo...");
  const { execSync } = await import('child_process');

  // First, ensure dependencies are installed
  console.log("Installing grafeovidajo dependencies...");
  try {
    execSync('npm install', {
      cwd: 'src/grafeovidajo',
      stdio: 'inherit'
    });
  } catch (npmInstallError) {
    console.log('npm install failed, trying yarn install...');
    execSync('yarn install', {
      cwd: 'src/grafeovidajo',
      stdio: 'inherit'
    });
  }

  // Then run grafeovidajo's own build script (which uses esbuild)
  console.log("Running grafeovidajo build...");
  execSync('npm run build', {
    cwd: 'src/grafeovidajo',
    stdio: 'inherit'
  });

  console.log("grafeovidajo built successfully");

  // Link grafeovidajo to node_modules so it can be resolved
  console.log("Linking grafeovidajo...");
  try {
    // Create a symlink from node_modules/grafeovidajo to src/grafeovidajo/dist
    const fs = await import('fs');
    const path = await import('path');

    const targetDir = path.join(process.cwd(), 'node_modules', 'grafeovidajo');
    const sourceDir = path.join(process.cwd(), 'src', 'grafeovidajo', 'dist');

    // Remove existing symlink or directory
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
    } catch (e) { }

    // Create symlink
    fs.symlinkSync(sourceDir, targetDir, 'dir');
    console.log(`Created symlink: ${targetDir} -> ${sourceDir}`);
  } catch (linkError) {
    console.warn("Could not create symlink for grafeovidajo:", linkError.message);
    console.log("Continuing without symlink...");
  }

} catch (error) {
  console.error("Failed to build grafeovidajo:", error);
  // Try fallback to tsc if esbuild fails
  console.log("Trying fallback tsc build...");
  try {
    const { execSync } = await import('child_process');
    execSync('npm run build:tsc', {
      cwd: 'src/grafeovidajo',
      stdio: 'inherit'
    });
    console.log("grafeovidajo built successfully with tsc fallback");
  } catch (tscError) {
    console.error("Fallback tsc build also failed:", tscError);
    process.exit(1);
  }
}

// Copy stakeholder tsx. Will bundle it the fly
// No need to copy html, we generate it from a template on the fly
// const stakeholderSrcPath = 'src/stakeholderApp/index.tsx';
// const stakeholderDistDir = 'dist/stakeholder/index.tsx';
//////////////////////////////////////////////////////////////////////////////////////////////////

// if (!fs.existsSync(stakeholderDistDir)) {
//   fs.mkdirSync(stakeholderDistDir, { recursive: true });
// }

// if (fs.existsSync(stakeholderDistFile)) {
//   const stat = fs.statSync(stakeholderDistFile);
//   if (stat.isDirectory()) {
//     fs.rmSync(stakeholderDistFile, { recursive: true });
//   }
// }

// fs.copyFileSync(stakeholderSrcPath, stakeholderDistFile);

//////////////////////////////////////////////////////////////////////////////////////////////////

// Copy media files for webview
const mediaDir = 'media';
const distMediaDir = 'dist/vscode/media';

if (!fs.existsSync(distMediaDir)) {
  fs.mkdirSync(distMediaDir, { recursive: true });
}

//////////////////////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////////////////////////

// const copyRuntimeFile = (srcpath, distpath, destpath) => {

//   if (!fs.existsSync(distpath)) {
//     fs.mkdirSync(distpath, { recursive: true });
//   }

//   if (fs.existsSync(srcpath)) {
//     fs.copyFileSync(srcpath, destpath);
//     console.log(`Copied artifact from ${srcpath} to ${destpath}`);
//   } else {
//     console.warn(`source file not found: ${srcpath}`);
//   }

// }

// copyRuntimeFile(
//   'src/server/runtimes/node/node.ts',
//   'dist/node',
//   'dist/node/node.ts',
// );

// copyRuntimeFile(
//   'src/server/runtimes/web/web.ts',
//   'dist/web',
//   'dist/web/web.ts',
// );

// copyRuntimeFile(
//   'src/server/runtimes/ruby/ruby.rb',
//   'dist/ruby',
//   'dist/ruby/ruby.rb',
// );

// copyRuntimeFile(
//   'src/server/runtimes/python/python.py',
//   'dist/python',
//   'dist/python/python.py',
// );

// copyRuntimeFile(
//   'src/server/runtimes/rust/main.rs',
//   'dist/rust',
//   'dist/rust/main.rs'
// );

// copyRuntimeFile(
//   'src/server/runtimes/java/main.java',
//   'dist/java',
//   'dist/java/main.java'
// );

// copyRuntimeFile(
//   'src/server/runtimes/web/hoist.ts',
//   'dist/web',
//   'dist/web/hoist.ts'
// );

// const stakeholderDistDir = 'dist/stakeholder/';
// const stakeholderDistFile = 'dist/stakeholder/index.tsx';
// const stakeholderSrcPath = 'src/stakeholderApp/index.tsx';

// if (!fs.existsSync(stakeholderDistDir)) {
//   fs.mkdirSync(stakeholderDistDir, { recursive: true });
// }
