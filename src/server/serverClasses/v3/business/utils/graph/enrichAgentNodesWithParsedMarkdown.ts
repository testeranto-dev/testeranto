import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../../graph";
import { parseAgentMarkdown } from "../../../../../../shared/utilities/parseAgentMarkdown";
import type { ITesterantoConfig } from "../../../../../../Types";

export async function enrichAgentNodesWithParsedMarkdown(
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  configs: ITesterantoConfig,
  projectRoot: string
): Promise<void> {
  for (const [agentName, agentConfig] of Object.entries(configs.agents || {})) {
    const personaFile = agentConfig.persona;
    if (!personaFile) {
      continue;
    }

    const absolutePersonaPath = `${projectRoot}/${personaFile}`;
    const parsed = parseAgentMarkdown(absolutePersonaPath);

    const agentNode = graph.findNode(
      (n: { id: string; label: string }) => n.id === `agent:${agentName}` || n.label === agentName
    );
    if (!agentNode) {
      continue;
    }

    agentNode.metadata = {
      ...agentNode.metadata,
      personaBody: parsed.personaBody,
      readFiles: parsed.readFiles,
      addFiles: parsed.addFiles,
      personaFilePath: personaFile,
    };
  }
}
