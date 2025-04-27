import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { svgToDataUrl } from './utils/favIcon.jsx';
import { favIconSVG } from './assets/SVGs.jsx';

try {
  const faviconUrl = svgToDataUrl(favIconSVG());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  document.head.appendChild(link);
} catch (error) {
  console.error('Failed to set favicon:', error);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);