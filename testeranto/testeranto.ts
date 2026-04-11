import type { ITesterantoConfig } from "../src/Types";
import { EisenhowerMatrixSlicer } from "../src/views/defaultViews/EisenhowerMatrix";
import { GanttSlicer } from "../src/views/defaultViews/Gantt";
import { KanbanSlicer } from "../src/views/defaultViews/KanbanBoard";

export const golangciLintCommand = (files: string[]): string => {
  // Simple implementation - just run on all Go files
  return "golangci-lint run ./... --timeout=5m --issues-exit-code=0";
};

const config: ITesterantoConfig = {

  views: {
    Kanban: {
      slicer: KanbanSlicer,
      filePath: 'src/views/defaultViews/KanbanBoardView.tsx'
    },
    EisenhowerMatrix: {
      slicer: EisenhowerMatrixSlicer,
      filePath: 'src/views/defaultViews/EisenhowerMatrixView.tsx'
    },
    Gantt: {
      slicer: GanttSlicer,
      filePath: 'src/views/defaultViews/GanttView.tsx'
    },

  },

  agents: {
    'prodirek': {
      load: [
        `/read SOUL.md`,
        `/read testeranto/slices/agents/prodirek.json`
      ],
      message: `Your name is "Prodirek". You are a Product Manager. Your responsibilities are: Groom and features, tickets and documentation. Use these docs to maintain the "specifications" for tests. You don't need to worry about the code or the other test files- you job is groom the specifications, keep them congruent with the docs. You can communicate with other agents through the graph: Chat messages are added to the graph when aider blocks complete. Your slice data (available in 'YOU_NAME.json') includes other agents' messages as chat_message nodes. You can post a message by curling the endpoint 'curl -X POST http://localhost:3000/~/chat -H "Content-Type: application/json" -d '{"agentName": "prodirek", "content": "Hello from Prodirek!"}''`,

      sliceFunction: (graphManager: any) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;
        const allEdges = graphData.edges;

        // Include all chat_message nodes from all agents
        const productNodes = allNodes.filter((node: any) =>
          node.type === 'feature' ||
          node.type === 'documentation' ||
          node.type === 'chat_message' ||
          node.type === 'agent'
        );

        const productEdges = allEdges.filter((edge: any) =>
          productNodes.some((n: any) => n.id === edge.source) &&
          productNodes.some((n: any) => n.id === edge.target)
        );

        return {
          nodes: productNodes,
          edges: productEdges
        };
      }
    },

    'arko': {
      load: [
        `/read SOUL.md`,
        `/read chat_slice.json`
      ],
      message: `Your name is "Arko". You are a Software Architect. Your responsibilities are: 1) You will be give a ticket to implement. 2) Use these docs to implement new features. 3) Create testeranto test(s) for your work. You should focus on the adapter- the product manager and the junior engineer will take care of the speciations and implementations. You have deputized to make broad architectural decisions. 4) Your ticket will contain some files to add to your context to get your started. You should limit yourself to the files given to you. Do not add any more files to your context.`,
      sliceFunction: (graphManager: any) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;
        const allEdges = graphData.edges;

        // Include all chat_message nodes from all agents
        const nodes = allNodes.filter((node: any) =>
          node.type === 'config' ||
          node.type === 'entrypoint' ||
          node.type === 'chat_message' ||
          node.type === 'agent'
        );

        const edges = allEdges.filter((edge: any) =>
          nodes.some((n: any) => n.id === edge.source) &&
          nodes.some((n: any) => n.id === edge.target)
        );

        return {
          nodes: nodes,
          edges: edges
        };
      }
    },
    // 'juna': {
    //   markdownFile: './testeranto/agents/juna.md',
    //   sliceFunction: (graphManager: any) => {
    //     const graphData = graphManager.getGraphData();
    //     const allNodes = graphData.nodes;
    //     const allEdges = graphData.edges;

    //     const juniorNodes = allNodes.filter((node: any) =>
    //       node.type === 'test' ||
    //       node.type === 'file'
    //     );

    //     const juniorEdges = allEdges.filter((edge: any) =>
    //       juniorNodes.some((n: any) => n.id === edge.source) &&
    //       juniorNodes.some((n: any) => n.id === edge.target)
    //     );

    //     return {
    //       nodes: juniorNodes,
    //       edges: juniorEdges
    //     };
    //   }
    // },

    // 'sipestro': {
    //   markdownFile: './testeranto/agents/sipestro.md',
    //   sliceFunction: (graphManager: any) => {
    //     // TODO update this
    //     const graphData = graphManager.getGraphData();
    //     const allNodes = graphData.nodes;
    //     const allEdges = graphData.edges;

    //     const juniorNodes = allNodes.filter((node: any) =>
    //       node.type === 'test' ||
    //       node.type === 'file'
    //     );

    //     const juniorEdges = allEdges.filter((edge: any) =>
    //       juniorNodes.some((n: any) => n.id === edge.source) &&
    //       juniorNodes.some((n: any) => n.id === edge.target)
    //     );

    //     return {
    //       nodes: juniorNodes,
    //       edges: juniorEdges
    //     };
    //   }
    // },
    // 'cefo': {
    //   markdownFile: './testeranto/agents/cefo.md',
    //   sliceFunction: (graphManager: any) => {
    //     // TODO update this
    //     const graphData = graphManager.getGraphData();
    //     const allNodes = graphData.nodes;
    //     const allEdges = graphData.edges;

    //     const nodes = allNodes.filter((node: any) =>
    //       node.type === 'test' ||
    //       node.type === 'file'
    //     );

    //     const edges = allEdges.filter((edge: any) =>
    //       nodes.some((n: any) => n.id === edge.source) &&
    //       nodes.some((n: any) => n.id === edge.target)
    //     );

    //     return {
    //       nodes: edges,
    //       edges: edges
    //     };
    //   }
    // }
  },

  volumes: [
    `${process.cwd()}/src:/workspace/src`,
    `${process.cwd()}/test:/workspace/test`,
    // Note: node_modules is NOT mounted to avoid platform incompatibility
  ],

  featureIngestor: async function (s: string): Promise<{ data: string; filepath: string }> {
    // Example implementation:
    // Fetch the URL content
    const response = await fetch(s);
    const data = await response.text();

    // Determine where to save it
    // Save to a location that matches the virtual folder structure
    const url = new URL(s);
    const hostname = url.hostname.replace(/\./g, '_');
    const pathname = url.pathname.replace(/\//g, '_').replace(/\./g, '_') || 'index';
    const filename = `${pathname}.md`;
    // Save under web/ directory to match virtual folder structure
    const filepath = `tickets/web/${hostname}/${filename}`;

    return { data, filepath };
  },

  runtimes: {

    nodetests: {
      runtime: "node",
      tests: [
        // "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
        // "src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts",
        // "src/lib/tiposkripto/tests/circle/Circle.test.ts",
        // "src/lib/tiposkripto/tests/Rectangle/Rectangle.test.ts",
        // "src/vscode/providers/AiderProcessTreeDataProvider.test/AiderProcessTreeDataProvider.test.ts",
        // "src/server/serverClasses/Server_GraphMangerCore.test/Server_GraphManagerCore.test.ts",
        "src/vscode/providers/logic/FileTreeLogic.test.ts"
        // "src/vscode/providers/utils/testTree/treeFilter.test.ts",
        // "src/vscode/providers/utils/testTree/debugTest.js"
        // "src/server/serverClasses/Server_Http/utils/handleCollatedFilesUtils/fileOperations.ts.",
      ],
      checks: [
        (x) => `yarn eslint ${x.join(" ")} `,
        (x) => `yarn tsc --noEmit ${x.join(" ")}`,
        // Run the calculator test
        (x) => {
          const calculatorTest = x.find(f => f.includes("Calculator.test.node.ts"));
          if (calculatorTest) {
            return `yarn tsx ${calculatorTest}`;
          }
          return "echo 'No calculator test found'";
        },
        // // Run Jest tests
        // (x) =>
        //   `yarn jest ${x.filter((f) => f.includes("jest.test")).join(" ")} --passWithNoTests`,

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
    //   buildKitOptions: {
    //     cacheMounts: ["/root/.m2", "/root/.gradle"],
    //   },
    //   outputs: ["src/lib/kafe/examples/calculator/Calculator.java"]
    // },

    // rubytests: {
    //   runtime: "ruby",
    //   tests: [
    //     // "src/lib/rubeno/examples/calculator/Calculator.test.rb",
    //   ],
    //   checks: [
    //     // Syntax check with proper load path
    //     // (x) => {
    //     //   const firstTest = x[0];
    //     //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
    //     //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
    //     //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} -c Calculator.test.rb`;
    //     // },
    //     // // Run the calculator test with proper load path
    //     // (x) => {
    //     //   const firstTest = x[0];
    //     //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
    //     //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
    //     //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} run_test.rb`;
    //     // },
    //   ],
    //   dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [
    //     "test_output",
    //     "testeranto/reports/rubytests"
    //   ],
    // },



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
    //     // "src/lib/pitono/examples/calculator_test.py",
    //   ],
    //   checks: [
    //     // Python syntax check
    //     (x) => `python -m py_compile ${x.join(" ")}`,
    //     // Run the calculator test
    //     (x) => `cd src/lib/pitono/examples && python calculator_test.py`,
    //     // Run unittest tests (if any)
    //     (x) =>
    //       `python -m unittest ${x.filter((f) => f.includes("unittest.test")).join(" ")}`,
    //   ],
    //   dockerfile: `testeranto/runtimes/python/python.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/python/python.py`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [
    //     "testeranto/reports/pythontests"
    //   ],
    // },

    // golangtests: {
    //   runtime: "golang",
    //   tests: [
    //     // Way 1: Golingvu tests on Testeranto
    //     // "src/lib/golingvu/examples/calculator/golingvu_test.go",

    //     // Way 2: Standard Go tests on Testeranto  
    //     // "src/lib/golingvu/examples/calculator/native_test.go",

    //     // // Additional test files
    //     // "src/lib/golingvu/golingvu_test.go",
    //     // "src/lib/golingvu/interopt_test.go",
    //     // "src/lib/golingvu/integration_test.go",
    //     // "src/lib/golingvu/package_test.go",
    //   ],
    //   checks: [
    //     // Simple syntax check
    //     () => "go fmt ./...",

    //     // Simple vet check
    //     () => "go vet ./...",

    //     // Run Golingvu tests
    //     (x) => {
    //       const calculatorTest = x.find(f => f.includes("golingvu_test.go"));
    //       if (calculatorTest) {
    //         return `go test -v ${calculatorTest}`;
    //       }
    //       return "echo 'No golang calculator test found'";
    //     },

    //     // All tests together
    //     () => "go test -v ./src/lib/golingvu/...",

    //     // Coverage report
    //     () => "go test -coverprofile=coverage.out ./src/lib/golingvu/... && go tool cover -func=coverage.out",

    //     // Lint check - use version compatible with Go 1.22
    //     () => "golangci-lint run ./src/lib/golingvu/... --timeout=5m"
    //   ],
    //   dockerfile: `testeranto/runtimes/golang/golang.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/golang/golang.ts`,
    //   buildKitOptions: {
    //     cacheMounts: [
    //       "/go/pkg/mod",
    //       "/root/.cache/go-build"
    //     ],
    //   },
    //   outputs: [
    //     "coverage.out",
    //     "coverage.html"
    //   ],
    // },

    // rusttests: {
    //   runtime: "rust",
    //   tests: [
    //     // "src/lib/rusto/examples/calculator_test.rs",
    //     // "src/lib/rusto/examples/calculator_complete_test.rs",
    //   ],
    //   checks: [
    //     // (x) => `cargo test --manifest-path=${x[0].split("/src/")[0]}/Cargo.toml`,
    //   ],
    //   dockerfile: `testeranto/runtimes/rust/rust.Dockerfile`,
    //   buildOptions: `testeranto/runtimes/rust/rust.ts`,
    //   buildKitOptions: {
    //     // Single-stage Dockerfile, no targetStage needed
    //   },
    //   outputs: [],
    // },
  },

};

export default config;
