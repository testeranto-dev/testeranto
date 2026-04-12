
console.error('Error loading view EisenhowerMatrix:', "Build failed with 1 error:\ntesteranto/views/EisenhowerMatrix.wrapper.tsx:4:37: ERROR: Could not resolve \"EisenhowerMatrix\"");
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #d32f2f;">
        <h1>Error Loading View</h1>
        <p>Failed to load EisenhowerMatrix view bundle.</p>
        <p>Error: Build failed with 1 error:
testeranto/views/EisenhowerMatrix.wrapper.tsx:4:37: ERROR: Could not resolve "EisenhowerMatrix"</p>
        <p>Check server logs for more details.</p>
      </div>
    `;
  }
});
