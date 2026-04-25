
import React from 'react';
import ReactDOM from 'react-dom/client';
import DebugGraphView from '../../src/vscode/views/defaultViews/DebugGraphView';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(DebugGraphView, {
      slicePath: '/~/views/DebugGraph/slice'
    })
  );
}
