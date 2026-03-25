import * as vscode from "vscode";
import * as path from "path";

export function convertLocalPathsToWebviewUris(
    htmlContent: string, 
    webview: vscode.Webview, 
    workspaceRoot: string
): string {
    let modifiedHtml = htmlContent;

    modifiedHtml = modifiedHtml.replace(
        /(href|src)=["']([^"']+\.(css|js|png|jpg|gif|svg))["']/gi,
        (match, attr, filePath) => {
            const fullPath = path.join(workspaceRoot, 'testeranto', 'reports', filePath);
            const uri = webview.asWebviewUri(vscode.Uri.file(fullPath));
            return `${attr}="${uri}"`;
        }
    );

    return modifiedHtml;
}

export function getErrorHtml(reportPath: string): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                    padding: 40px;
                    background: #f5f5f5;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #333; margin-bottom: 20px; }
                .error { 
                    color: #f44336; 
                    background: #ffebee;
                    padding: 15px;
                    border-radius: 4px;
                    border-left: 4px solid #f44336;
                }
                .info { 
                    color: #2196f3; 
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 4px;
                    border-left: 4px solid #2196f3;
                }
                button {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 20px;
                }
                button:hover {
                    background: #764ba2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Testeranto Stakeholder Report</h1>
                <p class="error">The HTML report file was not found at: ${reportPath}</p>
                <p class="info">Try generating the report again by clicking the button below.</p>
                <button onclick="generateReport()">Generate Report</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function generateReport() {
                    vscode.postMessage({
                        command: 'generateReport'
                    });
                }
            </script>
        </body>
        </html>
    `;
}
