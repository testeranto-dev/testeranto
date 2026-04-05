// This file injects React into the global scope for the bundled app
import React from 'react';
import ReactDOM from 'react-dom';

// Make React available globally
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
}

// Also export for module usage
export { React, ReactDOM };
