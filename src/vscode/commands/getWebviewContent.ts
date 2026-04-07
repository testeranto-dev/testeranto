function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Testeranto Chat</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    background-color: #1e1e1e;
                    color: #ffffff;
                    height: 100vh;
                    overflow: hidden;
                }
                
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                /* Header */
                .header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #333;
                    background-color: #252526;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }
                
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .header-title h1 {
                    font-size: 20px;
                    color: #007acc;
                    margin: 0;
                }
                
                .connection-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                .status-connected {
                    background-color: #4CAF50;
                }
                
                .status-disconnected {
                    background-color: #f44336;
                }
                
                .agent-selector {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .agent-select {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid #444;
                    background-color: #2d2d30;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                }
                
                .agent-select:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                /* Messages Area */
                .messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    background-color: #1e1e1e;
                }
                
                .date-divider {
                    text-align: center;
                    margin: 24px 0;
                    position: relative;
                }
                
                .date-label {
                    display: inline-block;
                    padding: 4px 12px;
                    background-color: #252526;
                    border-radius: 20px;
                    font-size: 12px;
                    color: #aaa;
                    border: 1px solid #333;
                }
                
                .message {
                    margin-bottom: 16px;
                    position: relative;
                }
                
                .message-reply-line {
                    position: absolute;
                    left: -24px;
                    top: 0;
                    bottom: 0;
                    width: 16px;
                    border-left: 2px solid #444;
                    border-bottom: 2px solid #444;
                    border-bottom-left-radius: 10px;
                }
                
                .message-card {
                    background-color: #252526;
                    border-radius: 12px;
                    padding: 16px;
                    border-left: 4px solid #007acc;
                    transition: background-color 0.2s;
                }
                
                .message-card:hover {
                    background-color: #2d2d30;
                }
                
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                
                .message-agent {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .agent-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                }
                
                .agent-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .agent-name {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .message-time {
                    font-size: 12px;
                    color: #888;
                }
                
                .message-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .action-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                
                .action-btn:hover {
                    background-color: #333;
                }
                
                .message-body {
                    line-height: 1.5;
                    font-size: 15px;
                    color: #e0e0e0;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                
                .message-footer {
                    margin-top: 12px;
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: #666;
                }
                
                .footer-action {
                    cursor: pointer;
                }
                
                .footer-action:hover {
                    color: #aaa;
                }
                
                /* Reply Preview */
                .reply-preview {
                    padding: 12px 24px;
                    background-color: #252526;
                    border-top: 1px solid #333;
                    border-bottom: 1px solid #333;
                    font-size: 14px;
                    color: #aaa;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .cancel-reply {
                    background: none;
                    border: none;
                    color: #f44336;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                /* Input Area */
                .input-area {
                    padding: 20px;
                    border-top: 1px solid #333;
                    background-color: #252526;
                    flex-shrink: 0;
                }
                
                .input-row {
                    display: flex;
                    gap: 12px;
                }
                
                #messageInput {
                    flex: 1;
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 1px solid #444;
                    background-color: #2d2d30;
                    color: white;
                    min-height: 60px;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 15px;
                    line-height: 1.5;
                }
                
                #messageInput:focus {
                    outline: none;
                    border-color: #007acc;
                    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
                }
                
                #sendButton {
                    padding: 0 24px;
                    background-color: #007acc;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    align-self: flex-end;
                    height: 60px;
                    transition: background-color 0.2s;
                }
                
                #sendButton:disabled {
                    background-color: #444;
                    cursor: not-allowed;
                }
                
                #sendButton:not(:disabled):hover {
                    background-color: #005a9e;
                }
                
                .input-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    font-size: 12px;
                    color: #666;
                }
                
                .key-hint {
                    background-color: #333;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }
                
                /* Agent Bar */
                .agent-bar {
                    padding: 12px 24px;
                    background-color: #252526;
                    border-top: 1px solid #333;
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    flex-shrink: 0;
                }
                
                .agent-tag {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid #444;
                    color: #aaa;
                    font-size: 13px;
                    white-space: nowrap;
                }
                
                .agent-tag-active {
                    border-color: #007acc;
                    color: #007acc;
                    background-color: rgba(0, 122, 204, 0.1);
                }
                
                .agent-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                
                .empty-title {
                    font-size: 24px;
                    margin-bottom: 10px;
                    color: #aaa;
                }
                
                .empty-description {
                    font-size: 16px;
                    max-width: 500px;
                    margin: 0 auto;
                }
            </style>
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
                        <select class="agent-select" id="agentSelect" disabled>
                            <option value="user">Loading agents...</option>
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
                    <div class="agent-tag">
                        <div class="agent-dot" style="background-color: #666"></div>
                        Loading agents...
                    </div>
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
                let agents = [];
                
                // Fetch agents from server
                async function fetchAgents() {
                    try {
                        const response = await fetch('/~/agents');
                        if (response.ok) {
                            const data = await response.json();
                            agents = data.agents || [];
                            updateAgentSelect();
                            updateAgentBar();
                        } else {
                            console.error('Failed to fetch agents:', await response.text());
                            agents = [];
                        }
                    } catch (error) {
                        console.error('Error fetching agents:', error);
                        agents = [];
                    }
                }
                
                // Update agent select dropdown
                function updateAgentSelect() {
                    agentSelect.innerHTML = '';
                    
                    const userOption = document.createElement('option');
                    userOption.value = 'user';
                    userOption.textContent = '👤 User';
                    agentSelect.appendChild(userOption);
                    
                    agents.forEach(agent => {
                        const option = document.createElement('option');
                        option.value = agent.name;
                        option.textContent = \`\${getAgentIcon(agent.name)} \${agent.name}\`;
                        agentSelect.appendChild(option);
                    });
                    
                    agentSelect.disabled = false;
                }
                
                // Update agent bar
                function updateAgentBar() {
                    agentBar.innerHTML = '';
                    
                    // Add user tag
                    const userTag = document.createElement('div');
                    userTag.className = 'agent-tag';
                    userTag.id = 'agentTag-user';
                    userTag.innerHTML = \`
                        <div class="agent-dot" style="background-color: \${getAgentColor('user')}"></div>
                        \${getAgentIcon('user')} User
                    \`;
                    agentBar.appendChild(userTag);
                    
                    // Add agent tags
                    agents.forEach(agent => {
                        const tag = document.createElement('div');
                        tag.className = 'agent-tag';
                        tag.id = \`agentTag-\${agent.name}\`;
                        tag.innerHTML = \`
                            <div class="agent-dot" style="background-color: \${getAgentColor(agent.name)}"></div>
                            \${getAgentIcon(agent.name)} \${agent.name}
                        \`;
                        agentBar.appendChild(tag);
                    });
                    
                    updateAgentTags();
                }
                
                // Get agent color
                function getAgentColor(agentName) {
                    const colors = [
                        '#007acc', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
                        '#3F51B5', '#009688', '#FF5722', '#673AB7', '#E91E63'
                    ];
                    const index = agentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                    return colors[index];
                }
                
                // Get agent icon
                function getAgentIcon(agentName) {
                    if (agentName === 'user') return '👤';
                    if (agentName.toLowerCase().includes('bot') || agentName.toLowerCase().includes('ai')) return '🤖';
                    if (agentName.toLowerCase().includes('dev') || agentName.toLowerCase().includes('code')) return '👨‍💻';
                    if (agentName.toLowerCase().includes('test') || agentName.toLowerCase().includes('qa')) return '🧪';
                    if (agentName.toLowerCase().includes('doc') || agentName.toLowerCase().includes('write')) return '📝';
                    return '👤';
                }
                
                // Update active agent tag
                function updateAgentTags() {
                    // Update user tag
                    const userTag = document.getElementById('agentTag-user');
                    if (userTag) {
                        if (agentSelect.value === 'user') {
                            userTag.classList.add('agent-tag-active');
                        } else {
                            userTag.classList.remove('agent-tag-active');
                        }
                    }
                    
                    // Update agent tags
                    agents.forEach(agent => {
                        const tag = document.getElementById(\`agentTag-\${agent.name}\`);
                        if (tag) {
                            if (agentSelect.value === agent.name) {
                                tag.classList.add('agent-tag-active');
                            } else {
                                tag.classList.remove('agent-tag-active');
                            }
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
                            const color = getAgentColor(msg.agent);
                            const icon = getAgentIcon(msg.agent);
                            
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
                fetchAgents();
                connectWebSocket();
            </script>
        </body>
        </html>
    `;
}
