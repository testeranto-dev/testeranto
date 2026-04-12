
import React from 'react';
import ReactDOM from 'react-dom/client';
import { EisenhowerMatrixView } from 'EisenhowerMatrix';

const config = window.TESTERANTO_VIEW_CONFIG;
if (!config) {
  console.error('TESTERANTO_VIEW_CONFIG not found in window');
  document.getElementById('root').innerHTML = `
    <div style="padding: 40px; text-align: center; color: #d32f2f;">
      <h1>Configuration Error</h1>
      <p>View configuration not found.</p>
    </div>
  `;
} else {
  console.log('Mounting view with config:', config);
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    React.createElement(EisenhowerMatrixView, {
      slicePath: config.dataPath,
      width: window.innerWidth - 40,
      height: window.innerHeight - 40
    })
  );
}
