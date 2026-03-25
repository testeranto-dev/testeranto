import esbuild from "esbuild";

const ctx = await esbuild.context({
  target: "esnext",
  format: "esm",
  splitting: true,
  outExtension: { ".js": ".mjs" },
  outbase: ".",
  jsx: "transform",
  bundle: true,
  write: true,
  loader: { ".js": "jsx", ".png": "binary", ".jpg": "binary" },
  outdir: ".",
  metafile: true,
  supported: { "dynamic-import": true },
  define: {
    "process.env.FLUENTFFMPEG_COV": "0",
    ENV: "node"
  },
  platform: "node",
  packages: "external",
  entryPoints: ["./tests/abstractBase.test/index.ts"],
  plugins: []
});

try {
  ctx.rebuild();
} catch (e) {
  console.error("This error never catches");
  console.error(e);
  process.exit(1);
}
