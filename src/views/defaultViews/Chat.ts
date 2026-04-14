import type { GraphData } from "../../graph";

export type ChatMessage = {
  id: string;
  content: string;
  agentName?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export type IChat = {
  messages: ChatMessage[];
  viewType: 'chat';
  timestamp: string;
}

export const ChatSlicer = (graphData: GraphData): IChat => {
  const messages: ChatMessage[] = graphData.nodes
    .filter(node => 
      node.type === 'chat_message' ||
      (node.attributes?.type && node.attributes.type === 'chat_message')
    )
    .map(node => ({
      id: node.id,
      content: node.content || node.label || node.id,
      agentName: node.agentName || node.attributes?.agentName,
      timestamp: node.timestamp || node.attributes?.timestamp,
      metadata: node.metadata || node.attributes
    }));

  return {
    messages,
    viewType: 'chat',
    timestamp: new Date().toISOString()
  };
}

export default {
  slicer: ChatSlicer,
  filePath: 'src/views/defaultViews/ChatView.tsx'
}
