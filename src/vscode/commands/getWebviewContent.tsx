import css from "./css";

export function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Testeranto Chat</title>
            ${css()}
        </head>
        <body>
            <div class="chat-container">
                <!-- Header -->
                <div class="header">
                    <div class="header-title">
                        <h1>💬 Testeranto Chat</h1>
                        <div class="connection-status">
                            <div class="status-dot status-disconnected" id="statusDot"></div>
                            <span id="connectionStatus">Disconnected</span>
                        </div>
                    </div>
                    
                    <div class="agent-selector">
                        <span style="font-size: 14px; color: #aaa;">Send as:</span>
                        <select class="agent-select" id="agentSelect">
                            <option value="user">👤 User</option>
                            <option value="Prodirek">🤖 Prodirek</option>
                            <option value="Arko">👨‍💻 Arko</option>
                            <option value="Juna">👩‍🔬 Juna</option>
                            <option value="Sipestro">🧙‍♂️ Sipestro</option>
                        </select>
                    </div>
                </div>
                
                <!-- Messages Area -->
                <div class="messages-area" id="messagesArea">
                    <div class="empty-state" id="emptyState">
                        <div class="empty-icon">💬</div>
                        <h2 class="empty-title">Start a conversation</h2>
                        <p class="empty-description">
                            Send a message to begin chatting with agents. Your messages will appear here.
                        </p>
                    </div>
                </div>
                
                <!-- Reply Preview -->
                <div class="reply-preview" id="replyPreview" style="display: none;">
                    <div id="replyText"></div>
                    <button class="cancel-reply" id="cancelReply">Cancel</button>
                </div>
                
                <!-- Input Area -->
                <div class="input-area">
                    <div class="input-row">
                        <textarea 
                            id="messageInput" 
                            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                        ></textarea>
                        <button id="sendButton" disabled>Send</button>
                    </div>
                    <div class="input-info">
                        <div>
                            Press <span class="key-hint">Enter</span> to send, 
                            <span class="key-hint">Shift+Enter</span> for new line
                        </div>
                        <div id="charCount">0 characters</div>
                    </div>
                </div>
                
                <!-- Agent Bar -->
                <div class="agent-bar" id="agentBar">
                    <!-- Agent tags will be added here -->
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                const messagesArea = document.getElementById('messagesArea');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const agentSelect = document.getElementById('agentSelect');
                const connectionStatus = document.getElementById('connectionStatus');
                const statusDot = document.getElementById('statusDot');
                const emptyState = document.getElementById('emptyState');
                const replyPreview = document.getElementById('replyPreview');
                const replyText = document.getElementById('replyText');
                const cancelReply = document.getElementById('cancelReply');
                const charCount = document.getElementById('charCount');
                const agentBar = document.getElementById('agentBar');
                
                let ws = null;
                let isConnected = false;
                let replyingTo = null;
                let messages = [];
                
                // Agent colors and icons
                const agentColors = {
                    'user': '#007acc',
                    'Prodirek': '#4CAF50',
                    'Arko': '#FF9800',
                    'Juna': '#9C27B0',
                    'Sipestro': '#F44336'
                };
                
                const agentIcons = {
                    'user': '👤',
                    'Prodirek': '🤖',
                    'Arko': '👨‍💻',
                    'Juna': '👩‍🔬',
                    'Sipestro': '🧙‍♂️'
                };
                
                const agents = ['user', 'Prodirek', 'Arko', 'Juna', 'Sipestro'];
                
                // Initialize agent bar
                agents.forEach(agent => {
                    const tag = document.createElement('div');
                    tag.className = 'agent-tag';
                    tag.id = \`agentTag-\${agent}\`;
                    tag.innerHTML = \`
                        <div class="agent-dot" style="background-color: \${agentColors[agent]}"></div>
                        \${agentIcons[agent]} \${agent}
                    \`;
                    agentBar.appendChild(tag);
                });
                
                // Update active agent tag
                function updateAgentTags() {
                    agents.forEach(agent => {
                        const tag = document.getElementById(\`agentTag-\${agent}\`);
                        if (agentSelect.value === agent) {
                            tag.classList.add('agent-tag-active');
                        } else {
                            tag.classList.remove('agent-tag-active');
                        }
                    });
                }
                
                // Connect to WebSocket
                function connectWebSocket() {
                    const wsUrl = 'ws://localhost:3000';
                    
                    try {
                        ws = new WebSocket(wsUrl);
                        
                        ws.onopen = () => {
                            console.log('WebSocket connected');
                            isConnected = true;
                            connectionStatus.textContent = 'Connected';
                            statusDot.className = 'status-dot status-connected';
                            sendButton.disabled = false;
                            
                            ws.send(JSON.stringify({
                                type: 'subscribeToSlice',
                                slicePath: '/~/chat'
                            }));
                            
                            addSystemMessage('Connected to server');
                        };
                        
                        ws.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                console.log('Received:', data);
                                
                                if (data.type === 'chat') {
                                    addChatMessage(data.agent, data.message, data.timestamp);
                                }
                            } catch (error) {
                                console.error('Error parsing message:', error);
                            }
                        };
                        
                        ws.onerror = (error) => {
                            console.error('WebSocket error:', error);
                            addSystemMessage('WebSocket error occurred');
                        };
                        
                        ws.onclose = () => {
                            console.log('WebSocket disconnected');
                            isConnected = false;
                            connectionStatus.textContent = 'Disconnected';
                            statusDot.className = 'status-dot status-disconnected';
                            sendButton.disabled = true;
                            addSystemMessage('Disconnected from server');
                            
                            setTimeout(connectWebSocket, 3000);
                        };
                    } catch (error) {
                        console.error('Error creating WebSocket:', error);
                        addSystemMessage('Failed to connect to server');
                    }
                }
                
                // Format time
                function formatTime(timestamp) {
                    const date = new Date(timestamp);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                
                // Format date
                function formatDate(timestamp) {
                    const date = new Date(timestamp);
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
                
                // Add system message
                function addSystemMessage(text) {
                    const message = {
                        id: 'sys_' + Date.now(),
                        agent: 'System',
                        message: text,
                        timestamp: new Date().toISOString(),
                        isSystem: true
                    };
                    messages.push(message);
                    renderMessages();
                }
                
                // Add chat message
                function addChatMessage(agent, messageText, timestamp) {
                    const message = {
                        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        agent: agent,
                        message: messageText,
                        timestamp: timestamp,
                        isSystem: false
                    };
                    messages.push(message);
                    renderMessages();
                }
                
                // Render all messages
                function renderMessages() {
                    if (messages.length === 0) {
                        emptyState.style.display = 'block';
                        return;
                    }
                    
                    emptyState.style.display = 'none';
                    
                    // Group messages by date
                    const grouped = {};
                    messages.forEach(msg => {
                        const date = formatDate(msg.timestamp);
                        if (!grouped[date]) grouped[date] = [];
                        grouped[date].push(msg);
                    });
                    
                    let html = '';
                    
                    Object.entries(grouped).forEach(([date, dateMessages]) => {
                        html += \`
                            <div class="date-divider">
                                <div class="date-label">\${date}</div>
                            </div>
                        \`;
                        
                        dateMessages.forEach(msg => {
                            const color = agentColors[msg.agent] || '#607D8B';
                            const icon = agentIcons[msg.agent] || '👤';
                            
                            html += \`
                                <div class="message">
                                    <div class="message-card" style="border-left-color: \${color}">
                                        <div class="message-header">
                                            <div class="message-agent">
                                                <div class="agent-avatar" style="background-color: \${color}">
                                                    \${icon}
                                                </div>
                                                <div class="agent-info">
                                                    <div class="agent-name" style="color: \${color}">
                                                        \${msg.agent}
                                                    </div>
                                                    <div class="message-time">
                                                        \${formatTime(msg.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="message-actions">
                                                <button class="action-btn" onclick="replyToMessage('\${msg.id}')">
                                                    Reply
                                                </button>
                                                <button class="action-btn" onclick="copyMessage('\${msg.message}')">
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                        <div class="message-body">
                                            \${msg.message}
                                        </div>
                                        <div class="message-footer">
                                            <div class="footer-action">👍 Like</div>
                                            <div class="footer-action">💬 Reply</div>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        });
                    });
                    
                    messagesArea.innerHTML = html;
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
                
                // Send message
                function sendMessage() {
                    const text = messageInput.value.trim();
                    const agent = agentSelect.value;
                    
                    if (!text || !isConnected) return;
                    
                    vscode.postMessage({
                        command: 'sendMessage',
                        agent: agent,
                        text: text
                    });
                    
                    addChatMessage(agent, text, new Date().toISOString());
                    messageInput.value = '';
                    charCount.textContent = '0 characters';
                    cancelReply.click();
                }
                
                // Reply to message
                function replyToMessage(messageId) {
                    const message = messages.find(m => m.id === messageId);
                    if (message) {
                        replyingTo = messageId;
                        replyText.textContent = \`Replying to \${message.agent}: \${message.message.substring(0, 50)}\${message.message.length > 50 ? '...' : ''}\`;
                        replyPreview.style.display = 'flex';
                        messageInput.focus();
                    }
                }
                
                // Copy message
                function copyMessage(text) {
                    navigator.clipboard.writeText(text);
                }
                
                // Event listeners
                sendButton.addEventListener('click', sendMessage);
                
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
                
                messageInput.addEventListener('input', () => {
                    charCount.textContent = \`\${messageInput.value.length} characters\`;
                    sendButton.disabled = !messageInput.value.trim() || !isConnected;
                });
                
                agentSelect.addEventListener('change', updateAgentTags);
                
                cancelReply.addEventListener('click', () => {
                    replyingTo = null;
                    replyPreview.style.display = 'none';
                });
                
                // Global functions for inline event handlers
                window.replyToMessage = replyToMessage;
                window.copyMessage = copyMessage;
                
                // Initialize
                updateAgentTags();
                connectWebSocket();
            </script>
        </body>
        </html>
    `;
}