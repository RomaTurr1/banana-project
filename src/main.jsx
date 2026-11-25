import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ExpoProvider } from './context/ExpoContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ExpoProvider>
        <App />
      </ExpoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
