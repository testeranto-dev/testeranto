import { getFallbackHtmlContent } from "./getFallbackHtmlContent";

export const openServerWebview = () => {
    vscode.commands.registerCommand("testeranto.openServerWebview", async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri;
            const reportHtmlUri = vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports', 'index.html');

            // Check if the report file exists
            try {
                await vscode.workspace.fs.stat(reportHtmlUri);
            } catch (error) {
                vscode.window.showWarningMessage('Report file not found. Starting server to generate it...');
                // Start server to generate the report
                await vscode.commands.executeCommand('testeranto.startServer');
                // Wait for server to generate the report
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Create and show webview
            const panel = vscode.window.createWebviewPanel(
                'testerantoServer',
                'Testeranto Server Report',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports')]
                }
            );

            // Get the HTML content
            let htmlContent: string;
            try {
                const fileContent = await vscode.workspace.fs.readFile(reportHtmlUri);
                htmlContent = Buffer.from(fileContent).toString('utf-8');
            } catch (error) {
                htmlContent = getFallbackHtmlContent();
            }

            // Replace script src to use webview.asWebviewUri
            const reportJsUri = panel.webview.asWebviewUri(
                vscode.Uri.joinPath(workspaceRoot, 'testeranto', 'reports', 'index.js')
            );

            // Update the script tag in the HTML
            const updatedHtmlContent = htmlContent.replace(
                /<script type="module">[\s\S]*?<\/script>/,
                `<script type="module">
                            // Wait for the stakeholder app to be loaded
                            async function initApp() {
                                const root = document.getElementById('root');
                                try {
                                    // Import the stakeholder app module using webview URI
                                    const { renderApp } = await import('${reportJsUri}');
                                    renderApp(root);
                                } catch (error) {
                                    console.error('Failed to load stakeholder report:', error);
                                    root.innerHTML = \`
                                        <div style="padding: 40px; text-align: center;">
                                            <h1 style="color: #d32f2f;">Error Loading Report</h1>
                                            <p>\${error.message}</p>
                                            <p>Please make sure the Testeranto server has generated the report files.</p>
                                            <details style="text-align: left; max-width: 800px; margin: 20px auto;">
                                                <summary>Technical Details</summary>
                                                <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">\${error.stack}</pre>
                                            </details>
                                        </div>
                                    \`;
                                }
                            }
                            
                            // Start the app when the DOM is ready
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', initApp);
                            } else {
                                initApp();
                            }
                        </script>`
            );

            panel.webview.html = updatedHtmlContent;

            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showErrorMessage(message.text);
                            return;
                        case 'refresh':
                            // Re-read the HTML file and update
                            vscode.workspace.fs.readFile(reportHtmlUri).then(fileContent => {
                                const newHtmlContent = Buffer.from(fileContent).toString('utf-8');
                                const updatedNewHtmlContent = newHtmlContent.replace(
                                    /<script type="module">[\s\S]*?<\/script>/,
                                    `<script type="module">
                                                // Wait for the stakeholder app to be loaded
                                                async function initApp() {
                                                    const root = document.getElementById('root');
                                                    try {
                                                        // Import the stakeholder app module using webview URI
                                                        const { renderApp } = await import('${reportJsUri}');
                                                        renderApp(root);
                                                    } catch (error) {
                                                        console.error('Failed to load stakeholder report:', error);
                                                        root.innerHTML = \`
                                                            <div style="padding: 40px; text-align: center;">
                                                                <h1 style="color: #d32f2f;">Error Loading Report</h1>
                                                                <p>\${error.message}</p>
                                                                <p>Please make sure the Testeranto server has generated the report files.</p>
                                                                <details style="text-align: left; max-width: 800px; margin: 20px auto;">
                                                                    <summary>Technical Details</summary>
                                                                    <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">\${error.stack}</pre>
                                                                </details>
                                                            </div>
                                                        \`;
                                                    }
                                                }
                                                
                                                // Start the app when the DOM is ready
                                                if (document.readyState === 'loading') {
                                                    document.addEventListener('DOMContentLoaded', initApp);
                                                } else {
                                                    initApp();
                                                }
                                            </script>`
                                );
                                panel.webview.html = updatedNewHtmlContent;
                            });
                            return;
                    }
                },
                // undefined,
                // disposables
            );

        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to open server webview: ${error.message}`);
        }
    })
}