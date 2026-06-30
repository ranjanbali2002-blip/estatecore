import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { PlanGateProvider } from './context/PlanGateContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BrandProvider>
          <ToastProvider>
            <ConfirmProvider>
              <PlanGateProvider>
                <App />
              </PlanGateProvider>
            </ConfirmProvider>
          </ToastProvider>
        </BrandProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
