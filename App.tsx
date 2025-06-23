// App.tsx (Este é um exemplo, seu arquivo pode ter outras coisas)

import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './components/AlertContext'; // Importe seu AlertProvider
import AppRoutes from './routes/routes'; // Seu componente de rotas principal

export default function App() {
  return (
    // Certifique-se de que AlertProvider e AuthProvider envolvem suas rotas.
    // A ordem geralmente não importa muito, mas o AlertProvider pode ser mais externo
    // se você quiser que os alertas cubram toda a aplicação.
    <AlertProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </AlertProvider>
  );
}