
console.error('Error loading view Kanban:', "View file not found: /Users/adam/Code/testeranto/src/views/defaultViews/KanbanBoardView.tsx");
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #d32f2f;">
        <h1>Error Loading View</h1>
        <p>Failed to load Kanban view bundle.</p>
        <p>Error: View file not found: /Users/adam/Code/testeranto/src/views/defaultViews/KanbanBoardView.tsx</p>
        <p>Check server logs for more details.</p>
      </div>
    `;
  }
});
