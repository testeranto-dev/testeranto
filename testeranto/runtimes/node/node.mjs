// the esbuild configuration for testeranto/node
export default {
  loaders: [],
  external: ['fs', 'child_process', 'http', 'https', 'process'],
  define: {
    'process.env.NODE_ENV': '"test"',
    'global': 'globalThis'
  },
  inject: ['./src/server/depsMocked.ts'],
  banner: {
    js: `
      import deps from './src/server/depsMocked.ts';
      globalThis.fs = deps.fs;
      globalThis.http = deps.http || require('http');
      globalThis.https = deps.https || require('https');
      globalThis.child_process = deps.child_process || require('child_process');
      globalThis.process = deps.process || require('process');
    `
  }
}
