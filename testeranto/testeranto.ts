import type { ITestconfigV2 } from "../src/Types";

export const golangciLintCommand = (files: string[]): string => {
  // Simple implementation - just run on all Go files
  return "golangci-lint run ./... --timeout=5m --issues-exit-code=0";
};

const config: ITestconfigV2 = {

  volumes: [
    `${process.cwd()}/src:/workspace/src`,
    `${process.cwd()}/test:/workspace/test`,
    // Note: node_modules is NOT mounted to avoid platform incompatibility
  ],

  featureIngestor: function (s: string): Promise<string> {
    throw new Error("Function not implemented.");
  },

  runtimes: {
    // javatests: {
    //   runtime: "java",
    //   tests: [
    //     // "src/java/test/java/com/example/calculator/CalculatorTest.java",
    //     // "src/java/test/java/com/example/calculator/CalculatorJUnitTest.java", // Standard JUnit test
    //   ],
    //   checks: [
    //     (x: string[]) => `javac -cp ".:lib/*" ${x.join(" ")}`,
    //     // Run JUnit tests
    //     (x: string[]) =>
    //       `java -cp ".:lib/*:." org.junit.platform.console.ConsoleLauncher --select-class=com.example.calculator.CalculatorJUnitTest`,
    //   ],
    //   dockerfile: `testeranto/runtimes/java/java.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/java/java.java`,
    //   outputs: [],
    //   buildKitOptions: {
    //     cacheMounts: ["/root/.m2", "/root/.gradle"],
    //   },
    // },

    // rubytests: {
    //   runtime: "ruby",
    //   tests: [
    //     // "src/ruby/Calculator-test.rb",
    //     // "src/ruby/Calculator.rspec.test.rb", // Standard RSpec test
    //   ],
    //   checks: [
    //     (x) => `bundle exec rubocop ${x.join(" ")}`,
    //     // Run RSpec tests
    //     (x) =>
    //       `bundle exec rspec ${x.filter((f) => f.includes("rspec.test")).join(" ")}`,
    //   ],
    //   dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },

    nodetests: {
      runtime: "node",
      tests: [
        "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
        "src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts",
        // "src/vscode/providers/utils/testTree/treeFilter.test.ts",
        "src/vscode/providers/utils/testTree/debugTest.js"
        // "src/server/serverClasses/Server_Http/utils/handleCollatedFilesUtils/fileOperations.ts.",
      ],
      checks: [
        (x) => `yarn eslint ${x.join(" ")} `,
        (x) => `yarn tsc --noEmit ${x.join(" ")}`,
        // Run Jest tests
        (x) =>
          `yarn jest ${x.filter((f) => f.includes("jest.test")).join(" ")} --passWithNoTests`,

        // () => `yarn node test/logFilesTest.js`, // you can run regular tests too!

        // () => `src/vscode/providers/utils/testTree/debugTest.js`
      ],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [],
    },

    // webtests: {
    //   runtime: "web",
    //   tests: [
    //     // "src/ts/Calculator.test.web.ts",
    //     // "src/ts/Calculator.test.web.react.ts",
    //     // We could add a standard web test framework like Vitest here
    //   ],
    //   checks: [
    //     (x) => `yarn eslint ${x.join(" ")} `,
    //     (x) => `yarn tsc --noEmit ${x.join(" ")}`,
    //   ],
    //   dockerfile: `testeranto/runtimes/web/web.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/web/web.ts`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },

    // pythontests: {
    //   runtime: "python",
    //   tests: [
    //     // "src/python/Calculator.pitono.test.py",
    //     // "src/python/Calculator.unittest.test.py", // Standard unittest test
    //   ],
    //   checks: [
    //     // Python syntax check
    //     (x) => `python -m py_compile ${x.join(" ")}`,
    //     // Run unittest tests
    //     (x) =>
    //       `python -m unittest ${x.filter((f) => f.includes("unittest.test")).join(" ")}`,
    //   ],
    //   dockerfile: `testeranto/runtimes/python/python.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/python/python.py`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },

    golangtests: {
      runtime: "golang",
      tests: [
        // Way 1: Golingvu tests on Testeranto
        "src/lib/golingvu/examples/calculator/golingvu_test.go",

        // Way 2: Standard Go tests on Testeranto  
        // "src/lib/golingvu/examples/calculator/native_test.go",

        // // Additional test files
        // "src/lib/golingvu/golingvu_test.go",
        // "src/lib/golingvu/interopt_test.go",
        // "src/lib/golingvu/integration_test.go",
        // "src/lib/golingvu/package_test.go",
      ],
      checks: [
        // Simple syntax check
        // () => "go fmt ./...",

        // // Simple vet check
        // () => "go vet ./...",

        // // Way 1 & 4: Run Golingvu tests
        // () => "go test -v ./src/lib/golingvu/examples/calculator/golingvu_test.go ./src/lib/golingvu/golingvu_test.go ./src/lib/golingvu/interopt_test.go ./src/lib/golingvu/integration_test.go",

        // // Way 2 & 3: Run standard Go tests
        // () => "go test -v ./src/lib/golingvu/examples/calculator/native_test.go ./src/lib/golingvu/package_test.go",

        // // All tests together
        // () => "go test -v ./src/lib/golingvu/...",

        // // Coverage report
        // () => "go test -coverprofile=coverage.out ./src/lib/golingvu/... && go tool cover -func=coverage.out",

        // // Lint check - use version compatible with Go 1.22
        // () => "golangci-lint run ./src/lib/golingvu/... --timeout=5m"
      ],
      dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
      buildOptions: `testeranto/runtimes/golang/golang.ts`,
      buildKitOptions: {
        cacheMounts: [
          "/go/pkg/mod",
          "/root/.cache/go-build"
        ],
      },
      outputs: [
        "coverage.out",
        "coverage.html"
      ],
    },

    // rusttests: {
    //   runtime: "rust",
    //   tests: [
    //     // "src/rust/testeranto/Calculator.rusto.test.rs",
    //     // "src/rust/testeranto/Calculator.native.test.rs", // Standard Rust test
    //   ],
    //   checks: [
    //     // Run Rust tests
    //     // (x) =>
    //     //   `cargo test --manifest-path=${x[0].split("/src/")[0]}/Cargo.toml`,
    //   ],
    //   dockerfile: `testeranto/runtimes/rust/rust.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/rust/rust.ts`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },
  },

  documentationGlob: "./**/*.md",
};

export default config;
