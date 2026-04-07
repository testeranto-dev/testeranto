import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TestTreeItem } from '../TestTreeItem';
import { TreeItemType } from '../types';
import { BaseTreeDataProvider } from './BaseTreeDataProvider';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  attributes: {
    type: string;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class ChatTreeDataProvider extends BaseTreeDataProvider {
  private chatMessages: Array<{
    id: string;
    agent: string;
    message: string;
    timestamp: string;
  }> = [];

  constructor() {
    super();
    console.log('[ChatTreeDataProvider] Constructor called');
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TestTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TestTreeItem): Promise<TestTreeItem[]> {
    if (!element) {
      // Root level: Show chat interface
      return this.getChatRootItems();
    }

    const elementData = element.data || {};
    
    // If this is a chat message, it doesn't have children
    if (elementData.chatMessage) {
      return [];
    }

    return [];
  }

  private getChatRootItems(): TestTreeItem[] {
    const items: TestTreeItem[] = [];

    // Add refresh item
    items.push(new TestTreeItem(
      'Refresh',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Reload chat messages',
        refresh: true
      },
      {
        command: 'testeranto.refreshChat',
        title: 'Refresh',
        arguments: []
      },
      new vscode.ThemeIcon('refresh')
    ));

    // Add send message section
    items.push(new TestTreeItem(
      'Send Message',
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        description: 'Click to send a message to agents',
        sendMessage: true
      },
      {
        command: 'testeranto.sendChatMessage',
        title: 'Send Message',
        arguments: []
      },
      new vscode.ThemeIcon('comment')
    ));

    // Add chat history header
    if (this.chatMessages.length > 0) {
      items.push(new TestTreeItem(
        `Chat History (${this.chatMessages.length})`,
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Recent messages from agents',
          count: this.chatMessages.length
        },
        undefined,
        new vscode.ThemeIcon('history')
      ));

      // Add chat messages (most recent first)
      const recentMessages = [...this.chatMessages].reverse().slice(0, 50); // Limit to 50 most recent
      for (const msg of recentMessages) {
        items.push(this.createChatMessageItem(msg));
      }
    } else {
      items.push(new TestTreeItem(
        'No messages yet',
        TreeItemType.Info,
        vscode.TreeItemCollapsibleState.None,
        {
          description: 'Send a message to start chatting with agents'
        },
        undefined,
        new vscode.ThemeIcon('info')
      ));
    }

    return items;
  }

  private createChatMessageItem(msg: {
    id: string;
    agent: string;
    message: string;
    timestamp: string;
  }): TestTreeItem {
    const time = new Date(msg.timestamp);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const item = new TestTreeItem(
      `${msg.agent}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`,
      TreeItemType.Info,
      vscode.TreeItemCollapsibleState.None,
      {
        chatMessage: true,
        agent: msg.agent,
        message: msg.message,
        timestamp: msg.timestamp,
        description: timeStr
      },
      undefined,
      this.getAgentIcon(msg.agent)
    );

    // Build tooltip
    let tooltip = `Agent: ${msg.agent}\n`;
    tooltip += `Time: ${time.toLocaleString()}\n`;
    tooltip += `Message: ${msg.message}`;
    
    item.tooltip = tooltip;
    return item;
  }

  private getAgentIcon(agentName: string): vscode.ThemeIcon {
    // Use a generic icon for all agents since they're user-defined
    return new vscode.ThemeIcon('person');
  }

  public addChatMessage(agent: string, message: string): void {
    const newMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.chatMessages.push(newMessage);
    
    // Keep only the last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }
    
    this.refresh();
  }

  public clearChat(): void {
    this.chatMessages = [];
    this.refresh();
  }

  protected handleWebSocketMessage(message: any): void {
    super.handleWebSocketMessage(message);
    if (message.type === 'chat') {
      const { agent, message: chatMessage, timestamp } = message;
      if (agent && chatMessage) {
        this.addChatMessage(agent, chatMessage);
      }
    }
  }
}
