export const generateViewHtml = (viewKey: string, viewPath: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto - ${viewKey} View</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.2rem;
      color: #666;
    }
    .error {
      padding: 40px;
      text-align: center;
      color: #d32f2f;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <h2>Loading ${viewKey} View...</h2>
    </div>
  </div>

  <script>
    // View configuration
    const viewKey = '${viewKey}';
    const viewPath = '${viewPath}';
    const dataPath = '/testeranto/slices/views/' + viewKey + '.json';
    
    console.log('[View HTML] Setting up configuration for view:', viewKey);
    console.log('[View HTML] Data path:', dataPath);
    
    window.TESTERANTO_VIEW_CONFIG = {
      viewKey: viewKey,
      viewPath: viewPath,
      dataPath: dataPath,
      apiEndpoint: '/~/api'
    };

    console.log('[View HTML] Configuration set:', window.TESTERANTO_VIEW_CONFIG);

    // Load the view-specific bundle
    const script = document.createElement('script');
    script.src = '/testeranto/views/' + viewKey + '.bundle.js';
    script.onload = function() {
      console.log('[View HTML] View bundle loaded successfully');
    };
    script.onerror = function() {
      console.error('[View HTML] Failed to load view bundle');
      document.getElementById('root').innerHTML = \`
        <div class="error">
          <h1>Error Loading View</h1>
          <p>Failed to load \${viewKey} view bundle.</p>
          <p>Make sure the server has generated the bundle.</p>
          <p>View path: \${viewPath}</p>
        </div>
      \`;
    };
    document.head.appendChild(script);
    console.log('[View HTML] Script element added to head');
  </script>
</body>
</html>`;
}

export const generateViewsIndexHtml = (views: Record<string, any>) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto Views</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      margin: 0;
      padding: 40px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .view-list {
      list-style: none;
      padding: 0;
    }
    .view-item {
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: background-color 0.2s;
    }
    .view-item:hover {
      background-color: #f9f9f9;
    }
    .view-link {
      display: block;
      text-decoration: none;
      color: #007acc;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 5px;
    }
    .view-link:hover {
      text-decoration: underline;
    }
    .view-path {
      font-size: 14px;
      color: #666;
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .empty {
      text-align: center;
      color: #666;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Testeranto Views</h1>
    ${Object.keys(views).length > 0 ? `
      <p>Available views:</p>
      <ul class="view-list">
        ${Object.entries(views).map(([key, path]) => `
          <li class="view-item">
            <a href="/testeranto/views/${key}.html" class="view-link">${key}</a>
            <div class="view-path">${path}</div>
          </li>
        `).join('')}
      </ul>
      <p>You can also access the <a href="/testeranto/reports/index.html">main stakeholder report</a>.</p>
    ` : `
      <div class="empty">
        <p>No views are currently configured.</p>
        <p>Add views to your testeranto configuration to see them here.</p>
      </div>
    `}
  </div>
</body>
</html>`
}

export const wrapperContent = (componentName: any, absoluteViewPath: string) => `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ${componentName} } from '${absoluteViewPath.replace(/\\/g, '/')}';

const config = window.TESTERANTO_VIEW_CONFIG;
if (!config) {
  console.error('TESTERANTO_VIEW_CONFIG not found in window');
  document.getElementById('root').innerHTML = \`
    <div style="padding: 40px; text-align: center; color: #d32f2f;">
      <h1>Configuration Error</h1>
      <p>View configuration not found.</p>
    </div>
  \`;
} else {
  console.log('Mounting view with config:', config);
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    React.createElement(${componentName}, {
      slicePath: config.dataPath,
      width: window.innerWidth - 40,
      height: window.innerHeight - 40
    })
  );
}
`;