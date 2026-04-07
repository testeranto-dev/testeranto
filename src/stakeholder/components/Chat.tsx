import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  type: 'chat';
  agent: string;
  message: string;
  timestamp: string;
  text: string;
  id?: string;
  replyTo?: string;
}

interface ThreadedMessage extends ChatMessage {
  id: string;
  replies: ThreadedMessage[];
  isExpanded: boolean;
}

interface AgentInfo {
  name: string;
  markdownFile: string;
  hasSliceFunction: boolean;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ThreadedMessage[]>([]);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState('user');
  const [isConnected, setIsConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Fetch agents from server
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/~/agents');
        if (response.ok) {
          const data = await response.json();
          setAvailableAgents(data.agents || []);
        } else {
          console.error('Failed to fetch agents:', await response.text());
          // Fallback to empty list
          setAvailableAgents([]);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAvailableAgents([]);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Subscribe to chat updates
      ws.send(JSON.stringify({
        type: 'subscribeToSlice',
        slicePath: '/~/chat'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle chat messages
        if (data.type === 'chat') {
          const newMessage: ThreadedMessage = {
            ...data,
            id: data.id || generateId(),
            replies: [],
            isExpanded: true
          };
          setMessages(prev => [...prev, newMessage]);
        }
        // Handle resourceChanged for chat
        else if (data.type === 'resourceChanged' && data.url === '/~/chat') {
          // Chat resource changed, we could fetch latest messages
          // For now, we rely on direct chat messages
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const messageData = {
      agent,
      message: input,
      replyTo: replyingTo || undefined
    };

    try {
      const response = await fetch(`/~/chat?agent=${encodeURIComponent(agent)}&message=${encodeURIComponent(input)}`);
      if (response.ok) {
        setInput('');
        setReplyingTo(null);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        console.error('Failed to send message:', await response.text());
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleThread = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isExpanded: !msg.isExpanded } : msg
    ));
  };

  const getAgentColor = (agentName: string): string => {
    // Generate a consistent color based on agent name
    const colors = [
      '#007acc', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
      '#3F51B5', '#009688', '#FF5722', '#673AB7', '#E91E63'
    ];
    const index = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getAgentIcon = (agentName: string): string => {
    // Default icons based on agent name
    if (agentName === 'user') return '👤';
    if (agentName.toLowerCase().includes('bot') || agentName.toLowerCase().includes('ai')) return '🤖';
    if (agentName.toLowerCase().includes('dev') || agentName.toLowerCase().includes('code')) return '👨‍💻';
    if (agentName.toLowerCase().includes('test') || agentName.toLowerCase().includes('qa')) return '🧪';
    if (agentName.toLowerCase().includes('doc') || agentName.toLowerCase().includes('write')) return '📝';
    return '👤';
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ThreadedMessage[]>);

  // Find message being replied to
  const replyingToMessage = replyingTo ? messages.find(m => m.id === replyingTo) : null;

  // Get agent names for dropdown and status bar
  const agentNames = ['user', ...availableAgents.map(a => a.name)];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '1000px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#1e1e1e',
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#007acc' }}>
            💬 Testeranto Chat
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: isConnected ? '#4CAF50' : '#f44336'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#4CAF50' : '#f44336'
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>Send as:</div>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #444',
              backgroundColor: '#2d2d30',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            disabled={isLoadingAgents}
          >
            {isLoadingAgents ? (
              <option value="user">Loading agents...</option>
            ) : (
              <>
                <option value="user">👤 User</option>
                {availableAgents.map(a => (
                  <option key={a.name} value={a.name}>
                    {getAgentIcon(a.name)} {a.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#1e1e1e'
      }}>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div style={{
              textAlign: 'center',
              margin: '20px 0',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '5px 15px',
                backgroundColor: '#252526',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#aaa',
                border: '1px solid #333'
              }}>
                {date}
              </div>
            </div>
            
            {dateMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '15px',
                  marginLeft: msg.replyTo ? '40px' : '0',
                  position: 'relative'
                }}
              >
                {msg.replyTo && (
                  <div style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '0',
                    bottom: '0',
                    width: '20px',
                    borderLeft: '2px solid #444',
                    borderBottom: '2px solid #444',
                    borderBottomLeftRadius: '10px'
                  }} />
                )}
                
                <div style={{
                  backgroundColor: '#252526',
                  borderRadius: '12px',
                  padding: '15px',
                  borderLeft: `4px solid ${getAgentColor(msg.agent)}`,
                  transition: 'all 0.2s',
                  ':hover': {
                    backgroundColor: '#2d2d30'
                  }
                }}>
                  {/* Message Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: getAgentColor(msg.agent),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {getAgentIcon(msg.agent)}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          color: getAgentColor(msg.agent)
                        }}>
                          {msg.agent}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#888'
                        }}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleReply(msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#aaa',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          ':hover': {
                            backgroundColor: '#333'
                          }
                        }}
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => handleCopy(msg.message)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#aaa',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          ':hover': {
                            backgroundColor: '#333'
                          }
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Message Body */}
                  <div style={{
                    lineHeight: '1.5',
                    fontSize: '15px',
                    color: '#e0e0e0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.message}
                  </div>
                  
                  {/* Message Actions */}
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '15px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <div style={{ cursor: 'pointer', ':hover': { color: '#aaa' } }}>
                      👍 Like
                    </div>
                    <div 
                      onClick={() => toggleThread(msg.id)}
                      style={{ cursor: 'pointer', ':hover': { color: '#aaa' } }}
                    >
                      {msg.isExpanded ? '▲ Collapse' : '▼ Expand'} Thread
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
            <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#aaa' }}>
              Start a conversation
            </h2>
            <p style={{ fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
              Send a message to begin chatting with agents. Your messages will appear here.
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingToMessage && (
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#252526',
          borderTop: '1px solid #333',
          borderBottom: '1px solid #333',
          fontSize: '14px',
          color: '#aaa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            Replying to <span style={{ color: getAgentColor(replyingToMessage.agent) }}>
              {replyingToMessage.agent}
            </span>: {replyingToMessage.message.substring(0, 50)}...
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f44336',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #333',
        backgroundColor: '#252526'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={replyingTo ? "Type your reply..." : "Type your message here... (Press Enter to send, Shift+Enter for new line)"}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #444',
              backgroundColor: '#2d2d30',
              color: 'white',
              minHeight: '60px',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '15px',
              lineHeight: '1.5',
              ':focus': {
                outline: 'none',
                borderColor: '#007acc',
                boxShadow: '0 0 0 2px rgba(0, 122, 204, 0.2)'
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            style={{
              padding: '0 24px',
              backgroundColor: input.trim() ? '#007acc' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              fontWeight: '500',
              alignSelf: 'flex-end',
              height: '60px',
              transition: 'background-color 0.2s',
              ':hover': input.trim() ? {
                backgroundColor: '#005a9e'
              } : {}
            }}
          >
            Send
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10px',
          fontSize: '12px',
          color: '#666'
        }}>
          <div>
            Press <span style={{
              backgroundColor: '#333',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>Enter</span> to send, <span style={{
              backgroundColor: '#333',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>Shift+Enter</span> for new line
          </div>
          <div>
            {input.length} characters
          </div>
        </div>
      </div>

      {/* Agent Status Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#252526',
        borderTop: '1px solid #333',
        display: 'flex',
        gap: '20px',
        overflowX: 'auto'
      }}>
        {isLoadingAgents ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: 'transparent',
            border: '1px solid #444',
            color: '#aaa',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#666'
            }} />
            Loading agents...
          </div>
        ) : (
          <>
            <div
              key="user"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: 'user' === agent ? getAgentColor('user') + '20' : 'transparent',
                border: `1px solid ${'user' === agent ? getAgentColor('user') : '#444'}`,
                color: 'user' === agent ? getAgentColor('user') : '#aaa',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getAgentColor('user')
              }} />
              {getAgentIcon('user')} User
            </div>
            {availableAgents.map(a => (
              <div
                key={a.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: a.name === agent ? getAgentColor(a.name) + '20' : 'transparent',
                  border: `1px solid ${a.name === agent ? getAgentColor(a.name) : '#444'}`,
                  color: a.name === agent ? getAgentColor(a.name) : '#aaa',
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getAgentColor(a.name)
                }} />
                {getAgentIcon(a.name)} {a.name}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
