
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  // StrictMode removed to prevent double-invocation of refs in HeroScene
  // and minimize context conflicts in the ESM environment.
  root.render(<App />);
} else {
  console.error("Failed to find the root element.");
}
