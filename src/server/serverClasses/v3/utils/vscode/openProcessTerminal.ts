export interface OpenProcessTerminalParams {
  nodeId: string;
  label: string;
  containerId: string;
  serviceName: string;
  isAiderProcess: boolean;
}

export interface OpenProcessTerminalResult {
  success: boolean;
  message: string;
  command: string;
  containerId: string;
  serviceName: string;
}

export function openProcessTerminal(params: OpenProcessTerminalParams): OpenProcessTerminalResult {
  const command = params.isAiderProcess
    ? `docker exec -it ${params.containerId} aider`
    : `docker exec -it ${params.containerId} /bin/bash`;

  return {
    success: true,
    message: `Terminal command generated for ${params.label}`,
    command,
    containerId: params.containerId,
    serviceName: params.serviceName,
  };
}
