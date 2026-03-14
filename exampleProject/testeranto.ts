import { ITestconfigV2 } from "testeranto/src/Types";

export const golangciLintCommand = (files: string[]): string => {
  if (files.length === 0) return "golangci-lint run ./...";

  // Escape dots and join files into apru regex: (file1\.go|file2\.go)
  const pattern = files
    .map(f => f.replace(/\./g, '\\.'))
    .join('|');

  // We use ./... to ensure the linter sees all dependencies,
  // but '--include' ensures it only outputs issues for your list.
  return `golangci-lint run ./... --include "^(${pattern})$" --issues-exit-code=0`;
};

const config: ITestconfigV2 = {
  featureIngestor: async (s: string): Promise<string> => s,

  runtimes: {
    nodetests: {
      runtime: "node",
      tests: ["src/ts/Calculator.test.node.ts"],
      checks: [
        (x: string[]) => `yarn eslint ${x.join(' ')}`,
        (x: string[]) => `yarn tsc --noEmit ${x.join(' ')}`,
      ],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["npm", "yarn"]
      }
    },

    webtests: {
      runtime: "web",
      tests: ["src/ts/Calculator.test.web.ts"],
      checks: [
        (x: string[]) => `yarn eslint ${x.join(' ')}`,
        (x: string[]) => `yarn tsc --noEmit ${x.join(' ')}`,
      ],
      dockerfile: `testeranto/runtimes/web/web.Dockerfile`,
      buildOptions: `testeranto/runtimes/web/web.ts`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["npm", "yarn"]
      }
    },

    golangtests: {
      runtime: "golang",
      tests: ["example/Calculator.golingvu.test.go"],
      checks: [
        (x: string[]) => `go vet ${x.join(' ')}`,
        golangciLintCommand,
      ],
      dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
      buildOptions: `testeranto/runtimes/golang/golang.go`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["/go/pkg/mod", "/root/.cache/go-build"]
      }
    },

    rubytests: {
      runtime: "ruby",
      tests: ["example/Calculator-test.rb"],
      checks: [
        (x: string[]) => `rubocop ${x.join(' ')}`,
      ],
      dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
      buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["/usr/local/bundle"]
      }
    },

    rusttests: {
      runtime: "rust",
      tests: ["src/rust/Calculator.rusto.test.rs"],
      checks: [
        (x: string[]) => `cargo clippy ${x.join(' ')}`,
      ],
      dockerfile: `testeranto/runtimes/rust/rust.Dockerfile`,
      buildOptions: `testeranto/runtimes/rust/rust.rs`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["/usr/local/cargo/registry", "/usr/local/cargo/git"]
      }
    },

    javatests: {
      runtime: "java",
      tests: ["example/Calculator-test.java"],
      checks: [
        (x: string[]) => `javac -cp ".:lib/*" ${x.join(' ')}`,
      ],
      dockerfile: `testeranto/runtimes/java/java.Dockerfile`,
      buildOptions: `testeranto/runtimes/java/java.java`,
      outputs: [],
      buildKitOptions: {
        cacheMounts: ["/root/.m2", "/root/.gradle"]
      }
    },
  },
};

export default config;
