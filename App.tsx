import React from 'react';
import { AlertProvider } from '../TCC/components/AlertContext';
import AppRoutes from '../TCC/routes/routes';

export default function App() {
  return (
    <AlertProvider>
      <AppRoutes />
    </AlertProvider>
  );
}