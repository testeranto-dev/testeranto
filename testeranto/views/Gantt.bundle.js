
console.error('Error loading view Gantt:', "Build failed with 1 error:\ntesteranto/views/Gantt.wrapper.tsx:4:26: ERROR: Could not resolve \"Gantt\"");
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #d32f2f;">
        <h1>Error Loading View</h1>
        <p>Failed to load Gantt view bundle.</p>
        <p>Error: Build failed with 1 error:
testeranto/views/Gantt.wrapper.tsx:4:26: ERROR: Could not resolve "Gantt"</p>
        <p>Check server logs for more details.</p>
      </div>
    `;
  }
});
