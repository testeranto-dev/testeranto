export function jsScript(): string {
    return `
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
    `;
}
