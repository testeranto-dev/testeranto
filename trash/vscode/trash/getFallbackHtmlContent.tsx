// export function getFallbackHtmlContent(): string {
//     return `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Testeranto - Stakeholder Report</title>
//             <style>
//                 body {
//                     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
//                     margin: 0;
//                     padding: 0;
//                     background-color: #f5f5f5;
//                 }
//                 #root {
//                     min-height: 100vh;
//                 }
//                 .loading {
//                     display: flex;
//                     justify-content: center;
//                     align-items: center;
//                     height: 100vh;
//                     font-size: 1.2rem;
//                     color: #666;
//                 }
//                 .error-container {
//                     padding: 40px;
//                     text-align: center;
//                 }
//                 .error-title {
//                     color: #d32f2f;
//                     margin-bottom: 20px;
//                 }
//                 .refresh-button {
//                     margin-top: 20px;
//                     padding: 10px 20px;
//                     background-color: #007acc;
//                     color: white;
//                     border: none;
//                     border-radius: 4px;
//                     cursor: pointer;
//                     font-size: 14px;
//                 }
//                 .refresh-button:hover {
//                     background-color: #005a9e;
//                 }
//             </style>
//         </head>
//         <body>
//             <div id="root">
//                 <div class="error-container">
//                     <h1 class="error-title">Report Not Found</h1>
//                     <p>The Testeranto report file could not be found.</p>
//                     <p>Please make sure the server is running and has generated the report files.</p>
//                     <button class="refresh-button" onclick="refreshReport()">Refresh Report</button>
//                 </div>
//             </div>
//             <script>
//                 const vscode = acquireVsCodeApi();
                
//                 function refreshReport() {
//                     vscode.postMessage({
//                         command: 'refresh'
//                     });
//                 }
                
//                 // Try to start the server if not running
//                 setTimeout(() => {
//                     vscode.postMessage({
//                         command: 'alert',
//                         text: 'Report not found. Please start the server first.'
//                     });
//                 }, 1000);
//             </script>
//         </body>
//         </html>
//     `;
// }
