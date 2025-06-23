import React from 'react';
import { AlertProvider } from './components/AlertContext'
import AppRoutes from './routes/routes';

export default function App() {
  return (
    <AlertProvider>
      <AppRoutes />
    </AlertProvider>
  );
}