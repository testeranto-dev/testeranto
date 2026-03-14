---
owner: adam
status: working
due date: idk
ETA: idk
---

### Ruby Runtime

**Implementation Details**:

- **Cache Mounts**: Gem caches (`/usr/local/bundle`)
- **BuildKit Integration**: On-demand builds with `rubyBuildKitBuild` function
- **Dependency Analysis**: Ruby file dependency tracking with require/require_relative
- **Bundle Generation**: Creates executable Ruby test bundles
- **Gem Management**: Works with Bundler and Gemfile.lock

**Example Configuration**:

```typescript
rubytests: {
  runtime: "ruby",
  tests: ["example/Calculator-test.rb"],
  checks: [
    (x) => `rubocop ${x.join(' ')}`,
  ],
  dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
  buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
  buildKitOptions: {
    cacheMounts: ["/usr/local/bundle"],
    targetStage: "runtime"
  }
}
```

**Migration Complete**: Ruby runtime uses BuildKit exclusively with optimized gem caching.
