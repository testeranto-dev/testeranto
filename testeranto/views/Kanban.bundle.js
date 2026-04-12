
console.error('Error loading view Kanban:', "Build failed with 1 error:\ntesteranto/views/Kanban.wrapper.tsx:4:27: ERROR: Could not resolve \"Kanban\"");
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #d32f2f;">
        <h1>Error Loading View</h1>
        <p>Failed to load Kanban view bundle.</p>
        <p>Error: Build failed with 1 error:
testeranto/views/Kanban.wrapper.tsx:4:27: ERROR: Could not resolve "Kanban"</p>
        <p>Check server logs for more details.</p>
      </div>
    `;
  }
});
