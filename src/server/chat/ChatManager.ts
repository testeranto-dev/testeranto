/**
 * Chat manager for processing aider output and managing chat messages
 */
export interface ChatMessage {
  id: string;
  agent: string;
  content: string;
  timestamp: string;
  type: 'aider_output' | 'user_input' | 'system';
  blockIndex: number;
  totalBlocks: number;
}

export class ChatManager {
  private messages: ChatMessage[] = [];
  private aiderOutputBuffers: Map<string, string> = new Map();
  private blockSeparator = '─';

  /**
   * Process aider output and extract chat blocks
   */
  processAiderOutput(agentName: string, output: string): ChatMessage[] {
    const buffer = (this.aiderOutputBuffers.get(agentName) || '') + output;
    this.aiderOutputBuffers.set(agentName, buffer);
    
    // Split by block separator lines (lines consisting mostly of ─ characters)
    const blocks: string[] = [];
    const lines = buffer.split('\n');
    let currentBlock: string[] = [];
    let inBlock = false;
    
    for (const line of lines) {
      // Check if line is a block separator (contains mostly ─ characters)
      const isSeparator = line.trim().length > 0 && 
                         line.replace(/[^─]/g, '').length > line.length * 0.7;
      
      if (isSeparator) {
        if (inBlock && currentBlock.length > 0) {
          // End of current block
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
          inBlock = false;
        } else if (!inBlock) {
          // Start of new block
          inBlock = true;
        }
      } else if (inBlock) {
        currentBlock.push(line);
      }
    }
    
    // Save remaining buffer (incomplete block)
    const remaining = inBlock ? currentBlock.join('\n') : '';
    this.aiderOutputBuffers.set(agentName, remaining);
    
    // Create chat messages from completed blocks
    const newMessages: ChatMessage[] = [];
    blocks.forEach((block, index) => {
      if (block.trim()) {
        const message: ChatMessage = {
          id: `${agentName}-${Date.now()}-${index}`,
          agent: agentName,
          content: block.trim(),
          timestamp: new Date().toISOString(),
          type: 'aider_output',
          blockIndex: index,
          totalBlocks: blocks.length
        };
        newMessages.push(message);
        this.messages.push(message);
      }
    });
    
    return newMessages;
  }

  /**
   * Add a user input message
   */
  addUserMessage(agentName: string, content: string): ChatMessage {
    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      agent: agentName,
      content,
      timestamp: new Date().toISOString(),
      type: 'user_input',
      blockIndex: 0,
      totalBlocks: 1
    };
    this.messages.push(message);
    return message;
  }

  /**
   * Get recent messages for an agent
   */
  getRecentMessages(agentName?: string, limit = 50): ChatMessage[] {
    const filtered = agentName 
      ? this.messages.filter(m => m.agent === agentName)
      : this.messages;
    
    return filtered.slice(-limit);
  }

  /**
   * Clear messages for an agent
   */
  clearMessages(agentName?: string): void {
    if (agentName) {
      this.messages = this.messages.filter(m => m.agent !== agentName);
      this.aiderOutputBuffers.delete(agentName);
    } else {
      this.messages = [];
      this.aiderOutputBuffers.clear();
    }
  }
}
