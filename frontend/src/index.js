import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/figma-redesign.css';
import App from './App';
import './locales/i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
