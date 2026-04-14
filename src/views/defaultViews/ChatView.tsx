import React from 'react';
import type { GraphData } from '../../graph';
import type { VizConfig } from '../../grafeovidajo';
import { BaseViewClass } from '../BaseViewClass';

export interface ChatConfig extends VizConfig {
  showTimestamps: boolean;
  showAgentNames: boolean;
  maxMessages: number;
  reverseOrder: boolean;
}

export class Chat extends BaseViewClass<GraphData> {
  get config(): ChatConfig {
    return this.props.config || {
      showTimestamps: true,
      showAgentNames: true,
      maxMessages: 100,
      reverseOrder: true // Show newest first
    };
  }

  renderMessage(message: any, index: number) {
    const config = this.config;
    const { width = 800 } = this.props;
    
    const messageStyle: React.CSSProperties = {
      margin: '10px 0',
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      maxWidth: '100%',
      wordWrap: 'break-word' as const,
    };

    const agentStyle: React.CSSProperties = {
      fontWeight: 'bold',
      color: '#4a90e2',
      marginBottom: '5px',
      fontSize: '14px',
    };

    const timestampStyle: React.CSSProperties = {
      fontSize: '11px',
      color: '#999',
      marginBottom: '5px',
    };

    const contentStyle: React.CSSProperties = {
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#333',
    };

    const containerStyle: React.CSSProperties = {
      ...messageStyle,
      cursor: (this.props as any).onNodeClick ? 'pointer' : 'default'
    };

    return (
      <div
        key={`message-${message.id || index}`}
        style={containerStyle}
        onClick={() => (this.props as any).onNodeClick?.(message)}
        onMouseEnter={() => (this.props as any).onNodeHover?.(message)}
        onMouseLeave={() => (this.props as any).onNodeHover?.(null)}
      >
        {config.showAgentNames && message.agentName && (
          <div style={agentStyle}>
            {message.agentName}
          </div>
        )}
        {config.showTimestamps && message.timestamp && (
          <div style={timestampStyle}>
            {new Date(message.timestamp).toLocaleString()}
          </div>
        )}
        <div style={contentStyle}>
          {message.content}
        </div>
      </div>
    );
  }

  renderContent() {
    const { width = 800, height = 600 } = this.props;
    const config = this.config;
    const data = this.state.data;

    if (!data || !data.messages) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>No chat messages found</div>
        </div>
      );
    }

    let messages = [...data.messages];
    if (config.reverseOrder) {
      messages.reverse();
    }
    if (config.maxMessages > 0) {
      messages = messages.slice(0, config.maxMessages);
    }

    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ 
            marginBottom: '20px', 
            paddingBottom: '10px',
            borderBottom: '2px solid #4a90e2'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>Chat Messages</h2>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </div>
          </div>
          {messages.map((message, index) => this.renderMessage(message, index))}
        </div>
      </div>
    );
  }
}

// Wrapper component for backward compatibility
export const ChatView: React.FC<{ slicePath: string; width?: number; height?: number }> = ({
  slicePath,
  width = 800,
  height = 600
}) => {
  return (
    <Chat
      slicePath={slicePath}
      width={width}
      height={height}
    />
  );
};

// Default export for the view
export default ChatView;
