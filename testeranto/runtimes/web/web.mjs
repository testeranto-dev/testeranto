// the esbuild configuration for testeranto/web
export default {
  loaders: [],
  external: [],
  define: {
    'process.env.NODE_ENV': '"test"',
    'window.IS_TEST': 'true'
  }
}
