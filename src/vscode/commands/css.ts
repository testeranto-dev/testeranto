export default () => {
  return `<style>
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
            </style>`
}