export function generateViewsIndexHtml(views: Record<string, any>): string {
  const viewLinks = Object.entries(views)
    .map(([key, config]) => {
      const name = config.name || key;
      return `<li><a href="/~/views/${key}">${name}</a></li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testeranto Views</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    ul { list-style: none; padding: 0; }
    li { margin: 10px 0; }
    a { color: #0066cc; text-decoration: none; font-size: 18px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Testeranto Views</h1>
  <ul>
    ${viewLinks}
  </ul>
</body>
</html>`;
}
