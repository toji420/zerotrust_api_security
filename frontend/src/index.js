import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050a14; font-family: 'JetBrains Mono', 'Courier New', monospace; }
  input:focus { border-color: rgba(0, 212, 255, 0.5) !important; box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.1) !important; }
  button:hover { opacity: 0.85; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a1628; }
  ::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.2); border-radius: 3px; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes gridMove { 0% { backgroundPosition: 0 0; } 100% { backgroundPosition: 50px 50px; } }
`;
document.head.appendChild(globalStyle);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);