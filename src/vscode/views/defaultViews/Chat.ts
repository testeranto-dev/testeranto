import type { GraphData } from "../../../graph";

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
    .filter(node => {
      // Check if node.type is an object with category 'chat' and type 'chat_message'
      if (node.type && typeof node.type === 'object') {
        return node.type.category === 'chat' && node.type.type === 'chat_message';
      }
      // For backward compatibility, also check string type
      return node.type === 'chat_message' ||
        (node.attributes?.type && node.attributes.type === 'chat_message');
    })
    .map(node => ({
      id: node.id,
      content: node.content || node.metadata?.content || node.label || node.id,
      agentName: node.sender || node.agentName || node.metadata?.sender || node.metadata?.agentName,
      timestamp: node.timestamp || node.metadata?.timestamp,
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
