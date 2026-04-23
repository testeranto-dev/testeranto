import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

export const generateViewBundleUtil = async (
  viewKey: string,
  viewPath: string,
  createErrorBundleFn: (bundlePath: string, viewKey: string, errorMessage: string) => void
): Promise<void> => {
  const viewsDir = path.join(process.cwd(), "src", "views");
  const bundlePath = path.join(viewsDir, `${viewKey}.bundle.js`);
  const absoluteViewPath = path.join(process.cwd(), viewPath);

  // Delete existing bundle to ensure fresh generation
  if (fs.existsSync(bundlePath)) {
    console.log(`[Server] Deleting existing bundle for ${viewKey} at ${bundlePath}`);
    fs.unlinkSync(bundlePath);
  }

  if (!fs.existsSync(absoluteViewPath)) {
    console.error(`[Server] View file not found: ${absoluteViewPath}`);
    createErrorBundleFn(bundlePath, viewKey, `View file not found: ${absoluteViewPath}`);
    return;
  }

  // Generate component name: capitalize first letter and add "View"
  const componentName = viewKey.charAt(0).toUpperCase() + viewKey.slice(1) + 'View';

  const wrapperPath = path.join(viewsDir, `${viewKey}.wrapper.tsx`);

  // Calculate the import path relative to the wrapper
  // The wrapper is in testeranto/views/, viewPath is relative to project root
  // We need to go from wrapper to view file
  const projectRoot = process.cwd();
  const wrapperDir = path.dirname(wrapperPath);
  const viewFileDir = path.dirname(absoluteViewPath);

  // Get relative path from wrapper to view file directory
  const relativeDir = path.relative(wrapperDir, viewFileDir);

  // Get filename without extension
  const viewFileName = path.basename(absoluteViewPath, '.tsx');

  // Construct import path
  let importPath = path.join(relativeDir, viewFileName);
  // Fix path separators for ES modules
  importPath = importPath.replace(/\\/g, '/');

  // Ensure it starts with ./
  if (!importPath.startsWith('.')) {
    importPath = `./${importPath}`;
  }

  // Create wrapper content
  const wrapperContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import ${componentName} from '${importPath}';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(${componentName}, {
      slicePath: '/~/views/${viewKey}/slice'
    })
  );
}
`;

  fs.writeFileSync(wrapperPath, wrapperContent, 'utf-8');

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: [wrapperPath],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    outfile: bundlePath,
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    alias: {
      'react': path.dirname(require.resolve('react')),
      'react-dom': path.dirname(require.resolve('react-dom')),
    },
    nodePaths: [path.join(process.cwd(), 'node_modules')],
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js'
    },
    external: ['react', 'react-dom'],
  };

  try {
    console.log(`[Server] Bundling view ${viewKey} from ${wrapperPath} to ${bundlePath}`);
    const result = esbuild.buildSync(buildOptions);

    // Clean up wrapper file
    fs.unlinkSync(wrapperPath);

    if (result.errors && result.errors.length > 0) {
      console.error(`[Server] Errors bundling view ${viewKey}:`, result.errors);
      createErrorBundleFn(bundlePath, viewKey, result.errors.map(e => e.text).join(', '));
    } else {
      console.log(`[Server] Successfully bundled view ${viewKey} to ${bundlePath}`);

      // Verify the bundle was created
      if (fs.existsSync(bundlePath)) {
        const stats = fs.statSync(bundlePath);
        console.log(`[Server] Bundle created: ${bundlePath} (${stats.size} bytes)`);
      } else {
        console.error(`[Server] Bundle not created at ${bundlePath}`);
      }
    }
  } catch (error) {
    console.error(`[Server] Error bundling view ${viewKey}:`, error);
    createErrorBundleFn(bundlePath, viewKey, error instanceof Error ? error.message : String(error));
  }
};
