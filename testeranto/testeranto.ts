import type { ITesterantoConfig } from "../src/Types";
import { ChatSlicer } from "../src/vscode/views/defaultViews/Chat";
import { DebugGraphSlicer } from "../src/vscode/views/defaultViews/DebugGraph";
import { EisenhowerMatrixSlicer } from "../src/vscode/views/defaultViews/EisenhowerMatrix";
import { GanttSlicer } from "../src/vscode/views/defaultViews/Gantt";
import { KanbanSlicer } from "../src/vscode/views/defaultViews/KanbanBoard";
// import { DebugGraphSlicerV2 } from "../src/vscode/views/defaultViews/DebugGraphV2";
import { HomeSlicer } from "../src/vscode/views/defaultViews/Home";

export const golangciLintCommand = (files: string[]): string => {
  // Simple implementation - just run on all Go files
  return "golangci-lint run ./... --timeout=5m --issues-exit-code=0";
};


const m = (n: string) => `You can communicate with other agents through the graph: Chat messages are added to the graph when aider blocks complete. Your slice data (available in 'YOU_NAME.json') includes other agents' messages as chat_message nodes. You can post a message by curling the endpoint: curl -X POST http://host.docker.internal:3000/~/chat -H "Content-Type: application/json" -d '{"agentName": "${n}", "content": "Hello from ${n}!"}'.`

