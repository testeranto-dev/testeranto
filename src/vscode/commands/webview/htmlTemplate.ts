export function htmlTemplate(css: string, js: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Testeranto Chat</title>
            <style>
                ${css}
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
                ${js}
            </script>
        </body>
        </html>
    `;
}
