import * as esbuild from 'esbuild'

// Build main library (ES modules for Node.js)
await esbuild.build({
  entryPoints: [
    'index.ts',
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  packages: "external",
  external: [
    "react", "react-dom"
  ],
})

// Build charts individually for tree-shaking
const charts = [
  'charts/EisenhowerMatrix',
  'charts/GanttChart',
  'charts/KanbanBoard',
  'charts/TreeGraph',
  'charts/BaseChart',
  'core/types',
  'core/projection',
  'core/layout',
  'core/styling',
  'hooks/useProjection',
  'hooks/useInteraction'
]

for (const chart of charts) {
  try {
    await esbuild.build({
      entryPoints: [`${chart}.tsx`],
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      outfile: `dist/${chart}.js`,
      packages: "external",
      external: [
        "react", "react-dom"
      ],
    })
    console.log(`Built ${chart}`)
  } catch (error) {
    // Some files might be .ts instead of .tsx
    try {
      await esbuild.build({
        entryPoints: [`${chart}.ts`],
        bundle: true,
        format: "esm",
        platform: "node",
        target: "node20",
        outfile: `dist/${chart}.js`,
        packages: "external",
        external: [
          "react", "react-dom"
        ],
      })
      console.log(`Built ${chart}`)
    } catch (error2) {
      console.warn(`Could not build ${chart}:`, error2.message)
    }
  }
}

// Build browser version (if needed)
await esbuild.build({
  entryPoints: [
    'index.ts',
  ],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  outfile: "dist/browser/index.js",
  external: ["react", "react-dom"],
})

console.log("All builds completed successfully")
