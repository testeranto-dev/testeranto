import type { Plugin } from "esbuild";
import * as fs from "fs";
import * as path from "path";

export interface TestLoggingPluginOptions {
  configKey: string;
  runtime: "node" | "web";
}

export function testLoggingPlugin(options: TestLoggingPluginOptions): Plugin {
  return {
    name: "testeranto-test-logging",
    setup(build) {
      const { configKey, runtime } = options;
      
      // Create directory for test logs
      const testLogsDir = path.join(
        process.cwd(),
        "testeranto",
        "reports",
        configKey,
        "test-logs",
      );
      if (!fs.existsSync(testLogsDir)) {
        fs.mkdirSync(testLogsDir, { recursive: true });
        console.log(`[${runtime} Builder] Created test logs directory: ${testLogsDir}`);
      }

      // Store original console methods
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
      };

      // Collect all logs during the build
      const allLogs: Array<{type: string, message: string, timestamp: string}> = [];
      
      // Override console methods to capture logs
      const overrideConsole = (type: string) => {
        return (...args: any[]) => {
          const timestamp = new Date().toISOString();
          const message = args.map(arg => 
            typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
          ).join(' ');
          
          allLogs.push({ type, message, timestamp });
          
          // Also call original console
          switch(type) {
            case 'log': originalConsole.log(...args); break;
            case 'error': originalConsole.error(...args); break;
            case 'warn': originalConsole.warn(...args); break;
            case 'info': originalConsole.info?.(...args); break;
            case 'debug': originalConsole.debug?.(...args); break;
          }
        };
      };
      
      // Apply overrides
      console.log = overrideConsole('log');
      console.error = overrideConsole('error');
      console.warn = overrideConsole('warn');
      if (console.info) console.info = overrideConsole('info');
      if (console.debug) console.debug = overrideConsole('debug');

      build.onEnd(async (result) => {
        // Restore original console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        if (originalConsole.info) console.info = originalConsole.info;
        if (originalConsole.debug) console.debug = originalConsole.debug;

        // Ensure the reports directory exists
        const reportsDir = path.join(
          process.cwd(),
          "testeranto",
          "reports",
          configKey
        );
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
      
        // Write all logs to a general build log
        const generalLogPath = path.join(reportsDir, "build.log");
        const generalLogStream = fs.createWriteStream(generalLogPath, { flags: 'a' });
        
        allLogs.forEach(log => {
          generalLogStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\n`);
        });
        generalLogStream.end();

        // Create per-test logs based on the metafile
        if (result.metafile && result.metafile.outputs) {
          // Group logs by entry point
          // For now, we'll write the same logs to each test's log file
          // A more sophisticated approach would try to associate logs with specific entry points
          for (const [outputPath, outputInfo] of Object.entries(result.metafile.outputs)) {
            const entryPoint = (outputInfo as any).entryPoint;
            if (entryPoint) {
              const testName = path.basename(entryPoint, path.extname(entryPoint));
              const testLogPath = path.join(testLogsDir, `${testName}.build.log`);
              
              const timestamp = new Date().toISOString();
              const header = `[${timestamp}] Build log for test: ${entryPoint}\n`;
              const buildInfo = `Output: ${outputPath}\nEntry point: ${entryPoint}\n`;
              
              // Write header and all logs
              const testLogStream = fs.createWriteStream(testLogPath, { flags: 'w' });
              testLogStream.write(header + buildInfo + '\n');
              
              allLogs.forEach(log => {
                testLogStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\n`);
              });
              
              const footer = `\n[${timestamp}] Build completed for: ${entryPoint}\n`;
              testLogStream.write(footer);
              testLogStream.end();
              
              originalConsole.log(
                `[${runtime} Builder] Created build log for ${entryPoint} at ${testLogPath}`,
              );
            }
          }
        } else {
          // If no metafile, write logs to a generic test log
          const genericLogPath = path.join(testLogsDir, `generic.build.log`);
          const genericStream = fs.createWriteStream(genericLogPath, { flags: 'w' });
          allLogs.forEach(log => {
            genericStream.write(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\n`);
          });
          genericStream.end();
        }
      });

      // Also capture build errors
      build.onStart(() => {
        // Clear logs at the start of each build
        allLogs.length = 0;
        const timestamp = new Date().toISOString();
        allLogs.push({ type: 'info', message: `Build started for ${configKey}`, timestamp });
      });
    },
  };
}
