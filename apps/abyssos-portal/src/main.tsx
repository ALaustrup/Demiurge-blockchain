import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Error boundary for initial render
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.querySelector('.error-display')) {
    root.innerHTML = `
      <div class="error-display" style="padding: 20px; color: white; background: #0a0a0f;">
        <h1>Error Loading AbyssOS</h1>
        <p>Check the browser console (F12) for details.</p>
        <pre style="color: red;">${event.error?.message || 'Unknown error'}</pre>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: white; background: #0a0a0f;">
        <h1>Failed to Load AbyssOS</h1>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Check the browser console (F12) for details.</p>
      </div>
    `;
  }
}

