import { type GraphOperation } from '../../../../graph/index';
import path from 'path';

// Pure function to create log file node operations
export function createLogFileNodeOperationsPure(
  logFilePath: string,
  serviceName: string,
  runtime: string,
  runtimeConfigKey: string,
  testName: string | undefined,
  timestamp: string
): GraphOperation[] {
  const operations: GraphOperation[] = [];

  // Create a simple node ID for the log file
  // Use just the filename and a timestamp to make it unique
  const filename = path.basename(logFilePath);
  const timestampPart = Date.now().toString(36); // Base36 timestamp
  const logFileId = `logfile:${filename}:${timestampPart}`;
  
  // Get the relative path for display
  const relativeLogPath = logFilePath.startsWith(process.cwd()) 
    ? path.relative(process.cwd(), logFilePath)
    : logFilePath;

  // Determine log type from service name
  const logType = serviceName.includes('bdd') ? 'bdd' :
                 serviceName.includes('check') ? 'check' :
                 serviceName.includes('aider') ? 'aider' :
                 serviceName.includes('builder') ? 'builder' : 'unknown';

  operations.push({
    type: 'addNode',
    data: {
      id: logFileId,
      type: 'file',
      label: path.basename(logFilePath),
      description: `Log file for ${serviceName} (${logType})`,
      status: 'done',
      icon: 'document',
      metadata: {
        filePath: logFilePath,
        relativePath: relativeLogPath,
        serviceName,
        runtime,
        configKey: runtimeConfigKey,
        testName,
        isLogFile: true,
        logType,
        timestamp,
        // Store the original path for reference
        originalPath: logFilePath
      }
    },
    timestamp
  });

  // Always create the log file node, even without connections
  // This ensures it appears in the graph
  
  // If we have a test name, try to connect to relevant nodes
  if (testName) {
    // Try to connect to entrypoint first (most reliable)
    let entrypointId: string;
    
    if (testName.includes('.') || testName.includes('/') || testName.includes('\\')) {
      entrypointId = `entrypoint:${testName}`;
    } else {
      entrypointId = `entrypoint:${runtimeConfigKey}:${testName}`;
    }
    
    // Connect to entrypoint
    operations.push({
      type: 'addEdge',
      data: {
        source: entrypointId,
        target: logFileId,
        attributes: {
          type: 'associatedWith',
          weight: 1,
          timestamp
        }
      },
      timestamp
    });

    // Also try to connect to service-specific process node
    // Determine service type from serviceName
    let processType: string | null = null;
    if (serviceName.includes('bdd')) {
      processType = 'bdd_process';
    } else if (serviceName.includes('check')) {
      processType = 'check_process';
    } else if (serviceName.includes('aider')) {
      processType = 'aider_process';
    } else if (serviceName.includes('builder')) {
      processType = 'builder_process';
    }
    
    if (processType) {
      let processId: string;
      if (processType === 'builder_process') {
        processId = `${processType}:${runtimeConfigKey}`;
      } else {
        processId = `${processType}:${runtimeConfigKey}:${testName}`;
      }
      
      operations.push({
        type: 'addEdge',
        data: {
          source: processId,
          target: logFileId,
          attributes: {
            type: 'hasLog',
            weight: 1,
            timestamp
          }
        },
        timestamp
      });
    }
  }
  
  // Also add a metadata property to make log files easier to find
  operations.push({
    type: 'updateNode',
    data: {
      id: logFileId,
      metadata: {
        ...operations[0].data.metadata, // Get metadata from the addNode operation
        isLogFile: true,
        logType: serviceName.includes('bdd') ? 'bdd' :
                serviceName.includes('check') ? 'check' :
                serviceName.includes('aider') ? 'aider' :
                serviceName.includes('builder') ? 'builder' : 'unknown'
      }
    },
    timestamp
  });

  return operations;
}