const config: ITesterantoConfig = {

  views: {
    Home: {
      slicer: HomeSlicer,
      filePath: 'src/vscode/views/defaultViews/HomeView.tsx'
    },
    Kanban: {
      slicer: KanbanSlicer,
      filePath: 'src/vscode/views/defaultViews/KanbanBoardView.tsx'
    },
    EisenhowerMatrix: {
      slicer: EisenhowerMatrixSlicer,
      filePath: 'src/vscode/views/defaultViews/EisenhowerMatrixView.tsx'
    },
    Gantt: {
      slicer: GanttSlicer,
      filePath: 'src/vscode/views/defaultViews/GanttView.tsx'
    },
    Chat: {
      slicer: ChatSlicer,
      filePath: 'src/vscode/views/defaultViews/ChatView.tsx'
    },
    DebugGraph: {
      slicer: DebugGraphSlicer,
      filePath: 'src/vscode/views/defaultViews/DebugGraphView.tsx'
    },
    DebugGraphV2: {
      slicer: (x) => x,
      filePath: 'src/vscode/views/defaultViews/DebugGraphViewV2.tsx'
    },
  },

  agents: {
    'prodirek': {
      persona: `testeranto/agents/prodirek.md`,
      sliceFunction: (graphManager: any) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;

        // Collect minimal data for product management
        const features = allNodes
          .filter((node: any) => node.type === 'feature')
          .map((node: any) => ({
            id: node.id,
            label: node.label,
            status: node.status || node.metadata?.frontmatter?.status,
            priority: node.priority || node.metadata?.frontmatter?.priority,
            description: node.description,
            metadata: node.metadata ? {
              frontmatter: node.metadata.frontmatter
            } : undefined
          }));

        const documentation = allNodes
          .filter((node: any) => node.type === 'documentation')
          .map((node: any) => ({
            id: node.id,
            label: node.label,
            content: node.metadata?.content ?
              node.metadata.content.substring(0, 200) + (node.metadata.content.length > 200 ? '...' : '') :
              undefined
          }));

        const chatMessages = allNodes
          .filter((node: any) =>
            node.type &&
            typeof node.type === 'object' &&
            node.type.category === 'chat' &&
            node.type.type === 'chat_message'
          )
          .map((node: any) => ({
            id: node.id,
            sender: node.sender || node.metadata?.sender,
            content: node.content || node.metadata?.content,
            timestamp: node.timestamp || node.metadata?.timestamp,
            preview: (node.content || node.metadata?.content) ?
              (node.content || node.metadata?.content).substring(0, 100) +
              ((node.content || node.metadata?.content).length > 100 ? '...' : '') :
              undefined
          }));

        const agents = allNodes
          .filter((node: any) =>
            node.type &&
            typeof node.type === 'object' &&
            node.type.category === 'agent' &&
            node.type.type === 'agent'
          )
          .map((node: any) => ({
            id: node.id,
            name: node.agentName || node.metadata?.agentName,
            label: node.label,
            description: node.description,
            message: node.message || node.metadata?.message
          }));

        return {
          viewType: 'agent',
          agentName: 'prodirek',
          timestamp: new Date().toISOString(),
          data: {
            features,
            documentation,
            chatMessages,
            agents,
            summary: {
              totalFeatures: features.length,
              totalDocumentation: documentation.length,
              totalChatMessages: chatMessages.length,
              totalAgents: agents.length
            }
          }
        };
      }
    },

    'arko': {

      persona: `testeranto/agents/arko.md`,

      sliceFunction: (graphManager: any) => {
        const graphData = graphManager.getGraphData();
        const allNodes = graphData.nodes;

        // Collect minimal data for architecture
        const configs = allNodes
          .filter((node: any) => node.type === 'config')
          .map((node: any) => ({
            id: node.id,
            label: node.label,
            key: node.metadata?.configKey,
            runtime: node.metadata?.runtime
          }));

        const entrypoints = allNodes
          .filter((node: any) => node.type === 'entrypoint')
          .map((node: any) => ({
            id: node.id,
            label: node.label,
            testName: node.metadata?.testName,
            configKey: node.metadata?.configKey,
            runtime: node.metadata?.runtime
          }));

        const chatMessages = allNodes
          .filter((node: any) =>
            node.type &&
            typeof node.type === 'object' &&
            node.type.category === 'chat' &&
            node.type.type === 'chat_message'
          )
          .map((node: any) => ({
            id: node.id,
            sender: node.sender || node.metadata?.sender,
            content: node.content || node.metadata?.content,
            timestamp: node.timestamp || node.metadata?.timestamp,
            preview: (node.content || node.metadata?.content) ?
              (node.content || node.metadata?.content).substring(0, 100) +
              ((node.content || node.metadata?.content).length > 100 ? '...' : '') :
              undefined
          }));

        const agents = allNodes
          .filter((node: any) =>
            node.type &&
            typeof node.type === 'object' &&
            node.type.category === 'agent' &&
            node.type.type === 'agent'
          )
          .map((node: any) => ({
            id: node.id,
            name: node.agentName || node.metadata?.agentName,
            label: node.label,
            role: 'agent',
            message: node.message || node.metadata?.message
          }));

        return {
          viewType: 'agent',
          agentName: 'arko',
          timestamp: new Date().toISOString(),
          data: {
            configs,
            entrypoints,
            chatMessages,
            agents,
            summary: {
              totalConfigs: configs.length,
              totalEntrypoints: entrypoints.length,
              totalChatMessages: chatMessages.length,
              totalAgents: agents.length
            }
          }
        };
      }
    },
  },

  volumes: [
    `${process.cwd()}/src:/workspace/src`,
    `${process.cwd()}/test:/workspace/test`,
    `${process.cwd()}/SOUL.md:/workspace/SOUL.md`,
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
        "src/lib/tiposkripto/tests/abstractBase.test/index.ts",
        "src/lib/tiposkripto/tests/calculator/Calculator.test.node.ts",
        "src/lib/tiposkripto/tests/circle/Circle.test.ts",
        "src/lib/tiposkripto/tests/Rectangle/Rectangle.test.ts",
        // "src/vscode/providers/AiderProcessTreeDataProvider.test/AiderProcessTreeDataProvider.test.ts",
        // "src/server/serverClasses/Server_GraphMangerCore.test/Server_GraphManagerCore.test.ts",
        // "src/vscode/providers/logic/FileTreeLogic.test.ts",
        // "src/vscode/providers/utils/testTree/treeFilter.test.ts",
        // "src/vscode/providers/utils/testTree/debugTest.js",
        // "src/server/serverClasses/Server_Http/utils/handleCollatedFilesUtils/fileOperations.ts.",
      ],
      checks: [
        // (x) => `yarn eslint ${x.join(" ")} `,
        // (x) => `yarn tsc --noEmit ${x.join(" ")}`,
        // // Run the calculator test
        // (x) => {
        //   const calculatorTest = x.find(f => f.includes("Calculator.test.node.ts"));
        //   if (calculatorTest) {
        //     return `yarn tsx ${calculatorTest}`;
        //   }
        //   return "echo 'No calculator test found'";
        // },
        // // Run Jest tests
        // (x) =>
        //   `yarn jest ${x.filter((f) => f.includes("jest.test")).join(" ")} --passWithNoTests`,

      ],
      dockerfile: `testeranto/runtimes/node/node.Dockerfile`,
      buildOptions: `testeranto/runtimes/node/node.mjs`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [],
    },


    webtests: {
      runtime: "web",
      tests: [
        "src/lib/tiposkripto/tests/calculator/Calculator.test.web.ts",
        "src/lib/tiposkripto/tests/calculator/Calculator.test.web.react.ts",
        // We could add a standard web test framework like Vitest here
      ],
      checks: [
        (x) => `yarn eslint ${x.join(" ")} `,
        (x) => `yarn tsc --noEmit ${x.join(" ")}`,
      ],
      dockerfile: `testeranto/runtimes/web/web.Dockerfile`,
      buildOptions: `testeranto/runtimes/web/web.ts`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [],
    },

    javatests: {
      runtime: "java",
      tests: [
        "src/java/test/java/com/example/calculator/CalculatorTest.java",
        // "src/java/test/java/com/example/calculator/CalculatorJUnitTest.java", // Standard JUnit test
      ],
      checks: [
        (x: string[]) => `javac -cp ".:lib/*" ${x.join(" ")}`,
        // Run JUnit tests
        (x: string[]) =>
          `java -cp ".:lib/*:." org.junit.platform.console.ConsoleLauncher --select-class=com.example.calculator.CalculatorJUnitTest`,
      ],
      dockerfile: `testeranto/runtimes/java/java.Dockerfile`,
      buildOptions: `testeranto/runtimes/java/java.java`,
      buildKitOptions: {
        cacheMounts: ["/root/.m2", "/root/.gradle"],
      },
      outputs: ["src/lib/kafe/examples/calculator/Calculator.java"]
    },

    rubytests: {
      runtime: "ruby",
      tests: [
        "src/lib/rubeno/examples/calculator/Calculator.test.rb",
      ],
      checks: [
        // Syntax check with proper load path
        // (x) => {
        //   const firstTest = x[0];
        //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
        //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
        //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} -c Calculator.test.rb`;
        // },
        // // Run the calculator test with proper load path
        // (x) => {
        //   const firstTest = x[0];
        //   const dir = firstTest.substring(0, firstTest.lastIndexOf('/'));
        //   const libDir = dir.substring(0, dir.lastIndexOf('/lib/') + 4);
        //   return `cd /workspace/${dir} && ruby -I/workspace/${libDir} run_test.rb`;
        // },
      ],
      dockerfile: `testeranto/runtimes/ruby/ruby.Dockerfile`,
      buildOptions: `testeranto/runtimes/ruby/ruby.rb`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [
        "test_output",
        "testeranto/reports/rubytests"
      ],
    },

    pythontests: {
      runtime: "python",
      tests: [
        "src/lib/pitono/examples/calculator_test.py",
      ],
      checks: [
        // Python syntax check
        (x) => `python -m py_compile ${x.join(" ")}`,
        // Run the calculator test
        (x) => `cd src/lib/pitono/examples && python calculator_test.py`,
        // Run unittest tests (if any)
        (x) =>
          `python -m unittest ${x.filter((f) => f.includes("unittest.test")).join(" ")}`,
      ],
      dockerfile: `testeranto/runtimes/python/python.Dockerfile`,
      buildOptions: `testeranto/runtimes/python/python.py`,
      buildKitOptions: {
        // Single-stage Dockerfile, no targetStage needed
      },
      outputs: [
        "testeranto/reports/pythontests"
      ],
    },

    // golangtests: {
    //   runtime: "golang",
    //   tests: [
    //     // Way 1: Golingvu tests on Testeranto
    //     "src/lib/golingvu/examples/calculator/golingvu_test.go",

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
    //     "src/lib/rusto/examples/calculator_test.rs",
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
