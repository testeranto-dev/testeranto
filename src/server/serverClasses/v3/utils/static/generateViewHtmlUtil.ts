export const generateViewHtmlUtil = (viewKey: string, viewPath: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto - ${viewKey} View</title>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background-color: #f5f5f5;
    }
    #root {
      height: 100vh;
      width: 100vw;
      position: relative;
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
    /* Ensure sigma container fills available space */
    .sigma-container,
    .sigma-scene,
    .sigma-mouse,
    .sigma-wrapper,
    div[class*="sigma"] {
      width: 100% !important;
      height: 100% !important;
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
    
    console.log('[View HTML!] Setting up configuration for view:', viewKey);
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
